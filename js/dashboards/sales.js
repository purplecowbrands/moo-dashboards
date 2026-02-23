// Sales Pipeline Dashboard
import { sampleData } from '../../data/sample-data.js';

export function renderSales() {
    const { sales } = sampleData;
    const progressPercent = (sales.currentWeek / sales.weeklyTarget) * 100;

    return `
        <div class="page-header">
            <h2>Sales Pipeline</h2>
            <p>121 tracking, prospect pipeline stages, weekly scorecard</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-icon ${sales.currentWeek >= sales.weeklyTarget ? 'success' : 'warning'}">
                        <i data-lucide="phone-call"></i>
                    </div>
                    <div class="stat-label">121s This Week</div>
                </div>
                <div class="stat-value">${sales.currentWeek}</div>
                <div class="stat-meta">Target: ${sales.weeklyTarget}/week</div>
                <div class="progress">
                    <div class="progress-bar ${sales.currentWeek >= sales.weeklyTarget ? 'success' : 'warning'}" style="width: ${Math.min(progressPercent, 100)}%"></div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="users"></i>
                </div>
                <div class="stat-label">Active Pipeline</div>
                <div class="stat-value">${sales.pipeline.reduce((sum, stage) => sum + stage.count, 0)}</div>
                <div class="stat-meta">Total prospects</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon success">
                    <i data-lucide="dollar-sign"></i>
                </div>
                <div class="stat-label">Pipeline Value</div>
                <div class="stat-value">$${(sales.pipeline.reduce((sum, stage) => sum + stage.value, 0) / 1000).toFixed(0)}k</div>
                <div class="stat-meta">Total potential</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="trophy"></i>
                </div>
                <div class="stat-label">Closed Won</div>
                <div class="stat-value">${sales.pipeline.find(s => s.stage === 'Closed Won').count}</div>
                <div class="stat-meta">This period</div>
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Weekly 121 Scorecard</h3>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="weeklyChart" data-chart="bar" data-chart-data='${JSON.stringify({
                            labels: sales.weeklyScorecard.map(w => w.week),
                            datasets: [{
                                label: '121 Meetings',
                                data: sales.weeklyScorecard.map(w => w.count),
                                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                                borderColor: 'rgb(99, 102, 241)',
                                borderWidth: 2
                            }, {
                                label: 'Target',
                                data: sales.weeklyScorecard.map(w => w.target),
                                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                borderColor: 'rgb(16, 185, 129)',
                                borderWidth: 2,
                                borderDash: [5, 5]
                            }]
                        })}'></canvas>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Pipeline Stages</h3>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Stage</th>
                                    <th>Count</th>
                                    <th>Value</th>
                                    <th>Avg Deal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sales.pipeline.map(stage => `
                                    <tr>
                                        <td><strong>${stage.stage}</strong></td>
                                        <td>${stage.count}</td>
                                        <td>$${(stage.value / 1000).toFixed(1)}k</td>
                                        <td>$${stage.count > 0 ? (stage.value / stage.count / 1000).toFixed(1) : '0'}k</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Recent Deals</h3>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Deal</th>
                                <th>Status</th>
                                <th>Last Activity</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sales.recentDeals.map(deal => `
                                <tr>
                                    <td>${deal.name}</td>
                                    <td><span class="badge ${deal.status.toLowerCase() === 'closed' ? 'error' : 'info'}">${deal.status}</span></td>
                                    <td>${deal.lastActivity}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}
