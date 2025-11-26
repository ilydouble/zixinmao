"""
产品推荐服务
使用大模型根据用户信用状况推荐合适的金融产品
"""
import json
import logging
from typing import List
from pathlib import Path
from openai import OpenAI

from app.models.visualization_model import (
    PersonalInfo,
    StatCard,
    DebtItem,
    LoanDetail,
    CreditCardDetail,
    LoanSummary,
    CreditUsageAnalysis,
    OverdueAnalysis,
    QueryRecord,
    ProductRecommendation
)
from app.config.settings import settings
from app.models.report_model import CustomerInfo

logger = logging.getLogger(__name__)


class ProductRecommendService:
    """产品推荐服务"""

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

        # 加载产品数据
        self.products = self._load_products()
    
    def _load_products(self) -> List[dict]:
        """加载产品数据"""
        try:
            products_file = Path(__file__).parent.parent / "data" / "product_standard.json"
            with open(products_file, 'r', encoding='utf-8') as f:
                products = json.load(f)
            logger.info(f"成功加载 {len(products)} 个产品")
            return products
        except Exception as e:
            logger.error(f"加载产品数据失败: {str(e)}")
            return []
        
    def _filter_product(
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
            customer_info: CustomerInfo = None) -> List[dict]:
        """
        筛选符合条件的产品

        Args:
            personal_info: 个人信息
            customer_info: 客户信息
            其他参数用于后续扩展筛选条件

        Returns:
            符合条件的产品列表
        """
        try:
            result = []

            # 检查是否缴纳公积金
            if customer_info is not None and customer_info.hasProvidentFund is False:
                logger.info(f"用户未缴纳公积金，不推荐任何产品")
                return []

            # 获取用户年龄
            try:
                user_age = int(personal_info.age)
            except (ValueError, TypeError):
                logger.warning(f"无法解析用户年龄: {personal_info.age}，将不进行年龄筛选")
                user_age = None

            for product in self.products:
                product_name = product.get('product_name', '未知产品')

                # 检查年龄范围
                if user_age is not None:
                    age_range = product.get("age_range")
                    if age_range and not self._check_age_in_range(user_age, age_range):
                        logger.debug(f"产品 {product_name} 年龄要求 {age_range} 不符合用户年龄 {user_age}")
                        continue

                # 检查优质单位要求
                if product.get("admission_conditions_quality_unit"):
                    if not self._check_quality_unit_requirement(customer_info):
                        logger.debug(f"产品 {product_name} 要求优质单位，用户不符合条件")
                        continue

                # 检查公积金基数要求
                required_provident_fund_base = product.get("admission_conditions_provident_fund_base")
                if required_provident_fund_base is not None:
                    if not self._check_provident_fund_base_requirement(customer_info, required_provident_fund_base):
                        logger.debug(f"产品 {product_name} 要求公积金基数 > {required_provident_fund_base}，用户不符合条件")
                        continue

                # 检查当前逾期要求
                overdue_requirements_current = product.get("overdue_requirements_current")
                if overdue_requirements_current == "无":
                    if not self._check_no_current_overdue_requirement(credit_cards):
                        logger.debug(f"产品 {product_name} 要求无当前逾期，用户信用卡存在非正常状态")
                        continue

                # 其他筛选条件可在此添加
                # 例如：公积金连续缴存月数等

                result.append(product)

            logger.info(f"筛选后产品数量: {len(result)}/{len(self.products)}")
            return result

        except Exception as e:
            logger.error(f"筛选产品数据失败: {str(e)}")
            return []

    def _check_age_in_range(self, age: int, age_range: str) -> bool:
        """
        检查年龄是否在指定范围内

        Args:
            age: 用户年龄（整数）
            age_range: 年龄范围字符串，格式如 "18-65" 或 "18-65岁"

        Returns:
            True 表示年龄符合范围，False 表示不符合
        """
        try:
            # 移除"岁"字符
            age_range = age_range.replace("岁", "").strip()

            # 分割年龄范围
            if "-" not in age_range:
                logger.warning(f"年龄范围格式不正确: {age_range}")
                return True  # 格式不正确时默认符合

            parts = age_range.split("-")
            if len(parts) != 2:
                logger.warning(f"年龄范围格式不正确: {age_range}")
                return True

            try:
                min_age = int(parts[0].strip())
                max_age = int(parts[1].strip())
            except ValueError:
                logger.warning(f"年龄范围包含非数字: {age_range}")
                return True

            # 检查年龄是否在范围内
            return min_age <= age <= max_age

        except Exception as e:
            logger.error(f"检查年龄范围失败: {str(e)}, age_range: {age_range}")
            return True  # 出错时默认符合

    def _check_quality_unit_requirement(self, customer_info: CustomerInfo) -> bool:
        """
        检查是否满足优质单位要求

        优质单位包括：机关及事业单位、国有企业、大型上市公司及大型民企

        Args:
            customer_info: 客户信息

        Returns:
            True 表示满足优质单位要求，False 表示不满足
        """
        # 定义优质单位列表
        quality_units = [
            "机关及事业单位",
            "国有企业",
            "大型上市公司及大型民企"
        ]

        try:
            # 如果没有提供客户信息，默认不符合
            if not customer_info:
                logger.debug("未提供客户信息，无法验证优质单位要求")
                return False

            # 获取单位性质
            company_nature = customer_info.companyNature

            # 如果没有提供单位性质，默认不符合
            if not company_nature:
                logger.debug("未提供单位性质，无法验证优质单位要求")
                return False

            # 检查单位性质是否在优质单位列表中
            is_quality_unit = company_nature in quality_units

            if is_quality_unit:
                logger.debug(f"用户单位性质 '{company_nature}' 符合优质单位要求")
            else:
                logger.debug(f"用户单位性质 '{company_nature}' 不符合优质单位要求")

            return is_quality_unit

        except Exception as e:
            logger.error(f"检查优质单位要求失败: {str(e)}")
            return False  # 出错时默认不符合

    def _check_provident_fund_base_requirement(self, customer_info: CustomerInfo, required_base: int) -> bool:
        """
        检查是否满足公积金基数要求

        Args:
            customer_info: 客户信息
            required_base: 产品要求的最低公积金基数

        Returns:
            True 表示满足公积金基数要求，False 表示不满足
        """
        try:
            # 如果没有提供客户信息，默认不符合
            if not customer_info:
                logger.debug(f"未提供客户信息，无法验证公积金基数要求 (要求: > {required_base})")
                return False

            # 获取用户的公积金基数
            user_provident_fund_base = customer_info.providentFundBase

            # 如果用户没有缴纳公积金或未提供公积金基数，默认不符合
            if user_provident_fund_base is None:
                logger.debug(f"用户未提供公积金基数，无法满足要求 (要求: > {required_base})")
                return False

            # 检查公积金基数是否大于要求值
            meets_requirement = user_provident_fund_base > required_base

            if meets_requirement:
                logger.debug(f"用户公积金基数 {user_provident_fund_base} 符合要求 (要求: > {required_base})")
            else:
                logger.debug(f"用户公积金基数 {user_provident_fund_base} 不符合要求 (要求: > {required_base})")

            return meets_requirement

        except Exception as e:
            logger.error(f"检查公积金基数要求失败: {str(e)}, required_base: {required_base}")
            return False  # 出错时默认不符合

    def _check_no_current_overdue_requirement(self, credit_cards: List[CreditCardDetail]) -> bool:
        """
        检查是否满足无当前逾期要求

        当产品要求 overdue_requirements_current 为 "无" 时，
        所有信用卡的 status 都必须为 "正常"

        Args:
            credit_cards: 信用卡列表

        Returns:
            True 表示满足无当前逾期要求，False 表示不满足
        """
        try:
            # 如果没有信用卡，默认符合要求
            if not credit_cards:
                logger.debug("用户无信用卡，符合无当前逾期要求")
                return True

            # 检查所有信用卡状态
            for card in credit_cards:
                card_status = card.status

                # 如果信用卡状态不是 "正常"，则不符合要求
                if card_status != "正常":
                    logger.debug(f"信用卡 {card.institution} 状态为 '{card_status}'，不符合无当前逾期要求")
                    return False

            logger.debug(f"所有 {len(credit_cards)} 张信用卡状态都为正常，符合无当前逾期要求")
            return True

        except Exception as e:
            logger.error(f"检查无当前逾期要求失败: {str(e)}")
            return False  # 出错时默认不符合
    
    def generate_recommendations(
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
        customer_info: CustomerInfo = None,
    ) -> List[ProductRecommendation]:
        """
        生成产品推荐
        
        Args:
            personal_info: 个人信息
            stats: 统计概览
            debt_composition: 负债构成
            bank_loans: 银行贷款列表
            non_bank_loans: 非银机构贷款列表
            loan_summary: 贷款汇总
            credit_cards: 信用卡列表
            credit_usage: 信用卡使用率分析
            overdue_analysis: 逾期分析
            query_records: 查询记录
            
        Returns:
            产品推荐列表
        """
        try:
            # 构建用户信息摘要
            user_summary = self._build_user_summary(
                personal_info, stats, debt_composition, bank_loans, non_bank_loans,
                loan_summary, credit_cards, credit_usage, overdue_analysis, query_records
            )

            # 筛选产品数据
            filtered_products = self._filter_product(
                personal_info, stats, debt_composition, bank_loans, non_bank_loans,
                loan_summary, credit_cards, credit_usage, overdue_analysis, query_records,
                customer_info
            )

            # 构建产品信息摘要
            products_summary = self._build_products_summary(filtered_products)
            
            # 构建提示词
            prompt = self._build_prompt(user_summary, products_summary)
            
            # 调用大模型
            response = self._call_llm(prompt)
            
            # 解析响应
            recommendations = self._parse_response(response)
            
            logger.info(f"成功生成 {len(recommendations)} 个产品推荐")
            return recommendations
            
        except Exception as e:
            logger.error(f"生成产品推荐失败: {str(e)}")
            # 返回默认推荐
            return self._get_default_recommendations()
    
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
                "总负债金额": stats.total_debt,
                "总机构数": stats.total_institutions,
                "贷款机构数": stats.loan_institutions,
                "历史逾期月份": stats.overdue_months,
                "近3月查询次数": stats.query_count_3m
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
                "平均贷款期限": loan_summary.avg_period,
                "最高单笔贷款余额": loan_summary.max_balance,
                "最小单笔贷款余额": loan_summary.min_balance,
                "贷款机构类型": loan_summary.institution_types,
                "银行贷款笔数": len(bank_loans),
                "非银行贷款笔数": len(non_bank_loans)
            },
            "银行贷款": [
                {
                    "机构": loan.institution,
                    "业务类型": loan.business_type,
                    "授信额度": loan.credit_limit,
                    "余额": loan.balance,
                    "剩余期限": loan.remaining_period,
                    "使用率": loan.usage_rate
                }
                for loan in bank_loans[:5]  # 只取前5条
            ],
            "非银行贷款": [
                {
                    "机构": loan.institution,
                    "业务类型": loan.business_type,
                    "授信额度": loan.credit_limit,
                    "余额": loan.balance,
                    "剩余期限": loan.remaining_period,
                    "使用率": loan.usage_rate
                }
                for loan in non_bank_loans[:5]  # 只取前5条
            ],
            "信用卡情况": {
                "信用卡数量": len(credit_cards),
                "总授信额度": credit_usage.total_credit,
                "已用额度": credit_usage.used_credit,
                "使用率": f"{credit_usage.usage_percentage:.1f}%",
                "风险等级": credit_usage.risk_level
            },
            "信用卡明细": [
                {
                    "机构": card.institution,
                    "授信额度": card.credit_limit,
                    "已用额度": card.used_amount,
                    "使用率": card.usage_rate,
                    "当前状态": card.status,
                    "历史逾期": card.overdue_history
                }
                for card in credit_cards[:5]  # 只取前5条
            ],
            "逾期分析": {
                "严重程度": overdue_analysis.severity_level,
                "逾期机构数": len(overdue_analysis.institutions),
                "90天以上逾期月数": overdue_analysis.overdue_90plus,
                "30-90天逾期月数": overdue_analysis.overdue_30_90,
                "30天以内逾期月数": overdue_analysis.overdue_under_30
            },
            "查询记录明细": [
                {
                    "时间段": q.period,
                    "贷款审批": q.loan_approval,
                    "信用卡审批": q.credit_card_approval,
                    "担保资格审查": q.guarantee_review,
                    "保前审查": q.insurance_review,
                    "资信审查": q.credit_review,
                    "非贷后管理查询": q.non_post_loan,
                    "本人查询": q.self_query
                }
                for q in query_records
            ]
        }
    
    def _build_products_summary(self, products: List[dict]) -> List[dict]:
        """构建产品信息摘要"""
        return [
            {
                "银行": product["bank_name"],
                "产品名称": product["product_name"],
                "地区": product["region"],
                "年龄要求": product["age_range"],
                "最高额度": product["max_credit"],
                "最长期限": product["max_period"],
                "利率": product["min_rate"],
                "还款方式": product["repayment_methods"],
                "准入条件": product["admission_conditions"],
                "准入条件-优质单位": product["admission_conditions_quality_unit"],
                "准入条件-公积金基数": product["admission_conditions_provident_fund_base"],
                "准入条件-公积金连续缴存月数": product["admission_conditions_provident_fund_months"],
                "查询要求": product["query_requirements"],
                "逾期要求": product["overdue_requirements"],
                "负债要求": product["debt_requirements"],
                "信用卡使用率要求": product["credit_card_usage_rate"],
                "征信白户是否准入": product["white_user_allowed"],
                "额度算法": product["credit_calculation"]
            }
            for product in products
        ]
    
    def _build_prompt(self, user_summary: dict, products_summary: List[dict]) -> str:
        """构建提示词"""
        prompt = f"""你是一位专业的金融产品推荐专家。请根据用户的信用状况和产品信息，推荐最合适的3-5个金融产品。

# 用户信息
{json.dumps(user_summary, ensure_ascii=False, indent=2)}

# 可选产品列表
{json.dumps(products_summary, ensure_ascii=False, indent=2)}

# 推荐要求
1. 根据用户的征信情况（查询次数、逾期记录、负债情况、信用卡使用率等）筛选符合条件的产品
2. 优先推荐征信要求与用户情况匹配度高的产品
3. 考虑产品的利率、额度、期限等因素
4. 为每个推荐产品给出1-5星的推荐指数（5星最高）
5. 为每个推荐产品提供具体的申请建议

# 输出格式
请严格按照以下JSON格式输出，不要包含任何其他文字：

```json
{{
  "recommendations": [
    {{
      "bank": "银行名称",
      "product_name": "产品名称",
      "min_rate": "利率（如：3.28%-7.68% 或 3%）",
      "max_credit": "最高额度（如：50万元）",
      "rating": 5,
      "suggestion": "申请建议"
    }}
  ]
}}
```

注意：
- 推荐3-5个产品
- rating必须是1-5之间的整数
- 按推荐指数从高到低排序
- 如果用户征信情况较差，应推荐门槛较低的产品并给出改善建议
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
                        "content": "你是一位专业的金融产品推荐专家，擅长根据用户的信用状况推荐合适的金融产品。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                timeout=self.timeout,
                temperature=self.temperature
            )
            
            content = response.choices[0].message.content
            logger.info(f"大模型响应: {content[:200]}...")
            return content
            
        except Exception as e:
            logger.error(f"调用大模型失败: {str(e)}")
            raise
    
    def _parse_response(self, response: str) -> List[ProductRecommendation]:
        """解析大模型响应"""
        try:
            # 提取JSON部分
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                raise ValueError("响应中未找到JSON格式数据")
            
            json_str = response[json_start:json_end]
            data = json.loads(json_str)
            
            # 转换为ProductRecommendation对象
            recommendations = []
            for item in data.get("recommendations", []):
                recommendations.append(ProductRecommendation(
                    bank=item["bank"],
                    product_name=item["product_name"],
                    min_rate=item["min_rate"],
                    max_credit=item["max_credit"],
                    rating=item["rating"],
                    suggestion=item["suggestion"]
                ))
            
            return recommendations
            
        except Exception as e:
            logger.error(f"解析响应失败: {str(e)}, 响应内容: {response}")
            raise
    
    def _get_default_recommendations(self) -> List[ProductRecommendation]:
        """获取默认推荐（当大模型调用失败时使用）"""
        logger.warning("大模型调用失败，返回空推荐列表")
        return []

