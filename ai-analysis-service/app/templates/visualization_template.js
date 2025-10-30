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

        /* 包含Grid布局的chart-container使用block布局 */
        .chart-container.grid-wrapper {
            display: block;
            min-height: auto;
        }

        /* 逾期分析样式 */
        .overdue-analysis {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            padding: 16px;
            margin: 0 16px 20px;
            width: calc(100% - 32px);
        }

        .overdue-severity {
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }

        .severity-indicator {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .severity-label {
            font-size: 16px;
            font-weight: 600;
            color: #2c3e50;
        }

        .severity-level {
            font-size: 18px;
            font-weight: 700;
            color: #2ecc71;
            padding: 4px 12px;
            background: rgba(46, 204, 113, 0.1);
            border-radius: 20px;
        }

        .severity-level.warning {
            color: #f39c12;
            background: rgba(243, 156, 18, 0.1);
        }

        .severity-level.danger {
            color: #e74c3c;
            background: rgba(231, 76, 60, 0.1);
        }

        .severity-bar {
            width: 100%;
            height: 20px;
            background: #f0f0f0;
            border-radius: 10px;
            margin-bottom: 10px;
            overflow: hidden;
            position: relative;
        }

        .severity-fill {
            height: 100%;
            background: linear-gradient(90deg, #2ecc71, #f39c12, #e74c3c);
            border-radius: 10px;
            transition: width 0.5s ease;
        }

        .severity-marker {
            position: relative;
            margin-bottom: 5px;
        }

        .marker {
            position: absolute;
            top: -6px;
            width: 12px;
            height: 32px;
            background: #2c3e50;
            transform: translateX(-50%);
            border-radius: 2px;
        }

        .marker::after {
            content: '';
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-bottom: 8px solid #2c3e50;
        }

        .severity-labels {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #666;
        }

        .overdue-distribution {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
            margin-bottom: 20px;
        }

        @media (min-width: 768px) {
            .overdue-distribution {
                grid-template-columns: 1fr 1fr;
            }
        }

        .overdue-chart-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 16px;
        }

        .overdue-timeline {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .timeline-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .timeline-period {
            font-size: 14px;
            font-weight: 600;
            color: #2c3e50;
        }

        .timeline-details {
            text-align: right;
        }

        .timeline-count {
            font-size: 16px;
            font-weight: 700;
            color: #e74c3c;
        }

        .timeline-desc {
            font-size: 12px;
            color: #666;
        }

        .overdue-institutions {
            margin-top: 15px;
        }

        .institution-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .institution-item {
            background: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .institution-name {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #2c3e50;
        }

        .institution-details {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
        }

        .detail-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        .detail-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
        }

        .detail-value {
            font-size: 14px;
            font-weight: 700;
            color: #2c3e50;
        }

        .detail-status {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }

        .status-closed {
            background: rgba(46, 204, 113, 0.1);
            color: #27ae60;
        }

        .status-active {
            background: rgba(231, 76, 60, 0.1);
            color: #e74c3c;
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

        /* 负债构成分析布局 */
        .debt-composition {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
        }

        /* 图表静态展示容器 */
        .chart-static {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            width: 100%;
        }

        /* 饼图样式 */
        .chart-pie {
            width: 140px;
            height: 140px;
            border-radius: 50%;
            position: relative;
            margin: 0 auto 15px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            /* 备用背景色，如果浏览器不支持conic-gradient */
            background: linear-gradient(135deg, #4b6cb7 0%, #2ecc71 100%);
        }

        /* 饼图内部白色圆圈（环形图效果） */
        .chart-pie::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 70px;
            height: 70px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
        }

        /* 图例样式 */
        .chart-legend {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            margin-top: 10px;
            width: 100%;
        }

        .legend-item {
            display: flex;
            align-items: center;
            font-size: 13px;
            color: #555;
        }

        .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 2px;
            margin-right: 8px;
            flex-shrink: 0;
        }

        /* 图标样式 */
        .icon {
            width: 16px;
            height: 16px;
            display: inline-block;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
        }

        .icon-chart {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232c3e50'%3E%3Cpath d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z'/%3E%3C/svg%3E");
        }

        .icon-info {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234b6cb7'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'/%3E%3C/svg%3E");
        }

        /* 贷款图表容器 - 左右布局 */
        .loans-chart-container {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }

        /* 贷款状态汇总 */
        .loan-status-summary {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 15px;
        }

        .loan-status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: #f8f9fa;
            border-radius: 8px;
        }

        .loan-status-item span:first-child {
            color: #666;
            font-size: 13px;
        }

        .loan-status-item span:last-child {
            color: #2c3e50;
            font-weight: 600;
            font-size: 14px;
        }

        /* 信用卡使用率分析 - 左右布局 */
        .credit-usage-analysis {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
        }

        /* 使用率概览卡片 */
        .usage-overview {
            background: linear-gradient(135deg, #4CAF50, #2ecc71);
            color: white;
            border-radius: 12px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }

        .usage-percentage {
            font-size: 48px;
            font-weight: 800;
            line-height: 1;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .usage-status {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 12px;
            opacity: 0.9;
        }

        .usage-details {
            display: flex;
            gap: 20px;
            margin-top: 10px;
        }

        .usage-detail-item {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .detail-number {
            font-size: 16px;
            font-weight: 700;
        }

        .detail-label {
            font-size: 12px;
            opacity: 0.8;
            margin-top: 4px;
        }

        /* 风险指示器卡片 */
        .risk-indicator-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .risk-meter {
            width: 100%;
            height: 120px;
            position: relative;
            margin: 20px 0;
        }

        .risk-gauge {
            width: 100%;
            height: 40px;
            background: linear-gradient(90deg,
                #4CAF50 0%,
                #4CAF50 40%,
                #FFC107 40%,
                #FFC107 70%,
                #F44336 70%,
                #F44336 100%);
            border-radius: 20px;
            position: relative;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .risk-needle {
            position: absolute;
            top: -10px;
            width: 4px;
            height: 60px;
            background-color: #2c3e50;
            transform: translateX(-50%);
            z-index: 10;
            border-radius: 2px;
        }

        .risk-needle::after {
            content: '';
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-bottom: 8px solid #2c3e50;
        }

        .risk-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            width: 100%;
            position: relative;
        }

        .risk-label {
            font-size: 12px;
            color: #666;
            text-align: center;
            position: absolute;
            transform: translateX(-50%);
        }

        .risk-label:nth-child(1) {
            left: 0%;
        }

        .risk-label:nth-child(2) {
            left: 40%;
        }

        .risk-label:nth-child(3) {
            left: 70%;
        }

        .risk-label:nth-child(4) {
            left: 100%;
        }

        .risk-zones {
            display: flex;
            justify-content: space-between;
            margin-top: 25px;
            padding: 0 5px;
        }

        .risk-zone {
            font-size: 12px;
            font-weight: 600;
            text-align: center;
            flex: 1;
        }

        .risk-zone.safe {
            color: #4CAF50;
        }

        .risk-zone.warning {
            color: #FFC107;
        }

        .risk-zone.danger {
            color: #F44336;
        }

        .risk-breakdown {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 20px;
        }

        .breakdown-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }

        .breakdown-value {
            font-size: 20px;
            font-weight: 700;
            color: #4CAF50;
            margin-bottom: 5px;
        }

        .breakdown-label {
            font-size: 12px;
            color: #666;
        }

        /* 响应式调整 */
        @media (max-width: 768px) {
            .debt-composition {
                grid-template-columns: 1fr;
            }
            .loans-chart-container {
                grid-template-columns: 1fr;
            }
            .credit-usage-analysis {
                grid-template-columns: 1fr;
            }
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
    // 计算负债构成数据
    const debtComposition = data.debt_composition || [];
    let loanData = debtComposition.find(item => item.type === '贷款') || { balance: 0 };
    let creditCardData = debtComposition.find(item => item.type === '信用卡') || { balance: 0 };

    const totalBalance = loanData.balance + creditCardData.balance;

    // 计算百分比，如果总额为0则显示默认值
    let loanPercentage, creditCardPercentage;
    if (totalBalance > 0) {
        loanPercentage = ((loanData.balance / totalBalance) * 100).toFixed(1);
        creditCardPercentage = ((creditCardData.balance / totalBalance) * 100).toFixed(1);
    } else {
        // 默认显示50-50
        loanPercentage = 50;
        creditCardPercentage = 50;
    }

    // 生成饼图渐变色（根据百分比）
    const pieChartGradient = `conic-gradient(#4b6cb7 0% ${loanPercentage}%, #2ecc71 ${loanPercentage}% 100%)`;

    // 生成表格行
    const debtRows = debtComposition.map(item => `
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
        <!-- 负债构成分析 - 左右分布 -->
        <div class="debt-composition">
            <!-- 饼图卡片 -->
            <div class="chart-card">
                <div class="chart-title">
                    <span class="icon icon-chart"></span>
                    负债构成分析
                </div>
                <div class="chart-container">
                    <div class="chart-static">
                        <div class="chart-pie" style="background: ${pieChartGradient};"></div>
                        <div class="chart-legend">
                            <div class="legend-item">
                                <div class="legend-color" style="background-color: #4b6cb7;"></div>
                                <div>贷款 (${formatNumber(loanData.balance)}元, ${loanPercentage}%)</div>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background-color: #2ecc71;"></div>
                                <div>信用卡 (${formatNumber(creditCardData.balance)}元, ${creditCardPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 负债构成分析表 -->
            <div class="chart-card">
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

    // 计算银行贷款合计
    const bankTotalCredit = data.bank_loans.reduce((sum, loan) => sum + (loan.credit_limit || 0), 0);
    const bankTotalBalance = data.bank_loans.reduce((sum, loan) => sum + (loan.balance || 0), 0);
    const bankTotalUsageRate = bankTotalCredit > 0 ? ((bankTotalBalance / bankTotalCredit) * 100).toFixed(1) : '0.0';

    // 计算非银机构贷款合计
    const nonBankTotalCredit = data.non_bank_loans.reduce((sum, loan) => sum + (loan.credit_limit || 0), 0);
    const nonBankTotalBalance = data.non_bank_loans.reduce((sum, loan) => sum + (loan.balance || 0), 0);
    const nonBankTotalUsageRate = nonBankTotalCredit > 0 ? ((nonBankTotalBalance / nonBankTotalCredit) * 100).toFixed(1) : '0.0';

    // 计算总计
    const grandTotalCredit = bankTotalCredit + nonBankTotalCredit;
    const grandTotalBalance = bankTotalBalance + nonBankTotalBalance;
    const grandTotalUsageRate = grandTotalCredit > 0 ? ((grandTotalBalance / grandTotalCredit) * 100).toFixed(1) : '0.0';

    // 准备贷款图表数据（用于本段内联脚本初始化）
    const loanChartLabels = (data.loan_charts || []).map(item => item.institution);
    const loanChartCreditData = (data.loan_charts || []).map(item => item.credit_limit);
    const loanChartBalanceData = (data.loan_charts || []).map(item => item.balance);

    return `<h2 class="section-title">贷款详情分析</h2>
    <div class="chart-card">
        <div class="loans-chart-container">
            <div class="chart-container">
                <canvas id="loansChart"></canvas>
            </div>
            <div class="loan-status-summary">
                <div class="loan-status-item">
                    <span>贷款平均期限</span>
                    <span>${data.loan_summary.avg_period}年</span>
                </div>
                <div class="loan-status-item">
                    <span>最高单笔贷款余额</span>
                    <span>${formatNumber(data.loan_summary.max_balance)}元</span>
                </div>
                <div class="loan-status-item">
                    <span>最小单笔贷款余额</span>
                    <span>${formatNumber(data.loan_summary.min_balance)}元</span>
                </div>
                <div class="loan-status-item">
                    <span>贷款机构类型</span>
                    <span>${data.loan_summary.institution_types}</span>
                </div>
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
                    <tr style="background-color: #f8f9fa; font-weight: 600;">
                        <td class="highlight">银行合计</td>
                        <td>-</td>
                        <td>${formatNumber(bankTotalCredit)}</td>
                        <td>${formatNumber(bankTotalBalance)}</td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                        <td>${bankTotalUsageRate}%</td>
                    </tr>
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
                    <tr style="background-color: #f8f9fa; font-weight: 600;">
                        <td class="highlight">非银机构合计</td>
                        <td>-</td>
                        <td>${formatNumber(nonBankTotalCredit)}</td>
                        <td>${formatNumber(nonBankTotalBalance)}</td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                        <td>${nonBankTotalUsageRate}%</td>
                    </tr>
                    <tr style="background-color: #e3f2fd; font-weight: 700; color: #1976d2;">
                        <td class="highlight">合计</td>
                        <td>-</td>
                        <td>${formatNumber(grandTotalCredit)}</td>
                        <td>${formatNumber(grandTotalBalance)}</td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                        <td>${grandTotalUsageRate}%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <script>
    (function() {
        try {
            const loansCtx = document.getElementById('loansChart');
            if (loansCtx && typeof Chart !== 'undefined') {
                new Chart(loansCtx.getContext('2d'), {
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
                                        try { return value.toLocaleString() + '元'; } catch(e) { return value + '元'; }
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: { display: true, position: 'top' }
                        }
                    }
                });
            }
        } catch (e) { console.error('贷款图表初始化失败:', e); }
    })();
    </script>`;
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

    // 计算信用卡合计
    const totalCreditLimit = data.credit_cards.reduce((sum, card) => sum + (card.credit_limit || 0), 0);
    const totalUsedAmount = data.credit_cards.reduce((sum, card) => sum + (card.used_amount || 0), 0);
    const totalInstallmentBalance = data.credit_cards.reduce((sum, card) => sum + (card.installment_balance || 0), 0);
    const totalUsageRate = totalCreditLimit > 0 ? ((totalUsedAmount / totalCreditLimit) * 100).toFixed(2) : '0.00';

    // 计算使用率和风险等级
    const usagePercentage = data.credit_usage.usage_percentage.toFixed(2);
    const riskLevel = data.credit_usage.risk_level;
    const safetyMargin = (70 - data.credit_usage.usage_percentage).toFixed(2);

    // 根据使用率确定背景渐变色
    let gradientColor = 'linear-gradient(135deg, #4CAF50, #2ecc71)'; // 低风险 - 绿色
    if (data.credit_usage.usage_percentage >= 70) {
        gradientColor = 'linear-gradient(135deg, #F44336, #e53935)'; // 高风险 - 红色
    } else if (data.credit_usage.usage_percentage >= 40) {
        gradientColor = 'linear-gradient(135deg, #FFC107, #ffb300)'; // 中风险 - 黄色
    }

    return `<h2 class="section-title">信用卡使用情况</h2>
    <div class="charts-container">
        <div class="chart-card">
            <div class="chart-title">
                <span class="icon icon-info"></span>
                信用卡使用率分析
            </div>
            <div class="chart-container grid-wrapper">
                <div class="credit-usage-analysis">
                <!-- 使用率概览 -->
                <div class="usage-overview" style="background: ${gradientColor};">
                    <div class="usage-percentage">${usagePercentage}%</div>
                    <div class="usage-status">${riskLevel}</div>
                    <div class="usage-details">
                        <div class="usage-detail-item">
                            <div class="detail-number">${formatNumber(data.credit_usage.total_credit)}元</div>
                            <div class="detail-label">授信额度</div>
                        </div>
                        <div class="usage-detail-item">
                            <div class="detail-number">${formatNumber(data.credit_usage.used_credit)}元</div>
                            <div class="detail-label">已用额度</div>
                        </div>
                        <div class="usage-detail-item">
                            <div class="detail-number">${formatNumber(data.credit_usage.available_credit)}元</div>
                            <div class="detail-label">可用额度</div>
                        </div>
                    </div>
                </div>

                <!-- 风险指示器 -->
                <div class="risk-indicator-card">
                    <div class="chart-title">
                        <span class="icon icon-info"></span>
                        风险等级评估
                    </div>
                    <div class="risk-meter">
                        <div class="risk-gauge">
                            <div class="risk-needle" style="left: ${usagePercentage}%;"></div>
                        </div>
                        <div class="risk-labels">
                            <div class="risk-label">0%</div>
                            <div class="risk-label">40%</div>
                            <div class="risk-label">70%</div>
                            <div class="risk-label">100%+</div>
                        </div>
                        <div class="risk-zones">
                            <div class="risk-zone safe">低风险</div>
                            <div class="risk-zone warning">中风险</div>
                            <div class="risk-zone danger">高风险</div>
                        </div>
                    </div>

                    <div class="risk-breakdown">
                        <div class="breakdown-item">
                            <div class="breakdown-value">${usagePercentage}%</div>
                            <div class="breakdown-label">当前使用率</div>
                        </div>
                        <div class="breakdown-item">
                            <div class="breakdown-value">70%</div>
                            <div class="breakdown-label">建议阈值</div>
                        </div>
                        <div class="breakdown-item">
                            <div class="breakdown-value">${safetyMargin}%</div>
                            <div class="breakdown-label">安全空间</div>
                        </div>
                        <div class="breakdown-item">
                            <div class="breakdown-value">${data.credit_usage.impact_level}</div>
                            <div class="breakdown-label">影响程度</div>
                        </div>
                    </div>
                </div>
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
                         <tr style="background-color: #e3f2fd; font-weight: 700; color: #1976d2;">
                            <td class="highlight">合计</td>
                            <td>-</td>
                            <td>${formatNumber(totalCreditLimit)}</td>
                            <td>${formatNumber(totalUsedAmount)}</td>
                            <td>${formatNumber(totalInstallmentBalance)}</td>
                            <td class="good">${totalUsageRate}%</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
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
    // 计算总逾期月数
    const totalOverdue = overdueAnalysis.overdue_90plus + overdueAnalysis.overdue_30_90 + overdueAnalysis.overdue_under_30;

    // 计算各时间段占比
    const over90Percentage = totalOverdue > 0 ? ((overdueAnalysis.overdue_90plus / totalOverdue) * 100).toFixed(0) : 0;
    const between30_90Percentage = totalOverdue > 0 ? ((overdueAnalysis.overdue_30_90 / totalOverdue) * 100).toFixed(0) : 0;
    const under30Percentage = totalOverdue > 0 ? ((overdueAnalysis.overdue_under_30 / totalOverdue) * 100).toFixed(0) : 0;

    // 确定严重程度等级和样式
    let severityClass = '';
    let severityText = overdueAnalysis.severity_level;
    if (overdueAnalysis.severity_percentage >= 70) {
        severityClass = 'danger';
    } else if (overdueAnalysis.severity_percentage >= 30) {
        severityClass = 'warning';
    }

    // 生成逾期机构列表
    const institutionItems = overdueAnalysis.institutions.map(inst => `
        <div class="institution-item">
            <div class="institution-name">${inst.name}</div>
            <div class="institution-details">
                <div class="detail-item">
                    <div class="detail-label">总逾期</div>
                    <div class="detail-value">${inst.total_overdue_months}个月</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">90天以上</div>
                    <div class="detail-value">${inst.overdue_90plus_months}个月</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">当前状态</div>
                    <div class="detail-status ${inst.status === '已结清' ? 'status-closed' : 'status-active'}">${inst.status}</div>
                </div>
            </div>
        </div>
    `).join('');

    return `<h2 class="section-title">逾期情况分析</h2>
    <div class="overdue-analysis">
        <!-- 逾期严重程度指示器 -->
        <div class="overdue-severity">
            <div class="severity-indicator">
                <div class="severity-label">逾期严重程度</div>
                <div class="severity-level ${severityClass}">${severityText}</div>
            </div>
            <div class="severity-bar">
                <div class="severity-fill" style="width: ${overdueAnalysis.severity_percentage}%;"></div>
            </div>
            <div class="severity-marker">
                <div class="marker" style="left: ${overdueAnalysis.severity_percentage}%;"></div>
            </div>
            <div class="severity-labels">
                <div>轻微</div>
                <div>中等</div>
                <div>严重</div>
            </div>
        </div>

        <div class="overdue-distribution">
            <!-- 逾期时间分布 -->
            <div class="overdue-chart-card">
                <div class="chart-title">
                    <span class="icon icon-chart"></span>
                    逾期时间分布
                </div>
                <div class="chart-container">
                    <div class="overdue-timeline">
                        <div class="timeline-item">
                            <div class="timeline-period">90天以上逾期</div>
                            <div class="timeline-details">
                                <div class="timeline-count">${overdueAnalysis.overdue_90plus}个月</div>
                                <div class="timeline-desc">占总逾期${over90Percentage}%</div>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <div class="timeline-period">30-90天逾期</div>
                            <div class="timeline-details">
                                <div class="timeline-count">${overdueAnalysis.overdue_30_90}个月</div>
                                <div class="timeline-desc">占总逾期${between30_90Percentage}%</div>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <div class="timeline-period">30天以内逾期</div>
                            <div class="timeline-details">
                                <div class="timeline-count">${overdueAnalysis.overdue_under_30}个月</div>
                                <div class="timeline-desc">占总逾期${under30Percentage}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 逾期管理机构信息 -->
            <div class="overdue-chart-card">
                <div class="chart-title">
                    <span class="icon icon-warning"></span>
                    逾期管理机构详情
                </div>
                <div class="overdue-institutions">
                    ${overdueAnalysis.institutions.length > 0 ? `
                    <div class="institution-list">
                        ${institutionItems}
                    </div>
                    ` : '<div style="text-align: center; padding: 20px; color: #666;">暂无逾期记录</div>'}
                </div>
            </div>
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

    // 准备查询记录图表数据（用于本段内联脚本初始化）
    const queryChartLabels = (queryCharts || []).map(item => item.period);
    const queryChartLoanData = (queryCharts || []).map(item => item.loan_approval);
    const queryChartCardData = (queryCharts || []).map(item => item.credit_card_approval);
    const queryChartGuaranteeData = (queryCharts || []).map(item => item.guarantee_review);
    const queryChartInsuranceData = (queryCharts || []).map(item => item.insurance_review);
    const queryChartCreditData = (queryCharts || []).map(item => item.credit_review);
    const queryChartNonPostLoanData = (queryCharts || []).map(item => item.non_post_loan);
    const queryChartSelfQueryData = (queryCharts || []).map(item => item.self_query);

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
    </div>

    <script>
    (function() {
        try {
            const queryTrendCtx = document.getElementById('queryTrendChart');
            if (queryTrendCtx && typeof Chart !== 'undefined') {
                new Chart(queryTrendCtx.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: ${JSON.stringify(queryChartLabels)},
                        datasets: [{
                            label: '贷款审批',
                            data: ${JSON.stringify(queryChartLoanData)},
                            borderColor: 'rgba(75, 108, 183, 1)',
                            backgroundColor: 'rgba(75, 108, 183, 0.1)',
                            tension: 0.4,
                            fill: true
                        }, {
                            label: '信用卡审批',
                            data: ${JSON.stringify(queryChartCardData)},
                            borderColor: 'rgba(46, 204, 113, 1)',
                            backgroundColor: 'rgba(46, 204, 113, 0.1)',
                            tension: 0.4,
                            fill: true
                        }, {
                            label: '担保资格审查',
                            data: ${JSON.stringify(queryChartGuaranteeData)},
                            borderColor: 'rgba(255, 193, 7, 1)',
                            backgroundColor: 'rgba(255, 193, 7, 0.1)',
                            tension: 0.4,
                            fill: true
                        }, {
                            label: '保前审查',
                            data: ${JSON.stringify(queryChartInsuranceData)},
                            borderColor: 'rgba(156, 39, 176, 1)',
                            backgroundColor: 'rgba(156, 39, 176, 0.1)',
                            tension: 0.4,
                            fill: true
                        }, {
                            label: '资信审查',
                            data: ${JSON.stringify(queryChartCreditData)},
                            borderColor: 'rgba(255, 87, 34, 1)',
                            backgroundColor: 'rgba(255, 87, 34, 0.1)',
                            tension: 0.4,
                            fill: true
                        }, {
                            label: '非贷后管理查询',
                            data: ${JSON.stringify(queryChartNonPostLoanData)},
                            borderColor: 'rgba(233, 30, 99, 1)',
                            backgroundColor: 'rgba(233, 30, 99, 0.1)',
                            tension: 0.4,
                            fill: true
                        }, {
                            label: '本人查询',
                            data: ${JSON.stringify(queryChartSelfQueryData)},
                            borderColor: 'rgba(0, 188, 212, 1)',
                            backgroundColor: 'rgba(0, 188, 212, 0.1)',
                            tension: 0.4,
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
                                position: 'top',
                                labels: {
                                    boxWidth: 12,
                                    padding: 10,
                                    font: {
                                        size: 11
                                    }
                                }
                            }
                        }
                    }
                });
            }
        } catch (e) { console.error('查询记录图表初始化失败:', e); }
    })();
    </script>`;
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

// 导出函数供Node.js和浏览器使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateVisualizationReport,
        formatNumber
    };
}


