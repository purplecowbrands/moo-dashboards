// Home/Overview Dashboard
import { sampleData } from '../../data/sample-data.js';

export function renderHome() {
    return `
        <div class="page-header">
            <h2>Dashboard Overview</h2>
            <p>Summary of all key metrics and dashboards</p>
        </div>

        <div class="stats-grid">
            <a href="#/sales" class="stat-card clickable">
                <div class="stat-header">
                    <div class="stat-icon ${sampleData.sales.currentWeek >= sampleData.sales.weeklyTarget ? 'success' : 'warning'}">
                        <i data-lucide="trending-up"></i>
                    </div>
                    <div class="stat-label">121s This Week</div>
                </div>
                <div class="stat-value">${sampleData.sales.currentWeek}/${sampleData.sales.weeklyTarget}</div>
                <div class="stat-meta">Sales Pipeline</div>
            </a>

            <a href="#/crm" class="stat-card clickable">
                <div class="stat-header">
                    <div class="stat-icon info">
                        <i data-lucide="users"></i>
                    </div>
                    <div class="stat-label">Total Contacts</div>
                </div>
                <div class="stat-value">${sampleData.crm.totalContacts.toLocaleString()}</div>
                <div class="stat-meta">${sampleData.crm.recentInteractions.length} recent interactions</div>
            </a>

            <a href="#/clients" class="stat-card clickable">
                <div class="stat-header">
                    <div class="stat-icon success">
                        <i data-lucide="briefcase"></i>
                    </div>
                    <div class="stat-label">Active Clients</div>
                </div>
                <div class="stat-value">${sampleData.clients.total}</div>
                <div class="stat-meta">${sampleData.clients.upsellOpportunities.length} upsell opportunities</div>
            </a>

            <a href="#/monitoring" class="stat-card clickable">
                <div class="stat-header">
                    <div class="stat-icon ${sampleData.monitoring.status.down > 0 ? 'error' : 'success'}">
                        <i data-lucide="activity"></i>
                    </div>
                    <div class="stat-label">Sites Monitored</div>
                </div>
                <div class="stat-value">${sampleData.monitoring.status.up}/${sampleData.monitoring.totalSites}</div>
                <div class="stat-meta">${sampleData.monitoring.status.down} down, ${sampleData.monitoring.status.warning} warnings</div>
            </a>

            <a href="#/financial" class="stat-card clickable">
                <div class="stat-header">
                    <div class="stat-icon info">
                        <i data-lucide="dollar-sign"></i>
                    </div>
                    <div class="stat-label">Revenue Progress</div>
                </div>
                <div class="stat-value">${sampleData.financial.revenue.percentage}%</div>
                <div class="stat-meta">$${(sampleData.financial.revenue.current / 1000).toFixed(0)}k / $${(sampleData.financial.revenue.target / 1000).toFixed(0)}k target</div>
            </a>

            <a href="#/tasks" class="stat-card clickable">
                <div class="stat-header">
                    <div class="stat-icon ${sampleData.tasks.overdue > 0 ? 'error' : 'success'}">
                        <i data-lucide="check-square"></i>
                    </div>
                    <div class="stat-label">Tasks</div>
                </div>
                <div class="stat-value">${sampleData.tasks.overdue + sampleData.tasks.dueToday}</div>
                <div class="stat-meta">${sampleData.tasks.overdue} overdue, ${sampleData.tasks.dueToday} due today</div>
            </a>

            <a href="#/bni" class="stat-card clickable">
                <div class="stat-header">
                    <div class="stat-icon info">
                        <i data-lucide="handshake"></i>
                    </div>
                    <div class="stat-label">BNI Attendance</div>
                </div>
                <div class="stat-value">${sampleData.bni.attendance.thisMonth}%</div>
                <div class="stat-meta">${sampleData.bni.chapter} Chapter</div>
            </a>

            <a href="#/time" class="stat-card clickable">
                <div class="stat-header">
                    <div class="stat-icon info">
                        <i data-lucide="clock"></i>
                    </div>
                    <div class="stat-label">Work This Week</div>
                </div>
                <div class="stat-value">${sampleData.time.week.totalWork}h</div>
                <div class="stat-meta">Time tracking overview</div>
            </a>

            <a href="#/kitchen" class="stat-card clickable">
                <div class="stat-header">
                    <div class="stat-icon success">
                        <i data-lucide="chef-hat"></i>
                    </div>
                    <div class="stat-label">This Week's Meals</div>
                </div>
                <div class="stat-value">${sampleData.kitchen.currentWeek.recipes.length}</div>
                <div class="stat-meta">${sampleData.kitchen.currentWeek.recipes[0].name}</div>
            </a>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Quick Actions</h3>
                </div>
                <div class="card-body">
                    <ul class="list">
                        <li class="list-item">
                            <span>Review overdue tasks</span>
                            <a href="#/tasks" class="btn btn-primary">View Tasks</a>
                        </li>
                        <li class="list-item">
                            <span>Check site monitoring alerts</span>
                            <a href="#/monitoring" class="btn btn-primary">View Alerts</a>
                        </li>
                        <li class="list-item">
                            <span>Follow up with prospects</span>
                            <a href="#/sales" class="btn btn-primary">View Pipeline</a>
                        </li>
                        <li class="list-item">
                            <span>Update client health status</span>
                            <a href="#/clients" class="btn btn-primary">View Clients</a>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Recent Activity</h3>
                </div>
                <div class="card-body">
                    <ul class="list">
                        ${sampleData.crm.recentInteractions.slice(0, 3).map(interaction => `
                            <li class="list-item">
                                <div>
                                    <strong>${interaction.contactName}</strong>
                                    <div style="font-size: 0.875rem; color: var(--text-secondary);">${interaction.notes}</div>
                                </div>
                                <span class="badge neutral">${interaction.date}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;
}
