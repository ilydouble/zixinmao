"""
HTML报告生成服务
负责将分析结果渲染为HTML格式的可视化报告
支持两种模式：
1. 模板模式：使用Jinja2模板渲染（需要手动维护模板）
2. 代码模式：直接用Python代码生成HTML（推荐，易于维护）
"""
from typing import Dict, Any, Optional, List
from loguru import logger
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pathlib import Path
import json
from datetime import datetime
from .html_builder import build_credit_report_html


class HTMLReportService:
    """HTML报告生成服务类"""

    def __init__(self, use_template: bool = False):
        """
        初始化服务

        Args:
            use_template: 是否使用Jinja2模板模式（默认False，使用代码生成模式）
        """
        self.use_template = use_template

        if use_template:
            # 设置模板目录
            template_dir = Path(__file__).parent.parent / "templates"
            template_dir.mkdir(exist_ok=True)

            # 初始化Jinja2环境
            self.env = Environment(
                loader=FileSystemLoader(str(template_dir)),
                autoescape=select_autoescape(['html', 'xml'])
            )

            # 添加自定义过滤器
            self.env.filters['format_number'] = self._format_number
            self.env.filters['format_date'] = self._format_date

            logger.info(f"HTML报告服务初始化完成（模板模式）, 模板目录: {template_dir}")
        else:
            logger.info(f"HTML报告服务初始化完成（代码生成模式）")
    
    async def generate_html_report(
        self,
        analysis_result: Dict[str, Any],
        report_type: str = "simple",
        name: Optional[str] = None,
        id_card: Optional[str] = None
    ) -> str:
        """
        生成HTML格式的可视化报告

        Args:
            analysis_result: AI分析结果
            report_type: 报告类型（simple/detail/flow）
            name: 姓名
            id_card: 身份证号

        Returns:
            HTML字符串
        """
        try:
            logger.info(f"开始生成HTML报告, 类型: {report_type}, 模式: {'模板' if self.use_template else '代码生成'}")

            if self.use_template:
                # 模板模式：使用Jinja2模板
                html_content = await self._generate_with_template(
                    analysis_result, report_type, name, id_card
                )
            else:
                # 代码生成模式：直接用Python生成HTML
                html_content = await self._generate_with_code(
                    analysis_result, report_type, name, id_card
                )

            logger.info(f"HTML报告生成成功, 长度: {len(html_content):,} 字符")
            return html_content

        except Exception as e:
            logger.error(f"生成HTML报告失败: {str(e)}")
            raise

    async def _generate_with_template(
        self,
        analysis_result: Dict[str, Any],
        report_type: str,
        name: Optional[str],
        id_card: Optional[str]
    ) -> str:
        """使用Jinja2模板生成HTML"""
        # 准备模板数据
        template_data = self._prepare_template_data(
            analysis_result,
            report_type,
            name,
            id_card
        )

        # 选择模板
        template_name = self._get_template_name(report_type)

        # 渲染模板
        template = self.env.get_template(template_name)
        html_content = template.render(**template_data)

        return html_content

    async def _generate_with_code(
        self,
        analysis_result: Dict[str, Any],
        report_type: str,
        name: Optional[str],
        id_card: Optional[str]
    ) -> str:
        """使用Python代码直接生成HTML"""
        # 准备数据
        now = datetime.now()
        report_number = now.strftime("%Y%m%d%H%M%S")
        report_time = now.strftime("%Y-%m-%d %H:%M:%S")

        # 提取数据
        personal_info = analysis_result.get("个人信息", {})
        stats = analysis_result.get("统计概览", {})
        debt_composition = analysis_result.get("负债构成", [])
        loan_summary = analysis_result.get("贷款汇总", {})
        bank_loans = analysis_result.get("银行贷款明细", [])
        non_bank_loans = analysis_result.get("非银机构贷款明细", [])
        credit_usage = analysis_result.get("信用卡使用分析", {})
        credit_cards = analysis_result.get("信用卡明细", [])
        overdue_analysis = analysis_result.get("逾期分析", {})
        overdue_institutions = analysis_result.get("逾期机构", [])
        query_records = analysis_result.get("查询记录", [])
        ai_analysis = analysis_result.get("AI分析", [])

        # 使用name参数或从personal_info中获取
        display_name = name or personal_info.get("姓名", "未提供")
        display_id_card = id_card or personal_info.get("身份证号", "未提供")

        # 使用html_builder生成HTML
        html_content = build_credit_report_html(
            report_number=report_number,
            report_time=report_time,
            name=display_name,
            id_card=display_id_card,
            personal_info=personal_info,
            stats=stats,
            debt_composition=debt_composition,
            loan_summary=loan_summary,
            bank_loans=bank_loans,
            non_bank_loans=non_bank_loans,
            credit_usage=credit_usage,
            credit_cards=credit_cards,
            overdue_analysis=overdue_analysis,
            overdue_institutions=overdue_institutions,
            query_records=query_records,
            ai_analysis=ai_analysis
        )

        return html_content
    
    def _prepare_template_data(
        self,
        analysis_result: Dict[str, Any],
        report_type: str,
        name: Optional[str],
        id_card: Optional[str]
    ) -> Dict[str, Any]:
        """
        准备模板数据
        
        Args:
            analysis_result: AI分析结果
            report_type: 报告类型
            name: 姓名
            id_card: 身份证号
            
        Returns:
            模板数据字典
        """
        # 生成报告编号和时间
        now = datetime.now()
        report_number = now.strftime("%Y%m%d%H%M%S")
        report_date = now.strftime("%Y-%m-%d")
        report_time = now.strftime("%Y-%m-%d %H:%M:%S")
        
        # 提取个人信息
        personal_info = analysis_result.get("个人信息", {})
        if name:
            personal_info["姓名"] = name
        if id_card:
            personal_info["身份证号"] = id_card
        
        # 构建模板数据
        template_data = {
            # 报告基本信息
            "report_number": report_number,
            "report_date": report_date,
            "report_time": report_time,
            "report_type": report_type,
            
            # 个人信息
            "personal_info": personal_info,
            "name": personal_info.get("姓名", "未提供"),
            "id_card": personal_info.get("身份证号", "未提供"),
            
            # 统计数据
            "stats": analysis_result.get("统计概览", {}),
            
            # 负债构成
            "debt_composition": analysis_result.get("负债构成", []),
            
            # 贷款明细
            "bank_loans": analysis_result.get("银行贷款明细", []),
            "non_bank_loans": analysis_result.get("非银机构贷款明细", []),
            "loan_summary": analysis_result.get("贷款汇总", {}),
            
            # 信用卡明细
            "credit_cards": analysis_result.get("信用卡明细", []),
            "credit_usage": analysis_result.get("信用卡使用分析", {}),
            
            # 逾期分析
            "overdue_analysis": analysis_result.get("逾期分析", {}),
            "overdue_institutions": analysis_result.get("逾期机构", []),
            
            # 查询记录
            "query_records": analysis_result.get("查询记录", []),
            
            # 产品推荐
            "product_recommendations": analysis_result.get("产品推荐", []),
            "match_status": analysis_result.get("匹配状态", "未知"),
            
            # AI分析
            "ai_analysis": analysis_result.get("AI分析", []),
            "suitability_rating": analysis_result.get("适配度评分", "未知"),
            "optimization_suggestions": analysis_result.get("优化建议", []),
            "risk_warning": analysis_result.get("风险提示", ""),
            
            # 图表数据
            "chart_data": self._prepare_chart_data(analysis_result),
            
            # 原始数据（用于调试）
            "raw_data": json.dumps(analysis_result, ensure_ascii=False, indent=2)
        }
        
        return template_data
    
    def _prepare_chart_data(self, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        准备图表数据
        
        Args:
            analysis_result: AI分析结果
            
        Returns:
            图表数据字典
        """
        chart_data = {}
        
        # 贷款图表数据
        bank_loans = analysis_result.get("银行贷款明细", [])
        non_bank_loans = analysis_result.get("非银机构贷款明细", [])
        
        if bank_loans or non_bank_loans:
            chart_data["loan_chart"] = {
                "labels": [],
                "credit_data": [],
                "balance_data": []
            }
            
            for loan in bank_loans:
                chart_data["loan_chart"]["labels"].append(loan.get("管理机构", ""))
                chart_data["loan_chart"]["credit_data"].append(loan.get("授信额度", 0))
                chart_data["loan_chart"]["balance_data"].append(loan.get("余额", 0))
            
            for loan in non_bank_loans:
                chart_data["loan_chart"]["labels"].append(loan.get("管理机构", ""))
                chart_data["loan_chart"]["credit_data"].append(loan.get("授信额度", 0))
                chart_data["loan_chart"]["balance_data"].append(loan.get("余额", 0))
        
        # 查询记录图表数据
        query_records = analysis_result.get("查询记录", [])
        if query_records:
            chart_data["query_chart"] = {
                "labels": [],
                "loan_data": [],
                "card_data": [],
                "guarantee_data": []
            }
            
            for record in query_records:
                chart_data["query_chart"]["labels"].append(record.get("月份", ""))
                chart_data["query_chart"]["loan_data"].append(record.get("贷款审批", 0))
                chart_data["query_chart"]["card_data"].append(record.get("信用卡审批", 0))
                chart_data["query_chart"]["guarantee_data"].append(record.get("担保资格审查", 0))
        
        return chart_data
    
    def _get_template_name(self, report_type: str) -> str:
        """
        获取模板文件名
        
        Args:
            report_type: 报告类型
            
        Returns:
            模板文件名
        """
        template_map = {
            "simple": "credit_report_simple.html",
            "detail": "credit_report_detail.html",
            "flow": "credit_report_flow.html"
        }
        
        return template_map.get(report_type, "credit_report_simple.html")
    
    def _format_number(self, value: Any) -> str:
        """
        格式化数字（添加千分位）
        
        Args:
            value: 数值
            
        Returns:
            格式化后的字符串
        """
        try:
            if isinstance(value, (int, float)):
                return f"{value:,}"
            return str(value)
        except:
            return str(value)
    
    def _format_date(self, value: Any, format: str = "%Y-%m-%d") -> str:
        """
        格式化日期
        
        Args:
            value: 日期值
            format: 日期格式
            
        Returns:
            格式化后的日期字符串
        """
        try:
            if isinstance(value, datetime):
                return value.strftime(format)
            elif isinstance(value, str):
                # 尝试解析字符串日期
                dt = datetime.fromisoformat(value)
                return dt.strftime(format)
            return str(value)
        except:
            return str(value)

