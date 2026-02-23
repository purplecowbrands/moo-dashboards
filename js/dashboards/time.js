// Time Tracking Dashboard
import { sampleData } from '../../data/sample-data.js';
import { loadData } from '../data-loader.js';

export async function renderTime() {
    // Try to load live data, fallback to sample data
    const liveData = await loadData('/data/time-data.json');
    const time = liveData || sampleData.time;
    const isLive = !!liveData;

    return `
        <div class="page-header">
            <h2>Time Tracking</h2>
            <p>Daily logs visualized by category, trends</p>
            ${isLive ? '<div class="badge success">Live Data</div>' : '<div class="badge warning">Sample Data</div>'}
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="briefcase"></i>
                </div>
                <div class="stat-label">Work This Week</div>
                <div class="stat-value">${time.week.totalWork}h</div>
                <div class="stat-meta">${(time.week.totalWork / 168 * 100).toFixed(1)}% of week</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon success">
                    <i data-lucide="moon"></i>
                </div>
                <div class="stat-label">Sleep This Week</div>
                <div class="stat-value">${time.week.totalSleep}h</div>
                <div class="stat-meta">${(time.week.totalSleep / 7).toFixed(1)}h/day avg</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="home"></i>
                </div>
                <div class="stat-label">Personal This Week</div>
                <div class="stat-value">${time.week.totalPersonal}h</div>
                <div class="stat-meta">${(time.week.totalPersonal / 168 * 100).toFixed(1)}% of week</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon warning">
                    <i data-lucide="coffee"></i>
                </div>
                <div class="stat-label">Break This Week</div>
                <div class="stat-value">${time.week.totalBreak}h</div>
                <div class="stat-meta">${(time.week.totalBreak / 168 * 100).toFixed(1)}% of week</div>
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Time Distribution</h3>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="timeChart" data-chart="doughnut" data-chart-data='${JSON.stringify({
                            labels: time.categories.map(c => c.name),
                            datasets: [{
                                data: time.categories.map(c => c.hours),
                                backgroundColor: [
                                    'rgba(99, 102, 241, 0.8)',
                                    'rgba(16, 185, 129, 0.8)',
                                    'rgba(245, 158, 11, 0.8)',
                                    'rgba(59, 130, 246, 0.8)',
                                    'rgba(236, 72, 153, 0.8)'
                                ],
                                borderWidth: 2
                            }]
                        })}'></canvas>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Category Breakdown</h3>
                </div>
                <div class="card-body">
                    <ul class="list">
                        ${time.categories.map(cat => `
                            <li class="list-item">
                                <div>
                                    <strong>${cat.name}</strong>
                                    <div class="progress" style="margin-top: var(--spacing-xs);">
                                        <div class="progress-bar info" style="width: ${cat.percentage}%"></div>
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div><strong>${cat.hours}h</strong></div>
                                    <div style="font-size: 0.875rem; color: var(--text-secondary);">${cat.percentage.toFixed(1)}%</div>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>

        <div class="card" style="margin-top: var(--spacing-lg);">
            <div class="card-header">
                <h3 class="card-title">Recent Time Entries</h3>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${time.recentEntries.map(entry => `
                                <tr>
                                    <td>${entry.date}</td>
                                    <td><span class="badge info">${entry.category}</span></td>
                                    <td>${entry.description}</td>
                                    <td><strong>${entry.hours}h</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="card" style="margin-top: var(--spacing-lg);">
            <div class="card-header">
                <h3 class="card-title">Today's Summary</h3>
            </div>
            <div class="card-body">
                <ul class="list">
                    <li class="list-item">
                        <span>Total Hours</span>
                        <strong>${time.today.total}h</strong>
                    </li>
                    <li class="list-item">
                        <span>Sleep</span>
                        <strong>${time.today.sleep}h</strong>
                    </li>
                    <li class="list-item">
                        <span>Work</span>
                        <strong>${time.today.work}h</strong>
                    </li>
                    <li class="list-item">
                        <span>Personal</span>
                        <strong>${time.today.personal}h</strong>
                    </li>
                    <li class="list-item">
                        <span>Break</span>
                        <strong>${time.today.break}h</strong>
                    </li>
                </ul>
            </div>
        </div>
    `;
}
