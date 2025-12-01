import pandas as pd
import json
import re
import math

def parse_json_field(value, field_type=None):
    """解析JSON字段"""
    if pd.isna(value) or value is None:
        return None

    if isinstance(value, (int, float)):
        if math.isnan(value):
            return None
        return value

    value_str = str(value).strip()
    if not value_str or value_str.lower() == 'nan':
        return None

    # 替换中文冒号和分号
    value_str = value_str.replace('：', ':').replace(';', ',')

    # 替换中文引号
    value_str = value_str.replace('"', '"').replace('"', '"')

    try:
        # 尝试解析为JSON
        parsed = json.loads(value_str)

        # 如果是统计类字段，需要转换键名为英文
        if field_type in ['query_stats', 'overdue_stats']:
            if isinstance(parsed, list):
                result = []
                for item in parsed:
                    if isinstance(item, dict):
                        new_item = {}
                        for k, v in item.items():
                            if k == '月份':
                                new_item['months'] = v
                            elif k == '次数':
                                new_item['times'] = v
                            elif k == '连续月份':
                                new_item['consecutive_months'] = v
                            elif k == '累计月份':
                                new_item['cumulative_months'] = v
                            else:
                                new_item[k] = v
                        result.append(new_item)
                    else:
                        result.append(item)
                return result

        # 如果是负债要求字段，需要转换键名为英文
        if field_type == 'debt_requirements':
            if isinstance(parsed, dict):
                new_dict = {}
                for k, v in parsed.items():
                    if k == '信用类负债':
                        new_dict['credit_debt'] = v
                    elif k == '总负债-公积金':
                        new_dict['total_debt_provident_fund_ratio'] = v
                    elif k == '总负债-金额':
                        new_dict['total_debt_amount'] = v
                    else:
                        new_dict[k] = v
                return new_dict

        return parsed
    except:
        # 如果解析失败，返回原字符串
        return value_str

def parse_region(value):
    """解析地区字段"""
    if pd.isna(value):
        return None
    
    value_str = str(value).strip()
    # 替换中文引号
    value_str = value_str.replace('"', '"').replace('"', '"')
    
    try:
        return json.loads(value_str)
    except:
        return [value_str]

def safe_convert(value):
    """安全转换值，处理NaN"""
    if pd.isna(value):
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    return value

# 读取Excel文件
excel_file = 'app/data/product_standard(2).xlsx'
df = pd.read_excel(excel_file)

# 转换数据
products = []
for _, row in df.iterrows():
    product = {
        "region": parse_region(row['地区']),
        "bank_name": safe_convert(row['所属银行']),
        "product_name": safe_convert(row['产品名']),
        "age_range": safe_convert(row['年龄']),
        "max_credit": safe_convert(row['最高可贷额度']),
        "max_period": safe_convert(row['最长可贷期限']),
        "min_rate": safe_convert(row['最低年利率']),
        "repayment_methods": safe_convert(row['还款方式']),
        "admission_conditions": safe_convert(row['准入条件']),
        "admission_conditions_quality_unit": safe_convert(row['准入条件-优质单位']),
        "admission_conditions_provident_fund_base": safe_convert(row['准入条件-公积金基数']),
        "admission_conditions_provident_fund_months": safe_convert(row['准入条件-公积金连续缴存月数']),
        "query_requirements": safe_convert(row['查询要求']),
        "query_requirements_stats": parse_json_field(row['查询要求-统计'], 'query_stats'),
        "overdue_requirements": safe_convert(row['逾期要求']),
        "overdue_requirements_current": safe_convert(row['逾期要求-当前逾期']),
        "overdue_requirements_current_stats": parse_json_field(row['逾期要求-当前统计'], 'overdue_stats'),
        "overdue_requirements_history_stats": parse_json_field(row['逾期要求-历史统计'], 'overdue_stats'),
        "debt_requirements": parse_json_field(row['负债要求'], 'debt_requirements'),
        "credit_card_usage_rate": safe_convert(row['信用卡使用率要求']),
        "credit_card_count": safe_convert(row['信用卡张数要求']),
        "loan_institutions_count": safe_convert(row['贷款机构数要求']),
        "non_bank_loans_count": safe_convert(row['非银机构贷款笔数要求']),
        "white_user_allowed": safe_convert(row['征信白户是否准入']),
        "credit_calculation": safe_convert(row['额度算法'])
    }
    products.append(product)

# 保存为JSON文件
output_file = 'app/data/product_standard_new.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print(f"转换完成！已保存到 {output_file}")
print(f"共转换 {len(products)} 个产品")
print("\n预览前2个产品:")
print(json.dumps(products[:2], ensure_ascii=False, indent=2))

