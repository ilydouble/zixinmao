from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from enum import Enum


class ReportType(str, Enum):
    FLOW = "flow"  # 银行流水
    SIMPLE = "simple"  # 简版征信
    DETAIL = "detail"  # 详版征信

class AnalysisRequest(BaseModel):
    # 支持两种输入方式：file_base64 或 markdown_content
    file_base64: Optional[str] = Field(None, description="文件的base64编码（与markdown_content二选一）")
    markdown_content: Optional[str] = Field(None, description="Markdown格式的文档内容（与file_base64二选一）")

    mime_type: Optional[str] = Field(None, description="文件MIME类型（使用file_base64时必填）")
    report_type: ReportType = Field(..., description="报告类型")
    custom_prompt: Optional[str] = Field(None, description="自定义提示词")
    file_name: Optional[str] = Field(None, description="文件名")
    name: Optional[str] = Field(None, description="姓名")
    id_card: Optional[str] = Field(None, description="身份证号")
    mobile_no: Optional[str] = Field(None, description="手机号码")
    customer_info: Optional[Dict[str, Any]] = Field(None, description="客户群体信息")

    class Config:
        schema_extra = {
            "example": {
                "file_base64": "JVBERi0xLjQKJcOkw7zDtsO...",
                "mime_type": "application/pdf",
                "report_type": "flow",
                "custom_prompt": "请分析这份银行流水...",
                "name": "张三",
                "id_card": "12131",
                "mobile_no": "188",
                "customer_info": {
                    "customerType": "授薪类客群",
                    "includeProductMatch": False,
                    "companyNature": "大型上市公司及大型民企",
                    "hasProvidentFund": "是",
                    "providentFundBase": "5000"
                }
            }
        }

class FileType(str, Enum):
    FLOW = "social"  # 社保
    SIMPLE = "fund"  # 公积金
    DETAIL = "income"  # 个税

class IncomeRequest(BaseModel):
    file_base64: str = Field(..., description="文件的base64编码")
    mime_type: str = Field(..., description="文件MIME类型")
    file_type: FileType = Field(..., description="文件类型")
    # name: Optional[str] = Field(None, description="姓名")
    # id_card: Optional[str] = Field(None, description="身份证号")
    # mobile_no: Optional[str] = Field(None, description="手机号码")

    class Config:
        schema_extra = {
            "example": {
                "file_base64": "JVBERi0xLjQKJcOkw7zDtsO...",
                "mime_type": "application/pdf",
                "file_type": "flow",
                # "name": "张三",
                # "id_card": "12131",
                # "mobile_no": "188"
            }
        }


class AnalysisResponse(BaseModel):
    success: bool = Field(..., description="分析是否成功")
    request_id: str = Field(..., description="请求ID")
    analysis_result: Optional[Dict[str, Any]] = Field(None, description="分析结果")
    error_message: Optional[str] = Field(None, description="错误信息")
    processing_time: float = Field(..., description="处理时间（秒）")
    html_report: Optional[str] = Field(None, description="HTML格式的可视化报告")
    pdf_report: Optional[str] = Field(None, description="PDF格式的可视化报告（base64编码）")

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "request_id": "req_1703123456789",
                "analysis_result": {
                    "summary": "分析摘要",
                    "details": {},
                    "risk_assessment": {}
                },
                "error_message": None,
                "processing_time": 15.5,
                "html_report": "<html>...</html>",
                "pdf_report": "JVBERi0xLjQK..."
            }
        }


class HealthResponse(BaseModel):
    status: str = Field(..., description="服务状态")
    version: str = Field(..., description="服务版本")
    timestamp: str = Field(..., description="当前时间")


class TaskSubmitResponse(BaseModel):
    success: bool = Field(..., description="提交是否成功")
    task_id: str = Field(..., description="任务ID")
    message: str = Field(..., description="提交结果消息")
    estimated_wait_time: Optional[float] = Field(None, description="预估等待时间（秒）")
    queue_position: Optional[int] = Field(None, description="队列位置")


class TaskStatusResponse(BaseModel):
    task_id: str = Field(..., description="任务ID")
    status: str = Field(..., description="任务状态")
    created_at: float = Field(..., description="创建时间")
    started_at: Optional[float] = Field(None, description="开始处理时间")
    completed_at: Optional[float] = Field(None, description="完成时间")
    processing_time: Optional[float] = Field(None, description="处理时间（秒）")
    wait_time: Optional[float] = Field(None, description="等待时间（秒）")
    result: Optional[Dict[str, Any]] = Field(None, description="分析结果")
    error_message: Optional[str] = Field(None, description="错误信息")
    retry_count: int = Field(..., description="重试次数")


class QueueStatsResponse(BaseModel):
    total_requests: int = Field(..., description="总请求数")
    completed_requests: int = Field(..., description="已完成请求数")
    failed_requests: int = Field(..., description="失败请求数")
    current_queue_size: int = Field(..., description="当前队列长度")
    current_processing: int = Field(..., description="当前处理中任务数")
    queue_capacity: int = Field(..., description="队列容量")
    max_concurrent: int = Field(..., description="最大并发数")
    is_running: bool = Field(..., description="队列是否运行中")


class LogStatsResponse(BaseModel):
    time_range_hours: int = Field(..., description="统计时间范围（小时）")
    total_requests: int = Field(..., description="总请求数")
    completed_requests: int = Field(..., description="完成请求数")
    failed_requests: int = Field(..., description="失败请求数")
    success_rate: float = Field(..., description="成功率")
    average_processing_time_seconds: float = Field(..., description="平均处理时间（秒）")
    report_types_distribution: Dict[str, int] = Field(..., description="报告类型分布")
    timestamp: str = Field(..., description="统计时间")
