"""
请求队列管理器
"""

import asyncio
import time
import uuid
import base64
from typing import Dict, Any, Optional, Callable
from enum import Enum
from dataclasses import dataclass, field
from loguru import logger


class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class QueueTask:
    """队列任务"""
    task_id: str
    request_data: Dict[str, Any]
    status: TaskStatus = TaskStatus.PENDING
    created_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 2
    
    @property
    def processing_time(self) -> Optional[float]:
        """计算处理时间"""
        if self.started_at and self.completed_at:
            return self.completed_at - self.started_at
        return None
    
    @property
    def wait_time(self) -> Optional[float]:
        """计算等待时间"""
        if self.started_at:
            return self.started_at - self.created_at
        return None


class RequestQueue:
    """请求队列管理器"""
    
    def __init__(self, max_concurrent_tasks: int = 3, max_queue_size: int = 100):
        self.max_concurrent_tasks = max_concurrent_tasks
        self.max_queue_size = max_queue_size
        self.queue = asyncio.Queue(maxsize=max_queue_size)
        self.tasks: Dict[str, QueueTask] = {}
        self.processing_tasks: Dict[str, asyncio.Task] = {}
        self.worker_tasks: list = []
        self.is_running = False
        self._stats = {
            "total_requests": 0,
            "completed_requests": 0,
            "failed_requests": 0,
            "current_queue_size": 0,
            "current_processing": 0
        }
    
    async def start(self):
        """启动队列处理器"""
        if self.is_running:
            return
        
        self.is_running = True
        logger.info(f"启动请求队列，最大并发: {self.max_concurrent_tasks}, 最大队列长度: {self.max_queue_size}")
        
        # 启动工作协程
        for i in range(self.max_concurrent_tasks):
            worker = asyncio.create_task(self._worker(f"worker-{i}"))
            self.worker_tasks.append(worker)
    
    async def stop(self):
        """停止队列处理器"""
        if not self.is_running:
            return
        
        self.is_running = False
        logger.info("停止请求队列...")
        
        # 取消所有工作协程
        for worker in self.worker_tasks:
            worker.cancel()
        
        # 等待所有工作协程结束
        await asyncio.gather(*self.worker_tasks, return_exceptions=True)
        self.worker_tasks.clear()
        
        # 取消所有处理中的任务
        for task in self.processing_tasks.values():
            task.cancel()
        
        logger.info("请求队列已停止")
    
    async def add_task(self, request_data: Dict[str, Any]) -> str:
        """添加任务到队列"""
        if not self.is_running:
            raise RuntimeError("队列未启动")
        
        if self.queue.qsize() >= self.max_queue_size:
            raise RuntimeError(f"队列已满，当前长度: {self.queue.qsize()}")
        
        task_id = str(uuid.uuid4())
        task = QueueTask(task_id=task_id, request_data=request_data)
        
        self.tasks[task_id] = task
        await self.queue.put(task)
        
        self._stats["total_requests"] += 1
        self._stats["current_queue_size"] = self.queue.qsize()
        
        logger.info(f"任务已加入队列: {task_id}, 队列长度: {self.queue.qsize()}")
        return task_id
    
    async def get_task_status(self, task_id: str) -> Optional[QueueTask]:
        """获取任务状态"""
        return self.tasks.get(task_id)
    
    async def cancel_task(self, task_id: str) -> bool:
        """取消任务"""
        task = self.tasks.get(task_id)
        if not task:
            return False
        
        if task.status == TaskStatus.PENDING:
            task.status = TaskStatus.CANCELLED
            logger.info(f"任务已取消: {task_id}")
            return True
        elif task.status == TaskStatus.PROCESSING:
            # 取消正在处理的任务
            processing_task = self.processing_tasks.get(task_id)
            if processing_task:
                processing_task.cancel()
                task.status = TaskStatus.CANCELLED
                logger.info(f"正在处理的任务已取消: {task_id}")
                return True
        
        return False
    
    def get_queue_stats(self) -> Dict[str, Any]:
        """获取队列统计信息"""
        self._stats["current_queue_size"] = self.queue.qsize()
        self._stats["current_processing"] = len(self.processing_tasks)
        
        return {
            **self._stats,
            "queue_capacity": self.max_queue_size,
            "max_concurrent": self.max_concurrent_tasks,
            "is_running": self.is_running
        }
    
    async def _worker(self, worker_name: str):
        """工作协程"""
        logger.info(f"工作协程启动: {worker_name}")
        
        while self.is_running:
            try:
                # 从队列获取任务
                task = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                
                if task.status == TaskStatus.CANCELLED:
                    self.queue.task_done()
                    continue
                
                # 处理任务
                await self._process_task(task, worker_name)
                self.queue.task_done()
                
            except asyncio.TimeoutError:
                # 超时继续循环
                continue
            except asyncio.CancelledError:
                logger.info(f"工作协程被取消: {worker_name}")
                break
            except Exception as e:
                logger.error(f"工作协程异常: {worker_name}, 错误: {e}")
                await asyncio.sleep(1)
        
        logger.info(f"工作协程结束: {worker_name}")
    
    async def _process_task(self, task: QueueTask, worker_name: str):
        """处理单个任务"""
        task_id = task.task_id
        
        try:
            # 更新任务状态
            task.status = TaskStatus.PROCESSING
            task.started_at = time.time()
            
            logger.info(f"开始处理任务: {task_id}, 工作协程: {worker_name}")
            
            # 创建处理协程
            from service.brief_report_service import BriefReportService
            from models.report_model import AnalysisRequest

            brief_report_service = BriefReportService()

            # 构建AnalysisRequest对象
            analysis_request = AnalysisRequest(
                file_base64=task.request_data.get("file_base64"),
                markdown_content=task.request_data.get("markdown_content"),
                mime_type=task.request_data.get("mime_type"),
                report_type=task.request_data["report_type"],
                custom_prompt=task.request_data.get("custom_prompt"),
                file_name=task.request_data.get("file_name"),
                name=task.request_data.get("name"),
                id_card=task.request_data.get("id_card"),
                mobile_no=task.request_data.get("mobile_no"),
                auth_file=task.request_data.get("auth_file"),
                customer_info=task.request_data.get("customer_info")
            )

            processing_coro = brief_report_service.generate_report(
                analysisRequest=analysis_request,
                request_id=task_id
            )

            processing_task = asyncio.create_task(processing_coro)
            self.processing_tasks[task_id] = processing_task

            # 等待处理完成 - generate_report返回三个值: (visualization_report, html_file, pdf_file)
            visualization_report, html_file, pdf_file = await processing_task

            # 更新任务结果
            task.completed_at = time.time()

            # 检查是否成功
            if visualization_report is not None:
                task.status = TaskStatus.COMPLETED
                self._stats["completed_requests"] += 1
                logger.info(f"任务处理成功: {task_id}, 耗时: {task.processing_time:.2f}s")

                # 将PDF二进制转换为base64字符串
                pdf_file_b64 = None
                if pdf_file is not None:
                    try:
                        if isinstance(pdf_file, (bytes, bytearray)):
                            pdf_file_b64 = base64.b64encode(pdf_file).decode('utf-8')
                        elif isinstance(pdf_file, str):
                            # 如果已经是字符串（例如已经是base64），直接使用
                            pdf_file_b64 = pdf_file
                    except Exception as e:
                        logger.warning(f"PDF转base64失败: {e}")
                        pdf_file_b64 = None

                # 构建结果字典
                task.result = {
                    "success": True,
                    "visualization_report": visualization_report.model_dump() if hasattr(visualization_report, 'model_dump') else visualization_report,
                    "html_file": html_file,
                    "pdf_file": pdf_file_b64,
                    "request_id": task_id,
                    "processing_time": task.processing_time
                }
            else:
                task.status = TaskStatus.FAILED
                task.error_message = "报告生成失败"
                self._stats["failed_requests"] += 1
                logger.error(f"任务处理失败: {task_id}, 错误: {task.error_message}")
                task.result = {
                    "success": False,
                    "error_message": task.error_message,
                    "request_id": task_id
                }
        
        except asyncio.CancelledError:
            task.status = TaskStatus.CANCELLED
            task.completed_at = time.time()
            logger.info(f"任务被取消: {task_id}")
        
        except Exception as e:
            task.completed_at = time.time()
            task.status = TaskStatus.FAILED
            task.error_message = str(e)
            self._stats["failed_requests"] += 1
            
            # 重试逻辑
            if task.retry_count < task.max_retries:
                task.retry_count += 1
                task.status = TaskStatus.PENDING
                task.started_at = None
                task.completed_at = None
                await self.queue.put(task)
                logger.warning(f"任务处理失败，重试 {task.retry_count}/{task.max_retries}: {task_id}, 错误: {e}")
            else:
                logger.error(f"任务处理失败，已达最大重试次数: {task_id}, 错误: {e}")
        
        finally:
            # 清理处理中的任务记录
            self.processing_tasks.pop(task_id, None)


# 全局队列实例
request_queue = RequestQueue(max_concurrent_tasks=3, max_queue_size=100)
