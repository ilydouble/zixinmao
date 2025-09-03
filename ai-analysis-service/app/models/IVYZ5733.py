"""
单人婚姻 (IVYZ5733)
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class IVYZ5733Response(BaseModel):
    """
    单人婚姻 (IVYZ5733)
    """
    code: Optional[str] = Field(None, description="返回码")
    data: Optional["MarrData"] = Field(None, description="返回数据")
    seq_no: Optional[str] = Field(None, alias='seqNo', description="查询序列号")
    message: Optional[str] = Field(None, description="返回信息")

class MarrData(BaseModel):
    """
    单人婚姻数据 字段值
    """
    data: Optional[str] = Field(None, description="婚姻数据")

