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
import tempfile
import asyncio
import os
from typing import Optional, Tuple, Dict, Any
from fastapi import APIRouter, HTTPException, Body
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

    async def process_document_by_pdfplumber(
        self,
        file_name: str,
        file_base64: str,
    ) -> str:
        """
            调用 pdfplumber 将pdf转换为markdown

            Args:
                file_name: 文件名
                file_base64: PDF文件的base64编码

            Returns:
                Markdown格式的文档内容
        """
        
        try:
            import pdfplumber
        except ImportError:
            print("❌ 错误: 缺少 pdfplumber 库。请安装: pip install pdfplumber")
            return None

        # --- Nested Helper Function 1: Convert table data to Markdown format ---
        def table_to_markdown(table: list[list[str | None]]) -> str:
            """
            将表格数据转换为Markdown表格格式。
            """
            if not table or not table[0]:
                return ""

            markdown_rows = []
            header = table[0]
            # Clean up header cells: replace newlines with space
            header_cells = [str(cell).replace('\n', ' ') if cell else "" for cell in header]
            markdown_rows.append("| " + " | ".join(header_cells) + " |")
            markdown_rows.append("| " + " | ".join(["---"] * len(header)) + " |")

            for row in table[1:]:
                if row:
                    # Clean up data cells
                    cells = [str(cell).replace('\n', ' ') if cell else "" for cell in row]
                    # Ensure row length matches header length, padding with empty strings
                    while len(cells) < len(header):
                        cells.append("")
                    markdown_rows.append("| " + " | ".join(cells[:len(header)]) + " |")

            return '\n'.join(markdown_rows)

        # --- Nested Helper Function 2: Extract and order content from a single page ---
        def extract_page_content_ordered(page: pdfplumber.page.Page) -> list[dict]:
            """
            按照Y坐标顺序提取页面内容（表格和文本），并转换为 Markdown/Text。
            """
            content_items = []

            # 1. Get all tables and their positions
            tables = page.find_tables()
            table_regions = []

            for table in tables:
                bbox = table.bbox  # (x0, y0, x1, y1)
                table_data = table.extract()
                if table_data:
                    table_regions.append({
                        'type': 'table',
                        'y0': bbox[1],  # Top Y coordinate
                        'y1': bbox[3],  # Bottom Y coordinate
                        'bbox': bbox,
                        'data': table_data
                    })

            # 2. Get all words and their positions
            words = page.extract_words()

            if not words:
                # If no words, just return tables
                for region in sorted(table_regions, key=lambda x: x['y0']):
                    content_items.append({
                        'type': 'table',
                        'content': table_to_markdown(region['data'])
                    })
                return content_items

            # 3. Group words by line (based on Y coordinate)
            lines = []
            current_line = []
            current_top = None
            line_tolerance = 3  # Y coordinate tolerance
            sorted_words = sorted(words, key=lambda w: (w['top'], w['x0']))

            for word in sorted_words:
                if current_top is None or abs(word['top'] - current_top) <= line_tolerance:
                    if current_top is None:
                        current_top = word['top']
                    current_line.append(word)
                else:
                    if current_line:
                        lines.append({
                            'y0': current_top,
                            'y1': current_line[0]['bottom'],
                            'words': current_line
                        })
                    current_top = word['top']
                    current_line = [word]

            if current_line:
                lines.append({
                    'y0': current_top,
                    'y1': current_line[0]['bottom'],
                    'words': current_line
                })

            # 4. Filter text lines inside table regions
            def is_in_table(line_y0, line_y1):
                for table_region in table_regions:
                    # Check for vertical overlap between text line and table region
                    if line_y0 < table_region['y1'] and line_y1 > table_region['y0']:
                        return True
                return False

            # 5. Merge all content (tables and non-table text)
            all_items = []

            # Add tables
            for region in table_regions:
                all_items.append({
                    'type': 'table',
                    'y0': region['y0'],
                    'content': table_to_markdown(region['data'])
                })

            # Add non-table text lines (grouped into paragraphs)
            text_lines = [line for line in lines if not is_in_table(line['y0'], line['y1'])]

            if text_lines:
                current_paragraph = []
                current_y0 = text_lines[0]['y0'] if text_lines else 0
                paragraph_gap = 15  # Paragraph spacing threshold

                for i, line in enumerate(text_lines):
                    # Join words in the line, sorted by x0
                    line_text = ' '.join([w['text'] for w in sorted(line['words'], key=lambda w: w['x0'])])

                    is_new_paragraph = False
                    if i > 0:
                        prev_line = text_lines[i-1]
                        gap = line['y0'] - prev_line['y1']
                        if gap > paragraph_gap:
                            is_new_paragraph = True
                    
                    if is_new_paragraph:
                        # End previous paragraph
                        if current_paragraph:
                            all_items.append({
                                'type': 'text',
                                'y0': current_y0,
                                'content': '\n'.join(current_paragraph)
                            })
                        # Start new paragraph
                        current_paragraph = [line_text]
                        current_y0 = line['y0']
                    elif i == 0:
                        current_paragraph.append(line_text)
                    else:
                        current_paragraph.append(line_text)

                # Add the last paragraph
                if current_paragraph:
                    all_items.append({
                        'type': 'text',
                        'y0': current_y0,
                        'content': '\n'.join(current_paragraph)
                    })

            # 6. Sort all content by Y coordinate
            all_items.sort(key=lambda x: x['y0'])

            return all_items


        # --- Main Conversion Logic (from Base64 data) ---
        temp_pdf = None
        pdf_path = None
        
        print("📄 正在从Base64数据解码并写入临时文件...")

        try:
            # Base64 解码
            pdf_bytes = base64.b64decode(file_base64)

            # 写入临时文件
            temp_pdf_file = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
            temp_pdf_file.write(pdf_bytes)
            temp_pdf_file.close()
            pdf_path = temp_pdf_file.name
            temp_pdf = temp_pdf_file # Keep reference for cleanup

            print(f"📄 正在使用 pdfplumber 解析PDF文件: {pdf_path}")
            
            # 解析PDF
            markdown_content = []

            with pdfplumber.open(pdf_path) as pdf:
                for i, page in enumerate(pdf.pages):
                    if i > 0:
                        # Add a page break marker for better separation
                        markdown_content.append("--- Page Break ---\n") 
                    
                    # Use the nested helper function
                    page_items = extract_page_content_ordered(page) 
                    
                    for item in page_items:
                        if item['content']:
                            markdown_content.append(item['content'])

            # 合并内容
            final_content = "\n\n".join(markdown_content)


            return final_content

        except Exception as e:
            print(f"❌ 转换失败: {str(e)}")
            return None
        

    async def process_document(
            self,
            file_name: str,
            file_base64: str,
        ) -> str:
        """
            将pdf转换为markdown

            Args:
                file_name: 文件名
                file_base64: PDF文件的base64编码

            Returns:
                Markdown格式的文档内容
        """
        try:
            final_content = await self.process_document_by_pdfplumber(
                file_name=file_name,
                file_base64=file_base64,
            )

            if len(final_content) < 800:
                final_content = await self.process_document_by_ocr(
                    file_name=file_name,
                    file_base64=file_base64,
                )
            
            return final_content
        except Exception as e:
            print(f"❌ 转换失败: {str(e)}")
            return None
            



async def main():
    default_base64_filename = "丁涛-简版征信(24-10-15).txt"
    script_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))+"/test"

    default_base64_path = os.path.join(script_dir, default_base64_filename)

    # 读取 Base64
    with open(default_base64_path, 'r', encoding='utf-8') as f:
        file_base64 = f.read().strip()

    documentService = DocumentService()

    # 等待异步执行
    final_content = await documentService.process_document_by_pdfplumber(
        file_name=None,
        file_base64=file_base64,
    )

    # 输出文件
    default_output_filename = "document_output.md"
    default_output_path = os.path.join(script_dir, default_output_filename)

    with open(default_output_path, 'w', encoding='utf-8') as f:
        f.write(final_content)

    print(f"✅ 转换成功! 输出文件: {default_output_path}")
    print(f"   文件大小: {os.path.getsize(default_output_path) / 1024:.2f} KB")


if __name__ == '__main__':
    asyncio.run(main())