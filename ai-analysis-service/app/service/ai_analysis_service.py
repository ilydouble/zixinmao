"""
AI专家分析服务
使用GPT-4o模型生成智能的信用分析
"""
import json
import logging
from typing import List
from openai import OpenAI

from app.models.visualization_model import (
    AIExpertAnalysis,
    AIAnalysisPoint,
    PersonalInfo,
    StatCard,
    DebtItem,
    LoanDetail,
    LoanSummary,
    CreditCardDetail,
    CreditUsageAnalysis,
    OverdueAnalysis,
    QueryRecord,
    ProductRecommendation
)
from app.config.settings import settings

logger = logging.getLogger(__name__)


class AIAnalysisService:
    """AI专家分析服务"""

    def __init__(self):
        """初始化服务"""
        # 初始化OpenAI客户端
        self.client = OpenAI(
            base_url=settings.openai.base_url,
            api_key=settings.openai.api_key
        )
        self.model = settings.openai.model
        self.timeout = settings.openai.timeout
        self.temperature = settings.openai.temperature
    
    def generate_analysis(
        self,
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
        生成AI专家分析
        
        Args:
            personal_info: 个人信息
            stats: 统计卡片
            debt_composition: 负债构成
            bank_loans: 银行贷款列表
            non_bank_loans: 非银行贷款列表
            loan_summary: 贷款汇总
            credit_cards: 信用卡列表
            credit_usage: 信用卡使用分析
            overdue_analysis: 逾期分析
            query_records: 查询记录
            product_recommendations: 产品推荐列表
            
        Returns:
            AIExpertAnalysis: AI专家分析结果
        """
        try:
            # 构建用户信息摘要
            user_summary = self._build_user_summary(
                personal_info, stats, debt_composition, bank_loans, non_bank_loans,
                loan_summary, credit_cards, credit_usage, overdue_analysis, query_records
            )
            
            # 构建提示词
            prompt = self._build_prompt(user_summary, product_recommendations)
            
            # 调用大模型
            response = self._call_llm(prompt)
            
            # 解析响应
            analysis = self._parse_response(response)
            
            logger.info("✅ AI专家分析生成成功")
            return analysis
            
        except Exception as e:
            logger.error(f"❌ AI专家分析生成失败: {str(e)}")
            # 返回默认分析
            return self._get_default_analysis(stats, credit_usage, overdue_analysis)
    
    def _build_user_summary(
        self,
        personal_info: PersonalInfo,
        stats: StatCard,
        debt_composition: List[DebtItem],
        bank_loans: List[LoanDetail],
        non_bank_loans: List[LoanDetail],
        loan_summary: LoanSummary,
        credit_cards: List[CreditCardDetail],
        credit_usage: CreditUsageAnalysis,
        overdue_analysis: OverdueAnalysis,
        query_records: List[QueryRecord]
    ) -> dict:
        """构建用户信息摘要"""
        return {
            "个人信息": {
                "姓名": personal_info.name,
                "身份证号": personal_info.id_card,
                "年龄": personal_info.age,
                "婚姻状况": personal_info.marital_status
            },
            "信贷概况": {
                "总授信额度": stats.total_credit,
                "总负债": stats.total_debt,
                "可用额度": stats.total_credit - stats.total_debt,
                "近3个月查询次数": stats.query_count_3m
            },
            "负债构成": [
                {
                    "类型": item.type,
                    "机构数": item.institutions,
                    "账户数": item.accounts,
                    "授信额度": item.credit_limit,
                    "余额": item.balance,
                    "使用率": item.usage_rate
                }
                for item in debt_composition
            ],
            "贷款汇总": {
                "贷款机构数": loan_summary.institution_count,
                "贷款笔数": loan_summary.loan_count,
                "贷款总额": loan_summary.total_amount,
                "剩余待还": loan_summary.remaining_amount,
                "平均贷款期限": loan_summary.avg_period
            },
            "银行贷款": [
                {
                    "机构": loan.institution,
                    "账户状态": loan.account_status,
                    "贷款金额": loan.loan_amount,
                    "余额": loan.balance,
                    "剩余期限": loan.remaining_period
                }
                for loan in bank_loans[:5]  # 只取前5条
            ],
            "非银行贷款": [
                {
                    "机构": loan.institution,
                    "账户状态": loan.account_status,
                    "贷款金额": loan.loan_amount,
                    "余额": loan.balance,
                    "剩余期限": loan.remaining_period
                }
                for loan in non_bank_loans[:5]  # 只取前5条
            ],
            "信用卡情况": {
                "信用卡数量": len(credit_cards),
                "总授信额度": credit_usage.total_limit,
                "已用额度": credit_usage.used_amount,
                "使用率": f"{credit_usage.usage_percentage:.1f}%",
                "风险等级": credit_usage.risk_level
            },
            "逾期分析": {
                "严重程度": overdue_analysis.severity_level,
                "逾期机构数": overdue_analysis.overdue_institutions,
                "90天以上逾期": overdue_analysis.overdue_90plus,
                "最高逾期金额": overdue_analysis.max_overdue_amount
            },
            "查询记录": {
                "近3个月贷款审批": sum(1 for q in query_records if "贷款审批" in q.query_reason),
                "近3个月信用卡审批": sum(1 for q in query_records if "信用卡审批" in q.query_reason),
                "近3个月担保审查": sum(1 for q in query_records if "担保" in q.query_reason)
            }
        }
    
    def _build_prompt(self, user_summary: dict, product_recommendations: List[ProductRecommendation]) -> str:
        """构建提示词"""
        user_json = json.dumps(user_summary, ensure_ascii=False, indent=2)
        
        products_info = ""
        if product_recommendations:
            products_info = "\n\n已推荐产品：\n"
            for prod in product_recommendations:
                products_info += f"- {prod.bank} {prod.product_name}（评分：{prod.rating}星）\n"
        
        prompt = f"""你是一位资深的信用分析专家，请根据以下用户的征信数据，提供专业的信用分析报告。

用户征信数据：
{user_json}
{products_info}

请从以下几个方面进行分析：

1. **总结性分析（详细分析要点）**：
   - 分析用户的负债情况（总负债、负债率、负债构成）
   - 分析信用卡使用情况（使用率、风险等级）
   - 分析逾期情况（是否有逾期、严重程度）
   - 分析查询记录（查询次数、查询频率）
   - 分析贷款情况（贷款笔数、贷款金额、还款情况）
   - 每个分析要点应该包含具体的数据和评价
   - 至少提供5-8个分析要点

2. **贷款申请适合度**：
   - 根据用户的整体信用状况，评估其申请贷款的适合程度
   - 必须从以下选项中选择一个：非常适合、适合、一般、不太适合、不适合

3. **优化建议列表**：
   - 针对用户的信用状况，提供3-5条具体的优化建议
   - 建议应该具有可操作性和针对性

4. **风险提示**：
   - 指出用户当前信用状况中最需要注意的风险点
   - 提示应该简洁明了，突出重点

请以JSON格式返回分析结果，格式如下：
{{
  "analysis_points": [
    {{"number": 1, "content": "分析内容1"}},
    {{"number": 2, "content": "分析内容2"}},
    ...
  ],
  "suitability_rating": "适合",
  "optimization_suggestions": [
    "建议1",
    "建议2",
    ...
  ],
  "risk_warning": "风险提示内容"
}}

注意：
- analysis_points 必须包含5-8个要点
- suitability_rating 必须是：非常适合、适合、一般、不太适合、不适合 之一
- optimization_suggestions 必须包含3-5条建议
- 所有内容必须基于提供的数据，客观专业
- 使用中文输出
"""
        return prompt
    
    def _call_llm(self, prompt: str) -> str:
        """调用大模型"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "你是一位资深的信用分析专家，擅长分析个人征信报告并提供专业建议。请始终以JSON格式返回结构化的分析结果。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                timeout=self.timeout,
                temperature=self.temperature,
                response_format={"type": "json_object"}  # 强制返回JSON格式
            )
            
            content = response.choices[0].message.content
            logger.info(f"✅ 大模型调用成功，返回内容长度: {len(content)}")
            return content
            
        except Exception as e:
            logger.error(f"❌ 大模型调用失败: {str(e)}")
            raise
    
    def _parse_response(self, response: str) -> AIExpertAnalysis:
        """解析大模型响应"""
        try:
            # 解析JSON
            data = json.loads(response)
            
            # 构建分析要点
            analysis_points = []
            for point in data.get("analysis_points", []):
                analysis_points.append(AIAnalysisPoint(
                    number=point.get("number", 0),
                    content=point.get("content", "")
                ))
            
            # 构建AIExpertAnalysis对象
            analysis = AIExpertAnalysis(
                analysis_points=analysis_points,
                suitability_rating=data.get("suitability_rating", "一般"),
                optimization_suggestions=data.get("optimization_suggestions", []),
                risk_warning=data.get("risk_warning", "请注意保护个人信用记录")
            )
            
            return analysis
            
        except Exception as e:
            logger.error(f"❌ 解析响应失败: {str(e)}")
            raise
    
    def _get_default_analysis(
        self,
        stats: StatCard,
        credit_usage: CreditUsageAnalysis,
        overdue_analysis: OverdueAnalysis
    ) -> AIExpertAnalysis:
        """获取默认分析（当大模型调用失败时使用）"""
        logger.warning("⚠️ 大模型调用失败，使用默认规则生成分析")

        # 计算基础指标
        total_debt = stats.total_debt
        total_credit = stats.total_credit
        debt_ratio = (total_debt / total_credit * 100) if total_credit > 0 else 0
        usage_rate = credit_usage.usage_percentage
        risk_level = credit_usage.risk_level
        severity = overdue_analysis.severity_level
        overdue_90plus = overdue_analysis.overdue_90plus
        query_count = stats.query_count_3m

        # 生成分析要点
        analysis_points = []
        point_number = 1

        # 1. 负债情况分析
        if debt_ratio > 70:
            debt_comment = "负债率较高，建议降低负债以提升还款能力"
        elif debt_ratio > 50:
            debt_comment = "负债率适中，需注意控制新增负债"
        else:
            debt_comment = "负债率合理，财务状况良好"

        analysis_points.append(AIAnalysisPoint(
            number=point_number,
            content=f"总负债金额为{total_debt:,}元，总授信额度为{total_credit:,}元，负债率{debt_ratio:.1f}%。{debt_comment}"
        ))
        point_number += 1

        # 2. 信用卡使用情况分析
        if usage_rate > 80:
            usage_comment = "使用率过高，存在较大还款压力，建议尽快降低至70%以下"
        elif usage_rate > 70:
            usage_comment = "使用率偏高，建议降低至50%以下以提升信用评分"
        elif usage_rate > 50:
            usage_comment = "使用率适中，建议保持在50%以下"
        else:
            usage_comment = "使用率合理，财务状况稳健"

        analysis_points.append(AIAnalysisPoint(
            number=point_number,
            content=f"信用卡使用率为{usage_rate:.1f}%，风险等级为{risk_level}。{usage_comment}"
        ))
        point_number += 1

        # 3. 逾期情况分析
        if severity != "无逾期":
            if overdue_90plus > 0:
                overdue_comment = f"存在{overdue_90plus}笔90天以上严重逾期记录，严重影响信用评分，建议尽快处理"
            else:
                overdue_comment = f"存在逾期记录，严重程度为{severity}，建议尽快处理并保持良好还款习惯"

            analysis_points.append(AIAnalysisPoint(
                number=point_number,
                content=overdue_comment
            ))
            point_number += 1
        else:
            analysis_points.append(AIAnalysisPoint(
                number=point_number,
                content="无逾期记录，还款记录良好，信用状况优秀"
            ))
            point_number += 1

        # 4. 查询记录分析
        if query_count > 10:
            query_comment = "查询次数过多，频繁申请贷款可能影响审批，建议暂停申请3-6个月"
        elif query_count > 6:
            query_comment = "查询次数偏多，建议减少申请频率，避免影响信用评分"
        elif query_count > 3:
            query_comment = "查询次数适中，建议控制申请频率"
        else:
            query_comment = "查询次数正常，申请记录良好"

        analysis_points.append(AIAnalysisPoint(
            number=point_number,
            content=f"近3个月查询次数为{query_count}次。{query_comment}"
        ))
        point_number += 1

        # 5. 综合评价
        if severity == "无逾期" and usage_rate < 50 and query_count < 6 and debt_ratio < 50:
            overall_comment = "综合信用状况优秀，各项指标表现良好，非常适合申请贷款"
        elif severity == "无逾期" and usage_rate < 70 and query_count < 10:
            overall_comment = "综合信用状况良好，适合申请贷款，建议适当优化部分指标以获得更优惠的利率"
        elif severity == "无逾期":
            overall_comment = "综合信用状况一般，建议先优化信用卡使用率和查询次数后再申请贷款"
        else:
            overall_comment = "综合信用状况需要改善，建议先处理逾期记录，待信用状况好转后再申请贷款"

        analysis_points.append(AIAnalysisPoint(
            number=point_number,
            content=overall_comment
        ))

        # 确定贷款申请适合度
        if severity == "无逾期" and usage_rate < 50 and query_count < 6 and debt_ratio < 50:
            suitability_rating = "非常适合"
        elif severity == "无逾期" and usage_rate < 70 and query_count < 10:
            suitability_rating = "适合"
        elif severity == "无逾期":
            suitability_rating = "一般"
        elif severity != "无逾期" and overdue_90plus == 0:
            suitability_rating = "不太适合"
        else:
            suitability_rating = "不适合"

        # 生成优化建议
        optimization_suggestions = []

        # 逾期相关建议
        if severity != "无逾期":
            if overdue_90plus > 0:
                optimization_suggestions.append("立即处理90天以上严重逾期记录，这是影响信用的最关键因素")
            optimization_suggestions.append("尽快处理所有逾期账户，保持良好的还款习惯，避免再次逾期")
        else:
            optimization_suggestions.append("继续保持良好的还款记录，按时足额还款")

        # 信用卡使用率建议
        if usage_rate > 80:
            optimization_suggestions.append("信用卡使用率过高，建议尽快还款降低至50%以下，可显著提升信用评分")
        elif usage_rate > 70:
            optimization_suggestions.append("适当降低信用卡使用率至50%以下，有助于提升信用评分和贷款审批通过率")
        elif usage_rate > 50:
            optimization_suggestions.append("保持信用卡使用率在50%以下，避免过度使用信用卡")
        else:
            optimization_suggestions.append("保持合理的信用卡使用率，避免突然大额消费")

        # 查询次数建议
        if query_count > 10:
            optimization_suggestions.append("近期查询次数过多，建议暂停申请3-6个月，让查询记录自然减少")
        elif query_count > 6:
            optimization_suggestions.append("减少短期内的贷款申请频率，避免频繁查询影响信用评分")
        else:
            optimization_suggestions.append("控制查询次数，避免短期内频繁申请多家机构的贷款或信用卡")

        # 负债率建议
        if debt_ratio > 70:
            optimization_suggestions.append("负债率较高，建议优先偿还部分贷款，降低总体负债水平")

        # 生成风险提示
        if severity != "无逾期":
            if overdue_90plus > 0:
                risk_warning = "存在90天以上严重逾期记录，严重影响信用评分和贷款审批。请立即处理逾期账户，并保持至少6个月的良好还款记录后再申请贷款"
            else:
                risk_warning = f"存在逾期记录（严重程度：{severity}），请及时处理并保持良好还款习惯。逾期记录会在征信报告中保留5年，建议尽快改善信用状况"
        elif usage_rate > 80:
            risk_warning = "信用卡使用率过高（超过80%），存在较大还款压力，可能影响贷款审批。请注意控制消费，避免过度负债"
        elif query_count > 10:
            risk_warning = "近3个月查询次数过多（超过10次），频繁申请可能被金融机构视为资金紧张信号，建议暂停申请3-6个月"
        elif debt_ratio > 70:
            risk_warning = "负债率较高（超过70%），还款能力可能受限，建议优先降低负债后再申请新的贷款"
        else:
            risk_warning = "请注意保护个人信用记录，按时还款，避免逾期和过度负债。良好的信用记录是获得优惠贷款利率的关键"

        return AIExpertAnalysis(
            analysis_points=analysis_points,
            suitability_rating=suitability_rating,
            optimization_suggestions=optimization_suggestions,
            risk_warning=risk_warning
        )

