// Site Monitoring Dashboard
import { sampleData } from '../data/sample-data.js';

export function renderMonitoring() {
    const { monitoring } = sampleData;
    const upPercent = (monitoring.status.up / monitoring.totalSites) * 100;

    return `
        <div class="page-header">
            <h2>Site Monitoring</h2>
            <p>32 sites status, last check results, alerts, baseline diffs</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon ${monitoring.status.down === 0 ? 'success' : 'error'}">
                    <i data-lucide="activity"></i>
                </div>
                <div class="stat-label">Sites Up</div>
                <div class="stat-value">${monitoring.status.up}/${monitoring.totalSites}</div>
                <div class="stat-meta">${upPercent.toFixed(1)}% uptime</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon ${monitoring.status.down > 0 ? 'error' : 'success'}">
                    <i data-lucide="alert-triangle"></i>
                </div>
                <div class="stat-label">Sites Down</div>
                <div class="stat-value">${monitoring.status.down}</div>
                <div class="stat-meta">Critical issues</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon ${monitoring.status.warning > 0 ? 'warning' : 'success'}">
                    <i data-lucide="alert-circle"></i>
                </div>
                <div class="stat-label">Warnings</div>
                <div class="stat-value">${monitoring.status.warning}</div>
                <div class="stat-meta">Needs attention</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="clock"></i>
                </div>
                <div class="stat-label">Last Check</div>
                <div class="stat-value" style="font-size: 1.2rem;">${monitoring.lastCheck.split(' ').slice(1).join(' ')}</div>
                <div class="stat-meta">${monitoring.lastCheck.split(' ')[0]}</div>
            </div>
        </div>

        ${monitoring.alerts.length > 0 ? `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Active Alerts</h3>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Site</th>
                                    <th>Issue</th>
                                    <th>Severity</th>
                                    <th>Detected</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${monitoring.alerts.map(alert => `
                                    <tr>
                                        <td><strong>${alert.site}</strong></td>
                                        <td>${alert.issue}</td>
                                        <td><span class="badge ${alert.severity}">${alert.severity}</span></td>
                                        <td>${alert.detected}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        ` : ''}

        <div class="card" style="margin-top: var(--spacing-lg);">
            <div class="card-header">
                <h3 class="card-title">Recent Site Checks</h3>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Site</th>
                                <th>Status</th>
                                <th>Response Time</th>
                                <th>Performance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${monitoring.recentChecks.map(check => {
                                const perfStatus = check.responseTime < 1000 ? 'success' : check.responseTime < 2000 ? 'warning' : 'error';
                                return `
                                    <tr>
                                        <td><strong>${check.site}</strong></td>
                                        <td><span class="badge ${check.status === 'up' ? 'success' : check.status}">${check.status}</span></td>
                                        <td>${check.responseTime}ms</td>
                                        <td>
                                            <div class="progress">
                                                <div class="progress-bar ${perfStatus}" style="width: ${Math.min((check.responseTime / 3000) * 100, 100)}%"></div>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="dashboard-grid" style="margin-top: var(--spacing-lg);">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Monitoring Info</h3>
                </div>
                <div class="card-body">
                    <ul class="list">
                        <li class="list-item">
                            <span>Total Sites Monitored</span>
                            <strong>${monitoring.totalSites}</strong>
                        </li>
                        <li class="list-item">
                            <span>Check Frequency</span>
                            <strong>Daily 3:00 AM</strong>
                        </li>
                        <li class="list-item">
                            <span>Monitoring Method</span>
                            <strong>Playwright Screenshots</strong>
                        </li>
                        <li class="list-item">
                            <span>Alert Method</span>
                            <strong>Telegram</strong>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Status Distribution</h3>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="statusChart" data-chart="doughnut" data-chart-data='${JSON.stringify({
                            labels: ['Up', 'Down', 'Warning'],
                            datasets: [{
                                data: [monitoring.status.up, monitoring.status.down, monitoring.status.warning],
                                backgroundColor: [
                                    'rgba(16, 185, 129, 0.8)',
                                    'rgba(239, 68, 68, 0.8)',
                                    'rgba(245, 158, 11, 0.8)'
                                ],
                                borderWidth: 2
                            }]
                        })}'></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
}
