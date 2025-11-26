#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
天远API服务接口
基于海之源科技定制组合包COMBHZY2接口文档
"""
import sys
from pathlib import Path
# 添加项目根目录到 sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import json
import base64
import requests
from loguru import logger
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes

from models.bigdata_model import BigDataResponse, COMBHZY2Request
from config.settings import settings



class BigdataAnalysisService:
    """天远API服务类"""

    def __init__(self):
        """
        初始化API服务

        Args:
            app_id: 应用ID
            app_secret: 应用密钥
            base_url: API基础URL
            api_code: API接口代码
        """
        self.app_id = settings.tianyuan.app_id
        self.app_secret = settings.tianyuan.app_secret
        self.base_url = settings.tianyuan.base_url
        self.api_code = settings.tianyuan.api_code

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
    
    def call_api(self, params: COMBHZY2Request) -> BigDataResponse | None:
        """
        发送API请求并返回解析后的数据

        Args:
            params: 请求参数

        Returns:
            BigDataResponse对象，失败返回None
        """
        # 将参数转换为JSON字符串并加密
        params_dict = params.model_dump()
        params_json = json.dumps(params_dict, ensure_ascii=False)
        encrypted_data = self.encrypt_data(params_json)

        # 构建请求
        headers = {
            'Content-Type': 'application/json',
            'Access-Id': self.app_id
        }

        url = f"{self.base_url}/api/v1/{self.api_code}"

        payload = {"data": encrypted_data}

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()  # 抛出HTTP错误

            response_data = response.json()
            code = response_data.get("code")

            # 业务成功才处理数据
            if code == 0 and response_data.get("data"):
                decrypted_data_str = self.decrypt_data(response_data["data"])
                decrypted_data = json.loads(decrypted_data_str)
                bigDataResponse=BigDataResponse(**decrypted_data)
                logger.info(f"✅天远大数据API调用成功 - code: {code}, result: {bigDataResponse}")
                return bigDataResponse

            # 业务失败或无数据
            logger.info(f"❌天远大数据API调用失败 - code: {code}, message: {response_data.get('message')}")
            return None

        except Exception as e:
            logger.error(f"天远大数据API调用异常: {e}")
            return None



if __name__ == "__main__":
    try:
        request = COMBHZY2Request(
            mobile_no="18391316453",
            id_card="610523199206168471",
            name="丁涛",
            authorization_url="https://7a69-zixinmao-6gze9a8pef07503b-1352083304.tcb.qcloud.la/auth_file/ogbda185lMsnyVJ6mEgWGhdwm9DE/20251120_113956_%E4%B8%81%E6%B6%9B_%E6%8E%88%E6%9D%83%E4%B9%A6.pdf"
        )
        bigdata_service = BigdataAnalysisService()
        result = bigdata_service.call_api(request)
        if result:
            logger.info(f"✅ 调用成功: {result}")
        else:
            logger.error("❌ 调用失败")
    except KeyboardInterrupt:
        print("[object Object]数据API测试被中断")