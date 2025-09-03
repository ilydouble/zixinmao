"""
AI分析提示词模板
"""

# 银行流水分析提示词
BANK_FLOW_PROMPT = """
你是一位专业的金融分析师，请仔细分析这份银行流水文件，并按照以下JSON格式返回结构化的分析结果：

{
  "summary": {
    "account_info": {
      "account_number": "账户号码",
      "account_name": "账户名称",
      "bank_name": "银行名称",
      "analysis_period": "分析期间"
    },
    "basic_stats": {
      "total_income": "总收入金额",
      "total_expense": "总支出金额",
      "net_flow": "净流水",
      "transaction_count": "交易笔数",
      "average_daily_balance": "日均余额"
    }
  },
  "income_analysis": {
    "salary_income": {
      "amount": "工资收入总额",
      "frequency": "发薪频率",
      "stability": "收入稳定性评分(1-10)"
    },
    "other_income": [
      {
        "type": "收入类型",
        "amount": "金额",
        "frequency": "频率"
      }
    ]
  },
  "expense_analysis": {
    "major_categories": [
      {
        "category": "支出类别",
        "amount": "金额",
        "percentage": "占比"
      }
    ],
    "large_transactions": [
      {
        "date": "日期",
        "amount": "金额",
        "description": "描述"
      }
    ]
  },
  "risk_assessment": {
    "risk_level": "风险等级(低/中/高)",
    "risk_factors": ["风险因素列表"],
    "credit_score": "信用评分(1-100)",
    "recommendations": ["建议列表"]
  },
  "monthly_trend": [
    {
      "month": "月份",
      "income": "收入",
      "expense": "支出",
      "balance": "余额"
    }
  ]
}

请确保：
1. 所有金额都转换为数字格式
2. 日期使用YYYY-MM-DD格式
3. 评分使用数字格式
4. 如果某些信息无法从文件中提取，请标注为"无法识别"
5. 只返回JSON格式，不要包含其他文字说明
"""

# 简版征信报告分析提示词
SIMPLE_CREDIT_PROMPT = """
你是一位专业的征信分析师，请仔细分析这份简版征信报告。

## 分析思维链：
请按照以下步骤进行分析，确保准确性和一致性：

### 第一步：基础信息提取
1. 仔细阅读报告，提取被查询人姓名、身份证号、报告日期等基本信息
2. 统计所有账户数量（信用卡+贷款+其他）
3. 识别所有银行和金融机构名称

### 第二步：账户信息统计
1. 逐一统计每张信用卡的授信额度
2. 逐一统计每笔贷款的金额
3. 计算信用卡总额度 = 所有信用卡额度之和
4. 计算贷款总额度 = 所有贷款金额之和
5. 计算总授信额度 = 信用卡总额度 + 贷款总额度

### 第三步：还款记录分析
1. 查找所有逾期记录，统计逾期次数和天数
2. 分析最近12个月的还款表现
3. 识别是否有呆账、代偿等严重不良记录

### 第四步：查询记录统计
1. 统计近6个月的查询次数
2. 统计近12个月的查询次数
3. 区分硬查询和软查询

### 第五步：信用评分计算
根据以下规则逐步计算：
- 基础分：600分
- 根据还款记录调整分数
- 根据信用使用率调整分数
- 根据查询次数调整分数
- 得出最终评分

### 第六步：等级判定
根据最终评分确定信用等级：
- 850-950分：AAA级
- 750-849分：AA级
- 650-749分：A级
- 550-649分：B级
- 350-549分：C级
- <350分：D级

## 重要分析规则：

### 信用评分估算规则（1-950分）：
- 基础分：600分
- 无逾期记录：+100分
- 有1-2次轻微逾期（1-30天）：-50分
- 有3-5次逾期：-100分
- 有严重逾期（90天以上）：-150分
- 账户数量多（10个以上）：+50分
- 信用卡使用率低（<30%）：+50分
- 信用卡使用率高（>70%）：-50分
- 查询次数少（近6个月<3次）：+30分
- 查询次数多（近6个月>6次）：-50分

### 信用等级对应：
- 850-950分：AAA级（优秀）
- 750-849分：AA级（良好）
- 650-749分：A级（一般）
- 550-649分：B级（较差）
- 350-549分：C级（很差）
- <350分：D级（极差）

### 总授信额度估算：
- 仔细查找文档中所有银行的信用卡额度、贷款额度
- 将所有可识别的授信额度相加
- 如果无法识别具体数字，根据账户数量估算：
  - 信用卡平均额度：2-5万/张
  - 房贷：50-200万
  - 车贷：10-30万
  - 消费贷：5-20万

请仔细分析这份简版征信报告，并按照以下JSON格式返回结构化的分析结果：

{
  "summary": {
    "report_info": {
      "report_date": "报告日期",
      "subject_name": "被查询人姓名",
      "id_number": "身份证号(脱敏)",
      "query_reason": "查询原因"
    },
    "credit_overview": {
      "credit_score": "信用评分（根据规则估算的数字）",
      "credit_level": "信用等级（AAA/AA/A/B/C/D）",
      "total_accounts": "账户总数",
      "total_credit_limit": "总授信额度（所有银行额度总和，数字格式）",
      "score_breakdown": {
        "base_score": 600,
        "payment_history_score": "还款历史得分调整",
        "utilization_score": "使用率得分调整",
        "inquiry_score": "查询次数得分调整",
        "final_score": "最终计算得分"
      }
    }
  },
  "account_summary": {
    "credit_cards": {
      "total_cards": "信用卡总数",
      "total_limit": "总额度",
      "used_amount": "已用额度",
      "utilization_rate": "使用率"
    },
    "loans": {
      "total_loans": "贷款总数",
      "total_amount": "贷款总额",
      "remaining_balance": "剩余余额"
    }
  },
  "payment_history": {
    "overdue_summary": {
      "current_overdue": "当前逾期笔数",
      "max_overdue_days": "最长逾期天数",
      "overdue_amount": "逾期金额"
    },
    "payment_behavior": {
      "on_time_rate": "按时还款率",
      "recent_queries": "近期查询次数",
      "query_institutions": ["查询机构列表"]
    }
  },
  "risk_assessment": {
    "risk_level": "风险等级(低/中/高)",
    "risk_factors": ["风险因素列表"],
    "positive_factors": ["正面因素列表"],
    "recommendations": ["建议列表"]
  },
  "detailed_accounts": [
    {
      "account_type": "账户类型",
      "institution": "机构名称",
      "account_status": "账户状态",
      "credit_limit": "授信额度",
      "balance": "余额",
      "overdue_info": "逾期信息"
    }
  ]
}

## 一致性检查要求：
在输出结果前，请进行以下检查：
1. **基础信息一致性**：姓名、身份证号等基础信息必须准确
2. **账户数量合理性**：总账户数应该等于信用卡数量+贷款数量+其他账户数量
3. **金额计算准确性**：总授信额度 = 信用卡总额度 + 贷款总额度
4. **评分逻辑合理性**：评分应该在350-950分之间，等级应该与评分匹配
5. **数据格式统一性**：所有数字字段必须是数字格式，不能是文字描述

请确保：
1. 所有金额都转换为数字格式（如：50000，不是"5万"）
2. 日期使用YYYY-MM-DD格式
3. 百分比使用小数格式(如0.85表示85%)
4. 敏感信息进行脱敏处理
5. **必须根据思维链步骤计算信用评分，不能标注为"无法识别"**
6. **必须精确计算总授信额度，逐项相加所有银行的额度**
7. **信用等级必须根据评分严格对应，不能为"无法识别"**
8. **评分计算过程必须在score_breakdown中详细展示**
9. 只返回JSON格式，不要包含其他文字说明
"""

# 详版征信报告分析提示词
DETAIL_CREDIT_PROMPT = """
你是一位专业的征信分析师，请仔细分析这份详版征信报告。

## 分析思维链：
请按照以下步骤进行分析，确保准确性和一致性：

### 第一步：基础信息提取
1. 仔细阅读报告头部，提取被查询人完整信息（姓名、身份证、性别、出生日期、婚姻状况、学历等）
2. 记录报告日期、报告编号、查询原因
3. 统计报告中的总账户数量

### 第二步：账户详情分析
1. **信用卡账户**：
   - 逐一记录每张信用卡的发卡机构、账户状态、授信额度、已用额度
   - 计算每张卡的使用率 = 已用额度/授信额度
   - 计算信用卡总授信额度
   - 计算平均使用率

2. **贷款账户**：
   - 逐一记录每笔贷款的机构、类型、原始金额、剩余余额、月还款额
   - 计算贷款总金额
   - 分析贷款类型分布（房贷、车贷、消费贷等）

### 第三步：还款历史深度分析
1. **逾期记录统计**：
   - 统计总逾期次数
   - 记录最长逾期天数
   - 分析逾期严重程度分布（1-30天、31-60天、61-90天、90天以上）
   - 计算近12个月逾期次数

2. **还款表现评估**：
   - 计算按时还款率 = (总期数-逾期次数)/总期数
   - 识别是否有呆账、代偿、止付等严重记录

### 第四步：查询记录分析
1. 统计近6个月查询次数（按机构和原因分类）
2. 统计近12个月查询次数
3. 区分硬查询（贷款审批、信用卡审批）和软查询
4. 分析查询频率趋势

### 第五步：信用历史长度计算
1. 找到最早开户的账户日期
2. 计算信用历史总长度（年）
3. 分析账户开户时间分布

### 第六步：综合信用评分计算
按权重逐步计算：
1. **还款历史（35%权重）**：根据逾期情况调整分数
2. **信用使用率（30%权重）**：根据平均使用率调整分数
3. **信用历史长度（15%权重）**：根据历史长度调整分数
4. **账户类型多样性（10%权重）**：根据账户类型丰富度调整分数
5. **查询记录（10%权重）**：根据查询频率调整分数
6. 计算最终得分 = 600 + 各项调整分数之和

### 第七步：风险评估和等级判定
1. 根据最终评分确定信用等级
2. 识别主要风险因素和正面因素
3. 提供改善建议

## 重要分析规则：

### 信用评分估算规则（1-950分）：
- 基础分：600分
- 还款历史（35%权重）：
  * 无逾期记录：+120分
  * 有1-2次轻微逾期（1-30天）：-30分
  * 有3-5次逾期：-60分
  * 有6-10次逾期：-100分
  * 有严重逾期（90天以上）：-150分
  * 有呆账、代偿：-200分
- 信用使用率（30%权重）：
  * 使用率<10%：+80分
  * 使用率10-30%：+50分
  * 使用率30-50%：+20分
  * 使用率50-70%：-20分
  * 使用率>70%：-60分
- 信用历史长度（15%权重）：
  * >10年：+50分
  * 5-10年：+30分
  * 2-5年：+10分
  * <2年：-10分
- 账户类型多样性（10%权重）：
  * 有信用卡+房贷+车贷：+30分
  * 有信用卡+1种贷款：+20分
  * 只有信用卡：+10分
  * 只有贷款：+5分
- 新开账户/查询记录（10%权重）：
  * 近6个月查询<3次：+30分
  * 近6个月查询3-6次：0分
  * 近6个月查询>6次：-40分

### 信用等级对应：
- 850-950分：AAA级（优秀）
- 750-849分：AA级（良好）
- 650-749分：A级（一般）
- 550-649分：B级（较差）
- 350-549分：C级（很差）
- <350分：D级（极差）

### 总授信额度计算：
- 精确统计所有信用卡的授信额度总和
- 加上所有贷款的原始放款金额
- 分别列出：信用卡总额度、贷款总额度、合计总额度

请仔细分析这份详版征信报告，并按照以下JSON格式返回结构化的分析结果：

{
  "summary": {
    "report_info": {
      "report_date": "报告日期",
      "subject_name": "被查询人姓名",
      "id_number": "身份证号(脱敏)",
      "query_reason": "查询原因",
      "report_number": "报告编号"
    },
    "personal_info": {
      "gender": "性别",
      "birth_date": "出生日期",
      "marital_status": "婚姻状况",
      "education": "学历",
      "residence_address": "居住地址(脱敏)"
    },
    "credit_overview": {
      "credit_score": "信用评分（根据详细规则估算的数字）",
      "credit_level": "信用等级（AAA/AA/A/B/C/D）",
      "total_accounts": "账户总数",
      "total_credit_limit": "总授信额度（数字格式）",
      "total_balance": "总余额",
      "credit_card_limit": "信用卡总额度",
      "loan_total_amount": "贷款总额度",
      "score_breakdown": {
        "base_score": 600,
        "payment_history_score": "还款历史得分（35%权重）",
        "utilization_score": "信用使用率得分（30%权重）",
        "history_length_score": "信用历史长度得分（15%权重）",
        "account_mix_score": "账户类型多样性得分（10%权重）",
        "inquiry_score": "查询记录得分（10%权重）",
        "final_score": "最终计算得分"
      }
    }
  },
  "account_details": {
    "credit_cards": [
      {
        "institution": "发卡机构",
        "account_number": "账户号(脱敏)",
        "account_status": "账户状态",
        "open_date": "开户日期",
        "credit_limit": "授信额度",
        "used_amount": "已用额度",
        "current_balance": "当前余额",
        "last_payment_date": "最后还款日期",
        "payment_status": "还款状态"
      }
    ],
    "loans": [
      {
        "institution": "放贷机构",
        "loan_type": "贷款类型",
        "account_number": "账户号(脱敏)",
        "loan_amount": "贷款金额",
        "remaining_balance": "剩余余额",
        "monthly_payment": "月还款额",
        "loan_term": "贷款期限",
        "interest_rate": "利率",
        "start_date": "放款日期",
        "payment_status": "还款状态"
      }
    ]
  },
  "payment_history": {
    "overdue_records": [
      {
        "institution": "机构名称",
        "account_type": "账户类型",
        "overdue_date": "逾期日期",
        "overdue_days": "逾期天数",
        "overdue_amount": "逾期金额",
        "settlement_date": "结清日期"
      }
    ],
    "payment_statistics": {
      "total_overdue_count": "总逾期次数",
      "max_overdue_days": "最长逾期天数",
      "recent_overdue_count": "近12个月逾期次数",
      "on_time_payment_rate": "按时还款率"
    }
  },
  "query_records": {
    "recent_queries": [
      {
        "query_date": "查询日期",
        "query_institution": "查询机构",
        "query_reason": "查询原因"
      }
    ],
    "query_statistics": {
      "total_queries_6m": "近6个月查询次数",
      "total_queries_12m": "近12个月查询次数",
      "hard_inquiry_count": "硬查询次数"
    }
  },
  "risk_assessment": {
    "overall_risk_level": "整体风险等级(低/中/高)",
    "risk_score": "风险评分(1-100)",
    "risk_factors": [
      {
        "factor": "风险因素",
        "severity": "严重程度",
        "description": "详细描述"
      }
    ],
    "positive_factors": [
      {
        "factor": "正面因素",
        "impact": "影响程度",
        "description": "详细描述"
      }
    ],
    "recommendations": [
      {
        "category": "建议类别",
        "suggestion": "具体建议",
        "priority": "优先级"
      }
    ]
  },
  "trend_analysis": {
    "credit_utilization_trend": "授信使用率趋势",
    "payment_behavior_trend": "还款行为趋势",
    "account_growth_trend": "账户增长趋势"
  }
}

## 一致性检查要求：
在输出结果前，请进行以下检查：
1. **基础信息一致性**：个人信息必须与报告中的信息完全一致
2. **账户统计准确性**：各类账户数量统计必须准确，总数必须匹配
3. **金额计算准确性**：
   - 信用卡总额度 = 各张信用卡额度之和
   - 贷款总额度 = 各笔贷款金额之和
   - 总授信额度 = 信用卡总额度 + 贷款总额度
4. **评分计算逻辑性**：
   - 各维度得分调整必须有依据
   - 最终得分 = 600 + 各项调整分数
   - 评分必须在350-950分范围内
5. **等级匹配准确性**：信用等级必须严格按评分区间对应

请确保：
1. 所有金额都转换为数字格式（如：500000，不是"50万"）
2. 日期使用YYYY-MM-DD格式
3. 百分比使用小数格式(如0.85表示85%)
4. 敏感信息进行脱敏处理
5. **必须按思维链步骤逐步分析，确保逻辑清晰**
6. **必须精确计算各项金额，分别统计信用卡和贷款额度**
7. **信用评分必须按5个维度加权计算，不能为"无法识别"**
8. **信用等级必须根据评分严格对应，不能为"无法识别"**
9. **score_breakdown必须详细展示每个维度的计算过程**
10. 只返回JSON格式，不要包含其他文字说明
"""

# 提示词映射
PROMPT_TEMPLATES = {
    "flow": BANK_FLOW_PROMPT,
    "simple": SIMPLE_CREDIT_PROMPT,
    "detail": DETAIL_CREDIT_PROMPT
}


def get_prompt_template(report_type: str, custom_prompt: str = None) -> str:
    """
    获取提示词模板
    
    Args:
        report_type: 报告类型
        custom_prompt: 自定义提示词
    
    Returns:
        提示词字符串
    """
    if custom_prompt:
        return custom_prompt
    
    return PROMPT_TEMPLATES.get(report_type, BANK_FLOW_PROMPT)
