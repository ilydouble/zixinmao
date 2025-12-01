"""
产品标准数据模型
定义银行信贷产品的标准数据结构
"""
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field


class QueryRequirementStats(BaseModel):
    """查询要求统计"""
    months: Optional[int] = Field(None, description="月份范围")
    times: Optional[int] = Field(None, description="查询次数限制")


class OverdueRequirementStats(BaseModel):
    """逾期要求统计"""
    months: Optional[int] = Field(None, description="月份范围")
    consecutive_months: Optional[int] = Field(None, description="连续逾期月数限制")
    cumulative_months: Optional[int] = Field(None, description="累计逾期月数限制")


class DebtRequirements(BaseModel):
    """负债要求"""
    credit_debt: Optional[int] = Field(None, description="信用类负债限制(元)")
    total_debt_provident_fund_ratio: Optional[float] = Field(None, description="总负债与公积金基数的倍数限制")
    total_debt_amount: Optional[int] = Field(None, description="总负债金额限制(元)")


class AdmissionConditions(BaseModel):
    """准入条件详细信息"""
    description: Optional[str] = Field(None, description="准入条件描述")
    quality_unit: Optional[bool] = Field(None, description="是否要求优质单位")
    provident_fund_base: Optional[int] = Field(None, description="公积金基数要求(元)")
    provident_fund_months: Optional[int] = Field(None, description="公积金连续缴存月数要求")


class QueryRequirements(BaseModel):
    """查询要求详细信息"""
    description: Optional[str] = Field(None, description="查询要求描述")
    stats: Optional[List[QueryRequirementStats]] = Field(default_factory=list, description="查询要求统计列表")


class OverdueRequirements(BaseModel):
    """逾期要求详细信息"""
    description: Optional[str] = Field(None, description="逾期要求描述")
    current: Optional[str] = Field(None, description="当前逾期要求")
    current_stats: Optional[List[OverdueRequirementStats]] = Field(default_factory=list, description="当前逾期统计列表")
    history_stats: Optional[List[OverdueRequirementStats]] = Field(default_factory=list, description="历史逾期统计列表")


class ProductModel(BaseModel):
    """银行信贷产品标准"""
    # 基本信息
    region: Optional[List[str]] = Field(default_factory=list, description="适用地区列表")
    bank_name: Optional[str] = Field(None, description="所属银行")
    product_name: Optional[str] = Field(None, description="产品名称")
    
    # 产品参数
    age_range: Optional[str] = Field(None, description="年龄范围")
    max_credit: Optional[str] = Field(None, description="最高可贷额度")
    max_period: Optional[str] = Field(None, description="最长可贷期限")
    min_rate: Optional[str] = Field(None, description="最低年利率")
    repayment_methods: Optional[str] = Field(None, description="还款方式")
    
    # 准入条件
    admission_conditions: Optional[str] = Field(None, description="准入条件描述")
    admission_conditions_quality_unit: Optional[bool] = Field(None, description="是否要求优质单位")
    admission_conditions_provident_fund_base: Optional[int] = Field(None, description="公积金基数要求(元)")
    admission_conditions_provident_fund_months: Optional[int] = Field(None, description="公积金连续缴存月数要求")
    
    # 查询要求
    query_requirements: Optional[str] = Field(None, description="查询要求描述")
    query_requirements_stats: Optional[List[QueryRequirementStats]] = Field(default_factory=list, description="查询要求统计列表")
    
    # 逾期要求
    overdue_requirements: Optional[str] = Field(None, description="逾期要求描述")
    overdue_requirements_current: Optional[str] = Field(None, description="当前逾期要求")
    overdue_requirements_current_stats: Optional[List[OverdueRequirementStats]] = Field(default_factory=list, description="当前逾期统计列表")
    overdue_requirements_history_stats: Optional[List[OverdueRequirementStats]] = Field(default_factory=list, description="历史逾期统计列表")
    
    # 负债要求
    debt_requirements: Optional[DebtRequirements] = Field(None, description="负债要求")
    
    # 其他要求
    credit_card_usage_rate: Optional[float] = Field(None, description="信用卡使用率要求")
    credit_card_count: Optional[float] = Field(None, description="信用卡张数要求")
    loan_institutions_count: Optional[float] = Field(None, description="贷款机构数要求")
    non_bank_loans_count: Optional[float] = Field(None, description="非银机构贷款笔数要求")
    white_user_allowed: Optional[str] = Field(None, description="征信白户是否准入")
    
    # 额度算法
    credit_calculation: Optional[str] = Field(None, description="额度计算方法")


