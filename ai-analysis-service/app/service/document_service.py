#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
个人征信报告生成
"""
import sys
from pathlib import Path
# 添加项目根目录到 sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import requests
import base64
from datetime import datetime, timedelta
from loguru import logger
import time
import httpx
import json
from typing import Optional, Tuple, Dict, Any
from fastapi import APIRouter, HTTPException, Body

from .database_service import DatabaseService
from pydantic import BaseModel
from config.settings import settings
from utils.log_manager import algorithm_logger

class DocumentService:
    
    def __init__(self):
        self.ai_api_url = settings.ai.api_url
        self.ai_api_key = settings.ai.api_key
        self.ai_api_timeout = settings.ai.api_timeout

        # PDF转Markdown服务配置
        self.pdf_to_markdown_url = settings.pdf.to_markdown_url
        self.pdf_to_markdown_timeout = settings.pdf.to_markdown_timeout

    async def process_document_by_gemini(
        self,
        file_name: str,
        file_base64: str,
    ):
        """
            调用 Gemini 将pdf转换为markdown

            Args:
                file_name: 文件名
                file_base64: PDF文件的base64编码

            Returns:
                Markdown格式的文档内容
        """
        logger.info(f"📄 Gemini [PDF转Markdown] 开始转换, 文件: {file_name}")
        logger.info(f"📊 Gemini [PDF转Markdown] Base64长度: {len(file_base64):,} 字符")
        
        # 构建请求数据
        request_data = {
            "contents": [
                {
                    "role": "user", 
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": "application/pdf",
                                "data": file_base64
                            }
                        },
                        {
                            "text": "请提取这个PDF中的所有文本内容，并以Markdown格式返回。忽略水印和印章，保留原始格式和表格结构。"
                        }
                    ]
                }
            ]
        }
        
        # 发送请求到Gemini API

        headers = {
            "Content-Type": "application/json"
        }
        params = {
            "key": self.ai_api_key
        }

        
        response = requests.post(
            self.ai_api_url,
            json=request_data,
            headers=headers,
            params=params,
            timeout=600
        )
        
        if response.status_code == 200:
            result = response.json()
            if 'candidates' in result and len(result['candidates']) > 0:
                markdown_content = result['candidates'][0]['content']['parts'][0]['text']
                logger.info(f"成功提取PDF内容，长度: {len(markdown_content)}")
                return markdown_content
            else:
                logger.error("API返回数据格式异常")
                return ""
        else:
            logger.error(f"API调用失败: {response.status_code}, {response.text}")
            return ""
   
    async def process_document_by_ocr(
        self,
        file_name: str,
        file_base64: str,
    ) -> str:
        """
            调用 OCR 将pdf转换为markdown

            Args:
                file_name: 文件名
                file_base64: PDF文件的base64编码

            Returns:
                Markdown格式的文档内容
        """
        try:
            logger.info(f"📄 OCR [PDF转Markdown] 开始转换, 文件: {file_name}")
            logger.info(f"📊 OCR [PDF转Markdown] Base64长度: {len(file_base64):,} 字符")

            # 构建请求数据
            request_data = {
                "filename": file_name,
                "file_data": file_base64
            }

            # 调用PDF转Markdown服务
            start_time = time.time()
            async with httpx.AsyncClient(timeout=self.pdf_to_markdown_timeout) as client:
                response = await client.post(
                    self.pdf_to_markdown_url,
                    json=request_data,
                    headers={
                        'Content-Type': 'application/json'
                    }
                )

            processing_time = time.time() - start_time

            if response.status_code == 200:
                result = response.json()

                # 尝试从响应中提取markdown内容，支持多种可能的字段名
                markdown_content = None
                if isinstance(result, dict):
                    for key in ['markdown', 'content', 'text', 'data', 'result']:
                        if key in result:
                            markdown_content = result[key]
                            logger.info(f"📝 [PDF转Markdown] 找到Markdown字段: {key}")
                            break

                    if not markdown_content:
                        # 如果没有找到标准字段，使用整个响应
                        markdown_content = json.dumps(result, ensure_ascii=False, indent=2)
                        logger.warning(f"⚠️ [PDF转Markdown] 未找到标准字段，使用完整响应")
                else:
                    markdown_content = str(result)

                logger.info(f"✅ [PDF转Markdown] 转换成功, "
                          f"Markdown长度: {len(markdown_content):,}, "
                          f"处理时间: {processing_time:.2f}s")

                return markdown_content
            else:
                error_msg = f"PDF转Markdown服务返回错误: {response.status_code}"
                logger.error(f"❌ [PDF转Markdown] {error_msg}, 响应: {response.text[:500]}")
                raise Exception(error_msg)

        except httpx.TimeoutException:
            error_msg = f"PDF转Markdown服务超时 (>{self.pdf_to_markdown_timeout}s)"
            logger.error(f"❌ [PDF转Markdown] {error_msg}")
            raise Exception(error_msg)
        except Exception as e:
            error_msg = f"PDF转Markdown失败: {str(e)}"
            logger.error(f"❌ [PDF转Markdown] {error_msg}")
            raise Exception(error_msg)

if __name__ == '__main__':
    # 直接读取PDF文件的原生二进制数据
    with open(Path(r"D:\work\星纬算法\金融文档\代码\zixinmao\ai-analysis-service\cuiyi.pdf"), 'rb') as f:
        pdf_data = f.read()

    # 将PDF原生数据编码为base64
    pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')

    documentService = DocumentService()
    documentService.process_document_by_gemini(pdf_base64)