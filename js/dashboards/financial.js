// Financial Overview Dashboard
import { sampleData } from '../../data/sample-data.js';

export function renderFinancial() {
    const { financial } = sampleData;
    const totalExpenses = Object.values(financial.expenses).reduce((sum, val) => sum + val, 0);
    const latestRevenue = financial.monthlyRevenue[financial.monthlyRevenue.length - 1].revenue;

    return `
        <div class="page-header">
            <h2>Financial Overview</h2>
            <p>Revenue vs $285k target, MRR tracking toward $25k</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon ${financial.revenue.percentage >= 50 ? 'success' : 'warning'}">
                    <i data-lucide="trending-up"></i>
                </div>
                <div class="stat-label">Annual Revenue</div>
                <div class="stat-value">$${(financial.revenue.current / 1000).toFixed(0)}k</div>
                <div class="stat-meta">
                    ${financial.revenue.percentage.toFixed(1)}% of $${(financial.revenue.target / 1000).toFixed(0)}k target
                </div>
                <div class="progress">
                    <div class="progress-bar ${financial.revenue.percentage >= 50 ? 'success' : 'warning'}" style="width: ${financial.revenue.percentage}%"></div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="repeat"></i>
                </div>
                <div class="stat-label">Monthly Recurring Revenue</div>
                <div class="stat-value">$${(financial.mrr.current / 1000).toFixed(1)}k</div>
                <div class="stat-meta">
                    ${financial.mrr.percentage.toFixed(1)}% of $${(financial.mrr.target / 1000).toFixed(0)}k target
                </div>
                <div class="progress">
                    <div class="progress-bar info" style="width: ${financial.mrr.percentage}%"></div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon success">
                    <i data-lucide="calendar"></i>
                </div>
                <div class="stat-label">Last Month Revenue</div>
                <div class="stat-value">$${(latestRevenue / 1000).toFixed(1)}k</div>
                <div class="stat-meta">${financial.monthlyRevenue[financial.monthlyRevenue.length - 1].month}</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon warning">
                    <i data-lucide="minus-circle"></i>
                </div>
                <div class="stat-label">Monthly Expenses</div>
                <div class="stat-value">$${(totalExpenses / 1000).toFixed(1)}k</div>
                <div class="stat-meta">Fixed costs</div>
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Revenue Trend</h3>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="revenueChart" data-chart="line" data-chart-data='${JSON.stringify({
                            labels: financial.monthlyRevenue.map(m => m.month),
                            datasets: [{
                                label: 'Monthly Revenue',
                                data: financial.monthlyRevenue.map(m => m.revenue),
                                borderColor: 'rgb(99, 102, 241)',
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                borderWidth: 3,
                                fill: true
                            }]
                        })}'></canvas>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Expense Breakdown</h3>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="expenseChart" data-chart="doughnut" data-chart-data='${JSON.stringify({
                            labels: Object.keys(financial.expenses).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
                            datasets: [{
                                data: Object.values(financial.expenses),
                                backgroundColor: [
                                    'rgba(99, 102, 241, 0.8)',
                                    'rgba(16, 185, 129, 0.8)',
                                    'rgba(245, 158, 11, 0.8)',
                                    'rgba(239, 68, 68, 0.8)'
                                ],
                                borderWidth: 2
                            }]
                        })}'></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="dashboard-grid" style="margin-top: var(--spacing-lg);">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Monthly Expenses</h3>
                </div>
                <div class="card-body">
                    <ul class="list">
                        ${Object.entries(financial.expenses).map(([key, value]) => `
                            <li class="list-item">
                                <span>${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                <strong>$${value.toLocaleString()}</strong>
                            </li>
                        `).join('')}
                        <li class="list-item" style="border-top: 2px solid var(--border); margin-top: var(--spacing-sm); padding-top: var(--spacing-md);">
                            <span><strong>Total</strong></span>
                            <strong>$${totalExpenses.toLocaleString()}</strong>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Goals & Targets</h3>
                </div>
                <div class="card-body">
                    <ul class="list">
                        <li class="list-item">
                            <div>
                                <strong>Annual Revenue Goal</strong>
                                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                    $${(financial.revenue.target - financial.revenue.current).toLocaleString()} remaining
                                </div>
                            </div>
                            <strong>$${(financial.revenue.target / 1000).toFixed(0)}k</strong>
                        </li>
                        <li class="list-item">
                            <div>
                                <strong>MRR Goal</strong>
                                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                    $${(financial.mrr.target - financial.mrr.current).toLocaleString()}/mo remaining
                                </div>
                            </div>
                            <strong>$${(financial.mrr.target / 1000).toFixed(0)}k</strong>
                        </li>
                        <li class="list-item">
                            <div>
                                <strong>Net Monthly</strong>
                                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                    Revenue minus expenses
                                </div>
                            </div>
                            <strong style="color: var(--success);">$${((latestRevenue - totalExpenses) / 1000).toFixed(1)}k</strong>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}
