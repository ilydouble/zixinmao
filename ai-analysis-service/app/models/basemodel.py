from typing import Optional, List, Any, Generic, TypeVar
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime

# 泛型类型变量
T = TypeVar('T')

# --- 请求实体类 ---
class ReportRequest(BaseModel):
    """
    大数据分析接口请求参数实体类。
    """
    mobile_no: Optional[str] = Field(None, description="手机号码")
    id_card: Optional[str] = Field(None, description="身份证号")
    name: Optional[str] = Field(None, description="姓名")


class COMB86PMRequest(BaseModel):
    """
    COMB86PM接口请求参数实体类。
    """
    mobile_no: Optional[str] = Field(None, description="手机号码")
    id_card: Optional[str] = Field(None, description="身份证号")
    name: Optional[str] = Field(None, description="姓名")
    auth_date: Optional[str] = Field(None, description="授权日期，格式：YYYYMMDD-YYYYMMDD，例如：20250318-20260318")

class EncryptedCOMB86PMRequest(BaseModel):
    """
    加密后的COMB86PM接口的实际请求体实体类
    """
    data: Optional[str] = Field(None, description="Base64编码的加密数据")

# --- 响应实体类 ---

class SubApiResponse(BaseModel):
    """
    子接口返回数据的通用结构。
    """
    api_code: Optional[str] = Field(None, description="子接口标识")
    data: Optional[Any] = Field(None, description="子接口返回的具体数据，类型为Any或特定实体类")
    success: Optional[bool] = Field(None, description="请求是否成功")

class DecryptedCOMB86PMData(BaseModel):
    """
    COMB86PM接口解密后的data字段结构。
    """
    responses: Optional[List[SubApiResponse]] = Field(None, description="子接口返回数据数组")

class COMB86PMResponse(BaseModel):
    """
    COMB86PM接口的顶层返回参数实体类。
    """
    code: Optional[int] = Field(None, description="状态码")
    message: Optional[str] = Field(None, description="消息")
    transaction_id: Optional[str] = Field(None, description="流水号")
    data: Optional[Any] = Field(None, description="加密数据，解密后为 DecryptedCOMB86PMData 结构")

# ==================== 响应状态码 ====================

class ResponseCode(Enum):
    """响应状态码"""
    SUCCESS = 0                    # 业务成功
    INTERFACE_ERROR = 1001         # 接口异常
    DECRYPT_FAILED = 1002          # 参数解密失败
    PARAM_VALIDATION_ERROR = 1003  # 基础参数校验不正确
    UNAUTHORIZED_IP = 1004         # 未经授权的IP
    MISSING_ACCESS_ID = 1005       # 缺少Access-Id
    UNAUTHORIZED_ACCESS_ID = 1006  # 未经授权的AccessId
    INSUFFICIENT_BALANCE = 1007    # 账户余额不足，无法请求
    PRODUCT_NOT_ACTIVATED = 1008   # 未开通此产品
    BUSINESS_FAILED = 2001         # 业务失败


# --- 统一响应格式实体类 ---
class CommonResponse(BaseModel, Generic[T]):
    """
    统一API响应格式实体类
    """
    code: int = Field(..., description="响应状态码")
    message: str = Field(..., description="响应消息")
    data: Optional[T] = Field(None, description="响应数据")
    timestamp: Optional[str] = Field(None, description="响应时间戳")

    @classmethod
    def success(cls, data: T, message: str = "操作成功", code: int = 200) -> "CommonResponse[T]":
        """创建成功响应"""
        return cls(
            code=code,
            message=message,
            data=data,
            timestamp=datetime.now().isoformat()
        )

    @classmethod
    def error(cls, message: str, code: int = 500, data: Optional[T] = None) -> "CommonResponse[T]":
        """创建错误响应"""
        return cls(
            code=code,
            message=message,
            data=data,
            timestamp=datetime.now().isoformat()
        )