#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF报告生成服务
将HTML报告转换为PDF格式
"""

import os
import tempfile
import logging
from typing import Optional
from pathlib import Path

logger = logging.getLogger(__name__)


class PDFReportService:
    """PDF报告生成服务"""

    def __init__(self):
        """初始化PDF报告服务"""
        self.logger = logger

    async def convert_html_to_pdf(
        self,
        html_content: str,
        pdf_filename: Optional[str] = None
    ) -> bytes:
        """
        将HTML内容转换为PDF

        Args:
            html_content: HTML内容字符串
            pdf_filename: PDF文件名（可选，用于日志）

        Returns:
            PDF文件的字节内容

        Raises:
            RuntimeError: 如果转换失败
        """
        try:
            from playwright.async_api import async_playwright

            self.logger.info(f"📄 开始将HTML转换为PDF | 长度: {len(html_content):,} 字符")

            # 创建临时HTML文件
            with tempfile.NamedTemporaryFile(
                mode='w',
                suffix='.html',
                delete=False,
                encoding='utf-8'
            ) as html_file:
                html_file.write(html_content)
                html_path = html_file.name

            try:
                # 创建临时PDF文件
                with tempfile.NamedTemporaryFile(
                    suffix='.pdf',
                    delete=False
                ) as pdf_file:
                    pdf_path = pdf_file.name

                try:
                    # 使用异步Playwright转换HTML为PDF
                    async with async_playwright() as p:
                        browser = await p.chromium.launch(
                            headless=True,
                            args=[
                                "--no-sandbox",
                                "--disable-gpu",
                                "--start-maximized"
                            ]
                        )

                        # 创建上下文和页面
                        context = await browser.new_context(
                            viewport={"width": 1920, "height": 1080},
                            device_scale_factor=2
                        )
                        page = await context.new_page()

                        # 加载HTML文件
                        absolute_html_path = os.path.abspath(html_path)
                        await page.goto(f"file://{absolute_html_path}")

                        # 注入CSS以优化PDF分页
                        await page.add_style_tag(content="""
                            @media print {
                                * {
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                    visibility: visible !important;
                                }
                                body {
                                    width: 100% !important;
                                    margin: 0 !important;
                                }
                                .loan-debt-analysis,
                                .loan-debt-analysis .chart-container,
                                .loan-debt-analysis table,
                                .loan-debt-analysis * {
                                    page-break-inside: avoid !important;
                                    page-break-before: avoid !important;
                                    page-break-after: avoid !important;
                                    width: 100% !important;
                                }
                                table {
                                    page-break-inside: avoid !important;
                                    width: 100% !important;
                                }
                            }
                            @media screen {
                                body {
                                    width: 1920px;
                                    margin: 0 auto;
                                }
                            }
                        """)

                        # 等待页面加载完成
                        await page.wait_for_load_state("networkidle", timeout=5000)
                        try:
                            await page.wait_for_selector(".charts-container", state="visible", timeout=3000)
                            await page.wait_for_selector(".charts-container .chart-container", state="visible", timeout=3000)
                        except Exception:
                            # 如果选择器不存在，继续处理
                            self.logger.warning("⚠️ 页面选择器未找到，继续处理")

                        await page.wait_for_timeout(3000)

                        # 生成PDF
                        pdf_bytes = await page.pdf(
                            path=pdf_path,
                            width="508mm",
                            height="400mm",
                            margin={
                                "top": "0.5cm",
                                "right": "0.5cm",
                                "bottom": "0.5cm",
                                "left": "0.5cm"
                            },
                            print_background=True,
                            prefer_css_page_size=False,
                            landscape=False
                        )

                        await browser.close()

                    # 读取PDF文件内容
                    with open(pdf_path, 'rb') as f:
                        pdf_content = f.read()

                    self.logger.info(f"✅ PDF转换成功 | 大小: {len(pdf_content):,} 字节 | 文件: {pdf_filename or '未命名'}")
                    return pdf_content

                finally:
                    # 清理临时PDF文件
                    if os.path.exists(pdf_path):
                        os.remove(pdf_path)

            finally:
                # 清理临时HTML文件
                if os.path.exists(html_path):
                    os.remove(html_path)

        except ImportError as e:
            self.logger.error(f"❌ Playwright库未安装: {str(e)}")
            raise RuntimeError(f"Playwright库未安装，请运行: pip install playwright") from e
        except Exception as e:
            self.logger.error(f"❌ HTML转PDF失败: {str(e)}")
            raise RuntimeError(f"HTML转PDF失败: {str(e)}") from e


# 创建全局实例
pdf_report_service = PDFReportService()

