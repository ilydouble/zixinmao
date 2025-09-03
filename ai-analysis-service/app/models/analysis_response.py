#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
大数据分析API响应实体类
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from .FLXG0V4B import *


class BasicInfo(BaseModel):
    """个人基本信息"""
    mobile_no: str = Field(..., description="手机号码")
    id_card: str = Field(..., description="身份证号")
    name: str = Field(..., description="姓名")
    marry: Optional[str] = Field(None, description="婚姻状态：INR-未婚，IA-结婚，IB-离婚")


class RiskAnalysis(BaseModel):
    """个人风险分析"""
    id: Optional[int] = Field(None, description="序号")
    risk_type: Optional[str] = Field(None, description="风险类型")
    risk_level: Optional[int] = Field(None, description="风险等级")
    comment: Optional[str] = Field(None, description="备注")


class SpecialList(BaseModel):
    """特殊名单信息查询"""
    court_bad: Optional[int] = Field(None, description="法院不良") #0-无记录，1-有记录
    court_executed: Optional[int] = Field(None, description="法院执行") #0-无记录，1-有记录
    bank_bad: Optional[int] = Field(None, description="银行不良") #0-无记录，1-有记录
    bank_overdue: Optional[int] = Field(None, description="银行逾期") #0-无记录，1-有记录
    bank_lost: Optional[int] = Field(None, description="银行失联") #0-无记录，1-有记录
    nbank_bad: Optional[int] = Field(None, description="非银不良") #0-无记录，1-有记录
    nbank_overdue: Optional[int] = Field(None, description="非银逾期") #0-无记录，1-有记录
    nbank_lost: Optional[int] = Field(None, description="非银失联") #0-无记录，1-有记录

class QuerySummaryData(BaseModel):
    """查询次数汇总数据"""
    id: Optional[int] = Field(None, description="序号")
    time: Optional[str] = Field(None, description="时间")
    applications: Optional[int] = Field(None, description="申请次数")
    institutions: Optional[int] = Field(None, description="申请机构数")

class LoanIntentionAnalysis(BaseModel):
    """借贷意向核查"""
    query_summary: Optional[List[QuerySummaryData]] = Field(None, description="查询次数汇总")
    bank_applications: Optional[List[QuerySummaryData]] = Field(None, description="银行申请次数")
    credit_card_applications: Optional[List[QuerySummaryData]] = Field(None, description="信用卡申请次数")
    non_bank_applications: Optional[List[QuerySummaryData]] = Field(None, description="非银申请次数")


class LoanApprovalData(BaseModel):
    """借贷核准数据"""
    id: Optional[int] = Field(None, description="序号")
    time: Optional[str] = Field(None, description="时间")
    loan_count: Optional[int] = Field(None, description="借贷次数")
    institution_count: Optional[int] = Field(None, description="机构数")
    loan_level: Optional[str] = Field(None, description="借贷等级")


class LoanBehaviorAnalysis(BaseModel):
    """借贷行为核查"""
    non_bank_new_approvals: Optional[List[LoanApprovalData]] = Field(None, description="非银机构新增核准")
    yearly_non_bank_approvals: Optional[List[LoanApprovalData]] = Field(None, description="近一年非银机构新增核准")

class EntoutDataData(BaseModel):
    """
    涉诉信息数据
    """
    administrative: Optional[Administrative] = Field(None, description="行政案件")
    implement: Optional[Implement] = Field(None, description="执行案件")
    count: Optional[Count] = Field(None, description="统计")
    preservation: Optional[Preservation] = Field(None, description="案件类型（非诉保全审查）")
    civil: Optional[Civil] = Field(None, description="民事案件")
    criminal: Optional[Criminal] = Field(None, description="刑事案件")
    bankrupt: Optional[Bankrupt] = Field(None, description="强制清算与破产案件")

class PersonalLegalLitigation(BaseModel):
    """个人司法涉诉(详版) """
    # sxbzxr: Optional[Dict[str, Any]] = Field(None, description="失信被执行人")
    # entout: Optional[Dict[str, Any]] = Field(None, description="涉诉信息")
    # xgbzxr: Optional[Dict[str, Any]] = Field(None, description="限高被执行人")
    sxbzxr: Optional[List[SxbzxrItem]] = Field(None, description="失信被执行人")
    xgbzxr: Optional[List[XgbzxrItem]] = Field(None, description="限高被执行人")
    entout: Optional[EntoutDataData] = Field(None, description="涉诉信息")


class RawData(BaseModel):
    """原始数据"""
    FLXG9687: Optional[Dict[str, Any]] = Field(None, description="电诈风险原始数据")
    FLXG0687: Optional[Dict[str, Any]] = Field(None, description="反赌反诈原始数据")
    FLXG54F5: Optional[Dict[str, Any]] = Field(None, description="其他风险原始数据")
    FLXG0V4B: Optional[Dict[str, Any]] = Field(None, description="其他风险原始数据")
    JRZQ0A03: Optional[Dict[str, Any]] = Field(None, description="借贷意向原始数据")
    JRZQ8203: Optional[Dict[str, Any]] = Field(None, description="借贷行为原始数据")
    FLXG3D56: Optional[Dict[str, Any]] = Field(None, description="特殊名单原始数据")
    IVYZ5733: Optional[Dict[str, Any]] = Field(None, description="基本信息原始数据")
    YYSY6F2E: Optional[Dict[str, Any]] = Field(None, description="其他原始数据")


class BigDataAnalysisResponse(BaseModel):
    """大数据分析响应"""
    basic_info: BasicInfo = Field(..., description="个人基本信息")
    risk_analysis: Optional[List[RiskAnalysis]] = Field(None, description="个人风险分析")
    special_list: Optional[SpecialList] = Field(None, description="特殊名单信息查询")
    loan_intention_analysis: Optional[LoanIntentionAnalysis] = Field(None, description="借贷意向核查")
    loan_behavior_analysis: Optional[LoanBehaviorAnalysis] = Field(None, description="借贷行为核查")
    personal_legal_litigation: Optional[PersonalLegalLitigation] = Field(None, description="个人司法涉诉")
    


class BigDataAnalysisErrorResponse(BaseModel):
    """大数据分析错误响应"""
    error: bool = Field(True, description="错误标识")
    message: str = Field(..., description="错误消息")
    basic_info: BasicInfo = Field(..., description="个人基本信息")
    risk_analysis: Optional[List[RiskAnalysis]] = Field(None, description="个人风险分析")
    special_list: Optional[SpecialList] = Field(None, description="特殊名单信息查询")
    loan_intention_analysis: Optional[LoanIntentionAnalysis] = Field(None, description="借贷意向核查")
    loan_behavior_analysis: Optional[LoanBehaviorAnalysis] = Field(None, description="借贷行为核查")

