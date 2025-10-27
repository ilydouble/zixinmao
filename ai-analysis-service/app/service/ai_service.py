import sys
from pathlib import Path
# 添加项目根目录到 sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import json
import time
import httpx
from typing import Dict, Any, Optional
from loguru import logger
from pydantic import ValidationError

from config.settings import settings
from utils.prompts import get_prompt_template
from utils.log_manager import algorithm_logger
from app.models.dify_model import DifyWorkflowOutput, DifyWorkflowResponse
from app.service.dify_converter import DifyToVisualizationConverter


class AIAnalysisService:
    """AI分析服务"""

    def __init__(self):
        self.api_url = settings.ai.api_url
        self.api_key = settings.ai.api_key
        self.timeout = settings.ai.api_timeout

        # PDF转Markdown服务配置
        self.pdf_to_markdown_url = "http://115.190.121.59:7860/api/process-base64"
        self.pdf_to_markdown_timeout = 120  # 2分钟超时

        # Dify工作流服务配置
        self.dify_workflow_url = "http://115.190.121.59:18080/v1/workflows/run"
        self.dify_api_key = "Bearer app-jUMXA7eLhbiNGnsE14lhLUNt"
        self.dify_timeout = 300  # 5分钟超时

    async def convert_pdf_to_markdown(
        self,
        file_base64: str,
        file_name: str,
        request_id: str = None
    ) -> str:
        """
        将PDF转换为Markdown

        Args:
            file_base64: PDF文件的base64编码
            file_name: 文件名
            request_id: 请求ID

        Returns:
            Markdown格式的文档内容
        """
        try:
            logger.info(f"📄 [PDF转Markdown] 开始转换, request_id: {request_id}, 文件: {file_name}")
            logger.info(f"📊 [PDF转Markdown] Base64长度: {len(file_base64):,} 字符")

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

                # 尝试从响应中提取markdown内容
                # 支持多种可能的字段名
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

                logger.info(f"✅ [PDF转Markdown] 转换成功, request_id: {request_id}, "
                          f"Markdown长度: {len(markdown_content):,}, "
                          f"处理时间: {processing_time:.2f}s")

                return markdown_content
            else:
                error_msg = f"PDF转Markdown服务返回错误: {response.status_code}"
                logger.error(f"❌ [PDF转Markdown] {error_msg}, 响应: {response.text[:500]}")
                raise Exception(error_msg)

        except httpx.TimeoutException:
            error_msg = f"PDF转Markdown服务超时 (>{self.pdf_to_markdown_timeout}s)"
            logger.error(f"❌ [PDF转Markdown] {error_msg}, request_id: {request_id}")
            raise Exception(error_msg)
        except Exception as e:
            error_msg = f"PDF转Markdown失败: {str(e)}"
            logger.error(f"❌ [PDF转Markdown] {error_msg}, request_id: {request_id}")
            raise Exception(error_msg)
    
    async def analyze_document(
        self,
        file_base64: Optional[str] = None,
        markdown_content: Optional[str] = None,
        mime_type: Optional[str] = None,
        report_type: str = None,
        custom_prompt: Optional[str] = None,
        request_id: str = None,
        file_name: str = "document.pdf"
    ) -> Dict[str, Any]:
        """
        分析文档

        流程：
        1. 如果提供file_base64，先调用PDF转Markdown服务
        2. 使用Markdown内容调用AI分析
        3. 返回分析结果

        Args:
            file_base64: 文件的base64编码（与markdown_content二选一）
            markdown_content: Markdown格式的文档内容（与file_base64二选一）
            mime_type: 文件MIME类型（使用file_base64时必填）
            report_type: 报告类型
            custom_prompt: 自定义提示词
            request_id: 请求ID
            file_name: 文件名

        Returns:
            分析结果字典
        """
        start_time = time.time()

        try:
            # 🆕 如果提供了file_base64，先转换为Markdown
            if file_base64 and not markdown_content:
                logger.info(f"🔄 [AI分析] 步骤1: 将PDF转换为Markdown, request_id: {request_id}")
                markdown_content = await self.convert_pdf_to_markdown(
                    file_base64=file_base64,
                    file_name=file_name,
                    request_id=request_id
                )
                logger.info(f"✅ [AI分析] PDF转Markdown完成, Markdown长度: {len(markdown_content):,}")

            # 验证必须有markdown_content
            if not markdown_content:
                raise ValueError("必须提供file_base64或markdown_content之一")

            # 🆕 步骤2: 调用Dify工作流进行AI分析
            logger.info(f"🤖 [AI分析] 步骤2: 调用Dify工作流分析, request_id: {request_id}, Markdown长度: {len(markdown_content):,}")

            # 构建Dify工作流请求数据
            dify_request_data = {
                "inputs": {
                    "text": markdown_content  # 将Markdown内容作为输入
                },
                "response_mode": "blocking",  # 阻塞模式，等待结果
                "user": request_id or "abc-123"  # 使用request_id作为用户标识
            }

            logger.info(f"📤 [Dify工作流] 开始调用, request_id: {request_id}")

            # 调用Dify工作流API
            async with httpx.AsyncClient(timeout=self.dify_timeout) as client:
                response = await client.post(
                    self.dify_workflow_url,
                    json=dify_request_data,
                    headers={
                        'Authorization': self.dify_api_key,
                        'Content-Type': 'application/json'
                    }
                )

            processing_time = time.time() - start_time

            if response.status_code == 200:
                response_data = response.json()
                logger.info(f"📥 [Dify工作流] 响应成功, request_id: {request_id}")
                logger.debug(f"📋 [Dify工作流] 响应数据: {json.dumps(response_data, ensure_ascii=False)[:500]}")

                try:
                    # 🆕 使用Pydantic模型解析完整响应
                    logger.info(f"🔄 [Dify解析] 开始使用Pydantic模型解析响应, request_id: {request_id}")
                    dify_response = DifyWorkflowResponse(**response_data)
                    logger.info(f"✅ [Dify解析] Pydantic模型解析成功, request_id: {request_id}")

                    # 提取outputs.output字段
                    outputs = dify_response.data.outputs
                    if 'output' in outputs:
                        output_data = outputs['output']
                        logger.info(f"✅ [Dify解析] 成功提取outputs.output字段, request_id: {request_id}")

                        # 使用DifyWorkflowOutput模型解析output数据
                        dify_output = DifyWorkflowOutput(**output_data)
                        logger.info(f"✅ [Dify解析] DifyWorkflowOutput模型解析成功, request_id: {request_id}")

                        # 🆕 使用转换器将Dify数据转换为可视化格式
                        logger.info(f"🔄 [数据转换] 开始转换Dify数据为可视化格式, request_id: {request_id}")
                        visualization_report = DifyToVisualizationConverter.convert(dify_output, request_id)
                        logger.info(f"✅ [数据转换] 转换完成, request_id: {request_id}")

                        # 转换为Dict保存到数据库
                        processed_result = visualization_report.model_dump(by_alias=False)

                        logger.info(f"✅ [AI分析] Dify工作流分析完成, request_id: {request_id}, 处理时间: {processing_time:.2f}s")

                        result = {
                            'success': True,
                            'analysis_result': processed_result,  # 使用转换后的可视化数据
                            'processing_time': processing_time,
                            'raw_response': response_data,  # 保存原始响应
                            'dify_task_id': dify_response.task_id,  # 保存任务ID
                            'dify_workflow_run_id': dify_response.workflow_run_id  # 保存工作流运行ID
                        }

                        # 记录成功的算法调用日志
                        if settings.log.algorithm_enable and request_id:
                            await algorithm_logger.log_request_complete(request_id, result, processing_time)

                        return result
                    else:
                        raise ValueError("Dify响应中未找到outputs.output字段")

                except ValidationError as e:
                    # Pydantic验证失败，使用降级方案
                    logger.warning(f"⚠️ [Dify解析] Pydantic模型验证失败，使用降级方案: {str(e)}, request_id: {request_id}")

                    # 降级方案：使用旧的提取逻辑
                    analysis_result = None
                    if 'data' in response_data and 'outputs' in response_data['data']:
                        outputs = response_data['data']['outputs']
                        for key in ['result', 'output', 'analysis', 'text', 'data']:
                            if key in outputs:
                                analysis_result = outputs[key]
                                logger.info(f"✅ [Dify工作流] 从outputs.{key}提取到结果")
                                break
                        if not analysis_result:
                            analysis_result = outputs
                    elif 'outputs' in response_data:
                        analysis_result = response_data['outputs']
                    else:
                        analysis_result = response_data

                    # 加工为可视化格式
                    processed_result = self._process_dify_result_for_visualization(analysis_result, request_id)

                    result = {
                        'success': True,
                        'analysis_result': processed_result,
                        'processing_time': processing_time,
                        'raw_response': response_data
                    }

                    if settings.log.algorithm_enable and request_id:
                        await algorithm_logger.log_request_complete(request_id, result, processing_time)

                    return result
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

    def _process_dify_result_for_visualization(
        self,
        dify_result: Dict[str, Any],
        request_id: str = None
    ) -> Dict[str, Any]:
        """
        加工Dify工作流返回的结果为可视化报告需要的格式
        只支持标准Dify响应格式：
        {
            "basic_info": {...},
            "loan_details": [...],
            "credit_card_details": [...],
            "query_records": [...]
        }

        Args:
            dify_result: Dify工作流返回的原始结果
            request_id: 请求ID

        Returns:
            加工后的可视化报告数据

        Raises:
            ValueError: 当数据格式不符合标准Dify格式时
        """
        logger.info(f"🔄 [数据加工] 开始处理Dify结果, request_id: {request_id}")
        logger.debug(f"📋 [数据加工] Dify结果字段: {list(dify_result.keys())}")

        # 检查是否是标准Dify格式（包含basic_info, loan_details等）
        if not self._is_standard_dify_format(dify_result):
            error_msg = f"❌ [数据加工] 数据格式不符合标准Dify格式，缺少必需字段。当前字段: {list(dify_result.keys())}"
            logger.error(error_msg)
            raise ValueError(error_msg)

        logger.info(f"✅ [数据加工] 检测到标准Dify格式，使用Pydantic模型解析")
        return self._parse_and_convert_dify_format(dify_result, request_id)



    def _is_standard_dify_format(self, data: Dict[str, Any]) -> bool:
        """
        检查数据是否是标准Dify格式

        Args:
            data: 待检查的数据

        Returns:
            是否是标准Dify格式
        """
        # 检查是否包含Dify标准字段
        required_fields = ["basic_info", "loan_details", "credit_card_details", "query_records"]
        has_required = all(field in data for field in required_fields)

        logger.debug(f"🔍 [格式检测] 检查标准Dify格式: {has_required}, 字段: {list(data.keys())}")
        return has_required

    def _parse_and_convert_dify_format(
        self,
        dify_result: Dict[str, Any],
        request_id: str = None
    ) -> Dict[str, Any]:
        """
        解析标准Dify格式并转换为可视化格式

        Args:
            dify_result: Dify工作流返回的标准格式数据
            request_id: 请求ID

        Returns:
            可视化报告数据

        Raises:
            ValidationError: 当Pydantic验证失败时
            Exception: 当转换失败时
        """
        logger.info(f"🔄 [Dify解析] 开始解析标准Dify格式, request_id: {request_id}")

        # 使用Pydantic模型解析Dify数据
        dify_output = DifyWorkflowOutput(**dify_result)
        logger.info(f"✅ [Dify解析] Pydantic模型解析成功")

        # 使用转换器转换为可视化格式
        visualization_data = DifyToVisualizationConverter.convert(dify_output, request_id)
        logger.info(f"✅ [Dify解析] 转换为可视化格式成功")

        return visualization_data

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
