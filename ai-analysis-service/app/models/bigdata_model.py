"""
大数据报告模型定义
用于天远数据报告的结构化数据模型
"""
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum

class COMBHZY2Request(BaseModel):
    """
    COMBHZY2接口请求参数实体类。
    """
    mobile_no: Optional[str] = Field(None, description="手机号码")
    id_card: Optional[str] = Field(None, description="身份证号")
    name: Optional[str] = Field(None, description="姓名")
    authorization_url: Optional[str] = Field(None, description="授权书地址")


# ==================== 枚举类型 ====================

class RiskLevel(str, Enum):
    """风险等级"""
    LOW = "低风险"
    MEDIUM = "中风险"
    HIGH = "高风险"
    UNKNOWN = "未知"


class CaseType(str, Enum):
    """案件类型"""
    CIVIL = "民事案件"
    CRIMINAL = "刑事案件"
    ADMINISTRATIVE = "行政案件"


class ExecutionStatus(str, Enum):
    """执行状态"""
    IN_PROGRESS = "执行中"
    COMPLETED = "已结案"
    TERMINATED = "终本结案"


# ==================== 报告摘要模块 ====================

class RuleValidation(BaseModel):
    """规则验证"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "code": "STR0042314/贷前-经营性租赁全量策略",
                "result": "高风险"
            }
        }
    )

    code: Optional[str] = Field(default="未知", description="规则验证所使用的策略编号")
    result: Optional[str] = Field(default="未知", description="规则验证的最终判定结果")


class AntiFraudScore(BaseModel):
    """反欺诈评分"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "level": "中风险"
            }
        }
    )

    level: Optional[str] = Field(default="未知", description="反欺诈评分对应的风险等级")


class AntiFraudRule(BaseModel):
    """反欺诈规则"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "code": "STR0042314/贷前-经营性租赁全量策略",
                "level": "高风险"
            }
        }
    )

    code: Optional[str] = Field(default="未知", description="反欺诈策略编号")
    level: Optional[str] = Field(default="未知", description="反欺诈策略的命中等级")


class AbnormalRulesHit(BaseModel):
    """异常规则命中"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "count": 4,
                "alert": "高风险提示"
            }
        }
    )

    count: Optional[int] = Field(default=0, ge=0, description="异常规则的累计命中条数")
    alert: Optional[str] = Field(default="暂无", description="异常规则的整体风险提示语")


class ReportSummary(BaseModel):
    """报告摘要"""
    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "ruleValidation": {
                    "code": "STR0042314/贷前-经营性租赁全量策略",
                    "result": "高风险"
                },
                "antiFraudScore": {
                    "level": "中风险"
                },
                "antiFraudRule": {
                    "code": "STR0042314/贷前-经营性租赁全量策略",
                    "level": "高风险"
                },
                "abnormalRulesHit": {
                    "count": 4,
                    "alert": "高风险提示"
                }
            }
        }
    )

    rule_validation: Optional[RuleValidation] = Field(default_factory=RuleValidation, alias="ruleValidation", description="规则验证结果")
    anti_fraud_score: Optional[AntiFraudScore] = Field(default_factory=AntiFraudScore, alias="antiFraudScore", description="反欺诈评分")
    anti_fraud_rule: Optional[AntiFraudRule] = Field(default_factory=AntiFraudRule, alias="antiFraudRule", description="反欺诈规则")
    abnormal_rules_hit: Optional[AbnormalRulesHit] = Field(default_factory=AbnormalRulesHit, alias="abnormalRulesHit", description="异常规则命中情况")


# ==================== 基本信息模块 ====================

class Verification(BaseModel):
    """核验项"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "item": "要素核查",
                "description": "使用姓名、手机号、身份证信息进行三要素核验",
                "result": "命中",
                "details": "身份证二要素不一致、手机号三要素不一致"
            }
        }
    )

    item: Optional[str] = Field(default="", description="核验项名称")
    description: Optional[str] = Field(default="", description="核验项说明文字")
    result: Optional[str] = Field(default="", description="核验项结论或提示语")
    details: Optional[str] = Field(default=None, description="核验项补充说明")


class BasicInfo(BaseModel):
    """
    基本信息

    注意：核心字段改为Optional是为了提高容错性，
    当API返回数据不完整或创建默认报告时不会因为缺少字段而失败
    """
    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "name": "李某某",
                "phone": "138****5623",
                "idCard": "3201**********45X",
                "reportId": "202512318B2F9D4C",
                "verifications": [
                    {
                        "item": "要素核查",
                        "description": "使用姓名、手机号、身份证信息进行三要素核验",
                        "result": "命中",
                        "details": "身份证二要素不一致、手机号三要素不一致"
                    }
                ]
            }
        }
    )

    name: Optional[str] = Field(default="未知", min_length=1, max_length=50, description="被查询人的姓名")
    phone: Optional[str] = Field(default="未知", min_length=1, max_length=20, description="被查询人的手机号")
    id_card: Optional[str] = Field(default="未知", alias="idCard", min_length=1, max_length=20, description="被查询人的身份证号码")
    report_id: Optional[str] = Field(default="", alias="reportId", description="本次报告的唯一编号")
    verifications: Optional[List[Verification]] = Field(default_factory=list, description="各类核验项的结果列表")


# ==================== 风险识别模块 ====================

class CaseAnnouncementRecord(BaseModel):
    """涉案公告记录"""
    authority: Optional[str] = Field(default="", description="立案法院名称")
    case_number: Optional[str] = Field(default="", alias="caseNumber", description="案号信息")
    case_type: Optional[str] = Field(default="", alias="caseType", description="案件类型描述")
    filing_date: Optional[str] = Field(default="", alias="filingDate", description="立案日期（YYYY-MM-DD）")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
            "authority": "沪市浦东新区人民法院",
            "caseNumber": "(2022)沪0115民初***号",
            "caseType": "民事案件",
            "filingDate": "2022-04-18"
            }
        }
    )


class CaseAnnouncements(BaseModel):
    """涉案公告列表"""
    title: Optional[str] = Field(default="涉案公告列表", description="涉案公告列表标题")
    records: Optional[List[CaseAnnouncementRecord]] = Field(default_factory=list, description="涉案公告记录列表")


class EnforcementAnnouncementRecord(BaseModel):
    """执行公告记录"""
    case_number: Optional[str] = Field(default="", alias="caseNumber", description="执行案件案号")
    court: Optional[str] = Field(default="", description="执行法院名称")
    filing_date: Optional[str] = Field(default="", alias="filingDate", description="执行立案日期（YYYY-MM-DD）")
    status: Optional[str] = Field(default="", description="执行案件状态描述")
    target_amount: Optional[str] = Field(default="", alias="targetAmount", description="执行标的金额（含单位）")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
            "caseNumber": "(2024)沪0115执***号",
            "court": "沪市浦东新区人民法院",
            "filingDate": "2024-01-15",
            "status": "执行中",
            "targetAmount": "256,800元"
            }
        }
    )


class EnforcementAnnouncements(BaseModel):
    """执行公告列表"""
    title: Optional[str] = Field(default="执行公告列表", description="执行公告列表标题")
    records: Optional[List[EnforcementAnnouncementRecord]] = Field(default_factory=list, description="执行公告记录列表")


class DishonestAnnouncementRecord(BaseModel):
    """失信公告记录"""
    court: Optional[str] = Field(default="", description="发布法院名称")
    dishonest_person: Optional[str] = Field(default="", alias="dishonestPerson", description="被执行人姓名")
    filing_date: Optional[str] = Field(default="", alias="filingDate", description="公告日期（YYYY-MM-DD）")
    id_card: Optional[str] = Field(default="", alias="idCard", description="被执行人证件号码")
    performance_status: Optional[str] = Field(default="", alias="performanceStatus", description="履行情况说明")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
            "court": "沪市浦东新区人民法院",
            "dishonestPerson": "李某某",
            "filingDate": "2023-03-09",
            "idCard": "3201**********45X",
            "performanceStatus": "全部未履行"
            }
        }
    )


class DishonestAnnouncements(BaseModel):
    """失信公告列表"""
    title: Optional[str] = Field(default="失信公告列表", description="失信公告列表标题")
    records: Optional[List[DishonestAnnouncementRecord]] = Field(default_factory=list, description="失信公告记录列表")


class HighConsumptionRestrictionRecord(BaseModel):
    """限制高消费记录"""
    court: Optional[str] = Field(default="", description="发布法院名称")
    id_card: Optional[str] = Field(default="", alias="idCard", description="被限制人员证件号码")
    measure: Optional[str] = Field(default="", description="限制措施描述")
    restricted_person: Optional[str] = Field(default="", alias="restrictedPerson", description="被限制消费的人员姓名")
    start_date: Optional[str] = Field(default="", alias="startDate", description="措施生效日期（YYYY-MM-DD）")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
            "court": "沪市浦东新区人民法院",
            "idCard": "3201**********45X",
            "measure": "限制高消费",
            "restrictedPerson": "李某某",
            "startDate": "2024-01-15"
            }
        }
    )


class HighConsumptionRestrictionAnnouncements(BaseModel):
    """限制高消费列表"""
    title: Optional[str] = Field(default="限高公告列表", description="限制高消费列表标题")
    records: Optional[List[HighConsumptionRestrictionRecord]] = Field(default_factory=list, description="限制高消费记录列表")


class RiskIdentification(BaseModel):
    """风险识别产品"""
    title: Optional[str] = Field(default="风险识别产品", description="模块名称")
    case_announcements: Optional[CaseAnnouncements] = Field(default_factory=CaseAnnouncements, alias="caseAnnouncements", description="涉案公告")
    enforcement_announcements: Optional[EnforcementAnnouncements] = Field(default_factory=EnforcementAnnouncements, alias="enforcementAnnouncements", description="执行公告")
    dishonest_announcements: Optional[DishonestAnnouncements] = Field(default_factory=DishonestAnnouncements, alias="dishonestAnnouncements", description="失信公告")
    high_consumption_restriction_announcements: Optional[HighConsumptionRestrictionAnnouncements] = Field(
        default_factory=HighConsumptionRestrictionAnnouncements,
        alias="highConsumptionRestrictionAnnouncements",
        description="限制高消费公告"
    )

    model_config = ConfigDict(populate_by_name=True)


# ==================== 信贷评估模块 ====================

class LoanIntentionByCustomerTypeRecord(BaseModel):
    """按机构类型统计的借贷申请记录"""
    customer_type: Optional[str] = Field(default="", alias="customerType", description="机构类型名称")
    application_count: Optional[int] = Field(default=0, alias="applicationCount", ge=0, description="近12个月的申请次数")
    risk_level: Optional[str] = Field(default="", alias="riskLevel", description="对应风险等级描述")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
            "customerType": "持牌消费金融",
            "applicationCount": 11,
            "riskLevel": "中风险"
            }
        }
    )


class LoanIntentionByCustomerType(BaseModel):
    """本人在各类机构的借贷意向表现"""
    title: Optional[str] = Field(default="本人在各类机构的借贷意向表现", description="借贷意向表现模块标题")
    records: Optional[List[LoanIntentionByCustomerTypeRecord]] = Field(default_factory=list, description="按机构类型统计的借贷申请记录")


class LoanIntentionAbnormalTimesRecord(BaseModel):
    """异常时间段的借贷申请记录"""
    time_period: Optional[str] = Field(default="", alias="timePeriod", description="时间段描述")
    main_institution_type: Optional[str] = Field(default="", alias="mainInstitutionType", description="主导申请的机构类型集合")
    risk_level: Optional[str] = Field(default="", alias="riskLevel", description="对应风险等级描述")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
            "timePeriod": "夜间(22:00-06:00)",
            "mainInstitutionType": "银行类机构、非银金融机构",
            "riskLevel": "高风险"
            }
        }
    )


class LoanIntentionAbnormalTimes(BaseModel):
    """异常时间段借贷申请情况"""
    title: Optional[str] = Field(default="异常时间段借贷申请情况", description="异常时间段模块标题")
    records: Optional[List[LoanIntentionAbnormalTimesRecord]] = Field(default_factory=list, description="异常时间段的借贷申请记录")


class CreditAssessment(BaseModel):
    """信贷评估产品"""
    title: Optional[str] = Field(default="信贷评估产品", description="模块名称")
    loan_intention_by_customer_type: Optional[LoanIntentionByCustomerType] = Field(
        default_factory=LoanIntentionByCustomerType,
        alias="loanIntentionByCustomerType",
        description="本人在各类机构的借贷意向表现"
    )
    loan_intention_abnormal_times: Optional[LoanIntentionAbnormalTimes] = Field(
        default_factory=LoanIntentionAbnormalTimes,
        alias="loanIntentionAbnormalTimes",
        description="异常时间段借贷申请情况"
    )

    model_config = ConfigDict(populate_by_name=True)


# ==================== 租赁风险评估模块 ====================

class MultiLenderRisk3CRecord(BaseModel):
    """3C租赁机构的多头风险记录"""
    institution_type: Optional[str] = Field(default="", alias="institutionType", description="机构类型名称")
    applied_count: Optional[int] = Field(default=0, alias="appliedCount", ge=0, description="申请机构数量")
    in_use_count: Optional[int] = Field(default=0, alias="inUseCount", ge=0, description="在用机构数量")
    total_credit_limit: Optional[float] = Field(default=0.0, alias="totalCreditLimit", ge=0, description="授信总额（元）")
    total_debt_balance: Optional[float] = Field(default=0.0, alias="totalDebtBalance", ge=0, description="负债总额（元）")
    risk_level: Optional[str] = Field(default="", alias="riskLevel", description="对应风险等级描述")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
            "institutionType": "消费金融",
            "appliedCount": 5,
            "inUseCount": 1,
            "totalCreditLimit": 50000,
            "totalDebtBalance": 12000,
            "riskLevel": "中风险"
            }
        }
    )


class MultiLenderRisk3C(BaseModel):
    """3C机构多头借贷风险"""
    title: Optional[str] = Field(default="3C机构多头借贷风险", description="3C 多头风险模块标题")
    records: Optional[List[MultiLenderRisk3CRecord]] = Field(default_factory=list, description="3C 租赁机构的多头风险记录")


class LeasingRiskAssessment(BaseModel):
    """租赁风险评估产品"""
    title: Optional[str] = Field(default="租赁风险评估产品", description="模块名称")
    multi_lender_risk_3c: Optional[MultiLenderRisk3C] = Field(
        default_factory=MultiLenderRisk3C,
        alias="multiLenderRisk3C",
        description="3C机构多头借贷风险"
    )

    model_config = ConfigDict(populate_by_name=True)


# ==================== 报告页脚模块 ====================

class ReportFooter(BaseModel):
    """报告页脚"""
    data_source: Optional[str] = Field(default="天远数据报告", alias="dataSource", description="数据来源说明")
    generation_time: Optional[str] = Field(default="", alias="generationTime", description="报告生成日期（YYYY-MM-DD）")
    disclaimer: Optional[str] = Field(
        default="本报告为示例数据，仅供参考演示，实际审批以真实数据为准。",
        description="报告使用声明与注意事项"
    )

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
            "dataSource": "天远数据报告",
            "generationTime": "2025-12-31",
            "disclaimer": "本报告为示例数据，仅供参考演示，实际审批以真实数据为准。"
            }
        }
    )


# ==================== 完整报告模型 ====================

class BigDataResponse(BaseModel):
    """
    大数据报告完整模型

    设计原则：所有嵌套字段都是Optional的，以实现最大兼容性

    1. 顶层容器字段：Optional + default_factory
       - 支持API返回不完整数据
       - 支持API调用失败时创建默认报告

    2. 记录类字段（Record）：Optional + default值
       - 提高容错性，避免因某个字段缺失导致整个记录解析失败
       - 即使API返回的记录数据不完整也能正常解析

    3. 列表字段：default_factory=list
       - 空列表是常见情况（如无涉案、失信记录等）
       - 不需要改为Optional，空列表本身就是有效值

    这种设计确保了系统的健壮性和容错性。
    """
    model_config = ConfigDict(populate_by_name=True)

    report_summary: Optional[ReportSummary] = Field(default_factory=ReportSummary, alias="reportSummary", description="报告摘要")
    basic_info: Optional[BasicInfo] = Field(default_factory=BasicInfo, alias="basicInfo", description="基本信息")
    risk_identification: Optional[RiskIdentification] = Field(default_factory=RiskIdentification, alias="riskIdentification", description="风险识别产品")
    credit_assessment: Optional[CreditAssessment] = Field(default_factory=CreditAssessment, alias="creditAssessment", description="信贷评估产品")
    leasing_risk_assessment: Optional[LeasingRiskAssessment] = Field(default_factory=LeasingRiskAssessment, alias="leasingRiskAssessment", description="租赁风险评估产品")
    comprehensive_analysis: Optional[List[str]] = Field(default_factory=list, alias="comprehensiveAnalysis", description="综合分析文字列表")
    report_footer: Optional[ReportFooter] = Field(default_factory=ReportFooter, alias="reportFooter", description="报告页脚")
