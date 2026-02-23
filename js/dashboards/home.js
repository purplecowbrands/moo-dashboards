// Home/Overview Dashboard
import { sampleData } from '../../data/sample-data.js';
import { 
    getCRMData, 
    getMonitoringData, 
    getClientHealthData, 
    getKitchenData,
    getBNIData,
    isLiveData 
} from '../data-loader.js';

// Parse time logs data (fetched from /data/time/week-summary.json if available)
async function getTimeData() {
    try {
        const response = await fetch('/data/time/week-summary.json');
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        return null;
    }
}

export async function renderHome() {
    // Fetch all available data sources in parallel
    const [crmData, monitoringData, clientHealthData, kitchenData, bniData, timeData] = await Promise.all([
        getCRMData(),
        getMonitoringData(),
        getClientHealthData(),
        getKitchenData(),
        getBNIData(),
        getTimeData()
    ]);

    // Determine which data sources are live
    const liveSources = {
        crm: isLiveData(crmData),
        monitoring: isLiveData(monitoringData),
        clients: isLiveData(clientHealthData),
        kitchen: isLiveData(kitchenData),
        bni: isLiveData(bniData),
        time: !!timeData
    };

    // Use live data where available, fallback to sample data
    const crm = crmData || sampleData.crm;
    const monitoring = monitoringData || sampleData.monitoring;
    const clients = clientHealthData || sampleData.clients;
    const kitchen = kitchenData?.mealPlan || sampleData.kitchen;
    const bni = bniData || sampleData.bni;
    const time = timeData || sampleData.time;

    // Calculate aggregated metrics
    const totalContacts = liveSources.crm ? crm.contacts.length : crm.totalContacts;
    const recentInteractionsCount = liveSources.crm 
        ? crm.interactions.filter(i => {
            const daysSince = (Date.now() - new Date(i.date)) / (1000 * 60 * 60 * 24);
            return daysSince <= 7;
        }).length
        : crm.recentInteractions.length;

    const totalClients = liveSources.clients ? clients.total : clients.total;
    const totalMRR = liveSources.clients ? clients.totalMRR : null;
    const upsellCount = liveSources.clients ? clients.upsellOpportunities.length : clients.upsellOpportunities.length;

    const sitesUp = liveSources.monitoring ? monitoring.status.up : monitoring.status.up;
    const totalSites = liveSources.monitoring ? monitoring.totalSites : monitoring.totalSites;
    const sitesDown = liveSources.monitoring ? monitoring.status.down : monitoring.status.down;
    const sitesWarning = liveSources.monitoring ? monitoring.status.warning : monitoring.status.warning;

    const workHours = liveSources.time ? time.categories?.Work?.total || 0 : time.week.totalWork;

    // BNI metrics
    const oneOnOnesWeek = liveSources.bni ? bni.oneOnOnes?.thisWeek || 0 : 0;
    const oneOnOnesTarget = liveSources.bni ? bni.oneOnOnes?.target || 6 : 6;
    const bniAttendance = liveSources.bni ? bni.attendance?.thisMonth || 0 : bni.attendance.thisMonth;
    const bniChapter = liveSources.bni ? bni.chapter : bni.chapter;

    // Kitchen - count meals for this week
    const thisWeekMeals = liveSources.kitchen 
        ? (kitchen.thisWeek?.breakfast?.length || 0) + (kitchen.thisWeek?.lunch?.length || 0) + (kitchen.thisWeek?.dinner?.length || 0)
        : kitchen.currentWeek.recipes.length;
    const firstMeal = liveSources.kitchen
        ? (kitchen.thisWeek?.dinner?.[0]?.name || kitchen.thisWeek?.lunch?.[0]?.name || kitchen.thisWeek?.breakfast?.[0]?.name || 'No meals planned')
        : kitchen.currentWeek.recipes[0].name;

    // Recent interactions (top 3)
    const recentInteractions = liveSources.crm
        ? crm.interactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3)
            .map(i => ({
                contactName: crm.contacts.find(c => c.id === i.contactId)?.name || 'Unknown',
                notes: i.notes || `${i.type} interaction`,
                date: new Date(i.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }))
        : crm.recentInteractions.slice(0, 3);

    // Count live data sources
    const liveCount = Object.values(liveSources).filter(Boolean).length;
    const totalSources = Object.keys(liveSources).length;

    return `
        <div class="page-header">
            <h2>Dashboard Overview</h2>
            <p>Summary of all key metrics and dashboards</p>
            ${liveCount > 0 ? `
                <div class="data-status ${liveCount === totalSources ? 'live' : 'partial'}">
                    <i data-lucide="wifi"></i>
                    ${liveCount === totalSources 
                        ? `Live Data (${liveCount}/${totalSources} sources connected)` 
                        : `Partial Live Data (${liveCount}/${totalSources} sources connected)`}
                </div>
            ` : ''}
        </div>

        <div class="stats-grid">
            <a href="#/sales" class="stat-card clickable">
                <div class="stat-header">
                    <div class="stat-icon ${oneOnOnesWeek >= oneOnOnesTarget ? 'success' : 'warning'}">
                        <i data-lucide="trending-up"></i>
                    </div>
                    <div class="stat-label">121s This Week</div>
                </div>
                <div class="stat-value">${oneOnOnesWeek}/${oneOnOnesTarget}</div>
                <div class="stat-meta">Sales Pipeline ${liveSources.bni ? '(Live)' : '(Sample)'}</div>
            </a>

            <a href="#/crm" class="stat-card clickable">
                <div class="stat-header">
                    <div class="stat-icon info">
                        <i data-lucide="users"></i>
                    </div>
                    <div class="stat-label">Total Contacts</div>
                </div>
                <div class="stat-value">${totalContacts.toLocaleString()}</div>
                <div class="stat-meta">${recentInteractionsCount} recent interactions ${liveSources.crm ? '(Live)' : '(Sample)'}</div>
            </a>

            <a href="#/clients" class="stat-card clickable">
                <div class="stat-header">
                    <div class="stat-icon success">
                        <i data-lucide="briefcase"></i>
                    </div>
                    <div class="stat-label">Active Clients</div>
                </div>
                <div class="stat-value">${totalClients}</div>
                <div class="stat-meta">${totalMRR ? `$${totalMRR.toLocaleString()} MRR, ` : ''}${upsellCount} upsell opportunities ${liveSources.clients ? '(Live)' : '(Sample)'}</div>
            </a>

            <a href="#/monitoring" class="stat-card clickable">
                <div class="stat-header">
                    <div class="stat-icon ${sitesDown > 0 ? 'error' : 'success'}">
                        <i data-lucide="activity"></i>
                    </div>
                    <div class="stat-label">Sites Monitored</div>
                </div>
                <div class="stat-value">${sitesUp}/${totalSites}</div>
                <div class="stat-meta">${sitesDown} down, ${sitesWarning} warnings ${liveSources.monitoring ? '(Live)' : '(Sample)'}</div>
            </a>

            <a href="#/financial" class="stat-card clickable">
                <div class="stat-header">
                    <div class="stat-icon info">
                        <i data-lucide="dollar-sign"></i>
                    </div>
                    <div class="stat-label">Revenue Progress</div>
                </div>
                <div class="stat-value">${sampleData.financial.revenue.percentage}%</div>
                <div class="stat-meta">$${(sampleData.financial.revenue.current / 1000).toFixed(0)}k / $${(sampleData.financial.revenue.target / 1000).toFixed(0)}k target (Sample)</div>
            </a>

            <a href="#/tasks" class="stat-card clickable">
                <div class="stat-header">
                    <div class="stat-icon ${sampleData.tasks.overdue > 0 ? 'error' : 'success'}">
                        <i data-lucide="check-square"></i>
                    </div>
                    <div class="stat-label">Tasks</div>
                </div>
                <div class="stat-value">${sampleData.tasks.overdue + sampleData.tasks.dueToday}</div>
                <div class="stat-meta">${sampleData.tasks.overdue} overdue, ${sampleData.tasks.dueToday} due today (Sample)</div>
            </a>

            <a href="#/bni" class="stat-card clickable">
                <div class="stat-header">
                    <div class="stat-icon info">
                        <i data-lucide="handshake"></i>
                    </div>
                    <div class="stat-label">BNI Attendance</div>
                </div>
                <div class="stat-value">${bniAttendance}%</div>
                <div class="stat-meta">${bniChapter} Chapter ${liveSources.bni ? '(Live)' : '(Sample)'}</div>
            </a>

            <a href="#/time" class="stat-card clickable">
                <div class="stat-header">
                    <div class="stat-icon info">
                        <i data-lucide="clock"></i>
                    </div>
                    <div class="stat-label">Work This Week</div>
                </div>
                <div class="stat-value">${workHours}h</div>
                <div class="stat-meta">Time tracking overview ${liveSources.time ? '(Live)' : '(Sample)'}</div>
            </a>

            <a href="#/kitchen" class="stat-card clickable">
                <div class="stat-header">
                    <div class="stat-icon success">
                        <i data-lucide="chef-hat"></i>
                    </div>
                    <div class="stat-label">This Week's Meals</div>
                </div>
                <div class="stat-value">${thisWeekMeals}</div>
                <div class="stat-meta">${firstMeal} ${liveSources.kitchen ? '(Live)' : '(Sample)'}</div>
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
                        ${recentInteractions.map(interaction => `
                            <li class="list-item">
                                <div>
                                    <strong>${interaction.contactName}</strong>
                                    <div style="font-size: 0.875rem; color: var(--text-secondary);">${interaction.notes}</div>
                                </div>
                                <span class="badge neutral">${interaction.date}</span>
                            </li>
                        `).join('')}
                        ${liveSources.crm ? '' : '<li class="list-item"><em>Sample data - connect CRM for live interactions</em></li>'}
                    </ul>
                </div>
            </div>
        </div>
    `;
}
