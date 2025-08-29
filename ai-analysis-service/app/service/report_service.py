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

from .tianyuan_api_service import TianyuanApiService
from .database_service import DatabaseService
from pydantic import BaseModel
from models.basemodel import *
from utils.response_builder import ResponseBuilder
from config.settings import settings
from utils.log_manager import algorithm_logger

class ReportService:
    """个人征信报告生成"""
    
    def __init__(self):
        self.dify_api_url = settings.dify.api_base_url
        self.dify_api_key = settings.dify.api_key
        self.dify_timeout = settings.dify.api_timeout
        self.ai_api_url = settings.ai.api_url
        self.ai_api_key = settings.ai.api_key


    async def generate_credit_analysis(self, name: str, document: str) -> Tuple[bool, str]:
        """生成个人征信报告"""
        headers = {
            'Authorization': f'Bearer {self.dify_api_key}',
            'Content-Type': 'application/json'
        }
        try:
            url = f"{self.dify_api_url}/v1/workflows/run"
            data = {
                "inputs": {
                    "name": name,
                    "document": document
                },
                "response_mode": "blocking",
                "user": "gradio-user"
            }

            # 设置较长的超时时间（15分钟）以适应Dify服务的处理时间
            response = requests.post(url, headers=headers, json=data, timeout=self.dify_timeout)

            if response.status_code == 200:
                result = response.json()
                if result.get('data', {}).get('status') == 'succeeded':
                    outputs = result.get('data', {}).get('outputs', {})
                    return True, outputs.get('text', '报告生成成功但内容为空')
                else:
                    error_msg = result.get('data', {}).get('error', '未知错误')
                    return False, f"生成失败: {error_msg}"
            else:
                return False, f"HTTP错误: {response.status_code} - {response.text}"
        except requests.exceptions.Timeout:
            return False, "请求超时: Dify服务处理时间较长，请稍后重试"
        except requests.exceptions.RequestException as e:
            return False, f"网络请求异常: {str(e)}"
        except Exception as e:
            return False, f"请求异常: {str(e)}"


    async def generate_big_data_analysis(self, name: str, id_card: str, mobile_no: str) -> Tuple[bool, str]:
        """
        执行大数据分析的核心业务逻辑

        Args:
            big_data: 大数据分析请求参数

        Returns:
            tuple: (response_object, error_message)
        """
        try:
            # 从配置文件获取API配置
            api_code = settings.tianyuan.api_code

            # 创建API服务实例和数据库服务实例
            api_service = TianyuanApiService()
            db_service = DatabaseService()

            # 生成auth_date：当天日期到一年后的日期范围
            today = datetime.now()
            next_year = today + timedelta(days=365)
            auth_date = f"{today.strftime('%Y%m%d')}-{next_year.strftime('%Y%m%d')}"

            # 请求参数
            params = COMB86PMRequest(
                mobile_no=mobile_no,
                id_card=id_card,
                name=name,
                auth_date=auth_date
            )

            # 初始化变量
            FLXG9687 = FLXG0687 = FLXG54F5 = FLXG0V4B = JRZQ0A03 = JRZQ8203 = FLXG3D56 = IVYZ5733 = YYSY6F2E = None

            try:
                logger.info("开始大数据分析查询流程")
                logger.debug(f"请求参数: {params.model_dump()}")

                # 主流程：首先根据姓名、身份证号和手机号从数据库服务中查询
                logger.info("缓存数据查询开始")
                cached_result = db_service.query_data_from_db(
                    params.name,
                    params.mobile_no,
                    params.id_card
                )

                if cached_result:
                    FLXG9687, FLXG0687, FLXG54F5, FLXG0V4B, JRZQ0A03, JRZQ8203, FLXG3D56, IVYZ5733, YYSY6F2E = cached_result
                else:
                    # 没有结果调用tianyuan_api_service查询，同时获取原始数据
                    logger.info("天远大数据API调用开始", params.model_dump())
                    api_result, raw_data = api_service.query_combined_package_with_raw_data(api_code, params)

                    if api_result:
                        FLXG9687, FLXG0687, FLXG54F5, FLXG0V4B, JRZQ0A03, JRZQ8203, FLXG3D56, IVYZ5733, YYSY6F2E = api_result
                        logger.info("天远大数据API调用成功")

                        # 将结果利用数据库服务存储在数据库中
                        if raw_data:
                            logger.info("天远大数据API数据结果缓存到big_data表")
                            db_service.save_data_to_db(
                                params.name,
                                params.mobile_no,
                                params.id_card,
                                raw_data
                            )
                    else:
                        logger.error("天远API调用失败，未获取到数据")

            except Exception as e:
                logger.error("大数据分析查询失败", exception=e)
                # 继续执行，使用初始化的None值

            # 使用响应构建器构建结构化响应
            logger.info("天远大数据分析开始")

            response = ResponseBuilder.build_success_response(
                mobile_no=mobile_no,
                id_card=id_card,
                name=name,
                FLXG9687=FLXG9687,
                FLXG0687=FLXG0687,
                FLXG54F5=FLXG54F5,
                FLXG0V4B=FLXG0V4B,
                JRZQ0A03=JRZQ0A03,
                JRZQ8203=JRZQ8203,
                FLXG3D56=FLXG3D56,
                IVYZ5733=IVYZ5733,
                YYSY6F2E=YYSY6F2E
            )

            logger.info("天远大数据分析完成")
            return True, response

        except Exception as e:
            logger.error("大数据分析API发生错误", exception=e)

            return False, None


    async def process_document(self, pdf_base64):
        # 构建请求数据
        request_data = {
            "contents": [
                {
                    "role": "user", 
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": "application/pdf",
                                "data": pdf_base64
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
            "key": self.ai_api_key  # TODO去掉硬编码(我取环境变量的一直不对，就这么写死了)
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
    
    async def generate_report(
        self,
        name: str,
        id_card: str,
        mobile_no: str,
        file_base64: str,
        mime_type: str,
        report_type: str,
        custom_prompt: Optional[str] = None,
        request_id: str = None
    ) -> CommonResponse:
        """
        分析文档
        
        Args:
            name: 姓名,
            id_card: 身份证号,
            mobile_no: 手机号,
            file_base64: 文件的base64编码
            mime_type: 文件MIME类型
            report_type: 报告类型
            custom_prompt: 自定义提示词
            request_id: 请求ID
        
        Returns:
            分析结果字典
        """
        start_time = time.time()
        
        try:
            logger.info(f"开始调用AI API分析文档, request_id: {request_id}")

            document = await self.process_document(pdf_base64=file_base64)
            credit_flag, credit_result = await self.generate_credit_analysis(name=name, document=document)
            big_data_flag, big_data_result = await self.generate_big_data_analysis(name=name, id_card=id_card, mobile_no=mobile_no)

            if big_data_flag:
                big_data_result_markdown = ResponseBuilder.build_success_markdown_response(big_data_result)
            else:
                big_data_result_markdown = ""
            
            merge_markdown = f"""# 个人征信综合分析报告
---

## 第一部分：个人征信报告

{credit_result}

---

## 第二部分：大数据风险分析

{big_data_result_markdown}

---


"""
            processing_time = time.time() - start_time

            logger.info(f"AI分析完成, request_id: {request_id}, "
                        f"处理时间: {processing_time:.2f}s")

            result = {
                        'success': True,
                        'analysis_result': merge_markdown,
                        'processing_time': processing_time,
                        'raw_text': None
                    }
            # 记录成功的算法调用日志
            if settings.log.algorithm_enable and request_id:
                await algorithm_logger.log_request_complete(request_id, result, processing_time)

            return CommonResponse.success(merge_markdown, "个人征信报告生成成功")
        
        except Exception as e:
            processing_time = time.time() - start_time
            error_msg = f'AI分析失败: {str(e)}'
            logger.error(f"{error_msg}, request_id: {request_id}")

            result = {
                'success': False,
                'error_message': error_msg,
                'processing_time': processing_time
            }

            # 记录失败的算法调用日志
            if settings.log.algorithm_enable and request_id:
                await algorithm_logger.log_error(request_id, "ai_analysis_error", error_msg)
                await algorithm_logger.log_request_complete(request_id, result, processing_time)

            return CommonResponse.error(f"个人征信报告生成失败: {e}", data=None)

if __name__ == '__main__':
    # 直接读取PDF文件的原生二进制数据
    with open(Path(r"D:\work\星纬算法\金融文档\代码\zixinmao\ai-analysis-service\cuiyi.pdf"), 'rb') as f:
        pdf_data = f.read()

    # 将PDF原生数据编码为base64
    pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')

    report_service = ReportService()
    report_service.process_document(pdf_base64)