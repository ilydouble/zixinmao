"""
HTML构建器
使用Python代码直接生成HTML，完全基于可视化最新样版.html的格式
"""
from typing import Dict, Any, List, Optional


def format_number(num: Any) -> str:
    """格式化数字，添加千分位"""
    try:
        if isinstance(num, str):
            num = float(num.replace(',', ''))
        return f"{num:,.0f}"
    except:
        return str(num)


def build_credit_report_html(
    report_number: str,
    report_time: str,
    name: str,
    id_card: str,
    personal_info: Dict[str, Any],
    stats: Dict[str, Any],
    debt_composition: List[Dict[str, Any]],
    loan_summary: Dict[str, Any],
    bank_loans: List[Dict[str, Any]],
    non_bank_loans: List[Dict[str, Any]],
    credit_usage: Dict[str, Any],
    credit_cards: List[Dict[str, Any]],
    overdue_analysis: Dict[str, Any],
    overdue_institutions: List[Dict[str, Any]],
    query_records: List[Dict[str, Any]],
    ai_analysis: List[Dict[str, Any]]
) -> str:
    """
    构建完整的征信报告HTML
    完全基于可视化最新样版.html的格式
    """

    # 读取可视化最新样版.html作为基础
    from pathlib import Path
    from loguru import logger

    # 模板文件路径：ai-analysis-service/可视化最新样版.html
    # 当前文件路径：ai-analysis-service/app/service/html_builder.py
    template_path = Path(__file__).parent.parent.parent / '可视化最新样版.html'

    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            html_template = f.read()
        logger.info(f"✅ 成功读取模板文件: {template_path}")
    except Exception as e:
        logger.error(f"❌ 读取模板文件失败: {template_path}, 错误: {e}")
        # 如果读取失败，使用简化版本
        return build_simple_html(
            report_number, report_time, name, id_card,
            personal_info, stats, debt_composition, loan_summary,
            bank_loans, non_bank_loans, credit_usage, credit_cards,
            overdue_analysis, overdue_institutions, query_records, ai_analysis
        )
    
    # 替换标题
    html_template = html_template.replace(
        '<title>唐晓杰个人征信分析报告</title>',
        f'<title>{name}个人征信分析报告</title>'
    )
    
    # 替换报告编号和时间
    import re
    html_template = re.sub(
        r'报告编号：\d+',
        f'报告编号：{report_number}',
        html_template
    )
    html_template = re.sub(
        r'报告时间：[\d\-\s:]+',
        f'报告时间：{report_time}',
        html_template
    )
    
    # 替换个人信息
    html_template = replace_personal_info(html_template, personal_info)
    
    # 替换统计概览
    html_template = replace_stats(html_template, stats)
    
    # 替换负债构成
    html_template = replace_debt_composition(html_template, debt_composition)
    
    # 替换贷款汇总
    html_template = replace_loan_summary(html_template, loan_summary)
    
    # 替换银行贷款明细
    html_template = replace_bank_loans(html_template, bank_loans)
    
    # 替换非银机构贷款明细
    html_template = replace_non_bank_loans(html_template, non_bank_loans)
    
    # 替换信用卡使用分析
    html_template = replace_credit_usage(html_template, credit_usage)
    
    # 替换信用卡明细
    html_template = replace_credit_cards(html_template, credit_cards)
    
    # 替换逾期分析
    html_template = replace_overdue_analysis(html_template, overdue_analysis)
    
    # 替换逾期机构
    html_template = replace_overdue_institutions(html_template, overdue_institutions)
    
    # 替换查询记录
    html_template = replace_query_records(html_template, query_records)
    
    # 替换AI分析
    html_template = replace_ai_analysis(html_template, ai_analysis)
    
    return html_template


def replace_personal_info(html: str, personal_info: Dict[str, Any]) -> str:
    """替换个人信息"""
    import re

    # 用户姓名
    html = re.sub(
        r'(<div class="info-label">用户姓名</div>\s*<div class="info-value">)[^<]+(</div>)',
        lambda m: f'{m.group(1)}{personal_info.get("姓名", "未提供")}{m.group(2)}',
        html
    )

    # 年龄
    html = re.sub(
        r'(<div class="info-label">年龄</div>\s*<div class="info-value">)[^<]+(</div>)',
        lambda m: f'{m.group(1)}{personal_info.get("年龄", "未提供")}{m.group(2)}',
        html
    )

    # 婚姻状况
    html = re.sub(
        r'(<div class="info-label">婚姻状况</div>\s*<div class="info-value">)[^<]+(</div>)',
        lambda m: f'{m.group(1)}{personal_info.get("婚姻状况", "未提供")}{m.group(2)}',
        html
    )

    # 单位性质
    html = re.sub(
        r'(<div class="info-label">单位性质</div>\s*<div class="info-value">)[^<]+(</div>)',
        lambda m: f'{m.group(1)}{personal_info.get("单位性质", "未提供")}{m.group(2)}',
        html
    )

    # 工作时长
    html = re.sub(
        r'(<div class="info-label">工作时长</div>\s*<div class="info-value">)[^<]+(</div>)',
        lambda m: f'{m.group(1)}{personal_info.get("工作时长", "未提供")}{m.group(2)}',
        html
    )

    # 公积金基数
    html = re.sub(
        r'(<div class="info-label">公积金基数</div>\s*<div class="info-value">)[^<]+(</div>)',
        lambda m: f'{m.group(1)}{personal_info.get("公积金基数", "未提供")}{m.group(2)}',
        html
    )

    # 白名单客群
    html = re.sub(
        r'(<div class="info-label">白名单客群</div>\s*<div class="info-value">)[^<]+(</div>)',
        lambda m: f'{m.group(1)}{personal_info.get("白名单客群", "未提供")}{m.group(2)}',
        html
    )

    # 身份证号
    html = re.sub(
        r'(<div class="info-label">身份证号</div>\s*<div class="info-value">)[^<]+(</div>)',
        lambda m: f'{m.group(1)}{personal_info.get("身份证号", "未提供")}{m.group(2)}',
        html
    )

    return html


def replace_stats(html: str, stats: Dict[str, Any]) -> str:
    """替换统计概览"""
    import re

    # 总授信额度
    html = re.sub(
        r'(<div class="stat-label">总授信额度</div>\s*<div class="stat-value">)[^<]+(<span)',
        lambda m: f'{m.group(1)}{format_number(stats.get("总授信额度", 0))}{m.group(2)}',
        html,
        count=1
    )

    # 总负债金额
    html = re.sub(
        r'(<div class="stat-label">总负债金额</div>\s*<div class="stat-value">)[^<]+(<span)',
        lambda m: f'{m.group(1)}{format_number(stats.get("总负债金额", 0))}{m.group(2)}',
        html,
        count=1
    )

    # 总机构数
    html = re.sub(
        r'(<div class="stat-label">总机构数</div>\s*<div class="stat-value">)\d+(<span)',
        lambda m: f'{m.group(1)}{stats.get("总机构数", 0)}{m.group(2)}',
        html,
        count=1
    )

    # 贷款机构数
    html = re.sub(
        r'(<div class="stat-label">贷款机构数</div>\s*<div class="stat-value">)\d+(<span)',
        lambda m: f'{m.group(1)}{stats.get("贷款机构数", 0)}{m.group(2)}',
        html,
        count=1
    )

    # 历史逾期月份
    html = re.sub(
        r'(<div class="stat-label">历史逾期月份</div>\s*<div class="stat-value">)\d+(<span)',
        lambda m: f'{m.group(1)}{stats.get("历史逾期月份", 0)}{m.group(2)}',
        html,
        count=1
    )

    # 近3月查询次数
    html = re.sub(
        r'(<div class="stat-label">近3月查询次数</div>\s*<div class="stat-value">)\d+(<span)',
        lambda m: f'{m.group(1)}{stats.get("近3月查询次数", 0)}{m.group(2)}',
        html,
        count=1
    )

    return html


def replace_debt_composition(html: str, debt_composition: List[Dict[str, Any]]) -> str:
    """替换负债构成表格"""
    import re
    
    # 构建表格行
    rows_html = ""
    for item in debt_composition:
        usage_rate = item.get("使用率", "-")
        class_attr = ' class="good"' if usage_rate != "-" and usage_rate.replace("%", "").replace(".", "").isdigit() and float(usage_rate.replace("%", "")) < 30 else ''
        
        rows_html += f'''
                                <tr>
                                    <td class="highlight">{item.get("类型", "-")}</td>
                                    <td>{item.get("机构数", 0)}</td>
                                    <td>{item.get("账户数", 0)}</td>
                                    <td>{format_number(item.get("授信额度", 0))}</td>
                                    <td>{format_number(item.get("余额", 0))}</td>
                                    <td{class_attr}>{usage_rate}</td>
                                </tr>'''
    
    # 替换表格内容
    pattern = r'(<div class="chart-title">\s*<span class="icon icon-chart"></span>\s*负债构成分析\s*</div>.*?<tbody>)(.*?)(</tbody>)'
    html = re.sub(pattern, lambda m: f'{m.group(1)}{rows_html}{m.group(3)}', html, flags=re.DOTALL)

    return html


def replace_loan_summary(html: str, loan_summary: Dict[str, Any]) -> str:
    """替换贷款汇总"""
    import re

    # 贷款平均期限
    html = re.sub(
        r'(<span>贷款平均期限</span>\s*<span>)[^<]+(</span>)',
        lambda m: f'{m.group(1)}{loan_summary.get("贷款平均期限", "0年")}{m.group(2)}',
        html,
        count=1
    )

    # 最高单笔贷款余额
    html = re.sub(
        r'(<span>最高单笔贷款余额</span>\s*<span>)[^<]+(</span>)',
        lambda m: f'{m.group(1)}{format_number(loan_summary.get("最高单笔贷款余额", 0))}元{m.group(2)}',
        html,
        count=1
    )

    # 最小单笔贷款余额
    html = re.sub(
        r'(<span>最小单笔贷款余额</span>\s*<span>)[^<]+(</span>)',
        lambda m: f'{m.group(1)}{format_number(loan_summary.get("最小单笔贷款余额", 0))}元{m.group(2)}',
        html,
        count=1
    )

    # 贷款机构类型
    html = re.sub(
        r'(<span>贷款机构类型</span>\s*<span>)[^<]+(</span>)',
        lambda m: f'{m.group(1)}{loan_summary.get("贷款机构类型", "未知")}{m.group(2)}',
        html,
        count=1
    )

    return html


def replace_bank_loans(html: str, bank_loans: List[Dict[str, Any]]) -> str:
    """替换银行贷款明细表格"""
    import re
    
    if not bank_loans:
        rows_html = '<tr><td colspan="8" style="text-align: center; color: #999;">暂无银行贷款记录</td></tr>'
    else:
        rows_html = ""
        for idx, loan in enumerate(bank_loans, 1):
            rows_html += f'''
                                <tr>
                                    <td>{loan.get("序号", idx)}</td>
                                    <td class="highlight">{loan.get("管理机构", "-")}</td>
                                    <td>{format_number(loan.get("授信额度", 0))}</td>
                                    <td>{format_number(loan.get("余额", 0))}</td>
                                    <td>{loan.get("业务类型", "-")}</td>
                                    <td>{loan.get("起止日期", "-")}</td>
                                    <td>{loan.get("还款状态", "-")}</td>
                                    <td>{loan.get("逾期情况", "无")}</td>
                                </tr>'''
    
    # 替换表格内容
    pattern = r'(<h3 class="section-title"[^>]*>银行贷款明细</h3>.*?<tbody>)(.*?)(</tbody>)'
    html = re.sub(pattern, lambda m: f'{m.group(1)}{rows_html}{m.group(3)}', html, flags=re.DOTALL)

    return html


def replace_non_bank_loans(html: str, non_bank_loans: List[Dict[str, Any]]) -> str:
    """替换非银机构贷款明细表格"""
    import re
    
    if not non_bank_loans:
        rows_html = '<tr><td colspan="8" style="text-align: center; color: #999;">暂无非银机构贷款记录</td></tr>'
    else:
        rows_html = ""
        for idx, loan in enumerate(non_bank_loans, 1):
            rows_html += f'''
                                <tr>
                                    <td>{loan.get("序号", idx)}</td>
                                    <td class="highlight">{loan.get("管理机构", "-")}</td>
                                    <td>{format_number(loan.get("授信额度", 0))}</td>
                                    <td>{format_number(loan.get("余额", 0))}</td>
                                    <td>{loan.get("业务类型", "-")}</td>
                                    <td>{loan.get("起止日期", "-")}</td>
                                    <td>{loan.get("还款状态", "-")}</td>
                                    <td>{loan.get("逾期情况", "无")}</td>
                                </tr>'''
    
    # 替换表格内容
    pattern = r'(<h3 class="section-title"[^>]*>非银机构贷款明细</h3>.*?<tbody>)(.*?)(</tbody>)'
    html = re.sub(pattern, lambda m: f'{m.group(1)}{rows_html}{m.group(3)}', html, flags=re.DOTALL)

    return html


def replace_credit_usage(html: str, credit_usage: Dict[str, Any]) -> str:
    """替换信用卡使用分析"""
    import re

    # 总使用率
    html = re.sub(
        r'(<div class="usage-percentage">)[^<]+(</div>)',
        lambda m: f'{m.group(1)}{credit_usage.get("总使用率", "0%")}{m.group(2)}',
        html,
        count=1
    )

    # 风险等级
    html = re.sub(
        r'(<div class="usage-status">)[^<]+(</div>)',
        lambda m: f'{m.group(1)}{credit_usage.get("风险等级", "未知")}{m.group(2)}',
        html,
        count=1
    )

    # 总授信额度
    html = re.sub(
        r'(<span>总授信额度</span>\s*<div class="detail-number">)[^<]+(元</div>)',
        lambda m: f'{m.group(1)}{format_number(credit_usage.get("总授信额度", 0))}{m.group(2)}',
        html,
        count=1
    )

    # 已用额度
    html = re.sub(
        r'(<span>已用额度</span>\s*<div class="detail-number">)[^<]+(元</div>)',
        lambda m: f'{m.group(1)}{format_number(credit_usage.get("已用额度", 0))}{m.group(2)}',
        html,
        count=1
    )

    # 可用额度
    html = re.sub(
        r'(<span>可用额度</span>\s*<div class="detail-number">)[^<]+(元</div>)',
        lambda m: f'{m.group(1)}{format_number(credit_usage.get("可用额度", 0))}{m.group(2)}',
        html,
        count=1
    )

    return html


def replace_credit_cards(html: str, credit_cards: List[Dict[str, Any]]) -> str:
    """替换信用卡明细表格"""
    import re

    if not credit_cards:
        rows_html = '<tr><td colspan="8" style="text-align: center; color: #999;">暂无信用卡记录</td></tr>'
    else:
        rows_html = ""
        for idx, card in enumerate(credit_cards, 1):
            usage_rate = card.get("使用率", "0%")
            class_attr = ' class="good"' if usage_rate.replace("%", "").replace(".", "").isdigit() and float(usage_rate.replace("%", "")) < 30 else ''

            rows_html += f'''
                                <tr>
                                    <td>{card.get("序号", idx)}</td>
                                    <td class="highlight">{card.get("管理机构", "-")}</td>
                                    <td>{format_number(card.get("授信额度", 0))}</td>
                                    <td>{format_number(card.get("已用额度", 0))}</td>
                                    <td>{format_number(card.get("大额专项分期余额", 0))}</td>
                                    <td{class_attr}>{usage_rate}</td>
                                    <td>{card.get("还款状态", "-")}</td>
                                    <td>{card.get("逾期情况", "无")}</td>
                                </tr>'''

    # 替换表格内容
    pattern = r'(<h3 class="section-title"[^>]*>信用卡明细</h3>.*?<tbody>)(.*?)(</tbody>)'
    html = re.sub(pattern, lambda m: f'{m.group(1)}{rows_html}{m.group(3)}', html, flags=re.DOTALL)

    return html


def replace_overdue_analysis(html: str, overdue_analysis: Dict[str, Any]) -> str:
    """替换逾期分析"""
    import re

    # 总逾期月份
    html = re.sub(
        r'(<div class="overdue-stat-label">总逾期月份</div>\s*<div class="overdue-stat-value">)[^<]+(</div>)',
        lambda m: f'{m.group(1)}{overdue_analysis.get("总逾期月份", 0)}个月{m.group(2)}',
        html,
        count=1
    )

    # 90天以上逾期
    html = re.sub(
        r'(<div class="overdue-stat-label">90天以上逾期</div>\s*<div class="overdue-stat-value">)[^<]+(</div>)',
        lambda m: f'{m.group(1)}{overdue_analysis.get("90天以上逾期", 0)}个月{m.group(2)}',
        html,
        count=1
    )

    # 当前逾期
    html = re.sub(
        r'(<div class="overdue-stat-label">当前逾期</div>\s*<div class="overdue-stat-value">)[^<]+(</div>)',
        lambda m: f'{m.group(1)}{overdue_analysis.get("当前逾期", 0)}笔{m.group(2)}',
        html,
        count=1
    )

    # 历史最高逾期
    html = re.sub(
        r'(<div class="overdue-stat-label">历史最高逾期</div>\s*<div class="overdue-stat-value">)[^<]+(</div>)',
        lambda m: f'{m.group(1)}{overdue_analysis.get("历史最高逾期", "无")}{m.group(2)}',
        html,
        count=1
    )

    return html


def replace_overdue_institutions(html: str, overdue_institutions: List[Dict[str, Any]]) -> str:
    """替换逾期机构列表"""
    import re

    if not overdue_institutions:
        items_html = '''
                            <div class="institution-item">
                                <div class="institution-name">无逾期记录</div>
                            </div>'''
    else:
        items_html = ""
        for inst in overdue_institutions:
            items_html += f'''
                            <div class="institution-item">
                                <div class="institution-name">{inst.get("机构名称", "-")}</div>
                                <div class="institution-details">
                                    <div class="detail-item">
                                        <div class="detail-label">总逾期</div>
                                        <div class="detail-value">{inst.get("总逾期", "0个月")}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">90天以上</div>
                                        <div class="detail-value">{inst.get("90天以上", "0个月")}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">当前状态</div>
                                        <div class="detail-status status-closed">{inst.get("当前状态", "未知")}</div>
                                    </div>
                                </div>
                            </div>'''

    # 替换列表内容
    pattern = r'(<div class="overdue-institutions-list">)(.*?)(</div>\s*</div>\s*</div>\s*<!-- 查询记录 -->)'
    html = re.sub(pattern, lambda m: f'{m.group(1)}{items_html}{m.group(3)}', html, flags=re.DOTALL)

    return html


def replace_query_records(html: str, query_records: List[Dict[str, Any]]) -> str:
    """替换查询记录表格"""
    import re

    if not query_records:
        # 如果没有查询记录，使用默认的7个时间段
        query_records = [
            {"时间段": "近7天", "贷款审批": 0, "信用卡审批": 0, "担保资格审查": 0, "保前审查": 0, "资信审查": 0, "非贷后管理查询": 0, "本人查询": 0},
            {"时间段": "近1月", "贷款审批": 0, "信用卡审批": 0, "担保资格审查": 0, "保前审查": 0, "资信审查": 0, "非贷后管理查询": 0, "本人查询": 0},
            {"时间段": "近2月", "贷款审批": 0, "信用卡审批": 0, "担保资格审查": 0, "保前审查": 0, "资信审查": 0, "非贷后管理查询": 0, "本人查询": 0},
            {"时间段": "近3月", "贷款审批": 0, "信用卡审批": 0, "担保资格审查": 0, "保前审查": 0, "资信审查": 0, "非贷后管理查询": 0, "本人查询": 0},
            {"时间段": "近6月", "贷款审批": 0, "信用卡审批": 0, "担保资格审查": 0, "保前审查": 0, "资信审查": 0, "非贷后管理查询": 0, "本人查询": 0},
            {"时间段": "近12月", "贷款审批": 0, "信用卡审批": 0, "担保资格审查": 0, "保前审查": 0, "资信审查": 0, "非贷后管理查询": 0, "本人查询": 0},
            {"时间段": "近24月", "贷款审批": 0, "信用卡审批": 0, "担保资格审查": 0, "保前审查": 0, "资信审查": 0, "非贷后管理查询": 0, "本人查询": 0},
        ]

    rows_html = ""
    for record in query_records:
        loan_approval = record.get("贷款审批", 0)
        guarantee = record.get("担保资格审查", 0)
        non_post_loan = record.get("非贷后管理查询", 0)

        loan_class = ' class="highlight"' if loan_approval > 5 else ''
        guarantee_class = ' class="highlight"' if guarantee > 5 else ''
        non_post_class = ' class="highlight"' if non_post_loan > 10 else ''

        rows_html += f'''
                                <tr>
                                    <td class="highlight">{record.get("时间段", "-")}</td>
                                    <td{loan_class}>{loan_approval}</td>
                                    <td>{record.get("信用卡审批", 0)}</td>
                                    <td{guarantee_class}>{guarantee}</td>
                                    <td>{record.get("保前审查", 0)}</td>
                                    <td>{record.get("资信审查", 0)}</td>
                                    <td{non_post_class}>{non_post_loan}</td>
                                    <td>{record.get("本人查询", 0)}</td>
                                </tr>'''

    # 替换表格内容
    pattern = r'(<h3 class="section-title"[^>]*>查询记录</h3>.*?<tbody>)(.*?)(</tbody>)'
    html = re.sub(pattern, lambda m: f'{m.group(1)}{rows_html}{m.group(3)}', html, flags=re.DOTALL)

    return html


def replace_ai_analysis(html: str, ai_analysis: List[Dict[str, Any]]) -> str:
    """替换AI分析列表"""
    import re

    if not ai_analysis:
        items_html = '''
                            <div class="ai-analysis-item">
                                <div class="ai-analysis-number">1</div>
                                <div class="ai-analysis-text">暂无AI分析结果</div>
                            </div>'''
    else:
        items_html = ""
        for idx, item in enumerate(ai_analysis, 1):
            items_html += f'''
                            <div class="ai-analysis-item">
                                <div class="ai-analysis-number">{item.get("序号", idx)}</div>
                                <div class="ai-analysis-text">{item.get("内容", "")}</div>
                            </div>'''

    # 替换列表内容
    pattern = r'(<div class="ai-analysis-list">)(.*?)(</div>\s*</div>\s*</div>\s*</div>\s*</body>)'
    html = re.sub(pattern, lambda m: f'{m.group(1)}{items_html}{m.group(3)}', html, flags=re.DOTALL)

    return html


def build_simple_html(*args, **kwargs) -> str:
    """构建简化版HTML（当无法读取模板时使用）"""
    return "<html><body><h1>报告生成失败：无法读取模板文件</h1></body></html>"

