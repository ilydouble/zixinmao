"""
使用JavaScript模板生成HTML报告
基于visualization_template.js，通过Node.js执行JavaScript生成HTML
"""
import sys
from pathlib import Path
# 添加项目根目录到 sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import json
import subprocess
from typing import Dict, Any
from loguru import logger
from app.models.visualization_model import VisualizationReportData


class JSHTMLBuilder:
    """使用JavaScript模板生成HTML的构建器"""
    
    def __init__(self):
        """初始化构建器"""
        self.template_path = Path(__file__).parent.parent / "templates" / "visualization_template.js"
        if not self.template_path.exists():
            raise FileNotFoundError(f"模板文件不存在: {self.template_path}")
        logger.info(f"JavaScript HTML构建器初始化完成，模板路径: {self.template_path}")
    
    def build_html_from_visualization_data(
        self,
        data: VisualizationReportData,
        report_date: str = None,
        report_number: str = None
    ) -> str:
        """
        从VisualizationReportData生成HTML
        
        Args:
            data: VisualizationReportData对象
            report_date: 报告日期
            report_number: 报告编号
            
        Returns:
            完整的HTML字符串
        """
        try:
            # 将Pydantic模型转换为字典
            data_dict = data.model_dump()
            
            # 创建临时JavaScript文件来执行生成
            js_code = self._create_js_execution_code(data_dict, report_date, report_number)
            
            # 使用Node.js执行JavaScript
            html_content = self._execute_js_code(js_code)
            
            logger.info(f"成功使用JavaScript模板生成HTML，长度: {len(html_content):,} 字符")
            return html_content
            
        except Exception as e:
            logger.error(f"使用JavaScript模板生成HTML失败: {str(e)}")
            raise
    
    def _create_js_execution_code(
        self,
        data_dict: Dict[str, Any],
        report_date: str = None,
        report_number: str = None
    ) -> str:
        """
        创建JavaScript执行代码
        
        Args:
            data_dict: 数据字典
            report_date: 报告日期
            report_number: 报告编号
            
        Returns:
            JavaScript代码字符串
        """
        # 读取模板文件
        with open(self.template_path, 'r', encoding='utf-8') as f:
            template_code = f.read()
        
        # 准备数据JSON
        data_json = json.dumps(data_dict, ensure_ascii=False, indent=2)
        
        # 准备报告日期和编号
        report_date_param = f"'{report_date}'" if report_date else "null"
        report_number_param = f"'{report_number}'" if report_number else "null"
        
        # 组合完整的JavaScript代码
        js_code = f"""
{template_code}

// 数据
const reportData = {data_json};

// 生成HTML
const html = generateVisualizationReport(reportData, {report_date_param}, {report_number_param});

// 输出HTML
console.log(html);
"""
        
        return js_code
    
    def _execute_js_code(self, js_code: str) -> str:
        """
        执行JavaScript代码
        
        Args:
            js_code: JavaScript代码
            
        Returns:
            执行结果（HTML字符串）
        """
        try:
            # 检查Node.js是否可用
            try:
                subprocess.run(
                    ['node', '--version'],
                    capture_output=True,
                    check=True,
                    timeout=5
                )
            except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
                logger.warning("Node.js不可用，使用Python fallback生成HTML")
                return self._python_fallback_generation(js_code)
            
            # 使用Node.js执行JavaScript
            result = subprocess.run(
                ['node', '-e', js_code],
                capture_output=True,
                text=True,
                encoding='utf-8',
                timeout=30
            )
            
            if result.returncode != 0:
                logger.error(f"Node.js执行失败: {result.stderr}")
                raise RuntimeError(f"Node.js执行失败: {result.stderr}")
            
            return result.stdout.strip()
            
        except subprocess.TimeoutExpired:
            logger.error("Node.js执行超时")
            raise RuntimeError("Node.js执行超时")
        except Exception as e:
            logger.error(f"执行JavaScript代码失败: {str(e)}")
            raise
    
    def _python_fallback_generation(self, js_code: str) -> str:
        """
        Python fallback：当Node.js不可用时，使用Python直接生成HTML
        
        Args:
            js_code: JavaScript代码（用于提取数据）
            
        Returns:
            HTML字符串
        """
        logger.info("使用Python fallback生成HTML")
        
        # 从js_code中提取数据
        import re
        data_match = re.search(r'const reportData = ({.*?});', js_code, re.DOTALL)
        if not data_match:
            raise ValueError("无法从JavaScript代码中提取数据")
        
        data_json = data_match.group(1)
        data = json.loads(data_json)
        
        # 使用Python生成HTML（简化版）
        from .python_html_generator import generate_html_from_data
        return generate_html_from_data(data)


def build_html_with_js_template(
    data: VisualizationReportData,
    report_date: str = None,
    report_number: str = None
) -> str:
    """
    便捷函数：使用JavaScript模板生成HTML
    
    Args:
        data: VisualizationReportData对象
        report_date: 报告日期
        report_number: 报告编号
        
    Returns:
        完整的HTML字符串
    """
    builder = JSHTMLBuilder()
    return builder.build_html_from_visualization_data(data, report_date, report_number)

