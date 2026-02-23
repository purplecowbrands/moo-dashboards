// Site Monitoring Dashboard - Live Data Edition
import { getMonitoringData, isLiveData } from '../data-loader.js';
import { sampleData } from '../../data/sample-data.js';

let cachedData = null;

async function loadData() {
    // Try to load live data
    const liveData = await getMonitoringData();
    if (liveData) {
        cachedData = liveData;
        return liveData;
    }
    
    // Fallback to sample data
    return { ...sampleData.monitoring, isLive: false };
}

function getPlatformColor(platform) {
    const colors = {
        framer: '#0099ff',
        shopify: '#96bf48',
        wordpress: '#21759b'
    };
    return colors[platform] || '#6b7280';
}

function getPlatformIcon(platform) {
    const icons = {
        framer: 'box',
        shopify: 'shopping-cart',
        wordpress: 'file-text'
    };
    return icons[platform] || 'globe';
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return dateString;
    }
}

function renderPlatformChart(platforms) {
    const total = Object.values(platforms).reduce((sum, count) => sum + count, 0);
    const chartData = Object.entries(platforms).map(([platform, count]) => ({
        platform,
        count,
        percent: (count / total) * 100,
        color: getPlatformColor(platform)
    }));
    
    return `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Platform Distribution</h3>
            </div>
            <div class="card-body">
                <canvas id="platform-chart" width="200" height="200"></canvas>
                <div class="platform-legend">
                    ${chartData.map(item => `
                        <div class="platform-legend-item">
                            <div class="platform-color" style="background: ${item.color};"></div>
                            <div class="platform-info">
                                <span class="platform-name">${item.platform}</span>
                                <span class="platform-count">${item.count} sites (${item.percent.toFixed(0)}%)</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <script>
            (function() {
                const ctx = document.getElementById('platform-chart');
                if (ctx && window.Chart) {
                    new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: ${JSON.stringify(chartData.map(d => d.platform))},
                            datasets: [{
                                data: ${JSON.stringify(chartData.map(d => d.count))},
                                backgroundColor: ${JSON.stringify(chartData.map(d => d.color))},
                                borderWidth: 0
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false }
                            }
                        }
                    });
                }
            })();
        </script>
        
        <style>
            .platform-legend {
                margin-top: 1rem;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            
            .platform-legend-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .platform-color {
                width: 16px;
                height: 16px;
                border-radius: 3px;
                flex-shrink: 0;
            }
            
            .platform-info {
                display: flex;
                flex-direction: column;
                gap: 0.125rem;
            }
            
            .platform-name {
                font-weight: 600;
                text-transform: capitalize;
                font-size: 0.875rem;
            }
            
            .platform-count {
                font-size: 0.75rem;
                color: var(--text-secondary);
            }
        </style>
    `;
}

export async function renderMonitoring() {
    const data = await loadData();
    const upPercent = data.totalSites > 0 ? (data.status.up / data.totalSites) * 100 : 0;

    const html = `
        <div class="page-header">
            <h2>Site Monitoring</h2>
            <p>${data.totalSites} client sites - ${data.isLive ? '✅ Live Data' : '⚠️ Sample Data'}</p>
        </div>

        <!-- KPI Cards -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon ${data.status.down === 0 ? 'success' : 'error'}">
                    <i data-lucide="check-circle"></i>
                </div>
                <div class="stat-label">Sites Up</div>
                <div class="stat-value">${data.status.up}/${data.totalSites}</div>
                <div class="stat-meta">${upPercent.toFixed(1)}% healthy</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon ${data.status.down > 0 ? 'error' : 'success'}">
                    <i data-lucide="alert-triangle"></i>
                </div>
                <div class="stat-label">Sites Down</div>
                <div class="stat-value">${data.status.down}</div>
                <div class="stat-meta">Critical issues</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon ${data.status.warning > 0 ? 'warning' : 'success'}">
                    <i data-lucide="alert-circle"></i>
                </div>
                <div class="stat-label">Warnings</div>
                <div class="stat-value">${data.status.warning}</div>
                <div class="stat-meta">Needs attention</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="clock"></i>
                </div>
                <div class="stat-label">Last Check</div>
                <div class="stat-value" style="font-size: 1.2rem;">${data.lastCheck ? formatDate(data.lastCheck) : 'Unknown'}</div>
                <div class="stat-meta">Daily 3:00 AM</div>
            </div>
        </div>

        <!-- Active Alerts (if any) -->
        ${data.alerts && data.alerts.length > 0 ? `
            <div class="alert-banner">
                <i data-lucide="alert-triangle"></i>
                <div>
                    <strong>${data.alerts.length} Active Alert${data.alerts.length > 1 ? 's' : ''}</strong>
                    <div class="alert-list">
                        ${data.alerts.map(alert => `
                            <a href="${data.sites.find(s => s.name === alert.site)?.url || '#'}" target="_blank" class="alert-item">
                                ${alert.site}: ${alert.issue}
                            </a>
                        `).join('')}
                    </div>
                </div>
            </div>
        ` : ''}

        <!-- Main Content Grid -->
        <div class="monitoring-grid">
            <!-- All Sites List -->
            <div class="card sites-list-card">
                <div class="card-header">
                    <h3 class="card-title">All Sites (${data.sites?.length || 0})</h3>
                </div>
                <div class="card-body" style="padding: 0;">
                    <div class="sites-table-container">
                        <table class="sites-table">
                            <thead>
                                <tr>
                                    <th>Site</th>
                                    <th>Platform</th>
                                    <th>Status</th>
                                    <th>Pages</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(data.sites || []).map(site => `
                                    <tr class="site-row ${site.status}" onclick="window.open('${site.url}', '_blank')">
                                        <td>
                                            <div class="site-name-cell">
                                                <i data-lucide="external-link" class="site-link-icon"></i>
                                                <strong>${site.name}</strong>
                                            </div>
                                            <div class="site-url">${site.url}</div>
                                        </td>
                                        <td>
                                            <div class="platform-badge" style="background: ${getPlatformColor(site.platform)}20; color: ${getPlatformColor(site.platform)}; border: 1px solid ${getPlatformColor(site.platform)}40;">
                                                <i data-lucide="${getPlatformIcon(site.platform)}"></i>
                                                ${site.platform}
                                            </div>
                                        </td>
                                        <td>
                                            <span class="status-badge ${site.status}">
                                                ${site.status === 'up' ? '✓' : site.status === 'down' ? '✗' : '!'} ${site.status}
                                            </span>
                                        </td>
                                        <td class="pages-count">${site.pagesMonitored || 0}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Platform Distribution Chart -->
            ${data.platforms ? renderPlatformChart(data.platforms) : ''}
        </div>

        <style>
            .monitoring-grid {
                display: grid;
                grid-template-columns: 1fr 350px;
                gap: 1.5rem;
                margin-top: 1.5rem;
            }
            
            @media (max-width: 1200px) {
                .monitoring-grid {
                    grid-template-columns: 1fr;
                }
            }
            
            .sites-list-card {
                min-height: 400px;
            }
            
            .sites-table-container {
                max-height: 600px;
                overflow-y: auto;
            }
            
            .sites-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .sites-table thead {
                position: sticky;
                top: 0;
                background: var(--bg-secondary);
                z-index: 10;
            }
            
            .sites-table th {
                text-align: left;
                padding: 0.75rem 1rem;
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--text-secondary);
                font-weight: 600;
                border-bottom: 2px solid var(--border);
            }
            
            .sites-table tbody tr {
                cursor: pointer;
                transition: background-color 0.15s;
                border-bottom: 1px solid var(--border);
            }
            
            .sites-table tbody tr:hover {
                background: var(--bg-secondary);
            }
            
            .sites-table tbody tr.down {
                background: rgba(239, 68, 68, 0.1);
            }
            
            .sites-table tbody tr.warning {
                background: rgba(245, 158, 11, 0.1);
            }
            
            .sites-table td {
                padding: 0.875rem 1rem;
                font-size: 0.875rem;
            }
            
            .site-name-cell {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.25rem;
            }
            
            .site-link-icon {
                width: 14px;
                height: 14px;
                color: var(--text-tertiary);
            }
            
            .site-url {
                font-size: 0.75rem;
                color: var(--text-secondary);
                padding-left: 1.75rem;
            }
            
            .platform-badge {
                display: inline-flex;
                align-items: center;
                gap: 0.375rem;
                padding: 0.25rem 0.625rem;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: capitalize;
            }
            
            .platform-badge i {
                width: 12px;
                height: 12px;
            }
            
            .status-badge {
                display: inline-block;
                padding: 0.25rem 0.625rem;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .status-badge.up {
                background: rgba(16, 185, 129, 0.2);
                color: var(--success);
            }
            
            .status-badge.down {
                background: rgba(239, 68, 68, 0.2);
                color: var(--error);
            }
            
            .status-badge.warning {
                background: rgba(245, 158, 11, 0.2);
                color: var(--warning);
            }
            
            .pages-count {
                color: var(--text-secondary);
                text-align: right;
            }
            
            .alert-banner {
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 8px;
                padding: 1rem;
                margin-top: 1.5rem;
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
            }
            
            .alert-banner > i {
                color: var(--error);
                flex-shrink: 0;
                margin-top: 0.125rem;
            }
            
            .alert-list {
                margin-top: 0.5rem;
                display: flex;
                flex-direction: column;
                gap: 0.375rem;
            }
            
            .alert-item {
                font-size: 0.875rem;
                color: var(--text-primary);
                text-decoration: none;
                padding: 0.375rem 0.625rem;
                border-radius: 4px;
                background: rgba(239, 68, 68, 0.05);
                transition: background 0.15s;
            }
            
            .alert-item:hover {
                background: rgba(239, 68, 68, 0.15);
                text-decoration: underline;
            }
        </style>
    `;

    return html;
}
