"""
Dify数据转换服务
将Dify工作流返回的数据转换为可视化报告所需的格式
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from app.models.dify_model import *
from app.models.visualization_model import *
from app.models.bigdata_model import *
from app.service.product_recommend_service import ProductRecommendService
from app.service.expert_analysis_service import ExpertAnalysisService
from app.models.report_model import CustomerInfo

logger = logging.getLogger(__name__)


def parse_report_date(date_str: str):
    """
    灵活解析报告日期，支持多种格式

    Args:
        date_str: 日期字符串

    Returns:
        datetime对象
    """
    from datetime import datetime

    # 尝试多种日期格式
    formats = [
        "%Y-%m-%d %H:%M:%S",  # 2024-10-15 12:00:00
        "%Y-%m-%d",           # 2024-10-15
        "%Y/%m/%d %H:%M:%S",  # 2024/10/15 12:00:00
        "%Y/%m/%d",           # 2024/10/15
    ]

    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue

    # 如果所有格式都失败，抛出异常
    raise ValueError(f"无法解析日期格式: {date_str}")


class DifyToVisualizationConverter:
    """Dify数据到可视化数据的转换器"""

    @staticmethod
    def convert(bigdata_report: BigDataResponse, dify_output: DifyWorkflowOutput, request_id: str = None, customer_info: CustomerInfo = None) -> VisualizationReportData:
        """
        将Dify工作流输出转换为可视化报告数据

        Args:
            dify_output: Dify工作流输出数据
            request_id: 请求ID
            customer_info: 客户信息（来自请求，用于产品推荐）

        Returns:
            可视化报告数据Pydantic对象
        """
        try:
            logger.info(f"🔄 [Dify转换] 开始转换Dify数据, request_id: {request_id}")

            # 1. 转换个人信息
            personal_info = DifyToVisualizationConverter._convert_personal_info(
                dify_output.basic_info
            )

            # 2. 转换统计概览
            stats = DifyToVisualizationConverter._convert_stats(
                dify_output.basic_info,
                dify_output.loan_details,
                dify_output.credit_card_details,
                dify_output.query_records
            )

            # 3. 转换负债构成
            debt_composition = DifyToVisualizationConverter._convert_debt_composition(
                dify_output.loan_details,
                dify_output.credit_card_details
            )

            # 4. 转换贷款明细
            bank_loans, non_bank_loans = DifyToVisualizationConverter._convert_loan_details(
                dify_output.loan_details,
                dify_output.basic_info.report_date
            )

            # 5. 转换贷款汇总
            loan_summary = DifyToVisualizationConverter._convert_loan_summary(
                dify_output.loan_details
            )

            # 6. 转换信用卡明细
            credit_cards = DifyToVisualizationConverter._convert_credit_card_details(
                dify_output.credit_card_details
            )

            # 7. 转换信用卡使用率分析
            credit_usage = DifyToVisualizationConverter._convert_credit_usage_analysis(
                dify_output.credit_card_details
            )

            # 8. 转换逾期分析
            overdue_analysis = DifyToVisualizationConverter._convert_overdue_analysis(
                dify_output.loan_details,
                dify_output.credit_card_details
            )

            # 9. 转换查询记录
            query_records = DifyToVisualizationConverter._convert_query_records(
                dify_output.query_records,
                dify_output.basic_info
            )

            # 10. 生成产品推荐（基于分析结果）
            if customer_info is not None and customer_info.includeProductMatch:
                product_recommendations = DifyToVisualizationConverter._generate_product_recommendations(
                    personal_info, stats, debt_composition, bank_loans, non_bank_loans,
                    loan_summary, credit_cards, credit_usage, overdue_analysis, query_records,
                    customer_info
                )
            else:
                product_recommendations = None

            # 11. 生成AI专家分析
            ai_expert_analysis = DifyToVisualizationConverter._generate_ai_analysis(
                personal_info, stats, debt_composition, bank_loans, non_bank_loans,
                loan_summary, credit_cards, credit_usage, overdue_analysis, query_records,
                product_recommendations
            )

            # 12. 生成图表数据
            loan_charts = \
                DifyToVisualizationConverter._generate_loan_chart_data(dify_output.loan_details)

            # 生成报告编号和日期（统一格式）
            now = datetime.now()
            report_date = now.strftime("%Y-%m-%d")
            report_number = now.strftime("%Y%m%d%H%M%S")
            
            # 构建完整的可视化数据Pydantic对象
            visualization_report = VisualizationReportData(
                report_number=report_number,
                report_date=report_date,
                personal_info=personal_info,
                stats=stats,
                debt_composition=debt_composition,
                bank_loans=bank_loans,
                non_bank_loans=non_bank_loans,
                loan_summary=loan_summary,
                credit_cards=credit_cards,
                credit_usage=credit_usage,
                overdue_analysis=overdue_analysis,
                query_records=query_records,
                product_recommendations=product_recommendations,
                ai_expert_analysis=ai_expert_analysis,
                loan_charts=loan_charts,
                query_charts=query_records,
                report_summary=bigdata_report.report_summary.model_dump() if bigdata_report.report_summary else None,
                basic_info=bigdata_report.basic_info.model_dump() if bigdata_report.basic_info else None,
                risk_identification=bigdata_report.risk_identification.model_dump() if bigdata_report.risk_identification else None,
                credit_assessment=bigdata_report.credit_assessment.model_dump() if bigdata_report.credit_assessment else None,
                leasing_risk_assessment=bigdata_report.leasing_risk_assessment.model_dump() if bigdata_report.leasing_risk_assessment else None,
                comprehensive_analysis=bigdata_report.comprehensive_analysis,
                report_footer=bigdata_report.report_footer.model_dump() if bigdata_report.report_footer else None
            )

            logger.info(f"✅ [Dify转换] 转换完成, request_id: {request_id}")
            return visualization_report

        except Exception as e:
            logger.error(f"❌ [Dify转换] 转换失败: {str(e)}, request_id: {request_id}")
            raise

    @staticmethod
    def _convert_personal_info(basic_info: DifyBasicInfo) -> PersonalInfo:
        """转换个人信息"""
        # 从身份证号计算年龄
        age = "未知"
        try:
            if basic_info.id_card and len(basic_info.id_card) >= 14:
                birth_year = int(basic_info.id_card[6:10])
                current_year = datetime.now().year
                age = str(current_year - birth_year)
        except:
            pass

        return PersonalInfo(
            name=basic_info.name or "未知",
            age=age,
            marital_status=basic_info.marital_status or "未知",
            id_card=basic_info.id_card or "未知"
        )

    @staticmethod
    def _convert_stats(
        basic_info: DifyBasicInfo,
        loan_details: List[DifyLoanDetail],
        credit_card_details: List[DifyCreditCardDetail],
        query_records: List[DifyQueryRecord]
    ) -> StatCard:
        """转换统计概览"""
        # 计算总授信额度
        total_credit = sum(loan.credit_limit or 0 for loan in loan_details)
        total_credit += sum(card.credit_limit or 0 for card in credit_card_details)

        # 计算总负债金额
        total_debt = sum(loan.balance or 0 for loan in loan_details)
        total_debt += sum(card.used_limit or 0 for card in credit_card_details)

        # 计算总机构数（去重）
        institutions = set()
        for loan in loan_details:
            if loan.institution:
                institutions.add(loan.institution)
        for card in credit_card_details:
            if card.institution:
                institutions.add(card.institution)

        # 计算贷款机构数
        loan_institutions = set(loan.institution for loan in loan_details if loan.institution)

        # 计算历史逾期月份
        overdue_months = sum(loan.total_overdue_months or 0 for loan in loan_details)
        overdue_months += sum(card.total_overdue_months or 0 for card in credit_card_details)

        # 计算近3月查询次数
        from datetime import datetime, timedelta
        # 使用报告日期作为基准日期
        report_datetime = parse_report_date(basic_info.report_date)
        three_months_ago = report_datetime - timedelta(days=90)
        query_count_3m = 0
        for record in query_records:
            try:
                # query_date现在是date类型，需要转换为datetime进行比较
                if record.query_date:
                    query_datetime = datetime.combine(record.query_date, datetime.min.time())
                    if query_datetime >= three_months_ago:
                        query_count_3m += 1
            except:
                pass

        return StatCard(
            total_credit=total_credit,
            total_debt=total_debt,
            total_institutions=len(institutions),
            loan_institutions=len(loan_institutions),
            overdue_months=overdue_months,
            query_count_3m=query_count_3m
        )

    @staticmethod
    def _convert_debt_composition(
        loan_details: List[DifyLoanDetail],
        credit_card_details: List[DifyCreditCardDetail]
    ) -> List[DebtItem]:
        """转换负债构成"""
        debt_items = []

        # 统计信用卡
        if credit_card_details:
            card_institutions = set(card.institution for card in credit_card_details if card.institution)
            card_credit = sum(card.credit_limit or 0 for card in credit_card_details)
            card_balance = sum(card.used_limit or 0 for card in credit_card_details)
            card_usage_rate = f"{(card_balance / card_credit * 100):.1f}%" if card_credit > 0 else "0%"

            debt_items.append(
                DebtItem(
                type = "信用卡",
                institutions = len(card_institutions),
                accounts = len(credit_card_details),
                credit_limit = card_credit,
                balance = card_balance,
                usage_rate = card_usage_rate
                )
            )

        # 统计贷款
        if loan_details:
            loan_institutions = set(loan.institution for loan in loan_details if loan.institution)
            loan_credit = sum(loan.credit_limit or 0 for loan in loan_details)
            loan_balance = sum(loan.balance or 0 for loan in loan_details)
            loan_usage_rate = "-"

            debt_items.append(
                DebtItem(
                type = "贷款",
                institutions = len(loan_institutions),
                accounts = len(loan_details),
                credit_limit = loan_credit,
                balance = loan_balance,
                usage_rate = loan_usage_rate
                )
            )

        debt_items.append(
            DebtItem(
                type = "总计",
                institutions = sum([debt.institutions or 0 for debt in debt_items]),
                accounts = sum([debt.accounts or 0 for debt in debt_items]),
                credit_limit = sum([debt.credit_limit or 0 for debt in debt_items]),
                balance = sum([debt.balance or 0 for debt in debt_items]),
                usage_rate = "-"
            )
        )
   
        return debt_items

    @staticmethod
    def _convert_loan_details(
        loan_details: List[DifyLoanDetail],
        report_date_str: str
    ) -> tuple[List[LoanDetail], List[LoanDetail]]:
        """转换贷款明细，分为银行贷款和非银机构贷款"""
        bank_loans = []
        non_bank_loans = []

        # 解析报告日期
        try:
            report_date = parse_report_date(report_date_str)
        except Exception as e:
            logger.warning(f"解析报告日期失败: {report_date_str}, 错误: {str(e)}")
            report_date = None

        # 银行关键词
        bank_keywords = ["银行"]

        # 先分类，再分别编号
        bank_loans_temp = []
        non_bank_loans_temp = []

        for loan in loan_details:
            # 判断是否为银行
            is_bank = any(keyword in (loan.institution or "") for keyword in bank_keywords)

            # 计算使用率
            credit_limit = loan.credit_limit or 0
            balance = loan.balance or 0
            usage_rate = f"{(balance / credit_limit * 100):.1f}%" if credit_limit > 0 else "0%"

            # 计算剩余期限
            remaining_period = "未知"
            if loan.start_end_date and report_date:
                try:
                    # 解析日期格式 "2022.02.26-2024.02.26"
                    date_parts = loan.start_end_date.split('-')
                    if len(date_parts) == 2:
                        end_date_str = date_parts[1].strip()

                        # 解析结束日期
                        end_date = datetime.strptime(end_date_str, "%Y.%m.%d")

                        # 计算剩余期限
                        remaining_days = (end_date - report_date).days

                        if remaining_days < 0:
                            remaining_period = "已到期"
                        elif remaining_days == 0:
                            remaining_period = "今日到期"
                        else:
                            # 转换为年和月
                            remaining_years = remaining_days // 365
                            remaining_months = (remaining_days % 365) // 30

                            if remaining_years > 0:
                                if remaining_months > 0:
                                    remaining_period = f"{remaining_years}年{remaining_months}个月"
                                else:
                                    remaining_period = f"{remaining_years}年"
                            elif remaining_months > 0:
                                remaining_period = f"{remaining_months}个月"
                            else:
                                remaining_period = f"{remaining_days}天"
                except Exception as e:
                    # 如果解析失败，保持为"未知"
                    logger.debug(f"解析贷款剩余期限失败: {loan.start_end_date}, 错误: {str(e)}")
                    pass

            loan_data = {
                "institution": loan.institution or "未知",
                "credit_limit": credit_limit,
                "balance": balance,
                "business_type": loan.business_type or "未知",
                "period": loan.start_end_date or "未知",
                "remaining_period": remaining_period,
                "usage_rate": usage_rate
            }

            if is_bank:
                bank_loans_temp.append(loan_data)
            else:
                non_bank_loans_temp.append(loan_data)

        # 为银行贷款分配从1开始的序号
        for idx, loan_data in enumerate(bank_loans_temp, start=1):
            bank_loans.append(
                LoanDetail(
                    id=idx,
                    institution=loan_data["institution"],
                    credit_limit=loan_data["credit_limit"],
                    balance=loan_data["balance"],
                    business_type=loan_data["business_type"],
                    period=loan_data["period"],
                    remaining_period=loan_data["remaining_period"],
                    usage_rate=loan_data["usage_rate"]
                )
            )

        # 为非银机构贷款分配从1开始的序号
        for idx, loan_data in enumerate(non_bank_loans_temp, start=1):
            non_bank_loans.append(
                LoanDetail(
                    id=idx,
                    institution=loan_data["institution"],
                    credit_limit=loan_data["credit_limit"],
                    balance=loan_data["balance"],
                    business_type=loan_data["business_type"],
                    period=loan_data["period"],
                    remaining_period=loan_data["remaining_period"],
                    usage_rate=loan_data["usage_rate"]
                )
            )

        return bank_loans, non_bank_loans

    @staticmethod
    def _convert_loan_summary(loan_details: List[DifyLoanDetail]) -> LoanSummary:
        """转换贷款汇总"""
        if not loan_details:
            return LoanSummary(
                avg_period="0年",
                max_balance=0,
                min_balance=0,
                institution_types="无"
            )

        # 计算平均期限
        valid_periods = []
        for loan in loan_details:
            if loan.start_end_date:
                try:
                    # 解析日期格式 "2022.02.26-2024.02.26"
                    date_parts = loan.start_end_date.split('-')
                    if len(date_parts) == 2:
                        start_date_str = date_parts[0].strip()
                        end_date_str = date_parts[1].strip()

                        # 解析开始和结束日期
                        start_date = datetime.strptime(start_date_str, "%Y.%m.%d")
                        end_date = datetime.strptime(end_date_str, "%Y.%m.%d")

                        # 计算期限（年）
                        period_days = (end_date - start_date).days
                        period_years = period_days / 365.25  # 考虑闰年

                        if period_years > 0:  # 只添加有效的期限
                            valid_periods.append(period_years)
                except Exception as e:
                    # 如果解析失败，跳过该记录
                    logger.debug(f"解析贷款期限失败: {loan.start_end_date}, 错误: {str(e)}")
                    continue

        # 计算平均期限
        if valid_periods:
            avg_period_years = sum(valid_periods) / len(valid_periods)
            # 格式化输出
            if avg_period_years >= 1:
                avg_period = f"{avg_period_years:.1f}年"
            else:
                avg_period_months = avg_period_years * 12
                avg_period = f"{avg_period_months:.1f}个月"
        else:
            avg_period = "未知"

        # 计算最高和最小余额
        balances = [loan.balance for loan in loan_details if loan.balance and loan.balance > 0]
        max_balance = max(balances) if balances else 0
        min_balance = min(balances) if balances else 0

        # 统计机构类型
        bank_keywords = ["银行"]
        has_bank = any(any(kw in (loan.institution or "") for kw in bank_keywords) for loan in loan_details)
        has_non_bank = any(not any(kw in (loan.institution or "") for kw in bank_keywords) for loan in loan_details)

        if has_bank and has_non_bank:
            institution_types = "银行+非银机构"
        elif has_bank:
            institution_types = "银行"
        elif has_non_bank:
            institution_types = "非银机构"
        else:
            institution_types = "未知"

        return LoanSummary(
            avg_period=avg_period,
            max_balance=max_balance,
            min_balance=min_balance,
            institution_types=institution_types
        )

    @staticmethod
    def _convert_credit_card_details(
        credit_card_details: List[DifyCreditCardDetail]
    ) -> List[CreditCardDetail]:
        """转换信用卡明细"""
        cards = []
        for idx, card in enumerate(credit_card_details, start=1):
            # 处理历史逾期字段
            if isinstance(card.overdue_history, bool):
                overdue_history_str = "有" if card.overdue_history else "无"
            else:
                overdue_history_str = str(card.overdue_history) if card.overdue_history is not None else "未知"

            cards.append(
                CreditCardDetail(
                    id=idx,
                    institution=card.institution or "未知",
                    credit_limit=card.credit_limit or 0,
                    used_amount=card.used_limit or 0,
                    installment_balance=card.large_installment_balance or 0,
                    usage_rate=card.usage_rate or "0%",
                    status=card.status or "未知",
                    overdue_history=overdue_history_str
                )
            )
        return cards

    @staticmethod
    def _convert_credit_usage_analysis(
        credit_card_details: List[DifyCreditCardDetail]
    ) -> CreditUsageAnalysis:
        """转换信用卡使用率分析"""
        if not credit_card_details:
            return CreditUsageAnalysis(
                usage_percentage=0.0,
                risk_level="无信用卡",
                total_credit=0,
                used_credit=0,
                available_credit=0,
                recommended_threshold=70.0,
                safety_margin=100.0,
                impact_level="无影响"
            )

        # 计算总额度和已用额度
        total_credit = sum(card.credit_limit or 0 for card in credit_card_details)
        used_credit = sum(card.used_limit or 0 for card in credit_card_details)
        available_credit = total_credit - used_credit

        # 计算使用率
        usage_percentage = (used_credit / total_credit * 100) if total_credit > 0 else 0.0

        # 判断风险等级 信用卡使用率 低风险：<40%  中风险：>=40 <70  高风险：>=70
        if usage_percentage >= 70:
            risk_level = "高风险"
            impact_level = "极高"
        elif usage_percentage >= 40:
            risk_level = "中风险"
            impact_level = "中等"
        else:
            risk_level = "低风险"
            impact_level = "极低"


        # 计算安全空间
        safety_margin = 70.0 - usage_percentage

        return CreditUsageAnalysis(
            usage_percentage=round(usage_percentage, 2),
            risk_level=risk_level,
            total_credit=total_credit,
            used_credit=used_credit,
            available_credit=available_credit,
            recommended_threshold=70.0,
            safety_margin=round(safety_margin, 2),
            impact_level=impact_level
        )

    @staticmethod
    def _convert_overdue_analysis(
        loan_details: List[DifyLoanDetail],
        credit_card_details: List[DifyCreditCardDetail]
    ) -> OverdueAnalysis:
        """转换逾期分析"""
        # 统计逾期机构
        overdue_institutions = {}

        # 处理贷款逾期
        for loan in loan_details:
            if loan.overdue_history and loan.total_overdue_months and loan.total_overdue_months > 0:
                inst_name = loan.institution or "未知机构"
                if inst_name not in overdue_institutions:
                    overdue_institutions[inst_name] = {
                        "机构名称": inst_name,
                        "总逾期月数": 0,
                        "90天以上逾期月数": 0,
                        "当前状态": loan.status or "未知"
                    }
                overdue_institutions[inst_name]["总逾期月数"] += (loan.total_overdue_months or 0)
                if loan.over_90_days:
                    overdue_institutions[inst_name]["90天以上逾期月数"] += 1

        # 处理信用卡逾期
        for card in credit_card_details:
            # 处理布尔类型的overdue_history
            has_overdue = False
            if isinstance(card.overdue_history, bool):
                has_overdue = card.overdue_history
            elif isinstance(card.overdue_history, str):
                has_overdue = card.overdue_history.lower() == "true"

            if has_overdue and card.total_overdue_months and card.total_overdue_months > 0:
                inst_name = card.institution or "未知机构"
                if inst_name not in overdue_institutions:
                    overdue_institutions[inst_name] = {
                        "机构名称": inst_name,
                        "总逾期月数": 0,
                        "90天以上逾期月数": 0,
                        "当前状态": card.status or "未知"
                    }
                overdue_institutions[inst_name]["总逾期月数"] += (card.total_overdue_months or 0)

                # 处理布尔类型的over_90_days
                is_over_90 = False
                if isinstance(card.over_90_days, bool):
                    is_over_90 = card.over_90_days
                elif isinstance(card.over_90_days, str):
                    is_over_90 = card.over_90_days.lower() == "true"

                if is_over_90:
                    overdue_institutions[inst_name]["90天以上逾期月数"] += 1

        # 计算逾期统计
        total_overdue_months = sum(inst["总逾期月数"] for inst in overdue_institutions.values())
        overdue_90plus = sum(inst["90天以上逾期月数"] for inst in overdue_institutions.values())

        # 判断严重程度
        if overdue_90plus > 0:
            severity_level = "严重"
            severity_percentage = 100.0
        elif total_overdue_months >= 6:
            severity_level = "较严重"
            severity_percentage = 75.0
        elif total_overdue_months >= 3:
            severity_level = "一般"
            severity_percentage = 50.0
        elif total_overdue_months > 0:
            severity_level = "轻微"
            severity_percentage = 25.0
        else:
            severity_level = "无逾期"
            severity_percentage = 0.0

        # 创建逾期机构列表
        institution_list = []
        for inst_data in overdue_institutions.values():
            institution_list.append(
                OverdueInstitution(
                    name=inst_data["机构名称"],
                    total_overdue_months=inst_data["总逾期月数"],
                    overdue_90plus_months=inst_data["90天以上逾期月数"],
                    status=inst_data["当前状态"]
                )
            )

        return OverdueAnalysis(
            severity_level=severity_level,
            severity_percentage=severity_percentage,
            overdue_90plus=overdue_90plus,
            overdue_30_90=0,  # Dify未提供详细分类
            overdue_under_30=max(0, total_overdue_months - overdue_90plus),
            institutions=institution_list
        )

    @staticmethod
    def _convert_query_records(
        query_records: List[DifyQueryRecord],
        basic_info: DifyBasicInfo
    ) -> List[QueryRecord]:
        """转换查询记录，按时间段统计各类查询次数"""
        from datetime import datetime, timedelta
        from collections import OrderedDict

        # 使用报告日期作为基准日期
        report_datetime = parse_report_date(basic_info.report_date)

        # 定义时间段（使用OrderedDict保持顺序）
        periods = OrderedDict([
            ("近7天", report_datetime - timedelta(days=7)),
            ("近1月", report_datetime - timedelta(days=30)),
            ("近2月", report_datetime - timedelta(days=60)),
            ("近3月", report_datetime - timedelta(days=90)),
            ("近6月", report_datetime - timedelta(days=180)),
            ("近1年", report_datetime - timedelta(days=365)),
            ("近2年", report_datetime - timedelta(days=730))
        ])

        result = []
        for period_name, period_start in periods.items():
            # 筛选该时间段内的查询记录（query_date是date类型，需要转换period_start为date）
            query_records_time = [q for q in query_records if q.query_date and q.query_date >= period_start.date()]

            result.append(
                QueryRecord(
                    period=period_name,
                    loan_approval=len([q for q in query_records_time if q.reason and "贷款审批" in q.reason]),
                    credit_card_approval=len([q for q in query_records_time if q.reason and "信用卡审批" in q.reason]),
                    guarantee_review=len([q for q in query_records_time if q.reason and "担保资格审查" in q.reason]),
                    insurance_review=len([q for q in query_records_time if q.reason and "保前审查" in q.reason]),
                    credit_review=len([q for q in query_records_time if q.reason and "资信审查" in q.reason]),
                    non_post_loan=len([q for q in query_records_time if q.reason and "本人查询" not in q.reason and "贷后管理" not in q.reason]),
                    self_query=len([q for q in query_records_time if q.reason and "本人查询" in q.reason]),
                )
            )

        return result

    @staticmethod
    def _generate_product_recommendations(
        personal_info: PersonalInfo,
        stats: StatCard,
        debt_composition: List[DebtItem],
        bank_loans: List[LoanDetail],
        non_bank_loans: List[LoanDetail],
        loan_summary: LoanSummary,
        credit_cards: List[CreditCardDetail],
        credit_usage: CreditUsageAnalysis,
        overdue_analysis: OverdueAnalysis,
        query_records: List[QueryRecord],
        customer_info: CustomerInfo = None
    ) -> List[ProductRecommendation]:
        """
        生成产品推荐
        使用大模型根据用户信用状况推荐合适的金融产品
        """
        try:
            # 创建产品推荐服务实例
            recommendation_service = ProductRecommendService()

            # 调用服务生成推荐
            recommendations = recommendation_service.generate_recommendations(
                personal_info=personal_info,
                stats=stats,
                debt_composition=debt_composition,
                bank_loans=bank_loans,
                non_bank_loans=non_bank_loans,
                loan_summary=loan_summary,
                credit_cards=credit_cards,
                credit_usage=credit_usage,
                overdue_analysis=overdue_analysis,
                query_records=query_records,
                customer_info=customer_info,
            )

            return recommendations

        except Exception as e:
            logger.error(f"大模型调用失败，返回空推荐列表: {str(e)}")
            # 如果大模型调用失败，返回默认推荐
            return []

    @staticmethod
    def _generate_ai_analysis(
        personal_info: PersonalInfo,
        stats: StatCard,
        debt_composition: List[DebtItem],
        bank_loans: List[LoanDetail],
        non_bank_loans: List[LoanDetail],
        loan_summary: LoanSummary,
        credit_cards: List[CreditCardDetail],
        credit_usage: CreditUsageAnalysis,
        overdue_analysis: OverdueAnalysis,
        query_records: List[QueryRecord],
        product_recommendations: List[ProductRecommendation]
    ) -> AIExpertAnalysis:
        """
        生成AI专家综合分析
        使用GPT-4o模型生成智能分析
        """
        try:
            # 使用AI分析服务
            expert_analysis_service = ExpertAnalysisService()
            return expert_analysis_service.generate_analysis(
                personal_info=personal_info,
                stats=stats,
                debt_composition=debt_composition,
                bank_loans=bank_loans,
                non_bank_loans=non_bank_loans,
                loan_summary=loan_summary,
                credit_cards=credit_cards,
                credit_usage=credit_usage,
                overdue_analysis=overdue_analysis,
                query_records=query_records,
                product_recommendations=product_recommendations
            )
        except Exception as e:
            logger.error(f"AI分析生成失败，使用默认分析: {str(e)}")
            # 如果AI服务失败，使用默认分析
            expert_analysis_service = ExpertAnalysisService()
            return expert_analysis_service._get_default_analysis(stats, credit_usage, overdue_analysis)

    @staticmethod
    def _generate_loan_chart_data(
        loan_details: List[LoanDetail]
    ) -> List[LoanChart]:
        """生成贷款图表数据"""
        return [
            LoanChart(
                institution=loan.institution,
                credit_limit=loan.credit_limit,
                balance=loan.balance if loan.balance is not None else 0
            )
            for loan in loan_details
        ]



