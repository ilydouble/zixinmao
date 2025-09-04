import sys
from pathlib import Path
# 添加项目根目录到 sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import json
import time
import httpx
from typing import Dict, Any, Optional
from loguru import logger

from config.settings import settings
from utils.prompts import get_prompt_template
from utils.log_manager import algorithm_logger


class AIAnalysisService:
    """AI分析服务"""
    
    def __init__(self):
        self.api_url = settings.ai.api_url
        self.api_key = settings.ai.api_key
        self.timeout = settings.ai.api_timeout
    
    async def analyze_document(
        self,
        file_base64: str,
        mime_type: str,
        report_type: str,
        custom_prompt: Optional[str] = None,
        request_id: str = None
    ) -> Dict[str, Any]:
        """
        分析文档
        
        Args:
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
            # 获取提示词
            prompt = get_prompt_template(report_type, custom_prompt)
            
            # 构建请求数据
            request_data = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": file_base64
                                }
                            },
                            {
                                "text": prompt
                            }
                        ]
                    }
                ]
            }
            
            logger.info(f"开始调用AI API分析文档, request_id: {request_id}")
            
            # 调用AI API
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    str(self.api_url),
                    json=request_data,
                    headers={
                        'Content-Type': 'application/json'
                    },
                    params={
                        'key': self.api_key
                    }
                )
            
            processing_time = time.time() - start_time
            
            if response.status_code == 200:
                response_data = response.json()
                
                if response_data.get('candidates') and len(response_data['candidates']) > 0:
                    analysis_text = response_data['candidates'][0]['content']['parts'][0]['text']
                    
                    logger.info(f"AI分析完成, request_id: {request_id}, "
                              f"结果长度: {len(analysis_text)}, "
                              f"处理时间: {processing_time:.2f}s")

                    # 尝试解析JSON结果
                    try:
                        analysis_result = json.loads(analysis_text)
                        result = {
                            'success': True,
                            'analysis_result': analysis_result,
                            'processing_time': processing_time,
                            'raw_text': analysis_text
                        }

                        # 记录成功的算法调用日志
                        if settings.log.algorithm_enable and request_id:
                            await algorithm_logger.log_request_complete(request_id, result, processing_time)

                        return result
                    except json.JSONDecodeError as e:
                        logger.warning(f"AI返回结果不是有效JSON, request_id: {request_id}, error: {e}")
                        # 如果不是JSON格式，尝试提取和清理
                        cleaned_result = self._extract_json_from_text(analysis_text)
                        if cleaned_result:
                            return {
                                'success': True,
                                'analysis_result': cleaned_result,
                                'processing_time': processing_time,
                                'raw_text': analysis_text
                            }
                        else:
                            # 返回文本结果
                            return {
                                'success': True,
                                'analysis_result': {
                                    'raw_text': analysis_text,
                                    'summary': analysis_text[:500] + '...' if len(analysis_text) > 500 else analysis_text,
                                    'parse_error': 'AI返回结果不是有效的JSON格式'
                                },
                                'processing_time': processing_time,
                                'raw_text': analysis_text
                            }
                else:
                    raise Exception('AI API返回数据格式异常：没有candidates')
            else:
                raise Exception(f'AI API调用失败：HTTP {response.status_code}, {response.text}')
                
        except httpx.TimeoutException:
            processing_time = time.time() - start_time
            error_msg = f'AI API调用超时，处理时间: {processing_time:.2f}s'
            logger.error(f"{error_msg}, request_id: {request_id}")
            return {
                'success': False,
                'error_message': error_msg,
                'processing_time': processing_time
            }
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

            return result
    
    def _extract_json_from_text(self, text: str) -> Optional[Dict[str, Any]]:
        """
        从文本中提取JSON
        
        Args:
            text: 包含JSON的文本
        
        Returns:
            提取的JSON对象或None
        """
        try:
            # 尝试找到JSON部分
            start_idx = text.find('{')
            end_idx = text.rfind('}')
            
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_text = text[start_idx:end_idx + 1]
                return json.loads(json_text)
        except Exception as e:
            logger.warning(f"无法从文本中提取JSON: {e}")
        
        return None
    
    async def health_check(self) -> Dict[str, Any]:
        """
        健康检查
        
        Returns:
            健康状态
        """
        try:
            # 简单的API连通性检查
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    str(self.api_url).replace('/generateContent', ''),
                    params={'key': self.api_key}
                )
            
            return {
                'ai_api_status': 'healthy' if response.status_code in [200, 404] else 'unhealthy',
                'api_url': self.api_url,
                'response_code': response.status_code
            }
        except Exception as e:
            return {
                'ai_api_status': 'unhealthy',
                'api_url': self.api_url,
                'error': str(e)
            }
