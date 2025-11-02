"""
HTML报告生成服务

负责：
1. 数据验证和转换
2. 生成报告元数据（日期、编号）
3. 管理JavaScript模板文件
4. 执行Node.js生成HTML报告
5. 异常处理和日志记录

使用JavaScript模板生成HTML报告（前端技术栈，响应式设计）
"""
import sys
from pathlib import Path
# 添加项目根目录到 sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import json
import subprocess
from typing import Any, Dict, Optional
from loguru import logger
from app.models.visualization_model import VisualizationReportData


class HTMLReportService:
    """
    HTML报告生成服务

    提供统一的HTML报告生成接口，处理业务逻辑和数据转换
    """

    def __init__(self):
        """
        初始化服务

        Raises:
            FileNotFoundError: 如果模板文件不存在
        """
        self.template_path = Path(__file__).parent.parent / "templates" / "visualization_template.js"
        if not self.template_path.exists():
            raise FileNotFoundError(f"JavaScript模板文件不存在: {self.template_path}")
        logger.info(f"✅ HTML报告服务初始化完成，模板路径: {self.template_path}")

    async def generate_html_report(
        self,
        analysis_result: Any,
        report_type: str = "simple"
    ) -> str:
        """
        生成HTML格式的可视化报告

        Args:
            analysis_result: AI分析结果（Dict或VisualizationReportData对象）
            report_type: 报告类型（simple/detail/flow），当前版本未使用，保留用于扩展

        Returns:
            HTML字符串

        Raises:
            ValueError: 如果数据格式不正确
            RuntimeError: 如果生成失败
        """
        try:
            logger.info(f"📝 开始生成HTML报告, 类型: {report_type}")

            # 1. 数据验证和转换
            data = self._validate_and_convert_data(analysis_result)

            # 2. 直接使用数据中的报告元数据（后端必然返回）
            logger.debug(f"使用报告元数据 - 日期: {data.report_date}, 编号: {data.report_number}")

            # 3. 生成HTML
            html_content = self._build_html(data)

            logger.info(f"✅ HTML报告生成成功, 长度: {len(html_content):,} 字符")
            return html_content

        except ValueError as e:
            logger.error(f"❌ 数据验证失败: {str(e)}")
            raise
        except RuntimeError as e:
            logger.error(f"❌ HTML生成失败: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"❌ 生成HTML报告时发生未知错误: {str(e)}")
            raise RuntimeError(f"生成HTML报告失败: {str(e)}") from e

    def _validate_and_convert_data(self, analysis_result: Any) -> VisualizationReportData:
        """
        验证并转换数据格式

        Args:
            analysis_result: 分析结果（Dict或VisualizationReportData对象）

        Returns:
            VisualizationReportData对象

        Raises:
            ValueError: 如果数据格式不正确
        """
        # 如果已经是VisualizationReportData对象，直接返回
        if isinstance(analysis_result, VisualizationReportData):
            logger.debug("✅ 数据已是VisualizationReportData对象")
            return analysis_result

        # 如果是字典，转换为VisualizationReportData对象
        if isinstance(analysis_result, dict):
            try:
                data = VisualizationReportData(**analysis_result)
                logger.debug("✅ 成功将字典转换为VisualizationReportData对象")
                return data
            except Exception as e:
                logger.error(f"❌ 数据转换失败: {str(e)}")
                raise ValueError(f"分析结果格式不正确，无法转换为VisualizationReportData: {str(e)}") from e

        # 不支持的数据类型
        raise ValueError(f"不支持的数据类型: {type(analysis_result)}, 需要Dict或VisualizationReportData对象")

    def _build_html(
        self,
        data: VisualizationReportData
    ) -> str:
        """
        构建HTML报告

        Args:
            data: 可视化报告数据对象（包含report_date和report_number）

        Returns:
            完整的HTML字符串

        Raises:
            RuntimeError: 如果生成失败
        """
        try:
            logger.debug(f"开始构建HTML，报告日期: {data.report_date}, 报告编号: {data.report_number}")

            # 将Pydantic模型转换为字典
            data_dict = data.model_dump()

            # 创建JavaScript执行代码
            js_code = self._create_js_execution_code(data_dict)

            # 使用Node.js执行JavaScript生成HTML
            html_content = self._execute_js_code(js_code)

            logger.info(f"✅ JavaScript模板生成HTML成功，长度: {len(html_content):,} 字符")
            return html_content

        except Exception as e:
            logger.error(f"❌ JavaScript模板生成HTML失败: {str(e)}")
            raise RuntimeError(f"生成HTML失败: {str(e)}") from e

    def _create_js_execution_code(
        self,
        data_dict: Dict[str, Any]
    ) -> str:
        """
        创建JavaScript执行代码

        将模板代码和数据组合成可执行的JavaScript代码

        Args:
            data_dict: 报告数据字典（包含report_date和report_number）

        Returns:
            完整的JavaScript代码字符串

        Raises:
            IOError: 如果无法读取模板文件
        """
        try:
            # 读取JavaScript模板文件
            with open(self.template_path, 'r', encoding='utf-8') as f:
                template_code = f.read()
            logger.debug(f"✅ 成功读取模板文件，大小: {len(template_code):,} 字符")
        except Exception as e:
            logger.error(f"❌ 读取模板文件失败: {str(e)}")
            raise IOError(f"无法读取模板文件: {self.template_path}") from e

        # 将数据转换为JSON字符串
        try:
            data_json = json.dumps(data_dict, ensure_ascii=False, indent=2)
            logger.debug(f"✅ 数据转换为JSON成功，大小: {len(data_json):,} 字符")
        except Exception as e:
            logger.error(f"❌ 数据转换为JSON失败: {str(e)}")
            raise ValueError(f"数据无法序列化为JSON: {str(e)}") from e

        # 组合完整的JavaScript代码
        js_code = f"""
{template_code}

// 报告数据（包含report_date和report_number）
const reportData = {data_json};

// 生成HTML报告
const html = generateVisualizationReport(reportData);

// 输出HTML到标准输出
console.log(html);
"""

        logger.debug(f"✅ JavaScript代码生成成功，总大小: {len(js_code):,} 字符")
        return js_code

    def _execute_js_code(self, js_code: str) -> str:
        """
        执行JavaScript代码生成HTML

        Args:
            js_code: JavaScript代码

        Returns:
            执行结果（HTML字符串）

        Raises:
            RuntimeError: 如果Node.js不可用或执行失败
            subprocess.TimeoutExpired: 如果执行超时
        """
        # 检查Node.js是否可用
        try:
            subprocess.run(
                ['node', '--version'],
                capture_output=True,
                check=True,
                timeout=5
            )
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired) as e:
            error_msg = "Node.js不可用，请确保已安装Node.js并添加到系统PATH"
            logger.error(f"❌ {error_msg}: {str(e)}")
            raise RuntimeError(error_msg) from e

        # 使用Node.js执行JavaScript
        try:
            result = subprocess.run(
                ['node', '-e', js_code],
                capture_output=True,
                text=True,
                encoding='utf-8',
                timeout=30
            )

            if result.returncode != 0:
                logger.error(f"❌ Node.js执行失败: {result.stderr}")
                raise RuntimeError(f"Node.js执行失败: {result.stderr}")

            html_output = result.stdout.strip()
            logger.debug(f"✅ Node.js执行成功，生成HTML长度: {len(html_output):,} 字符")
            return html_output

        except subprocess.TimeoutExpired as e:
            logger.error("❌ Node.js执行超时（30秒）")
            raise RuntimeError("Node.js执行超时") from e
        except Exception as e:
            logger.error(f"❌ 执行JavaScript代码失败: {str(e)}")
            raise



