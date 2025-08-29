#!/usr/bin/env python3
"""
AI文档分析服务启动脚本
"""

import uvicorn
from app.config.settings import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.app.host,
        port=settings.app.port,
        reload=settings.app.debug,
        log_level=settings.log.level.lower()
    )
