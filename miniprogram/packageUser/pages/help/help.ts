// help.ts - 帮助中心页面
Page({
  data: {
    faqs: [
      {
        id: 'faq_001',
        question: '如何上传银行流水？',
        answer: '在"流水宝"页面点击上传按钮，支持PDF、JPG、PNG格式文件，文件大小不超过10MB。'
      },
      {
        id: 'faq_002',
        question: '为什么需要实名认证？',
        answer: '为了合规和保护用户权益，征信相关功能需要实名认证。我们严格遵守相关法规，保护用户隐私。'
      },
      {
        id: 'faq_003',
        question: '数据安全如何保障？',
        answer: '我们采用银行级加密技术，所有数据传输和存储都经过加密处理，严格遵守数据保护法规。'
      },
      {
        id: 'faq_004',
        question: '报告生成需要多长时间？',
        answer: '通常情况下，报告会在1-3分钟内生成完成。复杂的分析可能需要稍长时间。'
      },
      {
        id: 'faq_005',
        question: '如何联系客服？',
        answer: '您可以通过企业微信、邮件或电话联系我们的客服团队，工作日9:00-18:00在线服务。'
      }
    ],
    expandedFaq: null
  },

  /**
   * 展开/收起FAQ
   */
  onToggleFaq(e: any) {
    const { faqId } = e.currentTarget.dataset
    const { expandedFaq } = this.data
    
    this.setData({
      expandedFaq: expandedFaq === faqId ? null : faqId
    })
  },

  /**
   * 联系客服
   */
  onContactSupport() {
    wx.navigateTo({
      url: '/packageUser/pages/support/support'
    })
  }
})
