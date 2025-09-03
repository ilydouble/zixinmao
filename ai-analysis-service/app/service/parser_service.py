#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API响应数据解析工具
提供通用的API响应数据解析功能
"""

from typing import Tuple, Dict, Any
from models.basemodel import SubApiResponse
from models.FLXG0V4B import FLXG0V4BResponse
from models.FLXG3D56 import FLXG3D56Response
from models.FLXG54F5 import FLXG54F5Response
from models.FLXG0687 import FLXG0687Response
from models.FLXG9687 import FLXG9687Response
from models.IVYZ5733 import IVYZ5733Response
from models.JRZQ0A03 import JRZQ0A03Response
from models.JRZQ8203 import JRZQ8203Response
from models.YYSY6F2E import YYSY6F2EResponse
from loguru import logger


def parse_api_responses(result_data: Dict[str, Any]) -> Tuple:
    """
    解析API响应数据为结构化对象

    Args:
        result_data: API响应的原始数据字典

    Returns:
        解析后的API响应元组 (FLXG9687, FLXG0687, FLXG54F5, FLXG0V4B, JRZQ0A03, JRZQ8203, FLXG3D56, IVYZ5733, YYSY6F2E)
    """

    # 初始化所有响应变量
    FLXG9687 = FLXG0687 = FLXG54F5 = FLXG0V4B = JRZQ0A03 = JRZQ8203 = FLXG3D56 = IVYZ5733 = YYSY6F2E = None

    try:
        for item in result_data.get('responses', []):
            sub_response = SubApiResponse(**item)
            api_code = sub_response.api_code

            logger.debug(f"解析API响应: {api_code}")

            # 根据API代码解析对应的响应数据
            if api_code == "FLXG9687":
                FLXG9687 = FLXG9687Response(**sub_response.data)
            elif api_code == "FLXG0687":
                FLXG0687 = FLXG0687Response(**sub_response.data)
            elif api_code == "FLXG54F5":
                FLXG54F5 = FLXG54F5Response(**sub_response.data)
            elif api_code == "FLXG0V4B":
                FLXG0V4B = FLXG0V4BResponse(**sub_response.data)
            elif api_code == "JRZQ0A03":
                JRZQ0A03 = JRZQ0A03Response(**sub_response.data)
            elif api_code == "JRZQ8203":
                JRZQ8203 = JRZQ8203Response(**sub_response.data)
            elif api_code == "FLXG3D56":
                FLXG3D56 = FLXG3D56Response(**sub_response.data)
            elif api_code == "IVYZ5733":
                IVYZ5733 = IVYZ5733Response(**sub_response.data)
            elif api_code == "YYSY6F2E":
                YYSY6F2E = YYSY6F2EResponse(**sub_response.data)
            else:
                logger.warning(f"未知的API代码: {api_code}")

    except Exception as e:
        logger.error("解析API响应失败", exception=e)

    return FLXG9687, FLXG0687, FLXG54F5, FLXG0V4B, JRZQ0A03, JRZQ8203, FLXG3D56, IVYZ5733, YYSY6F2E


def get_api_response_summary(parsed_result: Tuple) -> Dict[str, Any]:
    """
    获取API响应摘要信息
    
    Args:
        parsed_result: 解析后的API响应元组
        
    Returns:
        包含响应摘要的字典
    """
    FLXG9687, FLXG0687, FLXG54F5, FLXG0V4B, JRZQ0A03, JRZQ8203, FLXG3D56, IVYZ5733, YYSY6F2E = parsed_result
    
    summary = {
        "total_apis": 9,
        "successful_apis": sum(1 for x in parsed_result if x is not None),
        "failed_apis": sum(1 for x in parsed_result if x is None),
        "api_status": {
            "FLXG9687": "成功" if FLXG9687 else "失败",
            "FLXG0687": "成功" if FLXG0687 else "失败", 
            "FLXG54F5": "成功" if FLXG54F5 else "失败",
            "FLXG0V4B": "成功" if FLXG0V4B else "失败",
            "JRZQ0A03": "成功" if JRZQ0A03 else "失败",
            "JRZQ8203": "成功" if JRZQ8203 else "失败",
            "FLXG3D56": "成功" if FLXG3D56 else "失败",
            "IVYZ5733": "成功" if IVYZ5733 else "失败",
            "YYSY6F2E": "成功" if YYSY6F2E else "失败"
        }
    }
    
    return summary


def get_api_code_description(api_code: str) -> str:
    """
    获取API代码的中文描述
    
    Args:
        api_code: API代码
        
    Returns:
        API的中文描述
    """
    descriptions = {
        "FLXG9687": "电诈风险预警",
        "FLXG0687": "反赌反诈",
        "FLXG54F5": "手机号码风险",
        "FLXG0V4B": "个人司法涉诉(详版)",
        "JRZQ0A03": "借贷意向",
        "JRZQ8203": "借贷行为", 
        "FLXG3D56": "特殊名单",
        "IVYZ5733": "单人婚姻",
        "YYSY6F2E": "运营商三要素(高级版)"
    }
    
    return descriptions.get(api_code, f"未知API: {api_code}")
