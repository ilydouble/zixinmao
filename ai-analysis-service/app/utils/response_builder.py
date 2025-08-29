#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
响应构建工具类
"""

from typing import Optional, Any
from datetime import datetime

from models.analysis_response import *
from models.FLXG0V4B import *
from models.FLXG3D56 import *
from models.FLXG54F5 import *
from models.FLXG0687 import *
from models.FLXG9687 import *
from models.IVYZ5733 import *
from models.JRZQ0A03 import *
from models.JRZQ8203 import *
from models.YYSY6F2E import *


class ResponseBuilder:
    """响应构建器"""

    @staticmethod
    def _build_horizontal_table(items, model_class, info_type_name):
        """
        构建横向展示的表格

        Args:
            items: 数据项列表
            model_class: 模型类，用于获取字段信息
            info_type_name: 信息类型名称，用于表头显示

        Returns:
            str: 构建好的表格字符串
        """
        if not items:
            return "无相关数据\n"

        # 构建表头
        header = "| 指标 |"
        separator = "|------|"
        for i in range(len(items)):
            header += f" {info_type_name}{i+1} |"
            separator += "----|"
        result = header + "\n" + separator + "\n"

        # 获取所有字段信息
        field_infos = list(model_class.model_fields.items())

        # 按行构建表格内容
        for field_name, field_info in field_infos:
            field_desc = field_info.description or field_name
            row = f"| {field_desc} |"

            for item in items:
                field_value = getattr(item, field_name, None)
                value_str = str(field_value) if field_value is not None else "-"
                row += f" {value_str} |"

            result += row + "\n"
        result += "\n"

        return result

    @staticmethod
    def _format_dsrxx_list(dsrxx_list):
        """
        格式化当事人信息列表，将 Dsrxx 对象拼接成字符串

        Args:
            dsrxx_list: Dsrxx 对象列表

        Returns:
            str: 拼接后的当事人信息字符串
        """
        if not dsrxx_list:
            return "-"

        formatted_items = []
        for dsrxx in dsrxx_list:
            parts = []
            if dsrxx.n_dsrlx:
                parts.append(f"{dsrxx.n_dsrlx}")
            if dsrxx.c_mc:
                parts.append(f"{dsrxx.c_mc}")
            if dsrxx.n_ssdw:
                parts.append(f"{dsrxx.n_ssdw}")

            if parts:
                formatted_items.append("-".join(parts) )

        return "; ".join(formatted_items) if formatted_items else "-"

    @staticmethod
    def _build_entout_section(entout_data, section_name, section_data):
        """
        构建涉诉信息的单个部分

        Args:
            entout_data: 涉诉信息数据对象
            section_name: 部分名称（如"行政案件"）
            section_data: 部分数据对象

        Returns:
            str: 构建好的部分字符串
        """
        if not section_data:
            return f"**{section_name}**: 无相关数据\n\n"

        result = f"**{section_name}**:\n\n"

        # 处理 count 统计信息
        if section_data.count:
            result += "统计信息:\n"
            result += "| 指标 | 数值 |\n|------|----|\n"

            for field_name, field_info in Count.model_fields.items():
                field_value = getattr(section_data.count, field_name, None)
                field_desc = field_info.description or field_name
                value_str = str(field_value) if field_value is not None else "-"
                result += f"| {field_desc} | {value_str} |\n"
            result += "\n"

        # 处理 cases 案件信息
        if section_data.cases:
            result += "案件详情:\n"

            # 获取案件模型类
            case_model_class = type(section_data.cases[0]) if section_data.cases else None
            if case_model_class:
                # 构建表头
                header = "| 指标 |"
                separator = "|------|"
                for i in range(len(section_data.cases)):
                    header += f" 案件{i+1} |"
                    separator += "----|"
                result += header + "\n" + separator + "\n"

                # 按行构建表格内容
                for field_name, field_info in case_model_class.model_fields.items():
                    field_desc = field_info.description or field_name
                    row = f"| {field_desc} |"

                    for case in section_data.cases:
                        field_value = getattr(case, field_name, None)

                        # 特殊处理 c_dsrxx 字段
                        if field_name == 'c_dsrxx' and field_value:
                            value_str = ResponseBuilder._format_dsrxx_list(field_value)
                        else:
                            value_str = str(field_value) if field_value is not None else "-"

                        row += f" {value_str} |"

                    result += row + "\n"
                result += "\n"

        return result

    @staticmethod
    def safe_int(value: Any) -> int:
        """安全转换为整数"""
        try:
            return int(value) if value and value != '' else 0
        except (ValueError, TypeError):
            return 0
    
    @staticmethod
    def build_basic_info(mobile_no: str, id_card: str, name: str, IVYZ5733: IVYZ5733Response = None) -> BasicInfo:
        """构建基本信息"""
        marry = None
        if IVYZ5733 and IVYZ5733.data and IVYZ5733.data.data and ":" in IVYZ5733.data.data:
            marry = IVYZ5733.data.data.split(":")[1]
            marry = "未婚" if marry == "匹配不成功" else marry
        
        return BasicInfo(
            name=name,
            mobile_no=mobile_no,
            id_card=id_card,            
            marry=marry
        )
    
    @staticmethod
    def build_risk_analysis(FLXG9687: FLXG9687Response = None, FLXG0687: FLXG0687Response = None) -> RiskAnalysis:
        """构建风险分析"""
        # 电诈风险预警度
        telefraud_risk_level = FLXG9687.tfps_level if FLXG9687 else None

        # 反赌反诈风险等级映射
        risk_levels = {
            "110": None,  # 疑似欺诈疑似度
            "130": None,  # 疑似赌博庄家疑似度
            "150": None,  # 疑似赌博玩家疑似度
            "170": None   # 疑似涉赌跑分疑似度
        }

        # 解析FLXG0687数据
        if FLXG0687 and FLXG0687.value:
            for item in FLXG0687.value:
                if item.risk_type in risk_levels:
                    risk_levels[item.risk_type] = item.risk_level

        # 构建风险分析列表
        risk_analysis_list = [
            RiskAnalysis(
                id=1,
                risk_type="电诈风险预警度",
                risk_level=telefraud_risk_level,
                comment="风险等级，0-6，数值越高风险越大"
            ),
            RiskAnalysis(
                id=2,
                risk_type="疑似欺诈疑似度",
                risk_level=risk_levels["110"],
                comment="风险等级，1-100，数值越高风险越大"
            ),
            RiskAnalysis(
                id=3,
                risk_type="疑似赌博庄家疑似度",
                risk_level=risk_levels["130"],
                comment="风险等级，1-100，数值越高风险越大"
            ),
            RiskAnalysis(
                id=4,
                risk_type="疑似赌博玩家疑似度",
                risk_level=risk_levels["150"],
                comment="风险等级，1-100，数值越高风险越大"
            ),
            RiskAnalysis(
                id=5,
                risk_type="疑似涉赌跑分疑似度",
                risk_level=risk_levels["170"],
                comment="风险等级，1-100，数值越高风险越大"
            )
        ]

        return risk_analysis_list
    
    @staticmethod
    def build_special_list(FLXG3D56: FLXG3D56Response = None) -> SpecialList:
        """构建特殊名单"""
        if not FLXG3D56:
            return SpecialList()
        
        data = FLXG3D56.data
        return SpecialList( 
                    court_bad = data.sl_id_court_bad, 
                    court_executed = data.sl_id_court_executed, 
                    bank_bad = data.sl_id_bank_bad, 
                    bank_overdue = data.sl_id_bank_overdue, 
                    bank_lost = data.sl_id_bank_lost, 
                    nbank_bad = data.sl_id_nbank_bad, 
                    nbank_overdue = data.sl_id_nbank_overdue, 
                    nbank_lost = data.sl_id_nbank_lost
                )
    
    
    @staticmethod
    def build_loan_intention_analysis(JRZQ0A03: JRZQ0A03Response = None) -> LoanIntentionAnalysis:
        """构建借贷意向分析"""
        if not JRZQ0A03 or not JRZQ0A03.data:
            return LoanIntentionAnalysis()

        data = JRZQ0A03.data
        safe_int = ResponseBuilder.safe_int

        # 时间区间配置
        periods = [
            (1, "近7天", "als_d7"),
            (2, "近15天", "als_d15"),
            (3, "近1个月", "als_m1"),
            (4, "近3个月", "als_m3"),
            (5, "近6个月", "als_m6"),
            (6, "近12个月", "als_m12"),
        ]

        def build_list(keys):
            """通用构造方法，keys 是 (allnum_key, orgnum_key) 元组"""
            return [
                QuerySummaryData(
                    id=pid,
                    time=label,
                    applications=safe_int(getattr(data, f"{prefix}_{keys[0]}")),
                    institutions=safe_int(getattr(data, f"{prefix}_{keys[1]}")),
                )
                for pid, label, prefix in periods
            ]

        # 1. 查询次数汇总
        query_summary = [
            QuerySummaryData(
                id=pid,
                time=label,
                applications=safe_int(getattr(data, f"{prefix}_id_bank_allnum"))
                            + safe_int(getattr(data, f"{prefix}_id_rel_allnum"))
                            + safe_int(getattr(data, f"{prefix}_id_nbank_allnum")),
                institutions=safe_int(getattr(data, f"{prefix}_id_bank_orgnum"))
                            + safe_int(getattr(data, f"{prefix}_id_rel_orgnum"))
                            + safe_int(getattr(data, f"{prefix}_id_nbank_orgnum")),
            )
            for pid, label, prefix in periods
        ]

        # 2. 银行申请次数
        bank_applications = build_list(("id_bank_allnum", "id_bank_orgnum"))

        # 3. 信用卡申请次数
        credit_card_applications = build_list(("id_rel_allnum", "id_rel_orgnum"))

        # 4. 非银申请次数
        non_bank_applications = build_list(("id_nbank_allnum", "id_nbank_orgnum"))

        return LoanIntentionAnalysis(
            query_summary=query_summary,
            bank_applications=bank_applications,
            credit_card_applications=credit_card_applications,
            non_bank_applications=non_bank_applications
        )


    @staticmethod
    def build_loan_behavior_analysis(JRZQ8203: Any = None) -> LoanBehaviorAnalysis:
        """构建借贷行为分析"""
        if not JRZQ8203 or not JRZQ8203.data:
            return LoanBehaviorAnalysis()

        data = JRZQ8203.data
        safe_int = ResponseBuilder.safe_int

        # 1、非银机构新增核准
        # 时间区间配置
        periods = [
            (1, "近1个月", "als_m1"),
            (2, "近3个月", "als_m3"),
            (3, "近6个月", "als_m6"),
            (4, "近9个月", "als_m9"),
            (5, "近12个月", "als_m12"),
        ]

        non_bank_new_approvals = [
            LoanApprovalData(
                id=pid,
                time = label,
                loan_count=safe_int(getattr(data, f'tl_id_{suffix}_nbank_passnum', None)),
                institution_count=safe_int(getattr(data, f'tl_id_{suffix}_nbank_passorg', None)),
                loan_level=getattr(data, f'tl_id_{suffix}_nbank_passlendamt', None)
            )
            for  pid, label, suffix in periods
        ]


        # 2.近一年非银机构新增核准
        # 时间区间配置
        periods_yearly = [
            (1, "1个月前", "t1"),
            (2, "2个月前", "t2"),
            (3, "3个月前", "t3"),
            (4, "4个月前", "t4"),
            (5, "5个月前", "t5"),
            (6, "6个月前", "t6"),
            (7, "7个月前", "t7"),
            (8, "8个月前", "t8"),
            (9, "9个月前", "t9"),
            (10, "10个月前", "t10"),
            (11, "11个月前", "t11"),
        ]

        yearly_non_bank_approvals = [
            LoanApprovalData(
                id=pid,
                time=label,
                loan_count=safe_int(getattr(data, f"tl_id_{suffix}_nbank_num", None)),
                institution_count=safe_int(getattr(data, f"tl_id_{suffix}_nbank_org", None)),
                loan_level=getattr(data, f"tl_id_{suffix}_nbank_lendamt", None)
            )
            for pid, label, suffix in periods_yearly
        ]

        return LoanBehaviorAnalysis(
            non_bank_new_approvals=non_bank_new_approvals,
            yearly_non_bank_approvals=yearly_non_bank_approvals
        )
    
    @staticmethod
    def build_personal_legal_litigation(FLXG0V4B: FLXG0V4BResponse = None) -> PersonalLegalLitigation:
        sxbzxr = None
        if FLXG0V4B and FLXG0V4B.sxbzxr and FLXG0V4B.sxbzxr.data and FLXG0V4B.sxbzxr.data.sxbzxr:
            sxbzxr = FLXG0V4B.sxbzxr.data.sxbzxr

        xgbzxr = None
        if FLXG0V4B and FLXG0V4B.xgbzxr and FLXG0V4B.xgbzxr.data and FLXG0V4B.xgbzxr.data.xgbzxr:
            xgbzxr = FLXG0V4B.xgbzxr.data.xgbzxr

        entout = None
        if FLXG0V4B and FLXG0V4B.entout and FLXG0V4B.entout.data:
            entoutdata = FLXG0V4B.entout.data
            entout = EntoutDataData(
                administrative = entoutdata.administrative,
                implement = entoutdata.implement,
                count = entoutdata.count,
                preservation = entoutdata.preservation,
                civil = entoutdata.civil,
                criminal = entoutdata.criminal,
                bankrupt = entoutdata.bankrupt,
            )


        return PersonalLegalLitigation(sxbzxr=sxbzxr, xgbzxr=xgbzxr, entout=entout)

    @staticmethod
    def build_success_markdown_response(big_data_response: BigDataAnalysisResponse) -> str:
        """构建markdown成功响应"""
        result = "## 大数据分析 \n"

        # 一、基本信息
        basic_info = big_data_response.basic_info
        result += f"### 一、基本信息\n" \
                  f"| 项目       | 内容                  |\n" \
                  f"| ---------- | --------------------- |\n" \
                  f"| 用户姓名   | {basic_info.name}     |\n" \
                  f"| 身份证号   | {basic_info.id_card}  |\n" \
                  f"| 手机号     | {basic_info.mobile_no}|\n" \
                  f"| 婚姻状态   | {basic_info.marry}    |\n"

        # 二、个人风险分析
        risk_analysis = big_data_response.risk_analysis
        result += "### 二、个人风险分析 \n"
        if risk_analysis:
            # 先构建表头
            result += "| 风险类型  | 风险等级   |备注     |\n|-----------|------------|---------|\n"
            # 再拼接每一行数据
            result += "\n".join(
                f"| {risk.risk_type or '-'} | {risk.risk_level or '-'} | {risk.comment or '-'} |"
                for risk in risk_analysis
            )  + "\n"
        else:
            result += "无风险分析数据\n"
        

        # 三、个人司法涉诉
        result += "### 三、个人司法涉诉\n"
        personal_legal_litigation = big_data_response.personal_legal_litigation
        
        #1.失信被执行人查询
        result += "#### 1.失信被执行人查询 \n"
        result += ResponseBuilder._build_horizontal_table(
            personal_legal_litigation.sxbzxr,
            SxbzxrItem,
            "失信信息"
        )

        # 2.限高被执行人查询
        result += "#### 2.限高被执行人查询 \n"
        result += ResponseBuilder._build_horizontal_table(
            personal_legal_litigation.xgbzxr,
            XgbzxrItem,
            "限高信息"
        )
        
        # 3.涉诉信息
        result += "#### 3.涉诉信息 \n"
        if personal_legal_litigation.entout:
            entout_data = personal_legal_litigation.entout

            # 首先处理总体统计信息 count
            if entout_data.count:
                result += "**总体统计信息**:\n"
                result += "| 指标 | 数值 |\n|------|----|\n"

                for field_name, field_info in Count.model_fields.items():
                    field_value = getattr(entout_data.count, field_name, None)
                    field_desc = field_info.description or field_name
                    value_str = str(field_value) if field_value is not None else "-"
                    result += f"| {field_desc} | {value_str} |\n"
                result += "\n"

            # 依次处理各个案件类型
            sections = [
                ("行政案件", entout_data.administrative),
                ("执行案件", entout_data.implement),
                ("非诉保全审查案件", entout_data.preservation),
                ("民事案件", entout_data.civil),
                ("刑事案件", entout_data.criminal),
                ("强制清算与破产案件", entout_data.bankrupt)
            ]

            for section_name, section_data in sections:
                result += ResponseBuilder._build_entout_section(entout_data, section_name, section_data)
        else:
            result += "无相关数据\n"

        # 四、特殊名单信息查询
        special_list = big_data_response.special_list
        result += "### 四、特殊名单信息查询\n"
        if special_list:
            result += "| 指标 | 数值 |\n|------|----|\n"

            for field_name, field_info in SpecialList.model_fields.items():
                field_value = getattr(special_list, field_name, None)
                field_desc = field_info.description or field_name

                # 格式化显示值：0-无记录，1-有记录
                if field_value is not None:
                    display_value = "有记录" if field_value == 1 else "无记录"
                else:
                    display_value = "-"

                result += f"| {field_desc} | {display_value} |\n"
            result += "\n"
        else:
            result += "无相关数据\n"

        # 五、借贷意向验证
        loan_intention_analysis = big_data_response.loan_intention_analysis
        result += "### 五、借贷意向验证\n"
        if loan_intention_analysis:
            # 处理各个子项
            sections = [
                ("查询次数汇总", loan_intention_analysis.query_summary),
                ("银行申请次数", loan_intention_analysis.bank_applications),
                ("信用卡申请次数", loan_intention_analysis.credit_card_applications),
                ("非银申请次数", loan_intention_analysis.non_bank_applications)
            ]

            for section_name, section_data in sections:
                if section_data:
                    result += f"**{section_name}**:\n"
                    result += f"|时间|申请次数|申请机构数|\n|-----------|------------|---------|\n"
                    result += "\n".join(
                        f"| {query_data.time or '-'} | {query_data.applications or '-'} | {query_data.institutions or '-'} |"
                        for query_data in section_data
                    )  + "\n"
                else:
                    result += f"**{section_name}**: 无相关数据\n\n"
        else:
            result += "无相关数据\n"

        # 六、借贷行为验证
        loan_behavior_analysis = big_data_response.loan_behavior_analysis
        result += "### 六、借贷行为验证\n"
        if loan_behavior_analysis:
            # 处理各个子项
            sections = [
                ("非银机构新增核准", loan_behavior_analysis.non_bank_new_approvals),
                ("近一年非银机构新增核准", loan_behavior_analysis.yearly_non_bank_approvals)
            ]

            for section_name, section_data in sections:
                if section_data:
                    result += f"**{section_name}**:\n"
                    result += f"|时间|借贷次数|借贷机构数|借贷等级|\n|-----------|------------|---------|---------|\n"
                    result += "\n".join(
                        f"| {loan_data.time or '-'} | {loan_data.loan_count or '-'} | {loan_data.institution_count or '-'} | {loan_data.loan_level or '-'} |"
                        for loan_data in section_data
                    )  + "\n"
                else:
                    result += f"**{section_name}**: 无相关数据\n\n"
        else:
            result += "无相关数据\n"
     
        return result

    @staticmethod
    def build_success_response(mobile_no: str, id_card: str, name: str,
                             FLXG9687=None, FLXG0687=None, FLXG54F5=None, FLXG0V4B=None,
                             JRZQ0A03=None, JRZQ8203=None, FLXG3D56=None, IVYZ5733=None, YYSY6F2E=None) -> BigDataAnalysisResponse:
        """构建成功响应"""
        basic_info = ResponseBuilder.build_basic_info(mobile_no, id_card, name, IVYZ5733)
        risk_analysis = ResponseBuilder.build_risk_analysis(FLXG9687, FLXG0687)
        special_list = ResponseBuilder.build_special_list(FLXG3D56)
        loan_intention_analysis = ResponseBuilder.build_loan_intention_analysis(JRZQ0A03)
        loan_behavior_analysis = ResponseBuilder.build_loan_behavior_analysis(JRZQ8203)
        personal_legal_litigation = ResponseBuilder.build_personal_legal_litigation(FLXG0V4B)

        return BigDataAnalysisResponse(
            basic_info=basic_info,
            risk_analysis=risk_analysis,
            personal_legal_litigation=personal_legal_litigation,
            special_list=special_list,
            loan_intention_analysis=loan_intention_analysis,
            loan_behavior_analysis=loan_behavior_analysis,            
        )

    @staticmethod
    def build_error_markdown_response(error_response: BigDataAnalysisErrorResponse) -> str:
        """构建错误响应的Markdown格式"""
        markdown = f"""# 大数据分析报告 - 错误

## ❌ 分析失败

**错误信息**: {error_response.message}

## 📋 基本信息

| 项目 | 内容 |
|------|------|
| 姓名 | {error_response.basic_info.name} |
| 手机号 | {error_response.basic_info.mobile_no} |
| 身份证号 | {error_response.basic_info.id_card} |

## 🔧 解决建议

1. 请检查输入的姓名、手机号、身份证号是否正确
2. 如果信息正确，请稍后重试
3. 如果问题持续存在，请联系技术支持

---
*本报告由天远大数据分析系统生成*
"""
        return markdown
