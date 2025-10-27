"""
可视化报告数据模型
定义征信报告可视化所需的数据结构
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# 个人信息概览
class PersonalInfo(BaseModel):
    """个人信息"""
    name: str = Field(..., description="姓名")
    age: str = Field(..., description="年龄")
    marital_status: str = Field(..., description="婚姻状况")
    id_card: str = Field(..., description="身份证号")


class StatCard(BaseModel):
    """统计卡片数据"""
    total_credit: int = Field(..., description="总授信额度(元)")
    total_debt: int = Field(..., description="总负债金额(元)")
    total_institutions: int = Field(..., description="总机构数")
    loan_institutions: int = Field(..., description="贷款机构数")
    overdue_months: int = Field(..., description="历史逾期月份")
    query_count_3m: int = Field(..., description="近3月查询次数")

# 贷款与负债分析
class DebtItem(BaseModel):
    """负债项目"""
    type: str = Field(..., description="类型")
    institutions: int = Field(..., description="机构数")
    accounts: int = Field(..., description="账户数")
    credit_limit: int = Field(..., description="授信额度(元)")
    balance: int = Field(..., description="余额(元)")
    usage_rate: Optional[str] = Field(None, description="使用率")

class LoanChart(BaseModel):
    """贷款详情图表"""
    institution: str = Field(..., description="机构名称")
    credit_limit: int = Field(..., description="授信额度(元)")
    balance: int = Field(..., description="贷款余额(元)")

class LoanSummary(BaseModel):
    """贷款汇总"""
    avg_period: str = Field(..., description="贷款平均期限(如：5年)")
    max_balance: int = Field(..., description="最高单笔贷款余额(元)")
    min_balance: int = Field(..., description="最小单笔贷款余额(元)")
    institution_types: str = Field(..., description="贷款机构类型")

class LoanDetail(BaseModel):
    """贷款明细"""
    id: int = Field(..., description="序号")
    institution: str = Field(..., description="管理机构")
    credit_limit: int = Field(..., description="授信额度(元)")
    balance: int = Field(..., description="余额(元)")
    business_type: str = Field(..., description="业务类型")
    period: str = Field(..., description="起止日期")
    remaining_period: str = Field(..., description="剩余期限")
    usage_rate: str = Field(..., description="使用率")


# 信用卡使用情况
class CreditUsageAnalysis(BaseModel):
    """信用卡使用率分析"""
    usage_percentage: float = Field(..., description="使用率百分比")
    risk_level: str = Field(..., description="风险等级")
    total_credit: int = Field(..., description="授信额度(元)")
    used_credit: int = Field(..., description="已用额度(元)")
    available_credit: int = Field(..., description="可用额度(元)")
    recommended_threshold: float = Field(default=70.0, description="建议阈值")
    safety_margin: Optional[float] = Field(None, description="安全空间")
    impact_level: str = Field(..., description="影响程度")

class CreditCardDetail(BaseModel):
    """信用卡明细"""
    id: int = Field(..., description="序号")
    institution: str = Field(..., description="管理机构")
    credit_limit: int = Field(..., description="授信额度(元)")
    used_amount: int = Field(..., description="已用额度(元)")
    installment_balance: int = Field(..., description="大额专项分期余额(元)")
    usage_rate: str = Field(..., description="使用率")
    status: str = Field(..., description="当前状态")
    overdue_history: str = Field(..., description="历史逾期")


# 逾期情况分析
class OverdueInstitution(BaseModel):
    """逾期机构信息"""
    name: str = Field(..., description="机构名称")
    total_overdue_months: int = Field(..., description="总逾期月数")
    overdue_90plus_months: int = Field(..., description="90天以上逾期月数")
    status: str = Field(..., description="当前状态")

class OverdueAnalysis(BaseModel):
    """逾期分析"""
    severity_level: str = Field(..., description="严重程度")
    severity_percentage: float = Field(..., description="严重程度百分比(0-100)")
    overdue_90plus: int = Field(..., description="90天以上逾期月数")
    overdue_30_90: int = Field(..., description="30-90天逾期月数")
    overdue_under_30: int = Field(..., description="30天以内逾期月数")
    institutions: List[OverdueInstitution] = Field(..., description="逾期机构列表")

# 查询记录分析
class QueryRecord(BaseModel):
    """查询记录"""
    period: str = Field(..., description="时间段")
    loan_approval: int = Field(..., description="贷款审批")
    credit_card_approval: int = Field(..., description="信用卡审批")
    guarantee_review: int = Field(..., description="担保资格审查")
    insurance_review: int = Field(..., description="保前审查")
    credit_review: int = Field(..., description="资信审查")
    non_post_loan: int = Field(..., description="非贷后管理查询")
    self_query: int = Field(..., description="本人查询")


# 信贷产品匹配结果
class ProductRecommendation(BaseModel):
    """产品推荐"""
    bank: str = Field(..., description="所属银行")
    product_name: str = Field(..., description="产品名")
    min_rate: str = Field(..., description="最低年利率")
    max_credit: str = Field(..., description="最高授信额度(如：30万)")
    rating: int = Field(..., description="推荐指数(1-5星)")
    suggestion: str = Field(..., description="建议")

# AI专家解析
class AIAnalysisPoint(BaseModel):
    """AI分析要点"""
    number: int = Field(..., description="序号")
    content: str = Field(..., description="分析内容")


class VisualizationReportData(BaseModel):
    """可视化报告完整数据"""
    # 报告基本信息
    # report_number: str = Field(..., description="报告编号")
    # report_date: str = Field(..., description="报告时间")
    
    # 个人信息
    personal_info: PersonalInfo = Field(..., description="个人信息")
    
    # 统计卡片
    stats: StatCard = Field(..., description="统计数据")

    # 负债构成
    debt_composition: List[DebtItem] = Field(..., description="负债构成列表")
    
    # 贷款详情
    loan_charts: List[LoanChart] = Field(..., description="贷款图表标签")
    loan_summary: LoanSummary = Field(..., description="贷款汇总信息")
    bank_loans: List[LoanDetail] = Field(..., description="银行贷款列表")
    non_bank_loans: List[LoanDetail] = Field(..., description="非银机构贷款列表")
    
    # 信用卡详情
    credit_usage: CreditUsageAnalysis = Field(..., description="信用卡使用率分析")
    credit_cards: List[CreditCardDetail] = Field(..., description="信用卡列表")

    # 逾期分析
    overdue_analysis: OverdueAnalysis = Field(..., description="逾期分析")
    
    # 查询记录
    query_records: List[QueryRecord] = Field(..., description="查询记录列表")
    
    # 产品推荐
    product_recommendations: List[ProductRecommendation] = Field(..., description="产品推荐列表")
    match_status: str = Field(..., description="匹配状态描述")
    
    # AI分析
    ai_analysis: List[AIAnalysisPoint] = Field(..., description="AI分析要点")
    suitability_rating: str = Field(..., description="适合贷款申请程度")
    optimization_suggestions: List[str] = Field(..., description="优化建议列表")
    risk_warning: str = Field(..., description="风险提示")

    query_charts: List[QueryRecord] = Field(..., description="查询记录图表")

    
    # query_chart_labels: List[str] = Field(..., description="查询图表标签")
    # query_chart_loan_data: List[int] = Field(..., description="查询图表贷款审批数据")
    # query_chart_card_data: List[int] = Field(..., description="查询图表信用卡审批数据")
    # query_chart_guarantee_data: List[int] = Field(..., description="查询图表担保审查数据")


class VisualizationReportRequest(BaseModel):
    """可视化报告请求"""
    task_id: Optional[str] = Field(None, description="任务ID,如果提供则从任务结果生成报告")
    report_data: Optional[Dict[str, Any]] = Field(None, description="直接提供的报告数据")

