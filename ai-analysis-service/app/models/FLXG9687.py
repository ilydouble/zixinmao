"""
电诈风险预警 (FLXG9687)
"""
from typing import Optional
from pydantic import BaseModel, Field

class FLXG9687Response(BaseModel):
    """
    电诈风险预警 (FLXG9687)
    电诈风险预警接口的 data 字段结构。
    """
    code: Optional[str] = Field(None, description="状态码")
    flag_telefraudpredictstd: Optional[str] = Field(None, alias="flag_telefraudpredictstd", description="电诈风险输出标识")
    swift_number: Optional[str] = Field(None, alias="swift_number", description="流水号")
    tfps_level: Optional[str] = Field(None, alias="tfps_level", description="诈骗风险等级")