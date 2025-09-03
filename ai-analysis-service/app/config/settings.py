from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import HttpUrl, ValidationError
from pathlib import Path
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class TianYuanConfig(BaseSettings):
    """天远API配置"""
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", env_prefix="TIANYUAN_")
    app_id: str
    app_secret: str
    base_url: HttpUrl
    api_code: str


class DatabaseConfig(BaseSettings):
    """数据库配置"""
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", env_prefix="DB_")
    host: str
    port: int = 5455
    user: str
    password: Optional[str] = None
    database: str
    charset: str = "utf8mb4"


class LogConfig(BaseSettings):
    """日志配置"""
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", env_prefix="LOG_")
    level: str = "INFO"
    dir: str = "logs"
    algorithm_enable: bool = True
    filename: str = "app.log"
    backup_count: int = 30


class AppConfig(BaseSettings):
    """应用配置"""
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", env_prefix="APP_")
    name: str
    version: str
    host: str
    port: int
    debug: bool


class AIConfig(BaseSettings):
    """AI API配置"""
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", env_prefix="AI_")
    api_url: HttpUrl
    api_key: str
    api_timeout: int

class QueueConfig(BaseSettings):
    """队列配置"""
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", env_prefix="QUEUE_")
    max_concurrent_tasks: int  # 最大并发处理任务数
    max_queue_size: int # 最大队列长度
    task_timeout: int # 任务超时时间（秒）

class FileConfig(BaseSettings):
    """文件处理配置"""
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", env_prefix="FILE_")
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    allowed_mime_types: list = ["application/pdf", "image/jpeg", "image/png"]

class DifyConfig(BaseSettings):
    """Dify配置"""
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", env_prefix="DIFY_")
    api_base_url: str
    api_key: str
    api_timeout: int

class Settings:
    """统一的配置入口"""
    tianyuan = TianYuanConfig()
    db = DatabaseConfig()
    log = LogConfig()
    app = AppConfig()
    ai = AIConfig()
    queue = QueueConfig()
    file = FileConfig()
    dify = DifyConfig()

try:
    settings = Settings()
    print(f"{BASE_DIR}/.env 配置文件加载成功 ✅")
except ValidationError as e:
    print(f"{BASE_DIR}/.env 配置文件加载失败 ❌")
    print("详细错误信息：")
    print(e)
except Exception as e:
    print(f"{BASE_DIR}/.env 配置文件加载失败 ❌（非校验错误）")
    print("详细异常：", e)
