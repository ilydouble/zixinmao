"""
简版征信报告生成服务

负责：
1. 文档转Markdown处理
2. 调用Dify工作流进行AI分析
3. 数据格式转换和验证
4. 结果可视化处理
"""
import os
import time
import tempfile
from typing import Dict, Any, Optional
from datetime import datetime
import httpx
from pathlib import Path
from loguru import logger
from pydantic import ValidationError
import json
import subprocess
from playwright.async_api import async_playwright

from config.settings import settings
from app.models.visualization_model import VisualizationReportData
from app.models.report_model import *
from app.models.dify_model import DifyWorkflowOutput
from app.service.dify_converter import DifyToVisualizationConverter
from app.service.bigdata_analysis_service import *
from app.models.bigdata_model_example import *


class BriefReportService:
    """
    简版征信报告生成服务

    主要功能：
    1. PDF文档转Markdown
    2. 调用Dify工作流进行AI分析
    3. 数据格式转换和验证
    4. 生成可视化报告
    """

    def __init__(self):
        """初始化服务配置"""
        self.dify_workflow_url = settings.dify.workflow_url
        self.dify_api_key = settings.dify.workflow_api_key
        self.dify_timeout = settings.dify.api_timeout

        # 简版征信报告模板
        self.template_path = Path(__file__).parent.parent / "templates" / "brief_report_template.js"
        if not self.template_path.exists():
            raise FileNotFoundError(f"JavaScript模板文件不存在: {self.template_path}")
        logger.info(f"✅ HTML报告服务初始化完成，模板路径: {self.template_path}")

    async def generate_report(
        self,
        analysisRequest: AnalysisRequest,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        生成征信报告分析

        流程：
        1. 如果提供file_base64，先调用PDF转Markdown服务
        2. 使用Markdown内容调用Dify工作流进行AI分析
        3. 转换为可视化格式并返回结果

        Args:
            file_base64: 文件的base64编码（与markdown_content二选一）
            markdown_content: Markdown格式的文档内容（与file_base64二选一）
            request_id: 请求ID，用于日志追踪
            file_name: 文件名
            customer_info: 客户信息（包含includeProductMatch等字段）

        Returns:
            Dict[str, Any]: 包含以下字段的结果字典
                - success: bool, 是否成功
                - analysis_result: Dict, 分析结果（可视化格式）
                - processing_time: float, 处理时间（秒）
                - raw_response: Dict, Dify原始响应（可选）
                - dify_task_id: str, Dify任务ID（可选）
                - dify_workflow_run_id: str, Dify工作流运行ID（可选）
                - error_message: str, 错误信息（失败时）

        Raises:
            ValueError: 当file_base64和markdown_content都未提供时
        """
        start_time = time.time()

        markdown_content = analysisRequest.markdown_content 
        file_base64 = analysisRequest.file_base64
        file_name=analysisRequest.file_name or "document.pdf"
        customer_info = analysisRequest.customer_info

        try:
            # 步骤1: 准备Markdown内容
            markdown_content = await self._prepare_markdown_content(
                file_base64, markdown_content, file_name, request_id
            )

            # 步骤2: 调用Dify工作流进行AI分析
            dify_output = await self._call_dify_workflow(markdown_content, request_id)

            # 步骤3：调用大数据分析服务
            bigdata_service = BigdataAnalysisService()
            combhzy2Request = COMBHZY2Request(
                mobile_no=analysisRequest.mobile_no,
                id_card=analysisRequest.id_card,
                name=analysisRequest.name,
                authorization_url=analysisRequest.auth_file
            )
            bigdata_report = bigdata_service.call_api(combhzy2Request)
            # bigdata_report = example_create_report()

            # 如果大数据API调用失败，使用默认值
            if bigdata_report is None:
                logger.warning(f"⚠️ [步骤3] 大数据API调用失败，使用默认值, request_id: {request_id}")
                bigdata_report = self._get_default_bigdata_report(analysisRequest)

            # 步骤4: 解析并转换结果
            processing_time = time.time() - start_time
            # 使用转换器将Dify数据转换为可视化格式
            visualization_report = DifyToVisualizationConverter.convert(
                bigdata_report, dify_output, request_id, analysisRequest
            )

            logger.info(f"✅ [步骤4] Dify数据转换为可视化格式成功, 耗时: {processing_time:.2f}s, request_id: {request_id}")

            # 步骤5: 生成html报告
            html_file = await self.generate_html_file(
                visualization_report=visualization_report,
                report_type="simple"
            )

            # 步骤6: 生成pdf报告
            pdf_file = await self.generate_pdf_file(
                                    html_content=html_file,
                                    pdf_filename=analysisRequest.file_name or "report.pdf"
                                )

            return visualization_report, html_file, pdf_file

        except Exception as e:
            processing_time = time.time() - start_time
            error_msg = f'分析处理失败: {str(e)}, 处理时间: {processing_time:.2f}s'
            logger.error(f"❌ {error_msg}, request_id: {request_id}")
            raise

    # ==================== 核心处理方法 ====================

    async def _prepare_markdown_content(
        self,
        file_base64: Optional[str],
        markdown_content: Optional[str],
        file_name: str,
        request_id: Optional[str]
    ) -> str:
        """
        准备Markdown内容

        Args:
            file_base64: 文件base64编码
            markdown_content: 已有的Markdown内容
            file_name: 文件名
            request_id: 请求ID

        Returns:
            Markdown格式的内容

        Raises:
            ValueError: 当两个参数都未提供时
        """
        if markdown_content:
            logger.info(f"✅ [步骤1] 使用提供的Markdown内容, request_id: {request_id}")
            return markdown_content

        if not file_base64:
            raise ValueError("必须提供file_base64或markdown_content之一")

        logger.info(f"🔄 [步骤1] 将PDF转换为Markdown, 文件: {file_name}, request_id: {request_id}")
        from app.service.document_service import DocumentService
        doc_service = DocumentService()
        markdown_content = await doc_service.process_document(
            file_name=file_name,
            file_base64=file_base64,
        )
        logger.info(f"✅ [步骤1] PDF转Markdown完成, 长度: {len(markdown_content):,}, request_id: {request_id}")
        return markdown_content

    async def _call_dify_workflow(
        self,
        markdown_content: str,
        request_id: Optional[str]
    ) -> DifyWorkflowOutput | None:
        """
        调用Dify工作流API

        Args:
            markdown_content: Markdown格式的内容
            request_id: 请求ID

        Returns:
            Dify API响应数据

        Raises:
            Exception: 当API调用失败时
        """
        logger.info(f"🤖 [步骤2] 调用Dify工作流, 内容长度: {len(markdown_content):,}, request_id: {request_id}")

        request_data = {
            "inputs": {"text": markdown_content},
            "response_mode": "blocking",
            "user": request_id or "abc-123"
        }

        logger.debug(f"📤 [Dify] 请求数据已准备, request_id: {request_id}")

        async with httpx.AsyncClient(timeout=self.dify_timeout) as client:
            response = await client.post(
                self.dify_workflow_url,
                json=request_data,
                headers={
                    'Authorization': self.dify_api_key,
                    'Content-Type': 'application/json'
                }
            )

        if response.status_code != 200:
            raise Exception(f'Dify API调用失败: HTTP {response.status_code}, {response.text}')

        logger.info(f"✅ [步骤2] Dify工作流响应成功, request_id: {request_id}")

        response_data = response.json()
        if 'data' in response_data and 'outputs' in response_data['data']:
            outputs = response_data['data']['outputs']
            if 'output' in outputs:
                return DifyWorkflowOutput(**outputs['output'])

        return None

    def _get_default_bigdata_report(self, analysisRequest: AnalysisRequest) -> 'BigDataResponse':
        """
        获取默认的大数据报告（当API调用失败时使用）

        Args:
            analysisRequest: 分析请求对象

        Returns:
            默认的BigDataResponse对象
        """
        from app.models.bigdata_model import (
            BigDataResponse, ReportSummary, BasicInfo, RiskIdentification,
            CreditAssessment, LeasingRiskAssessment, ReportFooter,
            RuleValidation, AntiFraudScore, AntiFraudRule, AbnormalRulesHit,
            Verification, CaseAnnouncements, EnforcementAnnouncements,
            DishonestAnnouncements, HighConsumptionRestrictionAnnouncements,
            LoanIntentionByCustomerType, LoanIntentionAbnormalTimes,
            MultiLenderRisk3C
        )

        # 生成报告ID和时间
        now = datetime.now()
        report_id = now.strftime("%Y%m%d%H%M%S")
        generation_time = now.strftime("%Y-%m-%d")

        # 构建默认报告
        return BigDataResponse(
            reportSummary=ReportSummary(
                ruleValidation=RuleValidation(
                    code="DEFAULT/无数据",
                    result="无法验证"
                ),
                antiFraudScore=AntiFraudScore(
                    level="未知"
                ),
                antiFraudRule=AntiFraudRule(
                    code="DEFAULT/无数据",
                    level="未知"
                ),
                abnormalRulesHit=AbnormalRulesHit(
                    count=0,
                    alert="暂无数据"
                )
            ),
            basicInfo=BasicInfo(
                name=analysisRequest.name or "未知",
                phone=analysisRequest.mobile_no or "未知",
                idCard=analysisRequest.id_card or "未知",
                reportId=report_id,
                verifications=[
                    Verification(
                        item="数据获取",
                        description="大数据API调用失败",
                        result="未验证",
                        details="无法获取第三方数据，请稍后重试"
                    )
                ]
            ),
            riskIdentification=RiskIdentification(
                caseAnnouncements=CaseAnnouncements(
                    title="涉案公告列表",
                    records=[]
                ),
                enforcementAnnouncements=EnforcementAnnouncements(
                    title="执行公告列表",
                    records=[]
                ),
                dishonestAnnouncements=DishonestAnnouncements(
                    title="失信公告列表",
                    records=[]
                ),
                highConsumptionRestrictionAnnouncements=HighConsumptionRestrictionAnnouncements(
                    title="限高公告列表",
                    records=[]
                )
            ),
            creditAssessment=CreditAssessment(
                loanIntentionByCustomerType=LoanIntentionByCustomerType(
                    title="本人在各类机构的借贷意向表现",
                    records=[]
                ),
                loanIntentionAbnormalTimes=LoanIntentionAbnormalTimes(
                    title="异常时间段借贷申请情况",
                    records=[]
                )
            ),
            leasingRiskAssessment=LeasingRiskAssessment(
                multiLenderRisk3C=MultiLenderRisk3C(
                    title="3C机构多头借贷风险",
                    records=[]
                )
            ),
            comprehensiveAnalysis=[
                "注意：由于大数据API调用失败，本报告仅包含征信报告分析结果。",
                "建议：请检查网络连接或稍后重试以获取完整的风险评估数据。"
            ],
            reportFooter=ReportFooter(
                dataSource="天远数据报告（数据获取失败）",
                generationTime=generation_time,
                disclaimer="本报告因数据源暂时不可用，仅供参考，最终审核以完整数据为准。"
            )
        )

    async def generate_html_file(
        self,
        visualization_report: VisualizationReportData,
        report_type: str = "simple"
    ) -> str:
        """
        生成 HTML 可视化报告（无数据验证）
        仅负责：读取模板 → 构造 JS → 执行 Node → 返回 HTML
        """

        logger.info(f"📝 开始生成HTML报告, 类型: {report_type}")

        try:
            # ---------------------------------------------------------------------
            # 1. 读取 JS 模板
            # ---------------------------------------------------------------------
            try:
                with open(self.template_path, 'r', encoding='utf-8') as f:
                    template_code = f.read()
                logger.debug(f"模板读取成功, 大小: {len(template_code):,}")
            except Exception as e:
                raise RuntimeError(f"无法读取模板文件: {self.template_path}: {str(e)}")

            # ---------------------------------------------------------------------
            # 2. 将输入数据直接转为 JSON
            # ---------------------------------------------------------------------
            try:
                # 如果是Pydantic模型，先转换为字典
                # 🔑 关键：使用 by_alias=True 确保大数据报告字段使用驼峰命名（camelCase）
                if hasattr(visualization_report, 'model_dump'):
                    data_dict = visualization_report.model_dump(by_alias=True)
                elif hasattr(visualization_report, 'dict'):
                    data_dict = visualization_report.dict(by_alias=True)
                else:
                    data_dict = visualization_report

                data_json = json.dumps(data_dict, ensure_ascii=False, indent=2)
            except Exception as e:
                raise RuntimeError(f"数据转换为 JSON 失败: {str(e)}")

            # ---------------------------------------------------------------------
            # 3. 构建可执行 JS 代码
            # ---------------------------------------------------------------------
            js_code = f"""
                {template_code}

                // 输入数据
                const reportData = {data_json};

                // 生成 HTML
                const html = generateVisualizationReport(reportData);
                console.log(html);
            """
            logger.debug(f"JS 构建完成, 总长度: {len(js_code):,}")

            # ---------------------------------------------------------------------
            # 4. 检查 Node 是否可用
            # ---------------------------------------------------------------------
            import subprocess
            try:
                subprocess.run(
                    ["node", "--version"],
                    capture_output=True,
                    check=True,
                    timeout=5,
                )
            except Exception as e:
                raise RuntimeError("Node.js 未安装或不可用。") from e

            # ---------------------------------------------------------------------
            # 5. 执行 JS → 输出 HTML
            # ---------------------------------------------------------------------
            try:
                result = subprocess.run(
                    ["node", "-e", js_code],
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    timeout=30,
                )

                if result.returncode != 0:
                    raise RuntimeError(f"Node 执行失败: {result.stderr}")

                html = result.stdout.strip()
                logger.info(f"HTML 生成成功, 长度: {len(html):,}")
                return html

            except subprocess.TimeoutExpired:
                raise RuntimeError("Node.js 执行超时（30秒）")

            except Exception as e:
                raise RuntimeError(f"执行 JavaScript 失败: {str(e)}") from e

        except Exception as e:
            logger.error(f"❌ 生成 HTML 失败: {str(e)}")
            raise

    async def generate_pdf_file(
            self,
            html_content: str,
            pdf_filename: Optional[str] = None
        ) -> bytes:
            """
            将HTML内容转换为PDF

            Args:
                html_content: HTML内容字符串
                pdf_filename: PDF文件名（可选，用于日志）

            Returns:
                PDF文件的字节内容

            Raises:
                RuntimeError: 如果转换失败
            """
            try:
                logger.info(f"📄 开始将HTML转换为PDF | 长度: {len(html_content):,} 字符")

                # 创建临时HTML文件
                with tempfile.NamedTemporaryFile(
                    mode='w',
                    suffix='.html',
                    delete=False,
                    encoding='utf-8'
                ) as temp_html:
                    temp_html.write(html_content)
                    html_path = temp_html.name

                try:
                    # 创建临时PDF文件
                    with tempfile.NamedTemporaryFile(
                        suffix='.pdf',
                        delete=False
                    ) as pdf_file:
                        pdf_path = pdf_file.name

                    try:
                        # 使用异步Playwright转换HTML为PDF
                        async with async_playwright() as p:
                            browser = await p.chromium.launch(
                                headless=True,
                                args=[
                                    "--no-sandbox",
                                    "--disable-gpu",
                                    "--start-maximized"
                                ]
                            )

                            # 创建上下文和页面
                            context = await browser.new_context(
                                viewport={"width": 1920, "height": 1080},
                                device_scale_factor=2
                            )
                            page = await context.new_page()

                            # 加载HTML文件
                            absolute_html_path = os.path.abspath(html_path)
                            await page.goto(f"file://{absolute_html_path}")

                            # 注入CSS以优化PDF分页
                            await page.add_style_tag(content="""
                                @media print {
                                    * {
                                        -webkit-print-color-adjust: exact !important;
                                        print-color-adjust: exact !important;
                                        visibility: visible !important;
                                    }
                                    body {
                                        width: 100% !important;
                                        margin: 0 !important;
                                    }
                                    .loan-debt-analysis,
                                    .loan-debt-analysis .chart-container,
                                    .loan-debt-analysis table,
                                    .loan-debt-analysis * {
                                        page-break-inside: avoid !important;
                                        page-break-before: avoid !important;
                                        page-break-after: avoid !important;
                                        width: 100% !important;
                                    }
                                    table {
                                        page-break-inside: avoid !important;
                                        width: 100% !important;
                                    }
                                }
                                @media screen {
                                    body {
                                        width: 1920px;
                                        margin: 0 auto;
                                    }
                                }
                            """)

                            # 等待页面加载完成
                            await page.wait_for_load_state("networkidle", timeout=5000)
                            try:
                                await page.wait_for_selector(".charts-container", state="visible", timeout=3000)
                                await page.wait_for_selector(".charts-container .chart-container", state="visible", timeout=3000)
                            except Exception:
                                # 如果选择器不存在，继续处理
                               logger.warning("⚠️ 页面选择器未找到，继续处理")

                            await page.wait_for_timeout(3000)

                            # 生成PDF
                            pdf_bytes = await page.pdf(
                                path=pdf_path,
                                width="508mm",
                                height="400mm",
                                margin={
                                    "top": "0.5cm",
                                    "right": "0.5cm",
                                    "bottom": "0.5cm",
                                    "left": "0.5cm"
                                },
                                print_background=True,
                                prefer_css_page_size=False,
                                landscape=False
                            )

                            await browser.close()

                        # 读取PDF文件内容
                        with open(pdf_path, 'rb') as f:
                            pdf_content = f.read()

                        logger.info(f"✅ PDF转换成功 | 大小: {len(pdf_content):,} 字节 | 文件: {pdf_filename or '未命名'}")
                        return pdf_content

                    finally:
                        # 清理临时PDF文件
                        if os.path.exists(pdf_path):
                            os.remove(pdf_path)

                finally:
                    # 清理临时HTML文件
                    if os.path.exists(html_path):
                        os.remove(html_path)

            except ImportError as e:
                logger.error(f"❌ Playwright库未安装: {str(e)}")
                raise RuntimeError(f"Playwright库未安装，请运行: pip install playwright") from e
            except Exception as e:
                logger.error(f"❌ HTML转PDF失败: {str(e)}")
                raise RuntimeError(f"HTML转PDF失败: {str(e)}") from e
