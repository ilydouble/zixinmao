#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
天远API服务接口
基于海之源科技定制组合包COMB86PM接口文档
"""
import sys
from pathlib import Path
# 添加项目根目录到 sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import json
import time
import base64
import requests
from loguru import logger
from typing import Optional, Dict, Any, List
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes
from datetime import datetime

from models.basemodel import *
from models.FLXG0V4B import *
from models.FLXG3D56 import *
from models.FLXG54F5 import *
from models.FLXG0687 import *
from models.FLXG9687 import *
from models.IVYZ5733 import *
from models.JRZQ0A03 import *
from models.JRZQ8203 import *
from models.YYSY6F2E import *
from .parser_service import parse_api_responses
from config.settings import settings



class TianyuanApiService:
    """天远API服务类"""

    def __init__(self):
        """
        初始化API服务

        Args:
            app_id: 应用ID
            app_secret: 应用密钥
            base_url: API基础URL
        """
        self.app_id = settings.tianyuan.app_id
        self.app_secret = settings.tianyuan.app_secret
        self.base_url = settings.tianyuan.base_url

    def encrypt_data(self, data: str) -> str:
        """
        AES-128-CBC加密数据
        
        Args:
            data: 待加密的数据
            
        Returns:
            Base64编码的加密数据
        """
        key = bytes.fromhex(self.app_secret)
        iv = get_random_bytes(16)
        cipher = AES.new(key, AES.MODE_CBC, iv)
        padded_data = pad(data.encode('utf-8'), AES.block_size)
        encrypted_data = cipher.encrypt(padded_data)
        return base64.b64encode(iv + encrypted_data).decode('utf-8')
    
    def decrypt_data(self, encrypted_data: str) -> str:
        """
        AES-128-CBC解密数据
        
        Args:
            encrypted_data: Base64编码的加密数据
            
            
        Returns:
            解密后的数据
        """
        key = bytes.fromhex(self.app_secret)
        encrypted_bytes = base64.b64decode(encrypted_data)
        iv = encrypted_bytes[:16]
        ciphertext = encrypted_bytes[16:]
        cipher = AES.new(key, AES.MODE_CBC, iv)
        padded_data = cipher.decrypt(ciphertext)
        return unpad(padded_data, AES.block_size).decode('utf-8')
    
    def query_combined_package_with_raw_data(self, api_code: str, params: COMB86PMRequest):
        """
        发送API请求并返回解析后的数据和原始数据

        Args:
            api_code: API接口代码
            params: 请求参数

        Returns:
            tuple: (解析后的API响应元组, 原始API数据字典)
        """
        # 加密参数
        params_dict = params.model_dump()
        params_json = json.dumps(params_dict, ensure_ascii=False)
        encrypted_data = self.encrypt_data(params_json)

        # 构建请求
        headers = {
            'Content-Type': 'application/json',
            'Access-Id': self.app_id
        }

        url = f"{self.base_url}/api/v1/{api_code}"
        request_data = {'data': encrypted_data, 'options': {'json': True}}

        # 发送请求
        start_time = time.time()
        response = requests.post(url, json=request_data, headers=headers, timeout=30)
        elapsed_time = (time.time() - start_time) * 1000

        logger.info(f"API响应信息 - 状态码: {response.status_code}, 耗时: {elapsed_time:.2f}ms")

        if response.status_code != 200:
            raise Exception(f"HTTP请求失败: {response.status_code}, {response.text}")

        # 解析响应
        try:
            response_json = response.json()
            logger.debug(f"原始响应: {json.dumps(response_json, ensure_ascii=False, indent=2)}")

            # 检查响应格式
            if 'code' not in response_json:
                logger.warning("直接返回业务数据，非标准格式")
                return None, None

            # 标准格式处理
            comb86pmResponse = COMB86PMResponse(**response_json)

            logger.info(f"API响应码: {comb86pmResponse.code}, API消息: {comb86pmResponse.message}")

            if comb86pmResponse.code != 0:
                logger.error(f"API错误: {comb86pmResponse.message}")
                return None, None

            if not comb86pmResponse.data:
                logger.warning("无加密数据返回")
                return None, None

            # 解密数据
            try:
                decrypted_data = self.decrypt_data(comb86pmResponse.data)
                result_data = json.loads(decrypted_data)

                logger.info("数据解密成功")
                # filename = f"data/{params.name}-{datetime.now().strftime("%Y%m%d%H%M%S")}.json"
                # with open(filename, 'w', encoding='utf-8') as f:
                #     json.dump(result_data, f, ensure_ascii=False, indent=2)
                # logger.info(f"数据已保存到文件: {filename}")
                logger.debug(f"解密后的数据: {json.dumps(result_data, ensure_ascii=False, indent=2)}")

                # 使用公共解析函数
                parsed_result = parse_api_responses(result_data)
                return parsed_result, result_data

            except Exception as e:
                logger.error("数据解密失败", exception=e)
                return None, None

        except json.JSONDecodeError:
            logger.error(f"响应不是JSON格式: {response.text}")
            return None, None

   