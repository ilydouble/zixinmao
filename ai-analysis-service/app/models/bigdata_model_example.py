"""
大数据报告模型使用示例
演示如何创建、验证和使用 BigDataResponse 模型
"""
import json
from .bigdata_model import *


def example_create_report():
    """示例：创建一个完整的大数据报告"""

    # 完整的测试数据样例
    report_data = {
        "reportSummary": {
            "ruleValidation": {
                "code": "STR0042314/贷前-经营性租赁全量策略",
                "result": "高风险"
            },
            "antiFraudScore": {
                "level": "中风险"
            },
            "antiFraudRule": {
                "code": "STR0042314/贷前-经营性租赁全量策略",
                "level": "高风险"
            },
            "abnormalRulesHit": {
                "count": 4,
                "alert": "高风险提示"
            }
        },
        "basicInfo": {
            "name": "李某某",
            "phone": "138****5623",
            "idCard": "3201**********45X",
            "reportId": "202512318B2F9D4C",
            "verifications": [
                {
                    "item": "要素核查",
                    "description": "使用姓名、手机号、身份证信息进行三要素核验",
                    "result": "命中",
                    "details": "身份证二要素不一致、手机号三要素不一致"
                },
                {
                    "item": "运营商检验",
                    "description": "检查手机号在运营商处的状态及在线时长",
                    "result": "命中",
                    "details": "手机在网时长较短、身份证号手机号归属地不一致"
                },
                {
                    "item": "法院信息",
                    "description": "检测被查询人的借贷风险情况，及在司法体系中是否存在行为风险",
                    "result": "高风险",
                    "details": "刑事案件2条、民事案件3条、行政案件1条、执行案件5条、失信案件2条、限高案件3条"
                },
                {
                    "item": "借贷评估",
                    "description": "综合近12个月借贷申请情况评估风险",
                    "result": "命中",
                    "details": "命中近两年银行高风险、命中近两年非银高风险、命中当前逾期"
                },
                {
                    "item": "其他",
                    "description": "其它规则风险",
                    "result": "涉赌涉诈风险、重点人员风险、存在司法风险记录"
                }
            ]
        },
        "riskIdentification": {
            "title": "风险识别产品",
            "caseAnnouncements": {
                "title": "涉案公告列表",
                "records": [
                    {
                        "authority": "沪市浦东新区人民法院",
                        "caseNumber": "(2022)沪0115民初***号",
                        "caseType": "民事案件",
                        "filingDate": "2022-04-18"
                    },
                    {
                        "authority": "沪市浦东新区人民法院",
                        "caseNumber": "(2023)沪0115刑初***号",
                        "caseType": "刑事案件",
                        "filingDate": "2023-07-02"
                    },
                    {
                        "authority": "沪市静安区人民法院",
                        "caseNumber": "(2021)沪0106行初***号",
                        "caseType": "行政案件",
                        "filingDate": "2021-11-25"
                    },
                    {
                        "authority": "沪市浦东新区人民法院",
                        "caseNumber": "(2020)沪0115民初***号",
                        "caseType": "民事案件",
                        "filingDate": "2020-08-13"
                    },
                    {
                        "authority": "沪市静安区人民法院",
                        "caseNumber": "(2019)沪0106刑初***号",
                        "caseType": "刑事案件",
                        "filingDate": "2019-05-30"
                    },
                    {
                        "authority": "沪市静安区人民法院",
                        "caseNumber": "(2018)沪0106民初***号",
                        "caseType": "民事案件",
                        "filingDate": "2018-03-19"
                    }
                ]
            },
            "enforcementAnnouncements": {
                "title": "执行公告列表",
                "records": [
                    {
                        "caseNumber": "(2024)沪0115执***号",
                        "court": "沪市浦东新区人民法院",
                        "filingDate": "2024-01-15",
                        "status": "执行中",
                        "targetAmount": "256,800元"
                    },
                    {
                        "caseNumber": "(2023)沪0115执***号",
                        "court": "沪市浦东新区人民法院",
                        "filingDate": "2023-03-09",
                        "status": "已结案",
                        "targetAmount": "78,520元"
                    },
                    {
                        "caseNumber": "(2022)沪0106执***号",
                        "court": "沪市静安区人民法院",
                        "filingDate": "2022-06-28",
                        "status": "终本结案",
                        "targetAmount": "35,000元"
                    },
                    {
                        "caseNumber": "(2021)沪0106执***号",
                        "court": "沪市静安区人民法院",
                        "filingDate": "2021-09-02",
                        "status": "已结案",
                        "targetAmount": "12,640元"
                    },
                    {
                        "caseNumber": "(2020)沪0106执***号",
                        "court": "沪市静安区人民法院",
                        "filingDate": "2020-02-17",
                        "status": "已结案",
                        "targetAmount": "8,950元"
                    }
                ]
            },
            "dishonestAnnouncements": {
                "title": "失信公告列表",
                "records": [
                    {
                        "court": "沪市浦东新区人民法院",
                        "dishonestPerson": "李某某",
                        "filingDate": "2023-03-09",
                        "idCard": "3201**********45X",
                        "performanceStatus": "全部未履行"
                    },
                    {
                        "court": "沪市静安区人民法院",
                        "dishonestPerson": "李某某",
                        "filingDate": "2022-06-28",
                        "idCard": "3201**********45X",
                        "performanceStatus": "部分履行"
                    }
                ]
            },
            "highConsumptionRestrictionAnnouncements": {
                "title": "限高公告列表",
                "records": [
                    {
                        "court": "沪市浦东新区人民法院",
                        "idCard": "3201**********45X",
                        "measure": "限制高消费",
                        "restrictedPerson": "李某某",
                        "startDate": "2024-01-15"
                    },
                    {
                        "court": "沪市静安区人民法院",
                        "idCard": "3201**********45X",
                        "measure": "限制高消费",
                        "restrictedPerson": "李某某",
                        "startDate": "2022-11-08"
                    },
                    {
                        "court": "沪市浦东新区人民法院",
                        "idCard": "3201**********45X",
                        "measure": "限制高消费",
                        "restrictedPerson": "李某某",
                        "startDate": "2021-05-21"
                    }
                ]
            }
        },
        "creditAssessment": {
            "title": "信贷评估产品",
            "loanIntentionByCustomerType": {
                "title": "本人在各类机构的借贷意向表现",
                "records": [
                    {
                        "customerType": "持牌网络小贷",
                        "applicationCount": 4,
                        "riskLevel": "低风险"
                    },
                    {
                        "customerType": "持牌消费金融",
                        "applicationCount": 11,
                        "riskLevel": "中风险"
                    },
                    {
                        "customerType": "持牌融资租赁机构",
                        "applicationCount": 6,
                        "riskLevel": "中风险"
                    },
                    {
                        "customerType": "持牌汽车金融",
                        "applicationCount": 2,
                        "riskLevel": "低风险"
                    },
                    {
                        "customerType": "其他非银机构",
                        "applicationCount": 14,
                        "riskLevel": "高风险"
                    }
                ]
            },
            "loanIntentionAbnormalTimes": {
                "title": "异常时间段借贷申请情况",
                "records": [
                    {
                        "timePeriod": "夜间(22:00-06:00)",
                        "mainInstitutionType": "银行类机构、非银金融机构",
                        "riskLevel": "高风险"
                    },
                    {
                        "timePeriod": "周末",
                        "mainInstitutionType": "非银金融机构",
                        "riskLevel": "中风险"
                    },
                    {
                        "timePeriod": "工作日工作时间",
                        "mainInstitutionType": "银行类机构、非银金融机构",
                        "riskLevel": "中风险"
                    }
                ]
            }
        },
        "leasingRiskAssessment": {
            "title": "租赁风险评估产品",
            "multiLenderRisk3C": {
                "title": "3C机构多头借贷风险",
                "records": [
                    {
                        "institutionType": "消费金融",
                        "appliedCount": 5,
                        "inUseCount": 1,
                        "totalCreditLimit": 50000,
                        "totalDebtBalance": 12000,
                        "riskLevel": "中风险"
                    },
                    {
                        "institutionType": "小贷公司",
                        "appliedCount": 7,
                        "inUseCount": 2,
                        "totalCreditLimit": 62000,
                        "totalDebtBalance": 18000,
                        "riskLevel": "中风险"
                    },
                    {
                        "institutionType": "其他非银机构",
                        "appliedCount": 9,
                        "inUseCount": 3,
                        "totalCreditLimit": 95000,
                        "totalDebtBalance": 32000,
                        "riskLevel": "高风险"
                    }
                ]
            }
        },
        "comprehensiveAnalysis": [
            "规则验证判定为高风险、反欺诈规则判定为高风险。",
            "系统共识别4项规则命中（高风险提示）。",
            "法院信息显示刑事案件2条、民事案件3条、行政案件1条、执行案件5条、失信记录2条、限高记录3条，属于司法高风险因素。",
            "借贷评估显示持牌消费金融近12个月申请机构数11家，风险等级为中风险、持牌融资租赁机构近12个月申请机构数6家，风险等级为中风险、其他非银机构近12个月申请机构数14家，风险等级为高风险。",
            "其他风险因素包括：涉赌涉诈风险、重点人员风险。",
            "多头借贷风险在夜间(22:00-06:00)阶段主要由银行类机构、非银金融机构发起，风险等级为高风险、周末阶段主要由非银金融机构发起，风险等级为中风险、工作日工作时间阶段主要由银行类机构、非银金融机构发起，风险等级为中风险。",
            "风险提示：系统识别出该用户存在多项高风险因素，建议谨慎评估信用状况并加强风险管控措施。"
        ],
        "reportFooter": {
            "dataSource": "天远数据报告",
            "generationTime": "2025-12-31",
            "disclaimer": "本报告为示例数据，仅供参考演示，实际审批以真实数据为准。"
        }
    }
    
    # 使用 Pydantic 模型验证和解析数据
    try:
        report = BigDataResponse(**report_data)
        print("✅ 报告创建成功！")
        print(f"报告ID: {report.basic_info.report_id}")
        print(f"被查询人: {report.basic_info.name}")
        print(f"风险等级: {report.report_summary.rule_validation.result}")
        return report
    except Exception as e:
        print(f"❌ 报告创建失败: {e}")
        return None


def example_export_to_json(report: BigDataResponse):
    """示例：将报告导出为JSON"""
    # 使用 by_alias=True 导出为驼峰命名 (Pydantic V2)
    json_str = report.model_dump_json(by_alias=True, indent=2)
    print("\n📄 导出的JSON:")
    print(json_str[:500] + "...")  # 只打印前500个字符
    return json_str


def example_access_data(report: BigDataResponse):
    """示例：访问报告中的数据"""
    print("\n📊 数据访问示例:")
    print(f"1. 异常规则命中数: {report.report_summary.abnormal_rules_hit.count}")
    print(f"2. 规则验证结果: {report.report_summary.rule_validation.result}")
    print(f"3. 反欺诈等级: {report.report_summary.anti_fraud_score.level}")
    print(f"4. 核验项数量: {len(report.basic_info.verifications)}")
    print(f"5. 涉案公告数量: {len(report.risk_identification.case_announcements.records)}")
    print(f"6. 执行公告数量: {len(report.risk_identification.enforcement_announcements.records)}")
    print(f"7. 失信公告数量: {len(report.risk_identification.dishonest_announcements.records)}")
    print(f"8. 限高公告数量: {len(report.risk_identification.high_consumption_restriction_announcements.records)}")
    print(f"9. 借贷意向记录数: {len(report.credit_assessment.loan_intention_by_customer_type.records)}")
    print(f"10. 异常时间段记录数: {len(report.credit_assessment.loan_intention_abnormal_times.records)}")
    print(f"11. 3C多头风险记录数: {len(report.leasing_risk_assessment.multi_lender_risk_3c.records)}")
    print(f"12. 综合分析条数: {len(report.comprehensive_analysis)}")

    # 详细展示部分数据
    print("\n📋 核验项详情:")
    for i, verification in enumerate(report.basic_info.verifications, 1):
        print(f"  {i}. {verification.item}: {verification.result}")

    print("\n⚠️ 风险统计:")
    print(f"  - 涉案公告: {len(report.risk_identification.case_announcements.records)} 条")
    print(f"  - 执行公告: {len(report.risk_identification.enforcement_announcements.records)} 条")
    print(f"  - 失信公告: {len(report.risk_identification.dishonest_announcements.records)} 条")
    print(f"  - 限高公告: {len(report.risk_identification.high_consumption_restriction_announcements.records)} 条")

    print("\n💰 借贷机构统计:")
    for record in report.credit_assessment.loan_intention_by_customer_type.records:
        print(f"  - {record.customer_type}: {record.application_count}家 ({record.risk_level})")

    print("\n🏢 3C机构多头风险:")
    for record in report.leasing_risk_assessment.multi_lender_risk_3c.records:
        print(f"  - {record.institution_type}: 申请{record.applied_count}家, 在用{record.in_use_count}家, "
              f"授信{record.total_credit_limit}元, 负债{record.total_debt_balance}元 ({record.risk_level})")


if __name__ == "__main__":
    print("=" * 60)
    print("大数据报告模型使用示例")
    print("=" * 60)
    
    # 创建报告
    report = example_create_report()
    
    if report:
        # 导出JSON
        example_export_to_json(report)
        
        # 访问数据
        example_access_data(report)

