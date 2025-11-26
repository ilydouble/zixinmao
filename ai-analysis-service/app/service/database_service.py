#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
大数据分析数据库服务
负责big_data表的数据存储和查询操作
不再使用
"""
import sys
from pathlib import Path
# 添加项目根目录到 sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import json
import pymysql
from loguru import logger
from typing import Optional
from models.bigdata_model import BigDataResponse
from config.settings import settings


def get_database_connection(use_database=True):
    """获取数据库连接"""
    if use_database:
        return pymysql.connect(
            host=settings.db.host,
            port=settings.db.port,
            user=settings.db.user,
            password=settings.db.password,
            database=settings.db.database,
            charset=settings.db.charset,
            autocommit=True
        )
    else:
        # 不指定数据库，用于创建数据库
        return pymysql.connect(
            host=settings.db.host,
            port=settings.db.port,
            user=settings.db.user,
            password=settings.db.password,
            charset=settings.db.charset,
            autocommit=True
        )


class DatabaseService:
    """数据库服务类"""

    def __init__(self):
        """
        初始化数据库服务
        """
        self._init_database()
    
    def _init_database(self):
        """初始化数据库和表结构"""
        try:
            # 第一步：连接MySQL服务器（不指定数据库）
            connection = get_database_connection(use_database=False)
            cursor = connection.cursor()

            # 创建数据库（如果不存在）
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {settings.db.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")

            cursor.close()
            connection.close()

            # 第二步：连接到指定数据库并创建表
            connection = get_database_connection(use_database=True)
            cursor = connection.cursor()

            # 创建big_data表
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS big_data (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL COMMENT '姓名',
                mobile_no VARCHAR(20) NOT NULL COMMENT '手机号',
                id_card VARCHAR(20) NOT NULL COMMENT '身份证号',
                api_data JSON COMMENT 'API响应数据',
                create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                INDEX idx_query (name, mobile_no, id_card)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='大数据分析缓存表'
            """
            cursor.execute(create_table_sql)

            cursor.close()
            connection.close()
            logger.info("数据库初始化完成")

        except Exception as e:
            logger.error("数据库初始化失败", exception=e)
    
    def query_data_from_db(self, name: str, mobile_no: str, id_card: str) -> Optional[BigDataResponse]:
        """
        从big_data表查询数据

        Args:
            name: 姓名
            mobile_no: 手机号
            id_card: 身份证号

        Returns:
            BigDataResponse对象，如果没有数据则返回None
        """
        try:
            connection = get_database_connection()
            cursor = connection.cursor()

            query_sql = """
            SELECT api_data FROM big_data
            WHERE name = %s AND mobile_no = %s AND id_card = %s
            ORDER BY create_time DESC LIMIT 1
            """
            cursor.execute(query_sql, (name, mobile_no, id_card))
            result = cursor.fetchone()

            cursor.close()
            connection.close()

            if result:
                logger.info(f"big_data表中缓存数据命中: {name}, {mobile_no}, {id_card}")
                api_data = json.loads(result[0])
                return api_data
            else:
                logger.info(f"big_data表中缓存数据未命中: {name}, {mobile_no}, {id_card}")
                return None

        except Exception as e:
            logger.error(f"数据查询失败 - 错误: {e}")
            return None
    
    def save_data_to_db(self, name: str, mobile_no: str, id_card: str, api_data: dict):
        """
        保存数据到big_data表
        
        Args:
            name: 姓名
            mobile_no: 手机号
            id_card: 身份证号
            api_data: API响应数据
        """
        try:
            connection = get_database_connection()
            cursor = connection.cursor()
            
            insert_sql = """
            INSERT INTO big_data (name, mobile_no, id_card, api_data) 
            VALUES (%s, %s, %s, %s)
            """
            cursor.execute(insert_sql, (name, mobile_no, id_card, json.dumps(api_data, ensure_ascii=False)))
            
            cursor.close()
            connection.close()
            logger.info(f"数据插入成功 - big_data, 记录数: 1")

        except Exception as e:
            logger.error("数据插入失败 - big_data", exception=e)
    

