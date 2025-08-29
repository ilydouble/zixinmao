"""
反赌反诈 (FLXG0687)
"""

from typing import Optional, List
from pydantic import BaseModel, Field

class AntiGamblingFraudRiskItem(BaseModel):
    """
    风险标签
    """
    risk_level: Optional[str] = Field(None, alias="riskLevel", description="风险等级")
    risk_type: Optional[str] = Field(None, alias="riskType", description="风险类型")

class FLXG0687Response(BaseModel):
    """
    反赌反诈 (FLXG0687) 接口的 data 字段结构。
    """
    value: Optional[List[AntiGamblingFraudRiskItem]] = Field(None, description="风险标签列表")