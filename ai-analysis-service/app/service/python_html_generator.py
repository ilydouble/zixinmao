"""
Python HTML生成器
当Node.js不可用时的fallback方案
直接使用Python生成HTML，与JavaScript模板保持一致的样式
"""
from typing import Dict, Any, List
from datetime import datetime


def format_number(num):
    """格式化数字，添加千分位分隔符"""
    if num is None:
        return '0'
    return f"{num:,}"


def generate_html_from_data(data: Dict[str, Any]) -> str:
    """
    从数据字典生成HTML
    
    Args:
        data: 数据字典（VisualizationReportData的字典形式）
        
    Returns:
        完整的HTML字符串
    """
    # 生成报告日期和编号
    today = datetime.now()
    report_date = today.strftime("%Y-%m-%d")
    report_number = today.strftime("%Y%m%d%H%M%S")
    
    personal_info = data.get('personal_info', {})
    stats = data.get('stats', {})
    
    html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{personal_info.get('name', '用户')}个人征信分析报告</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    {generate_styles()}
</head>
<body>
    <div class="dashboard" id="dashboard">
        {generate_header(data, report_date, report_number)}
        {generate_personal_info(personal_info)}
        {generate_stats_grid(stats)}
        {generate_debt_analysis(data)}
        {generate_loan_analysis(data)}
        {generate_credit_card_analysis(data)}
        {generate_overdue_analysis(data.get('overdue_analysis', {}))}
        {generate_query_records(data.get('query_records', []), data.get('query_charts', []))}
        {generate_product_recommendations(data.get('product_recommendations', []), data.get('match_status', ''))}
        {generate_ai_analysis(data)}
        {generate_footer(report_date)}
    </div>
    {generate_scripts(data)}
</body>
</html>"""
    
    return html


def generate_styles() -> str:
    """生成CSS样式"""
    # 读取JavaScript模板中的样式部分
    # 这里直接嵌入样式，与JavaScript模板保持一致
    return """<style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
        }
        
        body {
            background: #f5f7fa;
            color: #333;
            line-height: 1.5;
            padding: 12px;
            font-size: 14px;
            width: 100%;
            overflow-x: hidden;
        }
        
        .dashboard {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            background-color: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            overflow: hidden;
        }
        
        header {
            background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
            color: white;
            padding: 35px 20px 25px;
            position: relative;
            text-align: center;
            min-height: 180px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        h1 {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 12px;
            letter-spacing: 1.5px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .report-info {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        
        .personal-card {
            background: white;
            color: #333;
            border-radius: 10px;
            padding: 18px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            margin: 16px;
            width: calc(100% - 32px);
            border-left: 4px solid #4b6cb7;
            position: relative;
            overflow: hidden;
        }
        
        .personal-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, #4b6cb7, #667eea);
        }
        
        .card-title {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #4b6cb7;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        
        .info-item {
            margin-bottom: 12px;
            padding: 10px;
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        
        .info-item:hover {
            background-color: #f8f9fa;
            transform: translateY(-2px);
        }
        
        .info-label {
            font-size: 16px;
            color: #666;
            margin-bottom: 6px;
            font-weight: 500;
        }
        
        .info-value {
            font-size: 20px;
            font-weight: 700;
            color: #2c3e50;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
            padding: 0 16px 16px;
            width: 100%;
        }
        
        .stat-card {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            padding: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            width: 100%;
            transition: all 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
        }
        
        .stat-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
            font-size: 18px;
            color: white;
        }
        
        .icon-credit { background: linear-gradient(135deg, #4CAF50, #8BC34A); }
        .icon-debt { background: linear-gradient(135deg, #FF5722, #FF9800); }
        .icon-institution { background: linear-gradient(135deg, #9C27B0, #E91E63); }
        .icon-nonbank { background: linear-gradient(135deg, #FF9800, #FFC107); }
        .icon-overdue { background: linear-gradient(135deg, #F44336, #E91E63); }
        .icon-query { background: linear-gradient(135deg, #2196F3, #03A9F4); }
        
        .stat-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 6px;
        }
        
        .stat-value {
            font-size: 18px;
            font-weight: 700;
            color: #2c3e50;
        }
        
        .stat-unit {
            font-size: 12px;
            color: #7f8c8d;
            margin-left: 2px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 700;
            margin: 20px 16px 12px;
            color: #2c3e50;
            padding-bottom: 8px;
            border-bottom: 2px solid #4b6cb7;
            width: calc(100% - 32px);
        }
        
        .charts-container {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
            padding: 0 16px 16px;
            width: 100%;
        }
        
        .chart-card {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            padding: 16px;
            width: 100%;
        }
        
        .chart-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #2c3e50;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .chart-container {
            height: auto;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            width: 100%;
            min-height: 300px;
        }
        
        .data-table {
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            margin: 0;
            overflow-x: auto;
            width: 100%;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            min-width: 800px;
        }
        
        th {
            background-color: #4b6cb7;
            color: white;
            padding: 12px 10px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
        }
        
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        td {
            padding: 12px 10px;
            border-bottom: 1px solid #e9ecef;
            font-size: 13px;
        }
        
        .highlight {
            font-weight: 600;
            color: #4b6cb7;
        }
        
        .warning {
            color: #e74c3c;
            font-weight: 600;
        }
        
        .good {
            color: #2ecc71;
            font-weight: 600;
        }
        
        /* 响应式调整 */
        @media (max-width: 768px) {
            .stats-grid {
                grid-template-columns: 1fr 1fr;
            }
            
            header {
                text-align: center;
                padding: 30px 16px 20px;
                min-height: 160px;
            }
            
            h1 {
                font-size: 26px;
            }
        }
        
        @media (max-width: 480px) {
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            header {
                padding: 25px 16px 15px;
                min-height: 140px;
            }
            
            h1 {
                font-size: 22px;
            }
        }
    </style>"""


def generate_header(data: Dict, report_date: str, report_number: str) -> str:
    """生成头部"""
    personal_info = data.get('personal_info', {})
    return f"""<header>
        <h1>{personal_info.get('name', '用户')}个人征信分析报告</h1>
        <div class="report-info">
            <div>报告时间: <span id="reportDate">{report_date}</span></div>
            <div>报告编号: <span id="reportNumber">{report_number}</span></div>
        </div>
    </header>"""


# 其他生成函数将在下一步添加...
def generate_personal_info(personal_info: Dict) -> str:
    return ""

def generate_stats_grid(stats: Dict) -> str:
    return ""

def generate_debt_analysis(data: Dict) -> str:
    return ""

def generate_loan_analysis(data: Dict) -> str:
    return ""

def generate_credit_card_analysis(data: Dict) -> str:
    return ""

def generate_overdue_analysis(overdue_analysis: Dict) -> str:
    return ""

def generate_query_records(query_records: List, query_charts: List) -> str:
    return ""

def generate_product_recommendations(products: List, match_status: str) -> str:
    return ""

def generate_ai_analysis(data: Dict) -> str:
    return ""

def generate_footer(report_date: str) -> str:
    return ""

def generate_scripts(data: Dict) -> str:
    return ""

