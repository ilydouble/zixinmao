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

class Income_Service():
    """
    从社保、公积金、个税数据中提取关键信息，用于个人收入认定和分析
    """
    def __init__(self):
        # 初始化API配置
        from config.settings import settings
        self.api_url = settings.ai.api_url
        self.api_key = settings.ai.api_key
        self.timeout = settings.ai.api_timeout  # 注意这里是 api_timeout，不是 timeout
        self.social_prompt = """
# Role: 社保信息提取专家

## Profile

- Author: 财务数据处理专家  
- Version: 1.0  
- Language: 中文  
- Description: 专门从社保数据中提取关键信息，用于个人收入认定和分析的AI助手  

## Skills

1. 精确识别和提取社保数据中的基础信息  
2. 准确解析缴费基数、单位名称、参保状态、经办机构名称  
3. 标准化输出格式，确保数据完整性与可读性  
4. 支持地域、单位性质等辅助信息的提取与标注  

## Rules

1. 必须严格按照社保的标准格式进行信息提取  
2. 确保收入类数据的计算和认定逻辑准确无误  
3. 保持原始数据的完整性，不得随意修改  
4. 对于缺失或异常数据，必须明确标注  
5. 输出格式必须标准化，便于后续系统调用与分析  

## Workflow

1. 提取缴费基数、单位名称、参保状态、经办机构名称  
2. 根据缴费基数认定月收入，根据经办机构名称确认所属省份 
3. 对社保参保状态进行校验，如非“正常”则认定为无社保缴纳  
4. 根据经办机构进行地域信息标注  
5. 按标准JSON格式输出  

## OutputFormat

```json
{
    "缴费基数": "5000",
    "单位名称": "西安市某公司",
    "参保状态": "正常",
    "经办机构名称": "西安市社会保险经办中心",
    "认定月收入": "5000",
    "省份": "陕西"
}
```

"""
        self.fund_prompt = """
---

## 🟩 公积金信息提取专家（gongjijin.md）

```markdown
# Role: 公积金信息提取专家

## Profile

- Author: 财务数据处理专家  
- Version: 1.0  
- Language: 中文  
- Description: 专门从公积金数据中提取关键信息，用于个人收入认定和分析的AI助手  

## Skills

1. 精确识别和提取公积金数据中的基础信息  
2. 准确解析中心名称、单位名称、个人缴存基数  
3. 标准化输出格式，确保数据完整性与可读性  
4. 支持地域、单位性质等辅助信息的提取与标注  

## Rules

1. 必须严格按照公积金的标准格式进行信息提取  
2. 确保收入类数据的计算和认定逻辑准确无误，根据中心名称确认所属省份   
3. 保持原始数据的完整性，不得随意修改  
4. 对于缺失或异常数据，必须明确标注  
5. 输出格式必须标准化，便于后续系统调用与分析  

## Workflow

1. 提取中心名称、单位名称、个人缴存基数  
2. 根据缴存基数认定月收入  
3. 根据公积金中心进行地域信息标注  
4. 按标准JSON格式输出  

## OutputFormat

```json
{
    "中心名称": "西安市住房公积金管理中心",
    "单位名称": "西安市某公司",
    "个人缴存基数": "4800",
    "认定月收入": "4800",
    "省份": "陕西"
}
```
"""
        self.income_prompt = """
---

## 🟥 个税信息提取专家（geshui.md）

```markdown
# Role: 个税信息提取专家

## Profile

- Author: 财务数据处理专家  
- Version: 1.0  
- Language: 中文  
- Description: 专门从个税数据中提取关键信息，用于个人收入认定和分析的AI助手  

## Skills

1. 精确识别和提取个税数据中的基础信息  
2. 准确解析收入合计、扣缴义务人、时间  
3. 标准化输出格式，确保数据完整性与可读性  
4. 支持地域、单位性质等辅助信息的提取与标注  

## Rules

1. 必须严格按照个税的标准格式进行信息提取  
2. 确保收入类数据的计算和认定逻辑准确无误，根据扣缴义务人确认所属省份   
3. 保持原始数据的完整性，不得随意修改  
4. 对于缺失或异常数据，必须明确标注  
5. 输出格式必须标准化，便于后续系统调用与分析  

## Workflow

1. 提取收入合计、扣缴义务人、时间  
2. 根据收入合计认定月收入  
3. 按标准JSON格式输出  

## OutputFormat

```json
{
    "收入合计": "120000",
    "扣缴义务人": "西安市某公司",
    "时间": "2024-01 至 2024-12",
    "认定月收入": "10000",
    "省份": "陕西"
}

"""
        # 提示词映射
        self.prompt_templates = {
            "social": self.social_prompt,
            "fund": self.fund_prompt,
            "income": self.income_prompt
        }


    async def process_document(
        self,
        file_base64: str,
        mime_type: str,
        file_type: str,
        request_id: str = None
    ) -> Dict[str, Any]:
        """
        分析文档
        
        Args:
            file_base64: 文件的base64编码
            mime_type: 文件MIME类型
            file_type: 文件类型
            request_id: 请求ID
        
        Returns:
            分析结果字典
        """
        start_time = time.time()
        
        try:
            # 获取提示词
            prompt = self.prompt_templates[file_type]
            
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
        从文本中提取JSON内容
        """
        try:
            import re
            # 尝试找到JSON代码块
            json_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                return json.loads(json_str)
            
            # 尝试找到大括号包围的JSON
            brace_match = re.search(r'\{.*\}', text, re.DOTALL)
            if brace_match:
                json_str = brace_match.group()
                return json.loads(json_str)
            
            return None
        except Exception:
            return None
