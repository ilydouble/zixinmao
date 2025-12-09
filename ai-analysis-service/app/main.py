import sys
from pathlib import Path
# 添加项目根目录到 sys.path
sys.path.append(str(Path(__file__).resolve().parent))

import time
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from loguru import logger
import sys
import base64

from config.settings import settings
from models.report_model import *
from utils.queue_manager import request_queue, TaskStatus
from utils.log_manager import algorithm_logger
from utils.prompts import PROMPT_TEMPLATES
from models.visualization_model import VisualizationReportRequest
from service.brief_report_service import BriefReportService

# 配置日志
logger.remove()
logger.add(
    sys.stdout,
    level=settings.log.level,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
)

# 创建FastAPI应用
app = FastAPI(
    title="AI文档分析服务",
    description="专业的AI文档分析服务，支持银行流水和征信报告分析",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    logger.info("启动AI分析服务...")

    # 启动请求队列
    await request_queue.start()

    # 初始化日志目录
    if settings.log.algorithm_enable:
        logger.info(f"算法日志已启用，日志目录: {settings.log.dir}")


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    logger.info("关闭AI分析服务...")

    # 停止请求队列
    await request_queue.stop()


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """请求日志中间件"""
    start_time = time.time()
    
    # 生成请求ID
    request_id = str(uuid.uuid4())[:8]
    
    logger.info(f"请求开始 - {request.method} {request.url.path} | request_id: {request_id}")
    
    # 将request_id添加到请求状态中
    request.state.request_id = request_id
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(f"请求完成 - {request.method} {request.url.path} | "
               f"status: {response.status_code} | "
               f"time: {process_time:.3f}s | "
               f"request_id: {request_id}")
    
    return response


@app.get("/", response_model=HealthResponse)
async def root():
    """根路径健康检查"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.now().isoformat()
    )


@app.post("/analyze", response_model=TaskSubmitResponse)
async def submit_analysis_task(request: AnalysisRequest, http_request: Request):
    """
    提交文档分析任务到队列

    接收文件的base64编码和相关参数，将任务加入队列等待处理
    """
    try:
        # 验证请求参数
        if not request.file_base64:
            raise HTTPException(
                status_code=400,
                detail="文件内容不能为空"
            )

        # 验证文件大小（base64编码后的大小约为原文件的1.33倍）
        estimated_file_size = len(request.file_base64) * 3 // 4
        if estimated_file_size > settings.file.max_file_size:
            raise HTTPException(
                status_code=413,
                detail=f"文件大小超过限制 ({settings.file.max_file_size // (1024*1024)}MB)"
            )

        # 验证MIME类型
        if request.mime_type not in settings.file.allowed_mime_types:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件类型: {request.mime_type}"
            )

        # 准备任务数据
        task_data = {
            "file_base64": request.file_base64,
            "mime_type": request.mime_type,
            "report_type": request.report_type.value,
            "custom_prompt": request.custom_prompt,
            "name":None,
            "id_card": None,
            "mobile_no": None
        }

        # 添加任务到队列
        task_id = await request_queue.add_task(task_data)

        # 记录请求开始日志
        if settings.log.algorithm_enable:
            await algorithm_logger.log_request_start(task_id, task_data)

        # 计算预估等待时间
        queue_stats = request_queue.get_queue_stats()
        estimated_wait_time = queue_stats["current_queue_size"] * 30  # 假设每个任务平均30秒

        logger.info(f"任务已提交到队列: {task_id} | "
                   f"类型: {request.report_type} | "
                   f"文件大小: {estimated_file_size // 1024}KB | "
                   f"队列位置: {queue_stats['current_queue_size']}")

        return TaskSubmitResponse(
            success=True,
            task_id=task_id,
            message="任务已成功提交到处理队列",
            estimated_wait_time=estimated_wait_time,
            queue_position=queue_stats["current_queue_size"]
        )

    except HTTPException:
        raise
    except RuntimeError as e:
        # 队列相关错误
        raise HTTPException(
            status_code=503,
            detail=f"服务暂时不可用: {str(e)}"
        )
    except Exception as e:
        logger.error(f"提交分析任务时发生错误: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"服务器内部错误: {str(e)}"
        )


@app.post("/analyze/sync", response_model=AnalysisResponse)
async def analyze_document_sync(request: AnalysisRequest, http_request: Request):
    """
    同步分析文档接口（直接处理，不使用队列）

    用于紧急或小文件的即时处理
    支持两种输入方式：
    1. file_base64 + mime_type: 传统的PDF base64方式
    2. markdown_content: 直接传入Markdown内容
    """
    request_id = f"sync_req_{int(time.time() * 1000)}"

    # 将原始请求对象转换为字典用于日志记录
    if hasattr(request, 'model_dump'):
        input_data = request.model_dump()
    elif hasattr(request, 'dict'):
        input_data = request.dict()
    else:
        # 备用方案：手动提取字段
        input_data = {
            "file_base64": request.file_base64,
            "markdown_content": request.markdown_content,
            "mime_type": request.mime_type,
            "report_type": request.report_type.value if request.report_type else None,
            "custom_prompt": request.custom_prompt,
            "name": getattr(request, 'name', None),
            "id_card": getattr(request, 'id_card', None),
            "mobile_no": getattr(request, 'mobile_no', None)
        }

    try:
        # 验证输入
        if not request.file_base64 and not request.markdown_content:
            raise HTTPException(status_code=400, detail="必须提供file_base64或markdown_content之一")

        # 验证文件输入
        if request.file_base64:
            file_size = len(request.file_base64) * 3 // 4
            if file_size > settings.file.max_file_size:
                raise HTTPException(status_code=413, detail=f"文件大小超过限制 ({settings.file.max_file_size // (1024*1024)}MB)")
            if not request.mime_type:
                raise HTTPException(status_code=400, detail="使用file_base64时必须提供mime_type")
            if request.mime_type not in settings.file.allowed_mime_types:
                raise HTTPException(status_code=400, detail=f"不支持的文件类型: {request.mime_type}")
            logger.info(f"📝 开始分析 | 类型: {request.report_type} | MIME: {request.mime_type} | 大小: {file_size // 1024}KB | ID: {request_id}")
        else:
            logger.info(f"📝 开始分析(Markdown) | 类型: {request.report_type} | 长度: {len(request.markdown_content)} | ID: {request_id}")

        # 记录算法日志
        if settings.log.algorithm_enable:
            await algorithm_logger.log_request_start(request_id, {
                "file_base64": request.file_base64 if request.file_base64 else None,
                "markdown_content": request.markdown_content[:500] if request.markdown_content else None,
                "mime_type": request.mime_type,
                "report_type": request.report_type.value,
                "custom_prompt": request.custom_prompt
            })

        # AI分析
        start_time = time.time()
        briefReportService = BriefReportService()
        visualization_report, html_file, pdf_file = await briefReportService.generate_report(
            analysisRequest=request,
            request_id=request_id
        )
        processing_time = time.time() - start_time

        # 返回响应
        # 将visualization_report转换为字典
        # 🔑 关键：使用 by_alias=True 确保大数据报告字段使用驼峰命名（camelCase）
        analysis_result_dict = None
        if visualization_report:
            if hasattr(visualization_report, 'model_dump'):
                analysis_result_dict = visualization_report.model_dump(by_alias=True)
            elif hasattr(visualization_report, 'dict'):
                analysis_result_dict = visualization_report.dict(by_alias=True)
            else:
                analysis_result_dict = visualization_report

            # 🔍 调试日志：检查report_number和report_date是否存在
            logger.info(f"📊 [数据检查] report_number: {analysis_result_dict.get('report_number', 'NOT FOUND')}")
            logger.info(f"📊 [数据检查] report_date: {analysis_result_dict.get('report_date', 'NOT FOUND')}")

        # 将PDF二进制转换为base64字符串
        pdf_report_b64 = None
        if pdf_file is not None:
            try:
                if isinstance(pdf_file, (bytes, bytearray)):
                    pdf_report_b64 = base64.b64encode(pdf_file).decode('utf-8')
                elif isinstance(pdf_file, str):
                    # 如果已经是字符串（例如已经是base64），直接使用
                    pdf_report_b64 = pdf_file
            except Exception:
                pdf_report_b64 = None

        # 准备输出数据
        response_data = AnalysisResponse(
            success=True,
            request_id=request_id,
            analysis_result=analysis_result_dict,
            error_message=None,
            processing_time=processing_time,
            html_report=html_file,
            pdf_report=pdf_report_b64
        )

        # 记录输入输出日志到本地JSON文件
        if settings.log.algorithm_enable:
            try:
                # 将响应对象转换为字典
                if hasattr(response_data, 'model_dump'):
                    output_data = response_data.model_dump()
                elif hasattr(response_data, 'dict'):
                    output_data = response_data.dict()
                else:
                    # 备用方案：手动提取字段
                    output_data = {
                        "success": response_data.success,
                        "request_id": response_data.request_id,
                        "analysis_result": response_data.analysis_result,
                        "error_message": response_data.error_message,
                        "processing_time": response_data.processing_time,
                        "html_report": response_data.html_report,
                        "pdf_report": response_data.pdf_report
                    }
                await algorithm_logger.log_input_output(request_id, input_data, output_data)
            except Exception as log_error:
                logger.warning(f"记录输入输出日志失败: {log_error}")

        return response_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 分析失败: {str(e)} | ID: {request_id}")
        
        # 记录错误情况下的输入输出日志
        if settings.log.algorithm_enable:
            await algorithm_logger.log_error(request_id, "sync_analysis_error", str(e))
                   
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")


@app.get("/task/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """
    获取任务状态

    Args:
        task_id: 任务ID
    """
    task = await request_queue.get_task_status(task_id)

    if not task:
        raise HTTPException(
            status_code=404,
            detail=f"任务不存在: {task_id}"
        )

    return TaskStatusResponse(
        task_id=task.task_id,
        status=task.status.value,
        created_at=task.created_at,
        started_at=task.started_at,
        completed_at=task.completed_at,
        processing_time=task.processing_time,
        wait_time=task.wait_time,
        result=task.result,
        error_message=task.error_message,
        retry_count=task.retry_count
    )


@app.delete("/task/{task_id}")
async def cancel_task(task_id: str):
    """
    取消任务

    Args:
        task_id: 任务ID
    """
    success = await request_queue.cancel_task(task_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"任务不存在或无法取消: {task_id}"
        )

    return {"message": f"任务已取消: {task_id}"}


@app.get("/queue/stats", response_model=QueueStatsResponse)
async def get_queue_stats():
    """
    获取队列统计信息
    """
    stats = request_queue.get_queue_stats()
    return QueueStatsResponse(**stats)


@app.get("/logs/stats", response_model=LogStatsResponse)
async def get_log_stats(hours: int = 24):
    """
    获取算法调用统计信息

    Args:
        hours: 统计时间范围（小时）
    """
    if not settings.log.algorithm_enable:
        raise HTTPException(
            status_code=404,
            detail="算法日志功能未启用"
        )

    stats = await algorithm_logger.get_stats_summary(hours)

    if "error" in stats:
        raise HTTPException(
            status_code=500,
            detail=f"获取统计信息失败: {stats['error']}"
        )

    return LogStatsResponse(**stats)


@app.get("/logs/recent")
async def get_recent_logs(log_type: str = "request", limit: int = 100):
    """
    获取最近的日志记录

    Args:
        log_type: 日志类型 (request/error/stats)
        limit: 返回记录数量限制
    """
    if not settings.log.algorithm_enable:
        raise HTTPException(
            status_code=404,
            detail="算法日志功能未启用"
        )

    if log_type not in ["request", "error", "stats"]:
        raise HTTPException(
            status_code=400,
            detail="无效的日志类型，支持: request, error, stats"
        )

    logs = await algorithm_logger.get_recent_logs(log_type, limit)

    return {
        "log_type": log_type,
        "count": len(logs),
        "logs": logs
    }


@app.get("/prompts/{report_type}")
async def get_prompt_template(report_type: str):
    """
    获取提示词模板

    Args:
        report_type: 报告类型 (flow/simple/detail)
    """

    if report_type not in PROMPT_TEMPLATES:
        raise HTTPException(
            status_code=404,
            detail=f"不支持的报告类型: {report_type}"
        )

    return {
        "report_type": report_type,
        "prompt_template": PROMPT_TEMPLATES[report_type]
    }

@app.post("/analysis", response_model=TaskSubmitResponse)
async def generate_report(request: AnalysisRequest, http_request: Request):
    """
    提交文档分析任务到队列

    接收文件的base64编码和相关参数，将任务加入队列等待处理
    """
    try:
        # 验证请求参数
        if not request.file_base64:
            raise HTTPException(
                status_code=400,
                detail="文件内容不能为空"
            )

        # 验证文件大小（base64编码后的大小约为原文件的1.33倍）
        estimated_file_size = len(request.file_base64) * 3 // 4
        if estimated_file_size > settings.file.max_file_size:
            raise HTTPException(
                status_code=413,
                detail=f"文件大小超过限制 ({settings.file.max_file_size // (1024*1024)}MB)"
            )

        # 验证MIME类型
        if request.mime_type not in settings.file.allowed_mime_types:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件类型: {request.mime_type}"
            )

        # 准备任务数据
        task_data = {
            "file_base64": request.file_base64,
            "mime_type": request.mime_type,
            "report_type": request.report_type.value,
            "custom_prompt": request.custom_prompt,
            "name": request.name,
            "id_card": request.id_card,
            "mobile_no": request.mobile_no
        }

        # 添加任务到队列
        task_id = await request_queue.add_task(task_data)

        # 记录请求开始日志
        if settings.log.algorithm_enable:
            await algorithm_logger.log_request_start(task_id, task_data)

        # 计算预估等待时间
        queue_stats = request_queue.get_queue_stats()
        estimated_wait_time = queue_stats["current_queue_size"] * 30  # 假设每个任务平均30秒

        logger.info(f"任务已提交到队列: {task_id} | "
                   f"类型: {request.report_type} | "
                   f"文件大小: {estimated_file_size // 1024}KB | "
                   f"队列位置: {queue_stats['current_queue_size']}")

        return TaskSubmitResponse(
            success=True,
            task_id=task_id,
            message="任务已成功提交到处理队列",
            estimated_wait_time=estimated_wait_time,
            queue_position=queue_stats["current_queue_size"]
        )

    except HTTPException:
        raise
    except RuntimeError as e:
        # 队列相关错误
        raise HTTPException(
            status_code=503,
            detail=f"服务暂时不可用: {str(e)}"
        )
    except Exception as e:
        logger.error(f"提交分析任务时发生错误: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"服务器内部错误: {str(e)}"
        )


@app.post("/income")
async def income_extraction(request: IncomeRequest):
    """
    从社保、公积金、个税数据中提取关键信息，用于个人收入认定和分析
    """
    try:
        # 验证请求参数
        if not request.file_base64:
            raise HTTPException(
                status_code=400,
                detail="文件内容不能为空"
            )

        # 验证文件大小（base64编码后的大小约为原文件的1.33倍）
        estimated_file_size = len(request.file_base64) * 3 // 4
        if estimated_file_size > settings.file.max_file_size:
            raise HTTPException(
                status_code=413,
                detail=f"文件大小超过限制 ({settings.file.max_file_size // (1024*1024)}MB)"
            )

        # 验证MIME类型
        if request.mime_type not in settings.file.allowed_mime_types:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件类型: {request.mime_type}"
            )

        # 创建收入服务实例
        from service.income_service import Income_Service
        income_service = Income_Service()

        # 生成唯一请求ID
        request_id = str(uuid.uuid4())

        logger.info(f"开始收入信息提取 - 文件类型: {request.file_type} | "
                   f"MIME: {request.mime_type} | "
                   f"文件大小: {estimated_file_size // 1024}KB | "
                   f"request_id: {request_id}")

        # 调用收入分析服务
        result = await income_service.process_document(
            file_base64=request.file_base64,
            mime_type=request.mime_type,
            file_type=request.file_type.value,
            request_id=request_id
        )

        if result['success']:
            return {
                "success": True,
                "request_id": request_id,
                "analysis_result": result['analysis_result'],
                "processing_time": result['processing_time']
            }
        else:
            return {
                "success": False,
                "request_id": request_id,
                "error_message": result['error_message'],
                "processing_time": result['processing_time']
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"收入信息提取时发生错误: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"服务器内部错误: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.app.host,
        port=settings.app.port,
        reload=settings.app.debug,
        log_level=settings.log.level.lower()
    )
