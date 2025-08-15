import os
from typing import Optional
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings


class Settings(BaseSettings):
    # AI API配置
    ai_api_url: str = "https://yunwu.ai/v1beta/models/gemini-2.5-flash:generateContent"
    ai_api_key: str = ""
    ai_api_timeout: int = 300  # 5分钟超时
    
    # 服务配置
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    
    # 日志配置
    log_level: str = "INFO"
    
    # 文件处理配置
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    allowed_mime_types: list = ["application/pdf", "image/jpeg", "image/png"]

    # 队列配置
    max_concurrent_tasks: int = 3  # 最大并发处理任务数
    max_queue_size: int = 100  # 最大队列长度
    task_timeout: int = 600  # 任务超时时间（秒）

    # 日志配置
    log_dir: str = "logs"
    enable_algorithm_logging: bool = True

    # 回调配置（可选）
    enable_callback: bool = False
    callback_url: str = ""  # 分析完成后的回调URL
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
