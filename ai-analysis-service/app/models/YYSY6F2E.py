"""
运营商三要素(高级版) (YYSY6F2E)
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class YYSY6F2EResponse(BaseModel):
    """
    运营商三要素验证数据
    """
    code: Optional[str] = Field(None, description="返回码")
    data: Optional["CarrierData"] = Field(None, description="返回数据")

class CarrierData(BaseModel):
    """
    运营商三要素(高级版) 
    """
    code: Optional[int] = Field(None, description="返回码")
    msg: Optional[str] = Field(None, description="返回信息")
    phone_type: Optional[str] = Field(None, alias='phoneType', description="手机号类型")
    guid: Optional[str] = Field(None, description="guid")
    encrypt_type: Optional[str] = Field(None, alias='encryptType', description="加密类型")

