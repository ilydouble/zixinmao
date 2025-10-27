"""
Dify工作流响应数据模型
定义Dify API返回的标准数据结构
"""
from typing import List, Optional, Dict, Any
from datetime import date
from pydantic import BaseModel, Field


class DifyBasicInfo(BaseModel):
    """Dify返回的基本信息"""
    name: str = Field(..., description="姓名")
    marital_status: str = Field(..., description="婚姻状况")
    id_card: str = Field(..., description="身份证号")
    report_date: str = Field(..., description="报告日期")
    report_number: str = Field(..., description="报告编号")
    credit_accounts: int = Field(..., description="信贷账户数")
    credit_accounts_uncleared: int = Field(..., description="未结清信贷账户数")
    loan_accounts: int = Field(..., description="贷款账户数")
    loan_accounts_uncleared: int = Field(..., description="未结清贷款账户数")


class DifyLoanDetail(BaseModel):
    """Dify返回的贷款明细"""
    id: Optional[int] = Field(None, description="序号")
    institution: str = Field(..., description="管理机构")
    credit_limit: int = Field(..., description="授信额度(元)")
    balance: int = Field(..., description="余额(元)")
    business_type: str = Field(..., description="业务类型")
    start_end_date: str = Field(..., description="起止日期")
    status: str = Field(..., description="当前状态")
    overdue_history: bool = Field(..., description="是否有逾期历史")
    total_overdue_months: int = Field(..., description="总逾期月数")
    over_90_days: bool = Field(..., description="是否有90天以上逾期")
    is_consumer_loan: bool = Field(..., description="是否为消费贷款")
    is_revolving_loan: bool = Field(..., description="是否为循环贷款")


class DifyCreditCardDetail(BaseModel):
    """Dify返回的信用卡明细"""
    id: Optional[int] = Field(None, description="序号")
    institution: str = Field(..., description="管理机构")
    credit_limit: int = Field(..., description="授信额度(元)")
    used_limit: int = Field(..., description="已用额度(元)")
    large_installment_limit: Optional[int] = Field(None, description="大额专项分期额度(元)")
    large_installment_balance: Optional[int] = Field(None, description="大额专项分期余额(元)")
    usage_rate: str = Field(..., description="使用率")
    status: str = Field(..., description="当前状态")
    overdue_history: bool = Field(..., description="是否有逾期历史")
    total_overdue_months: int = Field(..., description="总逾期月数")
    over_90_days: bool = Field(..., description="是否有90天以上逾期")


class DifyQueryRecord(BaseModel):
    """Dify返回的查询记录"""
    id: Optional[int] = Field(None, description="序号")
    query_date: date = Field(..., description="查询日期")
    institution: str = Field(..., description="查询机构")
    reason: str = Field(..., description="查询原因")
    query_type: str = Field(..., description="查询类型")


class DifyWorkflowOutput(BaseModel):
    """Dify工作流输出数据（outputs.output字段）"""
    basic_info: DifyBasicInfo = Field(..., description="基本信息")
    loan_details: List[DifyLoanDetail] = Field(default_factory=list, description="贷款明细列表")
    credit_card_details: List[DifyCreditCardDetail] = Field(default_factory=list, description="信用卡明细列表")
    query_records: List[DifyQueryRecord] = Field(default_factory=list, description="查询记录列表")


class DifyWorkflowData(BaseModel):
    """Dify工作流数据（data字段）"""
    id: str = Field(..., description="工作流运行ID")
    workflow_id: str = Field(..., description="工作流ID")
    status: str = Field(..., description="状态")
    outputs: Dict[str, Any] = Field(..., description="输出数据")
    error: str = Field(default="", description="错误信息")
    elapsed_time: float = Field(..., description="执行时间(秒)")
    total_tokens: int = Field(..., description="总token数")
    total_steps: int = Field(..., description="总步骤数")
    created_at: int = Field(..., description="创建时间戳")
    finished_at: int = Field(..., description="完成时间戳")


class DifyWorkflowResponse(BaseModel):
    """Dify工作流完整响应"""
    task_id: str = Field(..., description="任务ID")
    workflow_run_id: str = Field(..., description="工作流运行ID")
    data: DifyWorkflowData = Field(..., description="工作流数据")

