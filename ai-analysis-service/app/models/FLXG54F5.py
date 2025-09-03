"""
手机号码风险 (FLXG54F5)
"""

from typing import Optional, List
from pydantic import BaseModel, Field

class PhonePrimaryInfo(BaseModel):
    """
    phonePrimaryInfo 字段结构。
    """
    intl_phone_country: Optional[List[str]] = Field(None, alias="intl_phone_country", description="国际电话国家码")
    phone_city: Optional[str] = Field(None, description="手机归属地城市")
    phone_operator: Optional[str] = Field(None, description="手机运营商")
    phone_province: Optional[str] = Field(None, description="手机归属地省份")

class PhoneRiskLabel(BaseModel):
    """
    phoneRiskLabels 的单个项。
    """
    description: Optional[str] = Field(None, description="风险描述")
    label1: Optional[str] = Field(None, description="风险标签1")
    label2: Optional[str] = Field(None, description="风险标签2")
    label3: Optional[str] = Field(None, description="风险标签3")
    timestamp: Optional[str] = Field(None, description="时间戳")

class FLXG54F5Response(BaseModel):
    """
    手机号码风险 (FLXG54F5) 接口的 data 字段结构。
    """
    phone_primary_info: Optional[PhonePrimaryInfo] = Field(None, alias="phonePrimaryInfo", description="手机号基础信息")
    phone_risk_labels: Optional[List[PhoneRiskLabel]] = Field(None, alias="phoneRiskLabels", description="手机号风险标签信息")