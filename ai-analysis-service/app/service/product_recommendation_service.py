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

logger = logging.getLogger(__name__)


class ProductRecommendationService:
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
            products_file = Path(__file__).parent.parent / "data" / "products.json"
            with open(products_file, 'r', encoding='utf-8') as f:
                products = json.load(f)
            logger.info(f"成功加载 {len(products)} 个产品")
            return products
        except Exception as e:
            logger.error(f"加载产品数据失败: {str(e)}")
            return []
    
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
        query_records: List[QueryRecord]
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
            
            # 构建产品信息摘要
            products_summary = self._build_products_summary()
            
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
            "贷款情况": {
                "银行贷款数": len(bank_loans),
                "非银贷款数": len(non_bank_loans),
                "平均期限": loan_summary.avg_period,
                "最高余额": loan_summary.max_balance,
                "最低余额": loan_summary.min_balance,
                "机构类型": loan_summary.institution_types
            },
            "信用卡情况": {
                "信用卡数量": len(credit_cards),
                "使用率": f"{credit_usage.usage_percentage}%",
                "风险等级": credit_usage.risk_level,
                "总额度": credit_usage.total_credit,
                "已用额度": credit_usage.used_credit,
                "可用额度": credit_usage.available_credit
            },
            "逾期情况": {
                "严重程度": overdue_analysis.severity_level,
                "90天以上逾期": overdue_analysis.overdue_90plus,
                "逾期机构数": len(overdue_analysis.institutions)
            },
            "查询记录": {
                "近3月查询": stats.query_count_3m
            }
        }
    
    def _build_products_summary(self) -> List[dict]:
        """构建产品信息摘要"""
        return [
            {
                "银行": product["bank_name"],
                "产品名称": product["product_name"],
                "年龄要求": product["product_features"]["age_range"],
                "最高额度": product["product_features"]["max_credit"],
                "最长期限": product["product_features"]["max_period"],
                "利率": product["product_features"]["min_rate"],
                "还款方式": product["product_features"]["repayment_methods"],
                "准入条件": product["admission_conditions"],
                "征信要求": product["credit_requirements"]
            }
            for product in self.products
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

