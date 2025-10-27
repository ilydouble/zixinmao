"""
Dify数据转换服务
将Dify工作流返回的数据转换为可视化报告所需的格式
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from app.models.dify_model import (
    DifyWorkflowOutput,
    DifyBasicInfo,
    DifyLoanDetail,
    DifyCreditCardDetail,
    DifyQueryRecord
)
from app.models.visualization_model import (
    VisualizationReportData,
    PersonalInfo,
    StatCard,
    DebtItem,
    LoanDetail,
    CreditCardDetail,
    OverdueInstitution,
    QueryRecord,
    ProductRecommendation,
    AIAnalysisPoint,
    CreditUsageAnalysis,
    OverdueAnalysis,
    LoanSummary,
    LoanChart
)

logger = logging.getLogger(__name__)


class DifyToVisualizationConverter:
    """Dify数据到可视化数据的转换器"""

    @staticmethod
    def convert(dify_output: DifyWorkflowOutput, request_id: str = None) -> VisualizationReportData:
        """
        将Dify工作流输出转换为可视化报告数据

        Args:
            dify_output: Dify工作流输出数据
            request_id: 请求ID

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
                dify_output.loan_details
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
            product_recommendations = DifyToVisualizationConverter._generate_product_recommendations(
                stats, credit_usage, overdue_analysis
            )

            # 11. 生成AI分析
            ai_analysis = DifyToVisualizationConverter._generate_ai_analysis(
                stats, credit_usage, overdue_analysis
            )

            # 12. 生成图表数据
            loan_charts = \
                DifyToVisualizationConverter._generate_loan_chart_data(dify_output.loan_details)

            # query_chart_labels, query_chart_loan_data, query_chart_card_data, query_chart_guarantee_data = \
            #     DifyToVisualizationConverter._generate_query_chart_data(query_records)

            # 构建完整的可视化数据Pydantic对象
            visualization_report = VisualizationReportData(
                report_number=dify_output.basic_info.report_number,
                report_date=dify_output.basic_info.report_date,
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
                match_status="根据您的信用状况，为您推荐以下产品",
                ai_analysis=ai_analysis,
                suitability_rating="良好" if overdue_analysis.severity_level == "无逾期" else "一般",
                optimization_suggestions=[
                    "保持良好的还款记录",
                    "合理控制信用卡使用率",
                    "减少短期内的查询次数"
                ],
                risk_warning="请注意保护个人信用记录" if overdue_analysis.severity_level == "无逾期" else "存在逾期记录，请及时处理",
                loan_charts=loan_charts,
                query_charts=query_records
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
            name=basic_info.name,
            age=age,
            marital_status=basic_info.marital_status,
            id_card=basic_info.id_card
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
        total_credit = sum(loan.credit_limit for loan in loan_details)
        total_credit += sum(card.credit_limit for card in credit_card_details)

        # 计算总负债金额
        total_debt = sum(loan.balance for loan in loan_details)
        total_debt += sum(card.used_limit for card in credit_card_details)

        # 计算总机构数（去重）
        institutions = set()
        for loan in loan_details:
            institutions.add(loan.institution)
        for card in credit_card_details:
            institutions.add(card.institution)

        # 计算贷款机构数
        loan_institutions = set(loan.institution for loan in loan_details)

        # 计算历史逾期月份
        overdue_months = sum(loan.total_overdue_months for loan in loan_details)
        overdue_months += sum(card.total_overdue_months for card in credit_card_details)

        # 计算近3月查询次数
        from datetime import datetime, timedelta
        # 使用报告日期作为基准日期
        report_datetime = datetime.strptime(basic_info.report_date, "%Y-%m-%d %H:%M:%S")
        three_months_ago = report_datetime - timedelta(days=90)
        query_count_3m = 0
        for record in query_records:
            try:
                # query_date现在是date类型，需要转换为datetime进行比较
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
            card_institutions = set(card.institution for card in credit_card_details)
            card_credit = sum(card.credit_limit for card in credit_card_details)
            card_balance = sum(card.used_limit for card in credit_card_details)
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
            loan_institutions = set(loan.institution for loan in loan_details)
            loan_credit = sum(loan.credit_limit for loan in loan_details)
            loan_balance = sum(loan.balance for loan in loan_details)
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
                type = "统计",
                institutions = sum([debt.institutions for debt in debt_items]),
                accounts = sum([debt.accounts for debt in debt_items]),
                credit_limit = sum([debt.credit_limit for debt in debt_items]),
                balance = sum([debt.balance for debt in debt_items]),
                usage_rate = "-"
            )
        )
   
        return debt_items

    @staticmethod
    def _convert_loan_details(
        loan_details: List[DifyLoanDetail]
    ) -> tuple[List[LoanDetail], List[LoanDetail]]:
        """转换贷款明细，分为银行贷款和非银机构贷款"""
        bank_loans = []
        non_bank_loans = []

        # 银行关键词
        bank_keywords = ["银行"]

        # 先分类，再分别编号
        bank_loans_temp = []
        non_bank_loans_temp = []

        for loan in loan_details:
            # 判断是否为银行
            is_bank = any(keyword in loan.institution for keyword in bank_keywords)

            # 计算使用率
            usage_rate = f"{(loan.balance / loan.credit_limit * 100):.1f}%" if loan.credit_limit > 0 else "0%"

            # 计算剩余期限（简化处理）
            remaining_period = "未知"

            loan_data = {
                "institution": loan.institution,
                "credit_limit": loan.credit_limit,
                "balance": loan.balance,
                "business_type": loan.business_type,
                "period": loan.start_end_date,
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
                avg_period=0.0,
                max_balance=0,
                min_balance=0,
                institution_types="无"
            )

        # 计算平均期限（简化处理，假设为1年）
        avg_period = 1.0

        # 计算最高和最小余额
        balances = [loan.balance for loan in loan_details if loan.balance > 0]
        max_balance = max(balances) if balances else 0
        min_balance = min(balances) if balances else 0

        # 统计机构类型
        bank_keywords = ["银行"]
        has_bank = any(any(kw in loan.institution for kw in bank_keywords) for loan in loan_details)
        has_non_bank = any(not any(kw in loan.institution for kw in bank_keywords) for loan in loan_details)

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
                overdue_history_str = str(card.overdue_history)

            cards.append(
                CreditCardDetail(
                    id=idx,
                    institution=card.institution,
                    credit_limit=card.credit_limit,
                    used_amount=card.used_limit,
                    installment_balance=card.large_installment_balance or 0,
                    usage_rate=card.usage_rate,
                    status=card.status,
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
        total_credit = sum(card.credit_limit for card in credit_card_details)
        used_credit = sum(card.used_limit for card in credit_card_details)
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
            if loan.overdue_history and loan.total_overdue_months > 0:
                inst_name = loan.institution
                if inst_name not in overdue_institutions:
                    overdue_institutions[inst_name] = {
                        "机构名称": inst_name,
                        "总逾期月数": 0,
                        "90天以上逾期月数": 0,
                        "当前状态": loan.status
                    }
                overdue_institutions[inst_name]["总逾期月数"] += loan.total_overdue_months
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

            if has_overdue and card.total_overdue_months > 0:
                inst_name = card.institution
                if inst_name not in overdue_institutions:
                    overdue_institutions[inst_name] = {
                        "机构名称": inst_name,
                        "总逾期月数": 0,
                        "90天以上逾期月数": 0,
                        "当前状态": card.status
                    }
                overdue_institutions[inst_name]["总逾期月数"] += card.total_overdue_months

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
        report_datetime = datetime.strptime(basic_info.report_date, "%Y-%m-%d %H:%M:%S")

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
            query_records_time = [q for q in query_records if q.query_date >= period_start.date()]

            result.append(
                QueryRecord(
                    period=period_name,
                    loan_approval=len([q for q in query_records_time if "贷款审批" in q.reason]),
                    credit_card_approval=len([q for q in query_records_time if "信用卡审批" in q.reason]),
                    guarantee_review=len([q for q in query_records_time if "担保资格审查" in q.reason]),
                    insurance_review=len([q for q in query_records_time if "保前审查" in q.reason]),
                    credit_review=len([q for q in query_records_time if "资信审查" in q.reason]),
                    non_post_loan=len([q for q in query_records_time if "本人查询" not in q.reason and "贷后管理" not in q.reason]),
                    self_query=len([q for q in query_records_time if "本人查询" in q.reason]),
                )
            )

        return result

    @staticmethod
    def _generate_product_recommendations(
        stats: StatCard,
        credit_usage: CreditUsageAnalysis,
        overdue_analysis: OverdueAnalysis
    ) -> List[ProductRecommendation]:
        """生成产品推荐"""
        recommendations = []

        # 根据信用状况推荐产品
        has_overdue = overdue_analysis.severity_level != "无逾期"
        usage_rate = credit_usage.usage_percentage

        if not has_overdue and usage_rate < 50:
            # 信用良好，推荐优质产品
            recommendations.append(ProductRecommendation(
                bank="工商银行",
                product_name="融e借",
                min_rate="3.85%",
                max_credit=80,
                rating=5,
                suggestion="信用记录良好，强烈推荐申请"
            ))
            recommendations.append(ProductRecommendation(
                bank="建设银行",
                product_name="快贷",
                min_rate="4.35%",
                max_credit=50,
                rating=4,
                suggestion="适合您的信用状况"
            ))
        elif not has_overdue and usage_rate < 70:
            # 信用一般，推荐中等产品
            recommendations.append(ProductRecommendation(
                bank="招商银行",
                product_name="闪电贷",
                min_rate="5.6%",
                max_credit=30,
                rating=3,
                suggestion="建议降低信用卡使用率后申请"
            ))
        else:
            # 信用较差，推荐门槛较低的产品
            recommendations.append(ProductRecommendation(
                bank="微众银行",
                product_name="微粒贷",
                min_rate="7.2%",
                max_credit=20,
                rating=2,
                suggestion="建议先改善信用状况"
            ))

        return recommendations

    @staticmethod
    def _generate_ai_analysis(
        stats: StatCard,
        credit_usage: CreditUsageAnalysis,
        overdue_analysis: OverdueAnalysis
    ) -> List[AIAnalysisPoint]:
        """生成AI分析要点"""
        analysis_points = []
        point_number = 1

        # 1. 负债分析
        total_debt = stats.total_debt
        total_credit = stats.total_credit
        debt_ratio = (total_debt / total_credit * 100) if total_credit > 0 else 0

        analysis_points.append(AIAnalysisPoint(
            number=point_number,
            content=f"总负债金额为{total_debt:,}元，负债率{debt_ratio:.1f}%，"
                   f"{'负债率较高，建议降低负债' if debt_ratio > 70 else '负债率合理'}"
        ))
        point_number += 1

        # 2. 信用卡使用率分析
        usage_rate = credit_usage.usage_percentage
        risk_level = credit_usage.risk_level

        analysis_points.append(AIAnalysisPoint(
            number=point_number,
            content=f"信用卡使用率为{usage_rate:.1f}%，风险等级：{risk_level}，"
                   f"{'建议降低使用率至70%以下' if usage_rate > 70 else '使用率合理'}"
        ))
        point_number += 1

        # 3. 逾期分析
        severity = overdue_analysis.severity_level
        overdue_90plus = overdue_analysis.overdue_90plus

        if severity != "无逾期":
            analysis_points.append(AIAnalysisPoint(
                number=point_number,
                content=f"存在逾期记录，严重程度：{severity}，"
                       f"{'有90天以上逾期，严重影响信用' if overdue_90plus > 0 else '逾期较轻微'}"
            ))
            point_number += 1

        # 4. 查询次数分析
        query_count = stats.query_count_3m
        analysis_points.append(AIAnalysisPoint(
            number=point_number,
            content=f"近3个月查询次数为{query_count}次，"
                   f"{'查询次数过多，建议减少申请' if query_count > 6 else '查询次数正常'}"
        ))
        point_number += 1

        # 5. 综合建议
        if severity == "无逾期" and usage_rate < 50 and query_count < 6:
            suggestion = "信用状况良好，适合申请贷款"
        elif severity == "无逾期" and usage_rate < 70:
            suggestion = "信用状况一般，建议优化后申请"
        else:
            suggestion = "信用状况需要改善，建议先优化信用记录"

        analysis_points.append(AIAnalysisPoint(
            number=point_number,
            content=suggestion
        ))

        return analysis_points

    @staticmethod
    def _generate_loan_chart_data(
        loan_details: List[LoanDetail]
    ) -> List[LoanChart]:
        """生成贷款图表数据"""
        return [
            LoanChart(
                institution=loan.institution,
                credit_limit=loan.credit_limit,
                balance=loan.balance
            )
            for loan in loan_details
        ]

    @staticmethod
    def _generate_query_chart_data(
        query_records: List[QueryRecord]
    ) -> tuple:
        """生成查询记录图表数据"""
        # 按时间段统计查询次数
        from datetime import datetime, timedelta
        from collections import defaultdict

        period_stats = defaultdict(lambda: {"loan": 0, "card": 0, "guarantee": 0})

        for record in query_records:
            try:
                # query_date现在是date类型，直接使用
                period = record.query_date.strftime("%Y-%m")

                if "贷款" in record.reason:
                    period_stats[period]["loan"] += 1
                elif "信用卡" in record.reason:
                    period_stats[period]["card"] += 1
                elif "担保" in record.reason:
                    period_stats[period]["guarantee"] += 1
            except:
                pass

        # 排序并提取数据
        sorted_periods = sorted(period_stats.keys())[-6:]  # 最近6个月

        labels = sorted_periods
        loan_data = [period_stats[p]["loan"] for p in sorted_periods]
        card_data = [period_stats[p]["card"] for p in sorted_periods]
        guarantee_data = [period_stats[p]["guarantee"] for p in sorted_periods]

        return labels, loan_data, card_data, guarantee_data


