import sys
from pathlib import Path
# 添加项目根目录到 sys.path
sys.path.append(str(Path(__file__).resolve().parent))

import time
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

from config.settings import settings
from models.report_model import *
from service.ai_service import AIAnalysisService
from utils.queue_manager import request_queue, TaskStatus
from utils.log_manager import algorithm_logger
from utils.prompts import PROMPT_TEMPLATES
from models.basemodel import *
from service.report_service import *
from models.visualization_model import VisualizationReportRequest
from service.html_report_service import HTMLReportService

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

# 创建AI分析服务实例
ai_service = AIAnalysisService()

# 创建HTML报告服务实例
html_report_service = HTMLReportService()


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


@app.get("/health", response_model=dict)
async def health_check():
    """详细健康检查"""
    ai_health = await ai_service.health_check()
    queue_stats = request_queue.get_queue_stats()

    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "ai_api": ai_health,
            "request_queue": {
                "status": "running" if queue_stats["is_running"] else "stopped",
                "current_queue_size": queue_stats["current_queue_size"],
                "current_processing": queue_stats["current_processing"],
                "total_processed": queue_stats["completed_requests"] + queue_stats["failed_requests"]
            }
        },
        "config": {
            "ai_api_url": settings.ai.api_url,
            "max_file_size": settings.file.max_file_size,
            "allowed_mime_types": settings.file.allowed_mime_types,
            "max_concurrent_tasks": settings.queue.max_concurrent_tasks,
            "max_queue_size": settings.queue.max_queue_size,
            "algorithm_enable": settings.log.algorithm_enable
        }
    }


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

    try:
        # 验证请求参数 - 必须提供file_base64或markdown_content之一
        if not request.file_base64 and not request.markdown_content:
            raise HTTPException(
                status_code=400,
                detail="必须提供file_base64或markdown_content之一"
            )

        # 如果使用file_base64方式
        if request.file_base64:
            # 验证文件大小
            estimated_file_size = len(request.file_base64) * 3 // 4
            if estimated_file_size > settings.file.max_file_size:
                raise HTTPException(
                    status_code=413,
                    detail=f"文件大小超过限制 ({settings.file.max_file_size // (1024*1024)}MB)"
                )

            # 验证MIME类型
            if not request.mime_type:
                raise HTTPException(
                    status_code=400,
                    detail="使用file_base64时必须提供mime_type"
                )

            if request.mime_type not in settings.file.allowed_mime_types:
                raise HTTPException(
                    status_code=400,
                    detail=f"不支持的文件类型: {request.mime_type}"
                )

            logger.info(f"开始同步分析文档 - 类型: {request.report_type} | "
                       f"MIME: {request.mime_type} | "
                       f"文件大小: {estimated_file_size // 1024}KB | "
                       f"request_id: {request_id}")
        else:
            # 使用markdown_content方式
            logger.info(f"开始同步分析文档(Markdown) - 类型: {request.report_type} | "
                       f"Markdown长度: {len(request.markdown_content)} | "
                       f"request_id: {request_id}")

        # 记录请求开始日志
        if settings.log.algorithm_enable:
            task_data = {
                "file_base64": request.file_base64 if request.file_base64 else None,
                "markdown_content": request.markdown_content[:500] if request.markdown_content else None,  # 只记录前500字符
                "mime_type": request.mime_type,
                "report_type": request.report_type.value,
                "custom_prompt": request.custom_prompt,
                "name": None,
                "id_card": None,
                "mobile_no": None
            }
            await algorithm_logger.log_request_start(request_id, task_data)

        # 直接调用AI分析服务
        start_time = time.time()
        result = await ai_service.analyze_document(
            file_base64=request.file_base64,
            markdown_content=request.markdown_content,
            mime_type=request.mime_type,
            report_type=request.report_type.value,
            custom_prompt=request.custom_prompt,
            request_id=request_id,
            file_name=request.file_name or "document.pdf"  # 传递文件名
        )
        processing_time = time.time() - start_time

        # 记录请求完成日志
        if settings.log.algorithm_enable:
            await algorithm_logger.log_request_complete(request_id, result, processing_time)

        if result['success']:
            # 🔧 方式2：自动生成HTML报告
            logger.info(f"开始生成HTML报告 | request_id: {request_id}")
            html_start_time = time.time()

            try:
                html_report = await html_report_service.generate_html_report(
                    analysis_result=result['analysis_result'],
                    report_type=request.report_type.value,
                    name=request.name,
                    id_card=request.id_card
                )
                html_generation_time = time.time() - html_start_time
                logger.info(f"HTML报告生成成功 | 长度: {len(html_report):,} 字符 | 耗时: {html_generation_time:.2f}s | request_id: {request_id}")
            except Exception as html_error:
                logger.error(f"HTML报告生成失败: {str(html_error)} | request_id: {request_id}")
                html_report = None  # HTML生成失败不影响主流程

            return AnalysisResponse(
                success=True,
                request_id=request_id,
                analysis_result=result['analysis_result'],
                processing_time=result['processing_time'],
                html_report=html_report
            )
        else:
            return AnalysisResponse(
                success=False,
                request_id=request_id,
                error_message=result['error_message'],
                processing_time=result['processing_time']
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"同步分析文档时发生错误: {str(e)} | request_id: {request_id}")

        # 记录错误日志
        if settings.log.algorithm_enable:
            await algorithm_logger.log_error(request_id, "sync_analysis_error", str(e))

        raise HTTPException(
            status_code=500,
            detail=f"服务器内部错误: {str(e)}"
        )


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

@app.post("/analysis/report")
async def generate_analysis_report(request: AnalysisRequest):
    """
    生成个人征信报告接口

    接收文件的base64编码和相关参数，直接生成分析报告
    """
    try:
        from service.report_service import ReportService
        report_service = ReportService()
        
        # 生成唯一请求ID
        request_id = str(uuid.uuid4())
        
        # 调用异步方法时添加await
        result = await report_service.generate_report(
            file_base64=request.file_base64,
            mime_type=request.mime_type,
            report_type=request.report_type,
            custom_prompt=request.custom_prompt,
            request_id=request_id,
            name=request.name,
            id_card=request.id_card,
            mobile_no=request.mobile_no,
        )
        
        # 将Pydantic模型转换为字典以便FastAPI序列化
        return result.model_dump()
    except Exception as e:
        return None


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


@app.post("/generate/html-report")
async def generate_html_report(request: VisualizationReportRequest):
    """
    生成HTML格式的可视化报告

    支持两种方式：
    1. 通过task_id获取分析结果
    2. 直接提供report_data

    返回HTML字符串
    """
    try:
        logger.info("开始生成HTML报告")

        analysis_result = None
        name = None
        id_card = None

        # 获取分析结果
        if request.task_id:
            # 从队列中获取任务结果
            task = await request_queue.get_task_status(request.task_id)

            if not task:
                raise HTTPException(status_code=404, detail="任务不存在")

            if task.status != TaskStatus.COMPLETED:
                raise HTTPException(status_code=400, detail=f"任务未完成，当前状态: {task.status.value}")

            analysis_result = task.result.get("analysis_result", {})
            # 从任务数据中获取个人信息
            task_data = task.data or {}
            name = task_data.get("name")
            id_card = task_data.get("id_card")

        elif request.report_data:
            # 直接使用提供的数据
            analysis_result = request.report_data
        else:
            raise HTTPException(status_code=400, detail="必须提供task_id或report_data")

        # 生成HTML报告
        html_content = await html_report_service.generate_html_report(
            analysis_result=analysis_result,
            report_type="simple",  # 可以从request中获取
            name=name,
            id_card=id_card
        )

        logger.info(f"成功生成HTML报告, 长度: {len(html_content):,} 字符")

        # 返回HTML内容
        from fastapi.responses import HTMLResponse
        return HTMLResponse(content=html_content)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"生成HTML报告时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"生成报告失败: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.app.host,
        port=settings.app.port,
        reload=settings.app.debug,
        log_level=settings.log.level.lower()
    )
