/**
 * 征信报告可视化模板生成器
 * 基于可视化最新样版.html，使用VisualizationReportData数据模型
 * 支持响应式布局，适配手机和电脑端
 */

/**
 * 格式化数字，添加千分位分隔符
 */
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 生成完整的HTML报告
 * @param {Object} data - VisualizationReportData对象
 * @param {string} reportDate - 报告日期
 * @param {string} reportNumber - 报告编号
 * @returns {string} 完整的HTML字符串
 */
function generateVisualizationReport(data, reportDate = null, reportNumber = null) {
    // 如果没有提供报告日期和编号，自动生成
    if (!reportDate) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        reportDate = `${year}-${month}-${day}`;
    }
    
    if (!reportNumber) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        const seconds = String(today.getSeconds()).padStart(2, '0');
        reportNumber = `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.personal_info.name}个人征信分析报告</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    ${generateStyles()}
</head>
<body>
    <div class="dashboard" id="dashboard">
        ${generateHeader(data, reportDate, reportNumber)}
        ${generatePersonalInfo(data.personal_info)}
        ${generateStatsGrid(data.stats)}
        ${generateDebtAnalysis(data)}
        ${generateLoanAnalysis(data)}
        ${generateCreditCardAnalysis(data)}
        ${generateOverdueAnalysis(data.overdue_analysis)}
        ${generateQueryRecords(data.query_records, data.query_charts)}
        ${generateProductRecommendations(data.product_recommendations, data.match_status)}
        ${generateAIAnalysis(data)}
        ${generateFooter(reportDate)}
    </div>
    ${generateScripts(data)}
</body>
</html>`;
}

/**
 * 生成样式部分
 */
function generateStyles() {
    return `<style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
        }
        
        body {
            background: #f5f7fa;
            color: #333;
            line-height: 1.5;
            padding: 12px;
            font-size: 14px;
            width: 100%;
            overflow-x: hidden;
        }
        
        .dashboard {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            background-color: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            overflow: hidden;
        }
        
        header {
            background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
            color: white;
            padding: 35px 20px 25px;
            position: relative;
            text-align: center;
            min-height: 180px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        h1 {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 12px;
            letter-spacing: 1.5px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .report-info {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        
        .personal-card {
            background: white;
            color: #333;
            border-radius: 10px;
            padding: 18px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            margin: 16px;
            width: calc(100% - 32px);
            border-left: 4px solid #4b6cb7;
            position: relative;
            overflow: hidden;
        }
        
        .personal-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, #4b6cb7, #667eea);
        }
        
        .card-title {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #4b6cb7;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        
        .info-item {
            margin-bottom: 12px;
            padding: 10px;
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        
        .info-item:hover {
            background-color: #f8f9fa;
            transform: translateY(-2px);
        }
        
        .info-label {
            font-size: 16px;
            color: #666;
            margin-bottom: 6px;
            font-weight: 500;
        }
        
        .info-value {
            font-size: 20px;
            font-weight: 700;
            color: #2c3e50;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
            padding: 0 16px 16px;
            width: 100%;
        }
        
        .stat-card {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            padding: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            width: 100%;
            transition: all 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
        }
        
        .stat-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
            font-size: 18px;
            color: white;
        }
        
        .icon-credit { background: linear-gradient(135deg, #4CAF50, #8BC34A); }
        .icon-debt { background: linear-gradient(135deg, #FF5722, #FF9800); }
        .icon-institution { background: linear-gradient(135deg, #9C27B0, #E91E63); }
        .icon-nonbank { background: linear-gradient(135deg, #FF9800, #FFC107); }
        .icon-overdue { background: linear-gradient(135deg, #F44336, #E91E63); }
        .icon-query { background: linear-gradient(135deg, #2196F3, #03A9F4); }
        
        .stat-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 6px;
        }
        
        .stat-value {
            font-size: 18px;
            font-weight: 700;
            color: #2c3e50;
        }
        
        .stat-unit {
            font-size: 12px;
            color: #7f8c8d;
            margin-left: 2px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 700;
            margin: 20px 16px 12px;
            color: #2c3e50;
            padding-bottom: 8px;
            border-bottom: 2px solid #4b6cb7;
            width: calc(100% - 32px);
        }
        
        .charts-container {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
            padding: 0 16px 16px;
            width: 100%;
        }
        
        .chart-card {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            padding: 16px;
            width: 100%;
        }
        
        .chart-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #2c3e50;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .chart-container {
            height: auto;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            width: 100%;
            min-height: 300px;
        }
        
        .data-table {
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            margin: 0;
            overflow-x: auto;
            width: 100%;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            min-width: 800px;
        }
        
        th {
            background-color: #4b6cb7;
            color: white;
            padding: 12px 10px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
        }
        
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        td {
            padding: 12px 10px;
            border-bottom: 1px solid #e9ecef;
            font-size: 13px;
        }
        
        .highlight {
            font-weight: 600;
            color: #4b6cb7;
        }
        
        .warning {
            color: #e74c3c;
            font-weight: 600;
        }
        
        .good {
            color: #2ecc71;
            font-weight: 600;
        }

        .ai-analysis-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
            margin-top: 15px;
        }

        .ai-analysis-item {
            padding: 12px 16px;
            border-radius: 8px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            font-size: 15px;
            line-height: 1.5;
            background-color: #f8f9fa;
            border-left: 4px solid #e9ecef;
        }

        .ai-analysis-item:nth-child(1) {
            border-left-color: rgba(52, 152, 219, 0.8);
        }

        .ai-analysis-item:nth-child(2) {
            border-left-color: rgba(46, 204, 113, 0.8);
        }

        .ai-analysis-item:nth-child(3) {
            border-left-color: rgba(243, 156, 18, 0.8);
        }

        .ai-analysis-item:nth-child(4) {
            border-left-color: rgba(155, 89, 182, 0.8);
        }

        .ai-analysis-number {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            color: white;
            flex-shrink: 0;
        }

        .ai-analysis-item:nth-child(1) .ai-analysis-number {
            background-color: rgba(52, 152, 219, 0.8);
        }

        .ai-analysis-item:nth-child(2) .ai-analysis-number {
            background-color: rgba(46, 204, 113, 0.8);
        }

        .ai-analysis-item:nth-child(3) .ai-analysis-number {
            background-color: rgba(243, 156, 18, 0.8);
        }

        .ai-analysis-item:nth-child(4) .ai-analysis-number {
            background-color: rgba(155, 89, 182, 0.8);
        }

        .recommendation {
            background: rgba(237, 253, 237, 0.3);
            border-left: 3px solid rgba(46, 204, 113, 0.5);
            padding: 14px;
            border-radius: 6px;
            margin-top: 15px;
            font-size: 16px;
            line-height: 1.7;
        }

        /* 响应式调整 */
        @media (max-width: 768px) {
            .stats-grid {
                grid-template-columns: 1fr 1fr;
            }
            
            header {
                text-align: center;
                padding: 30px 16px 20px;
                min-height: 160px;
            }
            
            h1 {
                font-size: 26px;
            }
        }
        
        @media (max-width: 480px) {
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            header {
                padding: 25px 16px 15px;
                min-height: 140px;
            }
            
            h1 {
                font-size: 22px;
            }
        }
    </style>`;
}

/**
 * 生成头部
 */
function generateHeader(data, reportDate, reportNumber) {
    return `<header>
        <h1>${data.personal_info.name}个人征信分析报告</h1>
        <div class="report-info">
            <div>报告时间: <span id="reportDate">${reportDate}</span></div>
            <div>报告编号: <span id="reportNumber">${reportNumber}</span></div>
        </div>
    </header>`;
}

/**
 * 生成个人信息卡片
 */
function generatePersonalInfo(personalInfo) {
    return `<div class="personal-card">
        <div class="card-title">
            <span class="icon-user">👤</span>
            个人信息概览
        </div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">用户姓名</div>
                <div class="info-value">${personalInfo.name}</div>
            </div>
            <div class="info-item">
                <div class="info-label">年龄</div>
                <div class="info-value">${personalInfo.age}</div>
            </div>
            <div class="info-item">
                <div class="info-label">婚姻状况</div>
                <div class="info-value">${personalInfo.marital_status}</div>
            </div>
            <div class="info-item">
                <div class="info-label">身份证号</div>
                <div class="info-value">${personalInfo.id_card}</div>
            </div>
        </div>
    </div>`;
}

/**
 * 生成统计卡片网格
 */
function generateStatsGrid(stats) {
    return `<div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon icon-credit">💳</div>
            <div class="stat-label">总授信额度</div>
            <div class="stat-value">${formatNumber(stats.total_credit)}<span class="stat-unit">元</span></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon icon-debt">💰</div>
            <div class="stat-label">总负债金额</div>
            <div class="stat-value">${formatNumber(stats.total_debt)}<span class="stat-unit">元</span></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon icon-institution">🏦</div>
            <div class="stat-label">总机构数</div>
            <div class="stat-value">${stats.total_institutions}<span class="stat-unit">家</span></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon icon-nonbank">🏢</div>
            <div class="stat-label">贷款机构数</div>
            <div class="stat-value">${stats.loan_institutions}<span class="stat-unit">家</span></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon icon-overdue">⚠️</div>
            <div class="stat-label">历史逾期月份</div>
            <div class="stat-value">${stats.overdue_months}<span class="stat-unit">个月</span></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon icon-query">🔍</div>
            <div class="stat-label">近3月查询次数</div>
            <div class="stat-value">${stats.query_count_3m}<span class="stat-unit">次</span></div>
        </div>
    </div>`;
}

/**
 * 生成负债分析部分
 */
function generateDebtAnalysis(data) {
    const debtRows = data.debt_composition.map(item => `
        <tr>
            <td class="highlight">${item.type}</td>
            <td>${item.institutions}</td>
            <td>${item.accounts}</td>
            <td>${formatNumber(item.credit_limit)}</td>
            <td>${formatNumber(item.balance)}</td>
            <td class="${item.usage_rate && item.usage_rate !== '-' && parseFloat(item.usage_rate) < 30 ? 'good' : ''}">${item.usage_rate || '-'}</td>
        </tr>
    `).join('');

    return `<h2 class="section-title">贷款与负债分析</h2>
    <div class="charts-container">
        <div class="chart-card">
            <div class="chart-title">
                <span>📊</span>
                负债构成分析
            </div>
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>类型</th>
                            <th>机构数</th>
                            <th>账户数</th>
                            <th>授信额度(元)</th>
                            <th>余额(元)</th>
                            <th>使用率</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${debtRows}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

/**
 * 生成贷款分析部分
 */
function generateLoanAnalysis(data) {
    const bankLoanRows = data.bank_loans.map(loan => `
        <tr>
            <td>${loan.id}</td>
            <td class="highlight">${loan.institution}</td>
            <td>${formatNumber(loan.credit_limit)}</td>
            <td>${formatNumber(loan.balance)}</td>
            <td>${loan.business_type}</td>
            <td>${loan.period}</td>
            <td>${loan.remaining_period}</td>
            <td>${loan.usage_rate}</td>
        </tr>
    `).join('');

    const nonBankLoanRows = data.non_bank_loans.map(loan => `
        <tr>
            <td>${loan.id}</td>
            <td class="highlight">${loan.institution}</td>
            <td>${formatNumber(loan.credit_limit)}</td>
            <td>${formatNumber(loan.balance)}</td>
            <td>${loan.business_type}</td>
            <td>${loan.period}</td>
            <td>${loan.remaining_period}</td>
            <td>${loan.usage_rate}</td>
        </tr>
    `).join('');

    return `<h2 class="section-title">贷款详情分析</h2>
    <div class="charts-container">
        <div class="chart-card">
            <div class="chart-container">
                <canvas id="loansChart"></canvas>
            </div>

            <h3 class="section-title" style="font-size: 18px; margin-top: 20px;">贷款汇总信息</h3>
            <div class="info-grid" style="margin-top: 10px;">
                <div class="info-item">
                    <div class="info-label">贷款平均期限</div>
                    <div class="info-value">${data.loan_summary.avg_period}年</div>
                </div>
                <div class="info-item">
                    <div class="info-label">最高单笔贷款余额</div>
                    <div class="info-value">${formatNumber(data.loan_summary.max_balance)}元</div>
                </div>
                <div class="info-item">
                    <div class="info-label">最小单笔贷款余额</div>
                    <div class="info-value">${formatNumber(data.loan_summary.min_balance)}元</div>
                </div>
                <div class="info-item">
                    <div class="info-label">贷款机构类型</div>
                    <div class="info-value">${data.loan_summary.institution_types}</div>
                </div>
            </div>

            <h3 class="section-title" style="font-size: 18px; margin-top: 20px;">银行贷款明细</h3>
            <div class="data-table" style="margin-top: 10px;">
                <table>
                    <thead>
                        <tr>
                            <th>序号</th>
                            <th>管理机构</th>
                            <th>授信额度(元)</th>
                            <th>余额(元)</th>
                            <th>业务类型</th>
                            <th>起止日期</th>
                            <th>剩余期限</th>
                            <th>使用率</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bankLoanRows}
                    </tbody>
                </table>
            </div>

            <h3 class="section-title" style="font-size: 18px; margin-top: 20px;">非银机构贷款明细</h3>
            <div class="data-table" style="margin-top: 10px;">
                <table>
                    <thead>
                        <tr>
                            <th>序号</th>
                            <th>管理机构</th>
                            <th>授信额度(元)</th>
                            <th>余额(元)</th>
                            <th>业务类型</th>
                            <th>起止日期</th>
                            <th>剩余期限</th>
                            <th>使用率</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${nonBankLoanRows}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

/**
 * 生成信用卡分析部分
 */
function generateCreditCardAnalysis(data) {
    const creditCardRows = data.credit_cards.map(card => `
        <tr>
            <td>${card.id}</td>
            <td class="highlight">${card.institution}</td>
            <td>${formatNumber(card.credit_limit)}</td>
            <td>${formatNumber(card.used_amount)}</td>
            <td>${formatNumber(card.installment_balance)}</td>
            <td>${card.usage_rate}</td>
            <td class="${card.status === '正常' ? 'good' : 'warning'}">${card.status}</td>
            <td>${card.overdue_history}</td>
        </tr>
    `).join('');

    return `<h2 class="section-title">信用卡使用情况</h2>
    <div class="charts-container">
        <div class="chart-card">
            <div class="chart-title">
                <span>💳</span>
                信用卡使用率分析
            </div>
            <div class="info-grid" style="margin-top: 10px;">
                <div class="info-item">
                    <div class="info-label">使用率</div>
                    <div class="info-value ${data.credit_usage.usage_percentage > 70 ? 'warning' : 'good'}">${data.credit_usage.usage_percentage.toFixed(2)}%</div>
                </div>
                <div class="info-item">
                    <div class="info-label">风险等级</div>
                    <div class="info-value">${data.credit_usage.risk_level}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">授信额度</div>
                    <div class="info-value">${formatNumber(data.credit_usage.total_credit)}元</div>
                </div>
                <div class="info-item">
                    <div class="info-label">已用额度</div>
                    <div class="info-value">${formatNumber(data.credit_usage.used_credit)}元</div>
                </div>
                <div class="info-item">
                    <div class="info-label">可用额度</div>
                    <div class="info-value">${formatNumber(data.credit_usage.available_credit)}元</div>
                </div>
                <div class="info-item">
                    <div class="info-label">影响程度</div>
                    <div class="info-value">${data.credit_usage.impact_level}</div>
                </div>
            </div>

            <h3 class="section-title" style="font-size: 18px; margin-top: 20px;">信用卡明细</h3>
            <div class="data-table" style="margin-top: 10px;">
                <table>
                    <thead>
                        <tr>
                            <th>序号</th>
                            <th>管理机构</th>
                            <th>授信额度(元)</th>
                            <th>已用额度(元)</th>
                            <th>大额专项分期余额(元)</th>
                            <th>使用率</th>
                            <th>当前状态</th>
                            <th>历史逾期</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${creditCardRows}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

/**
 * 生成逾期分析部分
 */
function generateOverdueAnalysis(overdueAnalysis) {
    const institutionItems = overdueAnalysis.institutions.map(inst => `
        <div class="info-item">
            <div class="info-label">${inst.name}</div>
            <div class="info-value">
                总逾期: ${inst.total_overdue_months}月 |
                90天+: ${inst.overdue_90plus_months}月 |
                状态: <span class="${inst.status === '已结清' ? 'good' : 'warning'}">${inst.status}</span>
            </div>
        </div>
    `).join('');

    return `<h2 class="section-title">逾期情况分析</h2>
    <div class="charts-container">
        <div class="chart-card">
            <div class="chart-title">
                <span>⚠️</span>
                逾期严重程度
            </div>
            <div class="info-grid" style="margin-top: 10px;">
                <div class="info-item">
                    <div class="info-label">严重程度</div>
                    <div class="info-value ${overdueAnalysis.severity_level === '无逾期' ? 'good' : 'warning'}">${overdueAnalysis.severity_level}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">严重程度百分比</div>
                    <div class="info-value">${overdueAnalysis.severity_percentage.toFixed(2)}%</div>
                </div>
                <div class="info-item">
                    <div class="info-label">90天以上逾期</div>
                    <div class="info-value">${overdueAnalysis.overdue_90plus}月</div>
                </div>
                <div class="info-item">
                    <div class="info-label">30-90天逾期</div>
                    <div class="info-value">${overdueAnalysis.overdue_30_90}月</div>
                </div>
                <div class="info-item">
                    <div class="info-label">30天以内逾期</div>
                    <div class="info-value">${overdueAnalysis.overdue_under_30}月</div>
                </div>
            </div>

            ${overdueAnalysis.institutions.length > 0 ? `
            <h3 class="section-title" style="font-size: 18px; margin-top: 20px;">逾期机构详情</h3>
            <div class="info-grid" style="margin-top: 10px;">
                ${institutionItems}
            </div>
            ` : ''}
        </div>
    </div>`;
}

/**
 * 生成查询记录部分
 */
function generateQueryRecords(queryRecords, queryCharts) {
    const queryRows = queryRecords.map(record => `
        <tr>
            <td class="highlight">${record.period}</td>
            <td>${record.loan_approval}</td>
            <td>${record.credit_card_approval}</td>
            <td>${record.guarantee_review}</td>
            <td>${record.insurance_review}</td>
            <td>${record.credit_review}</td>
            <td class="${record.non_post_loan > 5 ? 'warning' : ''}">${record.non_post_loan}</td>
            <td>${record.self_query}</td>
        </tr>
    `).join('');

    return `<h2 class="section-title">查询记录分析</h2>
    <div class="charts-container">
        <div class="chart-card">
            <div class="chart-title">
                <span>🔍</span>
                查询记录趋势
            </div>
            <div class="chart-container">
                <canvas id="queryTrendChart"></canvas>
            </div>

            <div class="data-table" style="margin-top: 20px;">
                <table>
                    <thead>
                        <tr>
                            <th>时间段</th>
                            <th>贷款审批</th>
                            <th>信用卡审批</th>
                            <th>担保资格审查</th>
                            <th>保前审查</th>
                            <th>资信审查</th>
                            <th>非贷后管理查询</th>
                            <th>本人查询</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${queryRows}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

/**
 * 生成产品推荐部分
 */
function generateProductRecommendations(products, matchStatus) {
    if (!products || products.length === 0) {
        return `<div class="charts-container">
            <div class="chart-card">
                <div class="chart-title">
                    <span>🎯</span>
                    信贷产品匹配结果
                </div>
                <div class="info-item">
                    <div class="info-label">匹配状态</div>
                    <div class="info-value">暂无匹配产品</div>
                </div>
            </div>
        </div>`;
    }

    const productRows = products.map(product => {
        const stars = '⭐'.repeat(product.rating) + '☆'.repeat(5 - product.rating);
        return `
        <tr>
            <td class="highlight">${product.bank}</td>
            <td>${product.product_name}</td>
            <td>${product.min_rate}</td>
            <td>${product.max_credit}万元</td>
            <td>${stars}</td>
            <td>${product.suggestion}</td>
        </tr>
        `;
    }).join('');

    return `<h2 class="section-title">信贷产品匹配结果</h2>
    <div class="charts-container">
        <div class="chart-card">
            <div class="chart-title">
                <span>🎯</span>
                推荐产品列表
            </div>
            <div class="info-item" style="margin-bottom: 15px;">
                <div class="info-value good">${matchStatus}</div>
            </div>

            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>所属银行</th>
                            <th>产品名</th>
                            <th>最低年利率</th>
                            <th>最高授信额度</th>
                            <th>推荐指数</th>
                            <th>建议</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productRows}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

/**
 * 生成AI分析部分
 */
function generateAIAnalysis(data) {
    const analysisItems = data.ai_analysis.map(item => `
        <div class="ai-analysis-item">
            <div class="ai-analysis-number">${item.number}</div>
            <div class="ai-analysis-text">${item.content}</div>
        </div>
    `).join('');

    const suggestionItems = data.optimization_suggestions.map((suggestion, index) => `
        ${index + 1}. ${suggestion}<br>
    `).join('');

    return `<h2 class="section-title">AI专家解析</h2>
    <div class="charts-container">
        <div class="chart-card">
            <div class="chart-title">
                <span>🤖</span>
                AI智能分析
            </div>
            <div class="ai-analysis-grid">
                ${analysisItems}
            </div>

            <div class="recommendation" style="margin-top: 20px;">
                <strong>适合贷款申请程度：${data.suitability_rating}</strong><br><br>
                <strong>优化建议：</strong><br>
                ${suggestionItems}
                <br>
                <strong>风险提示：</strong> ${data.risk_warning}
            </div>
        </div>
    </div>`;
}

/**
 * 生成页脚
 */
function generateFooter(reportDate) {
    return `<footer style="text-align: center; padding: 16px; color: #7f8c8d; font-size: 12px; border-top: 1px solid #ecf0f1; background-color: #f8f9fa; width: 100%;">
        <p>数据来源: 个人征信报告 | 生成时间: <span id="footerDate">${reportDate}</span></p>
        <p>本报告基于<span id="footerDate2">${reportDate}</span>征信数据生成，仅供参考，具体信贷审批以银行最终审核为准。</p>
    </footer>`;
}

/**
 * 生成图表脚本
 */
function generateScripts(data) {
    // 准备贷款图表数据
    const loanChartLabels = data.loan_charts.map(item => item.institution);
    const loanChartCreditData = data.loan_charts.map(item => item.credit_limit);
    const loanChartBalanceData = data.loan_charts.map(item => item.balance);

    // 准备查询记录图表数据
    const queryChartLabels = data.query_charts.map(item => item.period);
    const queryChartLoanData = data.query_charts.map(item => item.loan_approval);
    const queryChartCardData = data.query_charts.map(item => item.credit_card_approval);
    const queryChartGuaranteeData = data.query_charts.map(item => item.guarantee_review);

    return `<script>
        document.addEventListener('DOMContentLoaded', function() {
            // 初始化贷款详情图表
            const loansCtx = document.getElementById('loansChart');
            if (loansCtx) {
                const loansChart = new Chart(loansCtx.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: ${JSON.stringify(loanChartLabels)},
                        datasets: [{
                            label: '授信额度(元)',
                            data: ${JSON.stringify(loanChartCreditData)},
                            backgroundColor: 'rgba(75, 108, 183, 0.6)',
                            borderColor: 'rgba(75, 108, 183, 1)',
                            borderWidth: 1
                        }, {
                            label: '贷款余额(元)',
                            data: ${JSON.stringify(loanChartBalanceData)},
                            backgroundColor: 'rgba(46, 204, 113, 0.6)',
                            borderColor: 'rgba(46, 204, 113, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return value.toLocaleString() + '元';
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        label += context.parsed.y.toLocaleString() + '元';
                                        return label;
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // 初始化查询记录趋势图
            const queryTrendCtx = document.getElementById('queryTrendChart');
            if (queryTrendCtx) {
                const queryTrendChart = new Chart(queryTrendCtx.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: ${JSON.stringify(queryChartLabels)},
                        datasets: [{
                            label: '贷款审批',
                            data: ${JSON.stringify(queryChartLoanData)},
                            borderColor: '#4285f4',
                            backgroundColor: 'rgba(66, 133, 244, 0.1)',
                            tension: 0.3,
                            fill: true
                        }, {
                            label: '信用卡审批',
                            data: ${JSON.stringify(queryChartCardData)},
                            borderColor: '#ea4335',
                            backgroundColor: 'rgba(234, 67, 53, 0.1)',
                            tension: 0.3,
                            fill: true
                        }, {
                            label: '担保资格审查',
                            data: ${JSON.stringify(queryChartGuaranteeData)},
                            borderColor: '#b5933e',
                            backgroundColor: 'rgba(181, 147, 62, 0.1)',
                            tension: 0.3,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            }
                        }
                    }
                });
            }
        });
    </script>`;
}

// 导出函数供Node.js和浏览器使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateVisualizationReport,
        formatNumber
    };
}


