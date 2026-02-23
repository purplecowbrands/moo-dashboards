// Client Health Dashboard
import { sampleData } from '../../data/sample-data.js';

export function renderClients() {
    const { clients } = sampleData;
    const totalMRR = clients.health.reduce((sum, c) => sum + c.mrr, 0);

    return `
        <div class="page-header">
            <h2>Client Health</h2>
            <p>All client accounts status, upsell opportunities</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="briefcase"></i>
                </div>
                <div class="stat-label">Active Clients</div>
                <div class="stat-value">${clients.total}</div>
                <div class="stat-meta">Total managed sites</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon success">
                    <i data-lucide="dollar-sign"></i>
                </div>
                <div class="stat-label">Total MRR</div>
                <div class="stat-value">$${totalMRR.toLocaleString()}</div>
                <div class="stat-meta">Monthly recurring revenue</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon warning">
                    <i data-lucide="trending-up"></i>
                </div>
                <div class="stat-label">Upsell Opportunities</div>
                <div class="stat-value">${clients.upsellOpportunities.length}</div>
                <div class="stat-meta">Potential revenue</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="layers"></i>
                </div>
                <div class="stat-label">Platforms</div>
                <div class="stat-value">${Object.keys(clients.byPlatform).length}</div>
                <div class="stat-meta">Framer, WP, Shopify</div>
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Platform Distribution</h3>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="platformChart" data-chart="pie" data-chart-data='${JSON.stringify({
                            labels: Object.keys(clients.byPlatform).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
                            datasets: [{
                                data: Object.values(clients.byPlatform),
                                backgroundColor: [
                                    'rgba(99, 102, 241, 0.8)',
                                    'rgba(16, 185, 129, 0.8)',
                                    'rgba(245, 158, 11, 0.8)'
                                ],
                                borderWidth: 2
                            }]
                        })}'></canvas>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Upsell Opportunities</h3>
                </div>
                <div class="card-body">
                    <ul class="list">
                        ${clients.upsellOpportunities.map(opp => `
                            <li class="list-item">
                                <div>
                                    <strong>${opp.client}</strong>
                                    <div style="font-size: 0.875rem; color: var(--text-secondary);">${opp.opportunity}</div>
                                </div>
                                <span class="badge success">+$${opp.potential}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>

        <div class="card" style="margin-top: var(--spacing-lg);">
            <div class="card-header">
                <h3 class="card-title">Client Health Status</h3>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Site</th>
                                <th>Platform</th>
                                <th>Status</th>
                                <th>Last Update</th>
                                <th>MRR</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clients.health.map(client => `
                                <tr>
                                    <td><strong>${client.name}</strong></td>
                                    <td><span class="badge neutral">${client.platform}</span></td>
                                    <td><span class="badge ${client.status === 'healthy' ? 'success' : 'warning'}">${client.status}</span></td>
                                    <td>${client.lastUpdate}</td>
                                    <td>$${client.mrr}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}
