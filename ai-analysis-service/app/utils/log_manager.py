"""
算法调用日志管理器
"""

import json
import time
import aiofiles
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional
from loguru import logger


class AlgorithmLogger:
    """算法调用日志记录器"""
    
    def __init__(self, log_dir: str = "logs"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        
        # 创建输入输出日志目录
        self.io_log_dir = self.log_dir / "io_logs"
        self.io_log_dir.mkdir(exist_ok=True)
        
        # 创建不同类型的日志文件
        self.request_log_file = self.log_dir / "algorithm_requests.jsonl"
        self.error_log_file = self.log_dir / "algorithm_errors.jsonl"
        self.stats_log_file = self.log_dir / "algorithm_stats.jsonl"
    
    async def log_request_start(self, request_id: str, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """记录请求开始"""
        # 安全获取文件大小
        file_base64 = request_data.get("file_base64") or ""
        custom_prompt = request_data.get("custom_prompt") or ""

        log_entry = {
            "request_id": request_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "request_start",
            "report_type": request_data.get("report_type"),
            "mime_type": request_data.get("mime_type"),
            "file_size_bytes": len(file_base64) * 3 // 4,  # 估算原始文件大小
            "has_custom_prompt": bool(custom_prompt),
            "custom_prompt_length": len(custom_prompt),
        }
        
        await self._write_log(self.request_log_file, log_entry)
        logger.info(f"记录请求开始: {request_id}")
        return log_entry
    
    async def log_request_complete(self, request_id: str, result: Dict[str, Any], processing_time: float):
        """记录请求完成"""
        # 安全计算结果大小
        result_size_chars = 0
        analysis_result = result.get("analysis_result")
        if analysis_result:
            try:
                result_size_chars = len(json.dumps(analysis_result, ensure_ascii=False))
            except Exception:
                result_size_chars = 0

        log_entry = {
            "request_id": request_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "request_complete",
            "success": result.get("success", False),
            "processing_time_seconds": processing_time,
            "ai_processing_time_seconds": result.get("processing_time", 0),
            "result_size_chars": result_size_chars,
            "error_message": result.get("error_message"),
        }
        
        # 如果成功，记录分析结果的关键指标
        if result.get("success") and result.get("analysis_result"):
            analysis_result = result["analysis_result"]
            log_entry.update(self._extract_analysis_metrics(analysis_result))
        
        await self._write_log(self.request_log_file, log_entry)
        
        if result.get("success"):
            logger.info(f"记录请求完成: {request_id}, 耗时: {processing_time:.2f}s")
        else:
            logger.error(f"记录请求失败: {request_id}, 错误: {result.get('error_message')}")
    
    async def log_error(self, request_id: str, error_type: str, error_message: str, context: Optional[Dict[str, Any]] = None):
        """记录错误"""
        log_entry = {
            "request_id": request_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "error",
            "error_type": error_type,
            "error_message": error_message,
            "context": context or {}
        }
        
        await self._write_log(self.error_log_file, log_entry)
        logger.error(f"记录错误: {request_id}, 类型: {error_type}, 消息: {error_message}")
    
    async def log_queue_stats(self, stats: Dict[str, Any]):
        """记录队列统计信息"""
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "queue_stats",
            **stats
        }
        
        await self._write_log(self.stats_log_file, log_entry)
    
    def _extract_analysis_metrics(self, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """提取分析结果的关键指标"""
        metrics = {}
        
        try:
            # 提取信用概览信息
            if "summary" in analysis_result and "credit_overview" in analysis_result["summary"]:
                overview = analysis_result["summary"]["credit_overview"]
                
                # 提取数值型指标
                credit_score = overview.get("credit_score")
                if isinstance(credit_score, (int, float)):
                    metrics["credit_score"] = credit_score
                elif isinstance(credit_score, str) and credit_score.replace(".", "").isdigit():
                    metrics["credit_score"] = float(credit_score)
                
                metrics["credit_level"] = overview.get("credit_level")
                
                total_accounts = overview.get("total_accounts")
                if isinstance(total_accounts, (int, float)):
                    metrics["total_accounts"] = total_accounts
                
                total_limit = overview.get("total_credit_limit")
                if isinstance(total_limit, (int, float)):
                    metrics["total_credit_limit"] = total_limit
            
            # 提取风险评估信息
            if "risk_assessment" in analysis_result:
                risk = analysis_result["risk_assessment"]
                metrics["risk_level"] = risk.get("risk_level")
                
                risk_factors = risk.get("risk_factors", [])
                metrics["risk_factors_count"] = len(risk_factors) if isinstance(risk_factors, list) else 0
        
        except Exception as e:
            logger.warning(f"提取分析指标时出错: {e}")
        
        return metrics
    
    async def _write_log(self, log_file: Path, log_entry: Dict[str, Any]):
        """写入日志文件"""
        try:
            log_line = json.dumps(log_entry, ensure_ascii=False) + "\n"
            
            async with aiofiles.open(log_file, "a", encoding="utf-8") as f:
                await f.write(log_line)
        
        except Exception as e:
            logger.error(f"写入日志文件失败: {log_file}, 错误: {e}")
    
    async def get_recent_logs(self, log_type: str = "request", limit: int = 100) -> list:
        """获取最近的日志记录"""
        log_file_map = {
            "request": self.request_log_file,
            "error": self.error_log_file,
            "stats": self.stats_log_file
        }
        
        log_file = log_file_map.get(log_type)
        if not log_file or not log_file.exists():
            return []
        
        try:
            logs = []
            async with aiofiles.open(log_file, "r", encoding="utf-8") as f:
                lines = await f.readlines()
                
                # 获取最后N行
                recent_lines = lines[-limit:] if len(lines) > limit else lines
                
                for line in recent_lines:
                    line = line.strip()
                    if line:
                        try:
                            logs.append(json.loads(line))
                        except json.JSONDecodeError:
                            continue
            
            return logs
        
        except Exception as e:
            logger.error(f"读取日志文件失败: {log_file}, 错误: {e}")
            return []
    
    async def get_stats_summary(self, hours: int = 24) -> Dict[str, Any]:
        """获取统计摘要"""
        try:
            logs = await self.get_recent_logs("request", limit=10000)
            
            # 过滤最近N小时的日志
            cutoff_time = time.time() - (hours * 3600)
            recent_logs = []
            
            for log in logs:
                try:
                    log_time = datetime.fromisoformat(log["timestamp"].replace("Z", "+00:00")).timestamp()
                    if log_time >= cutoff_time:
                        recent_logs.append(log)
                except:
                    continue
            
            # 统计分析
            total_requests = len([log for log in recent_logs if log.get("event_type") == "request_start"])
            completed_requests = len([log for log in recent_logs if log.get("event_type") == "request_complete" and log.get("success")])
            failed_requests = len([log for log in recent_logs if log.get("event_type") == "request_complete" and not log.get("success")])
            
            # 计算平均处理时间
            processing_times = [log.get("processing_time_seconds", 0) for log in recent_logs 
                              if log.get("event_type") == "request_complete" and log.get("success")]
            avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0
            
            # 按报告类型统计
            report_types = {}
            for log in recent_logs:
                if log.get("event_type") == "request_start":
                    report_type = log.get("report_type", "unknown")
                    report_types[report_type] = report_types.get(report_type, 0) + 1
            
            return {
                "time_range_hours": hours,
                "total_requests": total_requests,
                "completed_requests": completed_requests,
                "failed_requests": failed_requests,
                "success_rate": completed_requests / total_requests if total_requests > 0 else 0,
                "average_processing_time_seconds": avg_processing_time,
                "report_types_distribution": report_types,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            logger.error(f"生成统计摘要失败: {e}")
            return {"error": str(e)}
    
    async def log_input_output(self, request_id: str, input_data: Dict[str, Any], output_data: Dict[str, Any]):
        """记录函数调用的输入和输出数据到本地JSON文件（保存全量原始数据）"""
        try:
            # 创建日志条目，直接保存原始数据
            log_entry = {
                "request_id": request_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "input": input_data,  # 保存完整的输入数据
                "output": output_data  # 保存完整的输出数据
            }
            
            # 生成文件名（按日期分组）
            date_str = datetime.now().strftime("%Y%m%d")
            log_file = self.io_log_dir / f"analyze_sync_{date_str}.json"
            
            # 写入JSON文件
            await self._write_io_log(log_file, log_entry)
            logger.info(f"记录输入输出日志: {request_id} -> {log_file}")
            
        except Exception as e:
            logger.error(f"记录输入输出日志失败: {request_id}, 错误: {e}")
    
    async def _write_io_log(self, log_file: Path, log_entry: Dict[str, Any]):
        """写入输入输出日志文件"""
        try:
            # 如果文件不存在，创建新文件并写入数组
            if not log_file.exists():
                async with aiofiles.open(log_file, "w", encoding="utf-8") as f:
                    await f.write(json.dumps([log_entry], ensure_ascii=False, indent=2))
            else:
                # 如果文件存在，读取现有数据并追加
                async with aiofiles.open(log_file, "r", encoding="utf-8") as f:
                    content = await f.read()
                    
                try:
                    existing_data = json.loads(content) if content.strip() else []
                except json.JSONDecodeError:
                    existing_data = []
                
                # 追加新条目
                existing_data.append(log_entry)
                
                # 写回文件
                async with aiofiles.open(log_file, "w", encoding="utf-8") as f:
                    await f.write(json.dumps(existing_data, ensure_ascii=False, indent=2))
                    
        except Exception as e:
            logger.error(f"写入输入输出日志文件失败: {log_file}, 错误: {e}")


# 全局日志记录器实例
algorithm_logger = AlgorithmLogger()
