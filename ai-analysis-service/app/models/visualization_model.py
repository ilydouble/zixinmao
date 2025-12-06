"""
可视化报告数据模型
定义征信报告可视化所需的数据结构
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from .bigdata_model import *

# 个人信息概览
class PersonalInfo(BaseModel):
    """个人信息"""
    name: Optional[str] = Field(default="未知", description="姓名")
    age: Optional[str] = Field(default="未知", description="年龄")
    marital_status: Optional[str] = Field(default="未知", description="婚姻状况")
    id_card: Optional[str] = Field(default="未知", description="身份证号")


class StatCard(BaseModel):
    """统计卡片数据"""
    total_credit: Optional[int] = Field(default=0, description="总授信额度(元)")
    total_debt: Optional[int] = Field(default=0, description="总负债金额(元)")
    total_institutions: Optional[int] = Field(default=0, description="总机构数")
    loan_institutions: Optional[int] = Field(default=0, description="贷款机构数")
    overdue_months: Optional[int] = Field(default=0, description="历史逾期月份")
    query_count_3m: Optional[int] = Field(default=0, description="近3月查询次数")

# 贷款与负债分析
class DebtItem(BaseModel):
    """负债项目"""
    type: Optional[str] = Field(default="未知", description="类型")
    institutions: Optional[int] = Field(default=0, description="机构数")
    accounts: Optional[int] = Field(default=0, description="账户数")
    credit_limit: Optional[int] = Field(default=0, description="授信额度(元)")
    balance: Optional[int] = Field(default=0, description="余额(元)")
    usage_rate: Optional[str] = Field(default="0%", description="使用率")

class LoanChart(BaseModel):
    """贷款详情图表"""
    institution: Optional[str] = Field(default="未知", description="机构名称")
    credit_limit: Optional[int] = Field(default=0, description="授信额度(元)")
    balance: Optional[int] = Field(default=0, description="贷款余额(元)")

class LoanSummary(BaseModel):
    """贷款汇总"""
    avg_period: Optional[str] = Field(default="未知", description="贷款平均期限(如：5年)")
    max_balance: Optional[int] = Field(default=0, description="最高单笔贷款余额(元)")
    min_balance: Optional[int] = Field(default=0, description="最小单笔贷款余额(元)")
    institution_types: Optional[str] = Field(default="未知", description="贷款机构类型")

class LoanDetail(BaseModel):
    """贷款明细"""
    id: Optional[int] = Field(default=0, description="序号")
    institution: Optional[str] = Field(default="未知", description="管理机构")
    credit_limit: Optional[int] = Field(default=0, description="授信额度(元)")
    balance: Optional[int] = Field(default=0, description="余额(元)")
    business_type: Optional[str] = Field(default="未知", description="业务类型")
    period: Optional[str] = Field(default="未知", description="起止日期")
    remaining_period: Optional[str] = Field(default="未知", description="剩余期限")
    usage_rate: Optional[str] = Field(default="0%", description="使用率")


# 信用卡使用情况
class CreditUsageAnalysis(BaseModel):
    """信用卡使用率分析"""
    usage_percentage: Optional[float] = Field(default=0.0, description="使用率百分比")
    risk_level: Optional[str] = Field(default="低风险", description="风险等级")
    total_credit: Optional[int] = Field(default=0, description="授信额度(元)")
    used_credit: Optional[int] = Field(default=0, description="已用额度(元)")
    available_credit: Optional[int] = Field(default=0, description="可用额度(元)")
    recommended_threshold: Optional[float] = Field(default=70.0, description="建议阈值")
    safety_margin: Optional[float] = Field(default=0.0, description="安全空间")
    impact_level: Optional[str] = Field(default="低", description="影响程度")

class CreditCardDetail(BaseModel):
    """信用卡明细"""
    id: Optional[int] = Field(default=0, description="序号")
    institution: Optional[str] = Field(default="未知", description="管理机构")
    credit_limit: Optional[int] = Field(default=0, description="授信额度(元)")
    used_amount: Optional[int] = Field(default=0, description="已用额度(元)")
    installment_balance: Optional[int] = Field(default=0, description="大额专项分期余额(元)")
    usage_rate: Optional[str] = Field(default="0%", description="使用率")
    status: Optional[str] = Field(default="未知", description="当前状态")
    overdue_history: Optional[str] = Field(default="无", description="历史逾期")


# 逾期情况分析
class OverdueInstitution(BaseModel):
    """逾期机构信息"""
    name: Optional[str] = Field(default="未知", description="机构名称")
    total_overdue_months: Optional[int] = Field(default=0, description="总逾期月数")
    overdue_90plus_months: Optional[int] = Field(default=0, description="90天以上逾期月数")
    status: Optional[str] = Field(default="未知", description="当前状态")

class OverdueAnalysis(BaseModel):
    """逾期分析"""
    severity_level: Optional[str] = Field(default="无逾期", description="严重程度")
    severity_percentage: Optional[float] = Field(default=0.0, description="严重程度百分比(0-100)")
    overdue_90plus: Optional[int] = Field(default=0, description="90天以上逾期月数")
    overdue_30_90: Optional[int] = Field(default=0, description="30-90天逾期月数")
    overdue_under_30: Optional[int] = Field(default=0, description="30天以内逾期月数")
    institutions: Optional[List[OverdueInstitution]] = Field(default_factory=list, description="逾期机构列表")

# 查询记录分析
class QueryRecord(BaseModel):
    """查询记录"""
    period: Optional[str] = Field(default="未知", description="时间段")
    loan_approval: Optional[int] = Field(default=0, description="贷款审批")
    credit_card_approval: Optional[int] = Field(default=0, description="信用卡审批")
    guarantee_review: Optional[int] = Field(default=0, description="担保资格审查")
    insurance_review: Optional[int] = Field(default=0, description="保前审查")
    credit_review: Optional[int] = Field(default=0, description="资信审查")
    financing_approval: Optional[int] = Field(default=0, description="融资审批")
    non_post_loan: Optional[int] = Field(default=0, description="非贷后管理查询")
    self_query: Optional[int] = Field(default=0, description="本人查询")


# 信贷产品匹配结果
class ProductRecommendation(BaseModel):
    """产品推荐"""
    bank: Optional[str] = Field(default="未知银行", description="所属银行")
    product_name: Optional[str] = Field(default="未知产品", description="产品名")
    min_rate: Optional[str] = Field(default="未知", description="最低年利率")
    max_credit: Optional[str] = Field(default="未知", description="最高授信额度(如：30万)")
    rating: Optional[int] = Field(default=3, description="推荐指数(1-5星)")
    suggestion: Optional[str] = Field(default="暂无建议", description="建议")

# AI专家解析
class AIAnalysisPoint(BaseModel):
    """AI分析要点"""
    number: Optional[int] = Field(default=0, description="序号")
    content: Optional[str] = Field(default="暂无分析", description="分析内容")


class AIExpertAnalysis(BaseModel):
    """AI专家综合分析"""
    analysis_points: Optional[List[AIAnalysisPoint]] = Field(default_factory=list, description="总结性分析（详细分析要点）")
    suitability_rating: Optional[str] = Field(default="一般", description="贷款申请适合度(非常适合/适合/一般/不太适合/不适合)")
    optimization_suggestions: Optional[List[str]] = Field(default_factory=list, description="优化建议列表")
    risk_warning: Optional[str] = Field(default="请注意保护个人信用记录", description="风险提示")


class VisualizationReportData(BaseModel):
    """可视化报告完整数据

    🔑 命名规范说明：
    - Python字段名：使用蛇形命名（snake_case），符合Python规范
    - JSON序列化：使用驼峰命名（camelCase），符合前端JavaScript规范
    - 通过 alias 实现两种命名风格的转换
    - 序列化时必须使用 model_dump(by_alias=True) 才能输出驼峰命名
    """

    # 配置模型支持通过字段名和别名进行赋值
    model_config = ConfigDict(populate_by_name=True)

    # 报告基本信息（保持蛇形，前端使用 snake_case）
    report_number: Optional[str] = Field(default="", description="报告编号（格式：YYYYMMDDHHmmss）")
    report_date: Optional[str] = Field(default="", description="报告时间（格式：YYYY-MM-DD）")

    # 个人信息（保持蛇形）
    personal_info: Optional[PersonalInfo] = Field(default_factory=PersonalInfo, description="个人信息")

    # 统计卡片（保持蛇形）
    stats: Optional[StatCard] = Field(default_factory=StatCard, description="统计数据")

    # 负债构成（保持蛇形）
    debt_composition: Optional[List[DebtItem]] = Field(default_factory=list, description="负债构成列表")

    # 贷款详情（保持蛇形）
    loan_charts: Optional[List[LoanChart]] = Field(default_factory=list, description="贷款图表标签")
    loan_summary: Optional[LoanSummary] = Field(default_factory=LoanSummary, description="贷款汇总信息")
    bank_loans: Optional[List[LoanDetail]] = Field(default_factory=list, description="银行贷款列表")
    non_bank_loans: Optional[List[LoanDetail]] = Field(default_factory=list, description="非银机构贷款列表")

    # 信用卡详情（保持蛇形）
    credit_usage: Optional[CreditUsageAnalysis] = Field(default_factory=CreditUsageAnalysis, description="信用卡使用率分析")
    credit_cards: Optional[List[CreditCardDetail]] = Field(default_factory=list, description="信用卡列表")

    # 逾期分析（保持蛇形）
    overdue_analysis: Optional[OverdueAnalysis] = Field(default_factory=OverdueAnalysis, description="逾期分析")

    # 查询记录（保持蛇形）
    query_records: Optional[List[QueryRecord]] = Field(default_factory=list, description="查询记录列表")

    # 产品推荐（保持蛇形）
    product_recommendations: Optional[List[ProductRecommendation]] = Field(default_factory=list, description="产品推荐列表")

    # AI专家分析（保持蛇形）
    ai_expert_analysis: Optional[AIExpertAnalysis] = Field(default_factory=AIExpertAnalysis, description="AI专家综合分析")

    # 图表（保持蛇形）
    query_charts: Optional[List[QueryRecord]] = Field(default_factory=list, description="查询记录图表")

    # 大数据报告字段（可选，API失败时使用默认值）
    report_summary: Optional[ReportSummary] = Field(default_factory=ReportSummary, alias="reportSummary", description="报告摘要")
    basic_info: Optional[BasicInfo] = Field(default_factory=BasicInfo, alias="basicInfo", description="基本信息")
    risk_identification: Optional[RiskIdentification] = Field(default_factory=RiskIdentification, alias="riskIdentification", description="风险识别产品")
    credit_assessment: Optional[CreditAssessment] = Field(default_factory=CreditAssessment, alias="creditAssessment", description="信贷评估产品")
    leasing_risk_assessment: Optional[LeasingRiskAssessment] = Field(default_factory=LeasingRiskAssessment, alias="leasingRiskAssessment", description="租赁风险评估产品")
    comprehensive_analysis: Optional[List[str]] = Field(default_factory=list, alias="comprehensiveAnalysis", description="综合分析文字列表")
    report_footer: Optional[ReportFooter] = Field(default_factory=ReportFooter, alias="reportFooter", description="报告页脚")



class VisualizationReportRequest(BaseModel):
    """可视化报告请求"""
    task_id: Optional[str] = Field(None, description="任务ID,如果提供则从任务结果生成报告")
    report_data: Optional[Dict[str, Any]] = Field(None, description="直接提供的报告数据")

