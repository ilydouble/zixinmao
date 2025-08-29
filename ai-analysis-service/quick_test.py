#!/usr/bin/env python3
"""
AI分析服务综合测试脚本
"""

import base64
import json
import asyncio
import httpx
from pathlib import Path
import time


async def quick_test():
    """综合测试AI分析服务"""

    print("🚀 AI分析服务综合测试")
    print("=" * 50)
    
    # 检查PDF文件
    pdf_file = Path("cuiyi.pdf")
    if not pdf_file.exists():
        print("❌ 未找到cuiyi.pdf文件")
        return False
    
    print(f"📄 找到PDF文件: {pdf_file}")
    print(f"📊 文件大小: {pdf_file.stat().st_size / 1024:.1f} KB")
    
    # 读取PDF文件
    with open(pdf_file, "rb") as f:
        pdf_content = f.read()
    
    file_base64 = base64.b64encode(pdf_content).decode('utf-8')
    print(f"🔄 base64编码长度: {len(file_base64)} 字符")
    
    with open("cuiyi.txt", 'w', encoding='utf-8') as f:
        json.dump(file_base64, f, ensure_ascii=False, indent=2)

    # 测试征信分析（简版和详版，都使用cuiyi.pdf）
    test_cases = [
        {"type": "simple", "name": "简版征信分析"},
        {"type": "detail", "name": "详版征信分析"}
    ]
    
    service_url = "http://38.60.251.79:8002"
    
    async with httpx.AsyncClient(timeout=300) as client:
        # 健康检查
        print(f"\n🏥 检查服务状态...")
        try:
            health_response = await client.get(f"{service_url}/health")
            if health_response.status_code == 200:
                print("✅ 服务运行正常")
            else:
                print(f"❌ 服务异常: {health_response.status_code}")
                return False
        except Exception as e:
            print(f"❌ 无法连接服务: {e}")
            print("💡 请确保服务已启动: python run.py")
            return False
        
        # 测试队列功能
        print(f"\n📋 测试队列功能...")
        task_ids = []

        for i, test_case in enumerate(test_cases, 1):
            print(f"\n{i}️⃣ 提交任务: {test_case['name']} ({test_case['type']})")

            request_data = {
                "file_base64": file_base64,
                "mime_type": "application/pdf",
                "report_type": test_case['type']
            }

            try:
                response = await client.post(f"{service_url}/analyze", json=request_data)

                if response.status_code == 200:
                    result = response.json()
                    task_id = result['task_id']
                    task_ids.append((task_id, test_case))

                    print(f"✅ 任务已提交: {task_id[:8]}...")
                    print(f"📍 队列位置: {result.get('queue_position', '未知')}")
                else:
                    print(f"❌ 提交失败: {response.status_code}")
                    print(f"📄 错误: {response.text}")

            except Exception as e:
                print(f"❌ 提交异常: {e}")

        if not task_ids:
            print("❌ 没有成功提交的任务")
            return False

        # 监控任务状态
        print(f"\n👀 监控任务执行状态...")
        completed_tasks = set()
        max_wait_time = 180  # 最大等待3分钟
        start_time = time.time()

        while len(completed_tasks) < len(task_ids) and (time.time() - start_time) < max_wait_time:
            for task_id, test_case in task_ids:
                if task_id in completed_tasks:
                    continue

                try:
                    status_response = await client.get(f"{service_url}/task/{task_id}")

                    if status_response.status_code == 200:
                        task_status = status_response.json()
                        status = task_status['status']

                        if status in ['completed', 'failed', 'cancelled']:
                            completed_tasks.add(task_id)

                            if status == 'completed':
                                processing_time = task_status.get('processing_time', 0)
                                wait_time = task_status.get('wait_time', 0)
                                print(f"✅ {test_case['name']} 完成 - 处理: {processing_time:.1f}s, 等待: {wait_time:.1f}s")

                                # 检查并保存结果
                                result = task_status.get('result')
                                if result and result.get('success'):
                                    analysis_result = result.get('analysis_result', {})

                                    # 显示关键信息
                                    if 'summary' in analysis_result and 'credit_overview' in analysis_result['summary']:
                                        overview = analysis_result['summary']['credit_overview']
                                        score = overview.get('credit_score', '未知')
                                        level = overview.get('credit_level', '未知')
                                        accounts = overview.get('total_accounts', '未知')
                                        limit = overview.get('total_credit_limit', '未知')
                                        print(f"    📊 评分: {score}, 等级: {level}, 账户: {accounts}, 额度: {limit}")

                                    # 保存结果
                                    output_file = f"result_{test_case['type']}.json"
                                    with open(output_file, 'w', encoding='utf-8') as f:
                                        json.dump(analysis_result, f, indent=2, ensure_ascii=False)
                                    print(f"    💾 结果已保存到: {output_file}")

                            elif status == 'failed':
                                error_msg = task_status.get('error_message', '未知错误')
                                print(f"❌ {test_case['name']} 失败: {error_msg}")

                except Exception as e:
                    print(f"❌ 检查状态异常: {task_id[:8]}... - {e}")

            if len(completed_tasks) < len(task_ids):
                await asyncio.sleep(5)  # 等待5秒后再检查

        # 显示最终结果
        success_count = 0
        for task_id, test_case in task_ids:
            if task_id in completed_tasks:
                try:
                    status_response = await client.get(f"{service_url}/task/{task_id}")
                    if status_response.status_code == 200:
                        task_status = status_response.json()
                        if task_status['status'] == 'completed':
                            success_count += 1
                except:
                    pass

        print(f"\n📊 测试结果: {success_count}/{len(task_ids)} 任务成功完成")
    
    print(f"\n" + "=" * 50)
    print("🎉 快速测试完成!")
    return True


if __name__ == "__main__":
    try:
        asyncio.run(quick_test())
    except KeyboardInterrupt:
        print("\n👋 测试被中断")
