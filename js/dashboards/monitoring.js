// Site Monitoring Dashboard - Redesigned per Ben's feedback
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
        <div class="platform-chart-card">
            <h3>Platform Distribution</h3>
            <div class="platform-chart-content">
                <canvas id="platform-chart" width="160" height="160"></canvas>
                <div class="platform-legend">
                    ${chartData.map(item => `
                        <div class="platform-legend-item">
                            <div class="platform-color" style="background: ${item.color};"></div>
                            <div class="platform-info">
                                <span class="platform-name">${item.platform}</span>
                                <span class="platform-count">${item.count} sites</span>
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

        <!-- KPI Cards (Ben approved these) -->
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

        <!-- Active Alerts (single-clickable to go straight to issue) -->
        ${data.alerts && data.alerts.length > 0 ? `
            <div class="alert-banner">
                <i data-lucide="alert-triangle"></i>
                <div>
                    <strong>${data.alerts.length} Active Alert${data.alerts.length > 1 ? 's' : ''}</strong>
                    <div class="alert-list">
                        ${data.alerts.map(alert => {
                            const site = data.sites.find(s => s.name === alert.site);
                            return `
                                <a href="${site?.url || '#'}" target="_blank" class="alert-item">
                                    <strong>${alert.site}</strong>: ${alert.issue}
                                </a>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        ` : ''}

        <!-- ONE BIG LIST (primary focus) + Platform chart (secondary) -->
        <div class="monitoring-layout">
            <!-- All Sites List - PROMINENT, FULL-WIDTH -->
            <div class="sites-list-section">
                <div class="sites-list-header">
                    <h3>All Sites (${data.sites?.length || 0})</h3>
                    <div class="sites-list-meta">Sorted: Issues first, then alphabetical</div>
                </div>
                <div class="sites-table-container">
                    <table class="sites-table">
                        <thead>
                            <tr>
                                <th>Site</th>
                                <th>Platform</th>
                                <th>Status</th>
                                <th>Pages Monitored</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(data.sites || []).map(site => `
                                <tr class="site-row site-status-${site.status}" onclick="window.open('${site.url}', '_blank')">
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
                                        <span class="status-badge status-${site.status}">
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

            <!-- Platform Distribution Chart (compact, secondary) -->
            ${data.platforms ? renderPlatformChart(data.platforms) : ''}
        </div>

        <style>
            /* Layout: Big list + compact chart */
            .monitoring-layout {
                margin-top: 1.5rem;
                display: grid;
                grid-template-columns: 1fr 280px;
                gap: 1.5rem;
                align-items: start;
            }
            
            @media (max-width: 1200px) {
                .monitoring-layout {
                    grid-template-columns: 1fr;
                }
            }
            
            /* Sites List Section */
            .sites-list-section {
                background: var(--card-bg);
                border: 1px solid var(--border);
                border-radius: 8px;
                overflow: hidden;
            }
            
            .sites-list-header {
                padding: 1rem 1.25rem;
                border-bottom: 1px solid var(--border);
                background: var(--bg-secondary);
            }
            
            .sites-list-header h3 {
                margin: 0;
                font-size: 1rem;
                font-weight: 600;
            }
            
            .sites-list-meta {
                margin-top: 0.25rem;
                font-size: 0.75rem;
                color: var(--text-secondary);
            }
            
            /* Sites Table */
            .sites-table-container {
                max-height: 70vh;
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
                box-shadow: 0 1px 0 var(--border);
            }
            
            .sites-table th {
                text-align: left;
                padding: 0.625rem 1rem;
                font-size: 0.7rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--text-secondary);
                font-weight: 600;
            }
            
            .sites-table tbody tr {
                cursor: pointer;
                transition: all 0.15s;
                border-bottom: 1px solid var(--border);
            }
            
            .sites-table tbody tr:hover {
                background: var(--bg-secondary);
                transform: translateX(2px);
            }
            
            /* Highlight problem sites */
            .sites-table tbody tr.site-status-down {
                background: rgba(239, 68, 68, 0.08);
            }
            
            .sites-table tbody tr.site-status-warning {
                background: rgba(245, 158, 11, 0.06);
            }
            
            .sites-table tbody tr.site-status-down:hover {
                background: rgba(239, 68, 68, 0.12);
            }
            
            .sites-table tbody tr.site-status-warning:hover {
                background: rgba(245, 158, 11, 0.1);
            }
            
            .sites-table td {
                padding: 0.75rem 1rem;
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
                flex-shrink: 0;
            }
            
            .site-url {
                font-size: 0.7rem;
                color: var(--text-secondary);
                padding-left: 1.75rem;
            }
            
            .platform-badge {
                display: inline-flex;
                align-items: center;
                gap: 0.375rem;
                padding: 0.25rem 0.625rem;
                border-radius: 4px;
                font-size: 0.7rem;
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
                font-size: 0.7rem;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .status-badge.status-up {
                background: rgba(16, 185, 129, 0.15);
                color: var(--success);
            }
            
            .status-badge.status-down {
                background: rgba(239, 68, 68, 0.15);
                color: var(--error);
            }
            
            .status-badge.status-warning {
                background: rgba(245, 158, 11, 0.15);
                color: var(--warning);
            }
            
            .pages-count {
                color: var(--text-secondary);
                text-align: right;
                font-size: 0.875rem;
            }
            
            /* Alert Banner */
            .alert-banner {
                background: rgba(239, 68, 68, 0.08);
                border: 1px solid rgba(239, 68, 68, 0.25);
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
                padding: 0.5rem 0.75rem;
                border-radius: 4px;
                background: rgba(239, 68, 68, 0.05);
                transition: all 0.15s;
                border: 1px solid transparent;
            }
            
            .alert-item:hover {
                background: rgba(239, 68, 68, 0.12);
                border-color: rgba(239, 68, 68, 0.3);
                text-decoration: underline;
            }
            
            /* Platform Chart (compact, secondary) */
            .platform-chart-card {
                background: var(--card-bg);
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 1rem;
            }
            
            .platform-chart-card h3 {
                margin: 0 0 1rem 0;
                font-size: 0.9rem;
                font-weight: 600;
            }
            
            .platform-chart-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
            }
            
            .platform-chart-content canvas {
                max-width: 160px;
                max-height: 160px;
            }
            
            .platform-legend {
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 0.625rem;
            }
            
            .platform-legend-item {
                display: flex;
                align-items: center;
                gap: 0.625rem;
            }
            
            .platform-color {
                width: 14px;
                height: 14px;
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
                font-size: 0.8rem;
            }
            
            .platform-count {
                font-size: 0.7rem;
                color: var(--text-secondary);
            }
        </style>
    `;

    return html;
}
