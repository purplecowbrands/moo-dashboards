// EOS Scorecard Dashboard
import { sampleData } from '../data/sample-data.js';

export function renderEOS() {
    const { eos } = sampleData;
    const successCount = eos.metrics.filter(m => m.status === 'success').length;
    const warningCount = eos.metrics.filter(m => m.status === 'warning').length;
    const errorCount = eos.metrics.filter(m => m.status === 'error').length;

    return `
        <div class="page-header">
            <h2>EOS Scorecard</h2>
            <p>Weekly metrics tracker for Purple Cow Brands</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon success">
                    <i data-lucide="check-circle"></i>
                </div>
                <div class="stat-label">On Track</div>
                <div class="stat-value">${successCount}</div>
                <div class="stat-meta">Metrics hitting targets</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon warning">
                    <i data-lucide="alert-circle"></i>
                </div>
                <div class="stat-label">At Risk</div>
                <div class="stat-value">${warningCount}</div>
                <div class="stat-meta">Metrics below target</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon error">
                    <i data-lucide="x-circle"></i>
                </div>
                <div class="stat-label">Off Track</div>
                <div class="stat-value">${errorCount}</div>
                <div class="stat-meta">Metrics need attention</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="target"></i>
                </div>
                <div class="stat-label">Total Metrics</div>
                <div class="stat-value">${eos.metrics.length}</div>
                <div class="stat-meta">Tracked weekly</div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Weekly Metrics</h3>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Target</th>
                                <th>Actual</th>
                                <th>Progress</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${eos.metrics.map(metric => {
                                const percent = (metric.actual / metric.target) * 100;
                                return `
                                    <tr>
                                        <td><strong>${metric.name}</strong></td>
                                        <td>${metric.target}</td>
                                        <td>${metric.actual}</td>
                                        <td>
                                            <div class="progress">
                                                <div class="progress-bar ${metric.status}" style="width: ${Math.min(percent, 100)}%"></div>
                                            </div>
                                            <small style="color: var(--text-secondary);">${percent.toFixed(0)}%</small>
                                        </td>
                                        <td><span class="badge ${metric.status}">${metric.status}</span></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Performance Overview</h3>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="eosChart" data-chart="doughnut" data-chart-data='${JSON.stringify({
                            labels: ['On Track', 'At Risk', 'Off Track'],
                            datasets: [{
                                data: [successCount, warningCount, errorCount],
                                backgroundColor: [
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

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Actions Needed</h3>
                </div>
                <div class="card-body">
                    <ul class="list">
                        ${eos.metrics.filter(m => m.status !== 'success').map(metric => `
                            <li class="list-item">
                                <div>
                                    <strong>${metric.name}</strong>
                                    <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                        ${metric.actual} / ${metric.target} - Need ${metric.target - metric.actual} more
                                    </div>
                                </div>
                                <span class="badge ${metric.status}">${metric.status}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;
}
