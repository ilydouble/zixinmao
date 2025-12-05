#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF to Base64 Converter Script
将PDF文件转换为base64编码数据，输出文件以输入PDF的名称命名
"""

import os
import sys
import base64
from pathlib import Path


def pdf_to_base64(pdf_file_path):
    """
    将PDF文件转换为base64编码
    
    Args:
        pdf_file_path (str): PDF文件的路径
    
    Returns:
        str: base64编码的字符串
    """
    try:
        with open(pdf_file_path, 'rb') as pdf_file:
            pdf_data = pdf_file.read()
            base64_data = base64.b64encode(pdf_data).decode('utf-8')
            return base64_data
    except FileNotFoundError:
        print(f"错误: 文件不存在 - {pdf_file_path}")
        return None
    except Exception as e:
        print(f"错误: 转换失败 - {str(e)}")
        return None


def save_base64_to_file(base64_data, output_file_path):
    """
    将base64数据保存到文件
    
    Args:
        base64_data (str): base64编码的字符串
        output_file_path (str): 输出文件的路径
    
    Returns:
        bool: 是否保存成功
    """
    try:
        with open(output_file_path, 'w', encoding='utf-8') as f:
            f.write(base64_data)
        return True
    except Exception as e:
        print(f"错误: 保存文件失败 - {str(e)}")
        return False


def convert_pdf_to_base64(pdf_file_path, output_dir=None):
    """
    转换PDF文件为base64并保存

    Args:
        pdf_file_path (str): PDF文件的路径
        output_dir (str, optional): 输出目录，默认为PDF文件所在目录

    Returns:
        bool: 是否转换成功
    """
    # 转换相对路径为绝对路径
    if not os.path.isabs(pdf_file_path):
        pdf_file_path = os.path.join(os.getcwd(), pdf_file_path)

    # 检查文件是否存在
    if not os.path.exists(pdf_file_path):
        print(f"错误: 文件不存在 - {pdf_file_path}")
        return False

    # 检查文件是否为PDF
    if not pdf_file_path.lower().endswith('.pdf'):
        print(f"错误: 文件不是PDF格式 - {pdf_file_path}")
        return False

    # 确定输出目录
    if output_dir is None:
        output_dir = os.path.dirname(pdf_file_path)

    # 确保输出目录不为空
    if not output_dir:
        output_dir = os.getcwd()

    os.makedirs(output_dir, exist_ok=True)
    
    # 获取PDF文件名（不含扩展名）
    pdf_name = Path(pdf_file_path).stem
    output_file_path = os.path.join(output_dir, f"{pdf_name}.txt")
    
    print(f"正在转换: {pdf_file_path}")
    
    # 转换PDF为base64
    base64_data = pdf_to_base64(pdf_file_path)
    if base64_data is None:
        return False
    
    # 保存base64数据
    if save_base64_to_file(base64_data, output_file_path):
        print(f"转换成功! 输出文件: {output_file_path}")
        print(f"Base64数据长度: {len(base64_data)} 字符")
        return True
    else:
        return False


if __name__ == "__main__":
    file_name = "丁涛-简版征信(24-10-15).pdf"
    if len(sys.argv) < 2:
        # 如果没有提供参数，使用默认的PDF文件
        script_dir = os.path.dirname(os.path.abspath(__file__))
        default_pdf = os.path.join(script_dir, file_name)
        
        print("使用方法:")
        print(f"  python {os.path.basename(__file__)} <pdf文件路径> [输出目录]")
        print(f"\n示例:")
        print(f"  python {os.path.basename(__file__)} {file_name}")
        print(f"  python {os.path.basename(__file__)} /path/to/file.pdf /path/to/output")
        print("\n" + "="*50)
        
        if os.path.exists(default_pdf):
            print(f"\n使用默认PDF文件: {default_pdf}")
            convert_pdf_to_base64(default_pdf)
        else:
            print(f"\n未找到默认PDF文件: {default_pdf}")
    else:
        pdf_path = sys.argv[1]
        output_directory = sys.argv[2] if len(sys.argv) > 2 else None
        convert_pdf_to_base64(pdf_path, output_directory)

