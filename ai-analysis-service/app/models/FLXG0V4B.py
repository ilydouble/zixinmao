"""
个人司法涉诉(详版) (FLXG0V4B)
"""

from typing import Optional, List
from pydantic import BaseModel, Field

class FLXG0V4BResponse(BaseModel):
    """
    个人司法涉诉(详版) FLXG0V4B接口响应结构
    """
    sxbzxr: Optional["Sxbzxr"] = Field(None, description="失信被执行人")
    entout: Optional["Entout"] = Field(None, description="涉诉信息")
    xgbzxr: Optional["Xgbzxr"] = Field(None, description="限高被执行人")

class SxbzxrItem(BaseModel):
    """
    失信被执行人项
    """
    yw: Optional[str] = Field(None, description="生效法律文书确定的义务")
    pjje_gj: Optional[int] = Field(None, description="判决金额_估计")
    xwqx: Optional[str] = Field(None, description="失信被执行人行为具体情形")
    id: Optional[str] = Field(None, description="标识")
    zxfy: Optional[str] = Field(None, description="执行法院")
    ah: Optional[str] = Field(None, description="案号")
    zxyjwh: Optional[str] = Field(None, description="执行依据文号")
    lxqk: Optional[str] = Field(None, description="被执行人的履行情况")
    zxyjdw: Optional[str] = Field(None, description="出执行依据单位")
    fbrq: Optional[str] = Field(None, description="发布时间（日期）")
    xb: Optional[str] = Field(None, description="性别")
    larq: Optional[str] = Field(None, description="立案日期")
    sf: Optional[str] = Field(None, description="省份")

class SxbzxrData(BaseModel):
    """
    失信被执行人数据
    """
    sxbzxr: Optional[List[SxbzxrItem]] = Field(None, description="失信被执行人列表")

class Sxbzxr(BaseModel):
    """
    失信被执行人
    """
    msg: Optional[str] = Field(None, description="备注信息")
    data: Optional[SxbzxrData] = Field(None, description="数据结果")

class Dsrxx(BaseModel):
    """
    当事人
    """
    n_ssdw: Optional[str] = Field(None, description="诉讼地位")
    c_mc: Optional[str] = Field(None, description="名称")
    n_dsrlx: Optional[str] = Field(None, description="当事人类型")

class Count(BaseModel):
    """
    统计
    """
    money_yuangao: Optional[int] = Field(None, description="原告金额")
    area_stat: Optional[str] = Field(None, description="涉案地点分布")
    count_jie_beigao: Optional[int] = Field(None, description="被告已结案总数")
    count_total: Optional[int] = Field(None, description="案件总数")
    money_wei_yuangao: Optional[int] = Field(None, description="原告未结案金额")
    count_wei_total: Optional[int] = Field(None, description="未结案总数")
    money_wei_beigao: Optional[int] = Field(None, description="被告未结案金额")
    count_other: Optional[int] = Field(None, description="第三人总数")
    money_beigao: Optional[int] = Field(None, description="被告金额")
    count_yuangao: Optional[int] = Field(None, description="原告总数")
    money_jie_other: Optional[int] = Field(None, description="第三人已结案金额")
    money_total: Optional[int] = Field(None, description="涉案总金额")
    money_wei_total: Optional[int] = Field(None, description="未结案金额")
    count_wei_yuangao: Optional[int] = Field(None, description="原告未结案总数")
    ay_stat: Optional[str] = Field(None, description="涉案案由分布")
    count_beigao: Optional[int] = Field(None, description="被告总数")
    money_jie_yuangao: Optional[int] = Field(None, description="原告已结金额")
    jafs_stat: Optional[str] = Field(None, description="结案方式分布")
    money_jie_beigao: Optional[int] = Field(None, description="被告已结案金额")
    count_wei_beigao: Optional[int] = Field(None, description="被告未结案总数")
    count_jie_other: Optional[int] = Field(None, description="第三人已结案总数")
    count_jie_total: Optional[int] = Field(None, description="已结案总数")
    count_wei_other: Optional[int] = Field(None, description="第三人未结案总数")
    money_other: Optional[int] = Field(None, description="第三人金额")
    count_jie_yuangao: Optional[int] = Field(None, description="原告已结案总数")
    money_jie_total: Optional[int] = Field(None, description="已结案金额")
    money_wei_other: Optional[int] = Field(None, description="第三人未结案金额")
    money_wei_percent: Optional[float] = Field(None, description="未结案金额百分比")
    larq_stat: Optional[str] = Field(None, description="涉案时间分布")

class AdministrativeCase(BaseModel):
    """
    行政案件项
    """
    n_jabdje_gj_level: Optional[int] = Field(None, description="结案标的金额估计等级")
    n_jbfy_cj: Optional[str] = Field(None, description="法院所属层级")
    c_gkws_glah: Optional[str] = Field(None, description="相关案件号")
    n_jafs: Optional[str] = Field(None, description="结案方式")
    n_ssdw: Optional[str] = Field(None, description="诉讼地位")
    d_jarq: Optional[str] = Field(None, description="结案时间")
    c_gkws_pjjg: Optional[str] = Field(None, description="判决结果")
    n_qsbdje: Optional[int] = Field(None, description="起诉标的金额")
    n_crc: Optional[int] = Field(None, description="案件变更码")
    c_ssdy: Optional[str] = Field(None, description="所属地域")
    n_ajjzjd: Optional[str] = Field(None, description="案件进展阶段")
    n_jaay: Optional[str] = Field(None, description="结案案由")
    n_ajlx: Optional[str] = Field(None, description="案件类型")
    c_ah_ys: Optional[str] = Field(None, description="原审案号")
    n_laay_tree: Optional[str] = Field(None, description="立案案由详细")
    n_jabdje_level: Optional[int] = Field(None, description="结案标的金额等级")
    n_laay: Optional[str] = Field(None, description="立案案由")
    n_ajbs: Optional[str] = Field(None, description="案件标识")
    n_jbfy: Optional[str] = Field(None, description="经办法院")
    c_gkws_id: Optional[str] = Field(None, description="公开文书ID")
    n_jabdje_gj: Optional[int] = Field(None, description="结案标的金额估计")
    n_pj_victory: Optional[str] = Field(None, description="胜诉估计")
    c_gkws_dsr: Optional[str] = Field(None, description="当事人")
    n_slcx: Optional[str] = Field(None, description="审理程序")
    n_qsbdje_level: Optional[int] = Field(None, description="起诉标的金额等级")
    c_id: Optional[str] = Field(None, description="案件唯一ID")
    n_ssdw_ys: Optional[str] = Field(None, description="一审诉讼地位")
    c_slfsxx: Optional[str] = Field(None, description="审理方式信息")
    c_ah: Optional[str] = Field(None, description="案号")
    c_dsrxx: Optional[List[Dsrxx]] = Field(None, description="当事人")
    d_larq: Optional[str] = Field(None, description="立案时间")
    n_jaay_tree: Optional[str] = Field(None, description="结案案由详细")
    c_ah_hx: Optional[str] = Field(None, description="后续案号")
    n_jabdje: Optional[float] = Field(None, description="结案标的金额")

class Administrative(BaseModel):
    """
    行政案件
    """
    cases: Optional[List[AdministrativeCase]] = Field(None, description="案件")
    count: Optional[Count] = Field(None, description="统计")

class ImplementCase(BaseModel):
    """
    执行案件项
    """
    c_dsrxx: Optional[List[Dsrxx]] = Field(None, description="当事人")
    c_ssdy: Optional[str] = Field(None, description="所属地域")
    n_jabdje_gj: Optional[int] = Field(None, description="结案标的金额估计")
    n_crc: Optional[int] = Field(None, description="案件变更码")
    n_laay: Optional[str] = Field(None, description="立案案由")
    c_ah: Optional[str] = Field(None, description="案号")
    n_sqzxbdje: Optional[float] = Field(None, description="申请执行标的金额")
    c_ah_ys: Optional[str] = Field(None, description="原审案号")
    c_gkws_glah: Optional[str] = Field(None, description="相关案件号")
    n_ajbs: Optional[str] = Field(None, description="案件标识")
    c_gkws_pjjg: Optional[str] = Field(None, description="判决结果")
    n_jafs: Optional[str] = Field(None, description="结案方式")
    n_jaay: Optional[str] = Field(None, description="结案案由")
    n_jbfy_cj: Optional[str] = Field(None, description="法院所属层级")
    c_id: Optional[str] = Field(None, description="案件唯一ID")
    n_jabdje: Optional[float] = Field(None, description="结案标的金额")
    n_ajjzjd: Optional[str] = Field(None, description="案件进展阶段")
    d_larq: Optional[str] = Field(None, description="立案时间")
    n_ajlx: Optional[str] = Field(None, description="案件类型")
    n_sjdwje: Optional[int] = Field(None, description="实际到位金额")
    c_gkws_id: Optional[str] = Field(None, description="公开文书ID")
    c_ah_hx: Optional[str] = Field(None, description="后续案号")
    n_wzxje: Optional[int] = Field(None, description="未执行金额")
    d_jarq: Optional[str] = Field(None, description="结案时间")
    c_gkws_dsr: Optional[str] = Field(None, description="当事人")
    n_jbfy: Optional[str] = Field(None, description="经办法院")
    n_ssdw: Optional[str] = Field(None, description="诉讼地位")

class Implement(BaseModel):
    """
    执行案件
    """
    cases: Optional[List[ImplementCase]] = Field(None, description="案件")
    count: Optional[Count] = Field(None, description="统计")

class PreservationCase(BaseModel):
    """
    非诉保全审查案件项
    """
    n_jbfy_cj: Optional[str] = Field(None, description="法院所属层级")
    n_ssdw: Optional[str] = Field(None, description="诉讼地位")
    n_crc: Optional[int] = Field(None, description="案件变更码")
    c_ssdy: Optional[str] = Field(None, description="所属地域")
    d_larq: Optional[str] = Field(None, description="立案时间")
    c_gkws_id: Optional[str] = Field(None, description="公开文书ID")
    c_ah_ys: Optional[str] = Field(None, description="原审案号")
    n_sqbqse: Optional[int] = Field(None, description="申请保全数额")
    d_jarq: Optional[str] = Field(None, description="结案时间")
    n_ajbs: Optional[str] = Field(None, description="案件标识")
    c_gkws_dsr: Optional[str] = Field(None, description="当事人")
    c_gkws_pjjg: Optional[str] = Field(None, description="判决结果")
    n_jbfy: Optional[str] = Field(None, description="经办法院")
    n_jafs: Optional[str] = Field(None, description="结案方式")
    c_dsrxx: Optional[List[Dsrxx]] = Field(None, description="当事人")
    n_ajjzjd: Optional[str] = Field(None, description="案件进展阶段")
    n_ajlx: Optional[str] = Field(None, description="案件类型")
    c_id: Optional[str] = Field(None, description="案件唯一ID")
    c_ah: Optional[str] = Field(None, description="案号")
    n_sqbqse_level: Optional[int] = Field(None, description="申请保全数额等级")
    c_ah_hx: Optional[str] = Field(None, description="后续案号")
    c_sqbqbdw: Optional[str] = Field(None, description="申请保全标的物")
    c_gkws_glah: Optional[str] = Field(None, description="相关案件号")

class Preservation(BaseModel):
    """
    案件类型（非诉保全审查）
    """
    cases: Optional[List[PreservationCase]] = Field(None, description="案件")
    count: Optional[Count] = Field(None, description="统计")

class CivilCase(BaseModel):
    """
    民事案件项
    """
    n_jabdje_level: Optional[int] = Field(None, description="结案标的金额等级")
    n_slcx: Optional[str] = Field(None, description="审理程序")
    n_jabdje_gj_level: Optional[int] = Field(None, description="结案标的金额估计等级")
    n_ajjzjd: Optional[str] = Field(None, description="案件进展阶段")
    n_jafs: Optional[str] = Field(None, description="结案方式")
    c_gkws_pjjg: Optional[str] = Field(None, description="判决结果")
    c_slfsxx: Optional[str] = Field(None, description="审理方式信息")
    n_laay: Optional[str] = Field(None, description="立案案由")
    c_gkws_glah: Optional[str] = Field(None, description="相关案件号")
    n_ssdw: Optional[str] = Field(None, description="诉讼地位")
    n_ssdw_ys: Optional[str] = Field(None, description="一审诉讼地位")
    n_laay_tag: Optional[str] = Field(None, description="立案案由标签")
    n_qsbdje_level: Optional[int] = Field(None, description="起诉标的金额等级")
    n_crc: Optional[int] = Field(None, description="案件变更码")
    c_ah_hx: Optional[str] = Field(None, description="后续案号")
    n_qsbdje_gj_level: Optional[int] = Field(None, description="起诉标的金额估计等级")
    n_jbfy: Optional[str] = Field(None, description="经办法院")
    c_ah: Optional[str] = Field(None, description="案号")
    n_jabdje: Optional[float] = Field(None, description="结案标的金额")
    n_jabdje_gj: Optional[int] = Field(None, description="结案标的金额估计")
    n_qsbdje_gj: Optional[int] = Field(None, description="起诉标的金额估计")
    n_jbfy_cj: Optional[str] = Field(None, description="法院所属层级")
    c_ssdy: Optional[str] = Field(None, description="所属地域")
    d_larq: Optional[str] = Field(None, description="立案时间")
    c_gkws_id: Optional[str] = Field(None, description="公开文书ID")
    n_pj_victory: Optional[str] = Field(None, description="胜诉估计")
    c_gkws_dsr: Optional[str] = Field(None, description="当事人")
    d_jarq: Optional[str] = Field(None, description="结案时间")
    n_jaay: Optional[str] = Field(None, description="结案案由")
    n_laay_tree: Optional[str] = Field(None, description="立案案由详细")
    c_dsrxx: Optional[List[Dsrxx]] = Field(None, description="当事人")
    c_ah_ys: Optional[str] = Field(None, description="原审案号")
    n_qsbdje: Optional[float] = Field(None, description="起诉标的金额")
    n_jaay_tree: Optional[str] = Field(None, description="结案案由详细")
    n_ajlx: Optional[str] = Field(None, description="案件类型")
    c_id: Optional[str] = Field(None, description="案件唯一ID")
    n_ajbs: Optional[str] = Field(None, description="案件标识")

class Civil(BaseModel):
    """
    民事案件
    """
    cases: Optional[List[CivilCase]] = Field(None, description="案件")
    count: Optional[Count] = Field(None, description="统计")

class CriminalCase(BaseModel):
    """
    刑事案件项
    """
    c_gkws_dsr: Optional[str] = Field(None, description="当事人")
    n_pcpcje_level: Optional[int] = Field(None, description="判处赔偿金额等级")
    n_bqqpcje: Optional[int] = Field(None, description="被请求赔偿金额")
    n_pcpcje_gj_level: Optional[int] = Field(None, description="判处赔偿金额估计等级")
    d_larq: Optional[str] = Field(None, description="立案时间")
    d_jarq: Optional[str] = Field(None, description="结案时间")
    c_ah_hx: Optional[str] = Field(None, description="后续案号")
    n_jafs: Optional[str] = Field(None, description="结案方式")
    n_jaay_tag: Optional[str] = Field(None, description="结案案由标签")
    n_jbfy: Optional[str] = Field(None, description="经办法院")
    n_laay_tag: Optional[str] = Field(None, description="立案案由标签")
    n_dzzm: Optional[str] = Field(None, description="定罪罪名")
    n_jbfy_cj: Optional[str] = Field(None, description="法院所属层级")
    n_laay_tree: Optional[str] = Field(None, description="立案案由详细")
    n_ccxzxje_level: Optional[int] = Field(None, description="财产刑执行金额等级")
    n_crc: Optional[int] = Field(None, description="案件变更码")
    c_dsrxx: Optional[List[Dsrxx]] = Field(None, description="当事人")
    n_ccxzxje_gj_level: Optional[int] = Field(None, description="财产刑执行金额估计等级")
    n_fzje: Optional[int] = Field(None, description="犯罪金额")
    c_gkws_id: Optional[str] = Field(None, description="公开文书ID")
    c_ah: Optional[str] = Field(None, description="案号")
    c_ssdy: Optional[str] = Field(None, description="所属地域")
    n_pcpcje: Optional[int] = Field(None, description="判处赔偿金额")
    c_ah_ys: Optional[str] = Field(None, description="原审案号")
    n_ajjzjd: Optional[str] = Field(None, description="案件进展阶段")
    c_gkws_glah: Optional[str] = Field(None, description="相关案件号")
    c_gkws_pjjg: Optional[str] = Field(None, description="判决结果")
    c_slfsxx: Optional[str] = Field(None, description="审理方式信息")
    n_pcpcje_gj: Optional[int] = Field(None, description="判处赔偿金额估计")
    n_ajbs: Optional[str] = Field(None, description="案件标识")
    n_laay: Optional[str] = Field(None, description="立案案由")
    n_jaay: Optional[str] = Field(None, description="结案案由")
    n_ssdw: Optional[str] = Field(None, description="诉讼地位")
    n_dzzm_tree: Optional[str] = Field(None, description="定罪罪名树")
    n_jaay_tree: Optional[str] = Field(None, description="结案案由详细")
    n_pcjg: Optional[str] = Field(None, description="判处结果")
    c_id: Optional[str] = Field(None, description="案件唯一ID")
    n_ssdw_ys: Optional[str] = Field(None, description="一审诉讼地位")
    n_ccxzxje: Optional[int] = Field(None, description="财产刑执行金额")
    n_fzje_level: Optional[int] = Field(None, description="犯罪金额等级")
    n_slcx: Optional[str] = Field(None, description="审理程序")
    n_ajlx: Optional[str] = Field(None, description="案件类型")
    n_bqqpcje_level: Optional[int] = Field(None, description="被请求赔偿金额等级")
    n_ccxzxje_gj: Optional[int] = Field(None, description="财产刑执行金额估计")

class Criminal(BaseModel):
    """
    刑事案件
    """
    cases: Optional[List[CriminalCase]] = Field(None, description="案件")
    count: Optional[Count] = Field(None, description="统计")

class CasesTreeItem(BaseModel):
    """
    串联树项
    """
    c_ah: Optional[str] = Field(None, description="案号")
    case_type: Optional[int] = Field(None, description="案件类型")
    n_ajbs: Optional[str] = Field(None, description="案件标识")
    stage_type: Optional[int] = Field(None, description="审理阶段类型")
    next: Optional["CasesTreeItem"] = Field(None, description="下一个案件")

class CasesTree(BaseModel):
    """
    串联树
    """
    administrative: Optional[List[CasesTreeItem]] = Field(None, description="行政案件")
    criminal: Optional[List[CasesTreeItem]] = Field(None, description="刑事案件")
    civil: Optional[List[CasesTreeItem]] = Field(None, description="民事案件")

class BankruptCase(BaseModel):
    """
    强制清算与破产案件项
    """
    c_dsrxx: Optional[List[Dsrxx]] = Field(None, description="当事人")
    c_gkws_id: Optional[str] = Field(None, description="公开文书ID")
    n_ajbs: Optional[str] = Field(None, description="案件标识")
    n_jbfy_cj: Optional[str] = Field(None, description="法院所属层级")
    c_gkws_dsr: Optional[str] = Field(None, description="当事人")
    c_id: Optional[str] = Field(None, description="案件唯一ID")
    d_larq: Optional[str] = Field(None, description="立案时间")
    d_jarq: Optional[str] = Field(None, description="结案时间")
    n_ajlx: Optional[str] = Field(None, description="案件类型")
    c_gkws_glah: Optional[str] = Field(None, description="相关案件号")
    n_jbfy: Optional[str] = Field(None, description="经办法院")
    n_ajjzjd: Optional[str] = Field(None, description="案件进展阶段")
    c_gkws_pjjg: Optional[str] = Field(None, description="判决结果")
    c_ssdy: Optional[str] = Field(None, description="所属地域")
    n_crc: Optional[int] = Field(None, description="案件变更码")
    n_ssdw: Optional[str] = Field(None, description="诉讼地位")
    n_jafs: Optional[str] = Field(None, description="结案方式")
    c_ah: Optional[str] = Field(None, description="案号")

class Bankrupt(BaseModel):
    """
    强制清算与破产案件
    """
    cases: Optional[List[BankruptCase]] = Field(None, description="案件")
    count: Optional[Count] = Field(None, description="统计")

class EntoutData(BaseModel):
    """
    涉诉信息数据
    """
    administrative: Optional[Administrative] = Field(None, description="行政案件")
    implement: Optional[Implement] = Field(None, description="执行案件")
    count: Optional[Count] = Field(None, description="统计")
    preservation: Optional[Preservation] = Field(None, description="案件类型（非诉保全审查）")
    crc: Optional[int] = Field(None, description="当事人变更码")
    civil: Optional[Civil] = Field(None, description="民事案件")
    criminal: Optional[Criminal] = Field(None, description="刑事案件")
    cases_tree: Optional[CasesTree] = Field(None, description="串联树")
    bankrupt: Optional[Bankrupt] = Field(None, description="强制清算与破产案件")

class Entout(BaseModel):
    """
    涉诉信息
    """
    msg: Optional[str] = Field(None, description="备注信息")
    data: Optional[EntoutData] = Field(None, description="数据结果")

class XgbzxrItem(BaseModel):
    """
    限高被执行人项
    """
    ah: Optional[str] = Field(None, description="案号")
    id: Optional[str] = Field(None, description="标识")
    zxfy: Optional[str] = Field(None, description="执行法院")
    fbrq: Optional[str] = Field(None, description="发布时间")

class XgbzxrData(BaseModel):
    """
    限高被执行人数据
    """
    xgbzxr: Optional[List[XgbzxrItem]] = Field(None, description="限高被执行人列表")

class Xgbzxr(BaseModel):
    """
    限高被执行人
    """
    msg: Optional[str] = Field(None, description="备注信息")
    data: Optional[XgbzxrData] = Field(None, description="数据结果")



