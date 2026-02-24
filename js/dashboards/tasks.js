// Task Overview Dashboard
import { sampleData } from '../../data/sample-data.js';
import { getClickUpData, isLiveData } from '../data-loader.js';

export async function renderTasksAsync() {
    // Try to fetch live ClickUp data
    const liveData = await getClickUpData();
    const isLive = isLiveData(liveData);

    // Use live data if available, otherwise fall back to sample data
    let tasks;
    let dataStatusBanner = '';

    if (isLive) {
        // Transform ClickUp API data to dashboard format
        tasks = {
            overdue: liveData.summary.overdue,
            dueToday: liveData.summary.dueToday,
            upcoming: liveData.summary.upcoming,
            noDueDate: liveData.summary.noDueDate,
            byCategory: liveData.byCategory,
            recentTasks: [
                ...liveData.tasks.overdue.slice(0, 5).map(t => transformTask(t, 'overdue')),
                ...liveData.tasks.dueToday.slice(0, 5).map(t => transformTask(t, 'due-today')),
                ...liveData.tasks.upcoming.slice(0, 5).map(t => transformTask(t, 'upcoming'))
            ].slice(0, 15) // Limit to 15 most urgent tasks
        };
        
        const lastUpdated = new Date(liveData.lastUpdated).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
        
        dataStatusBanner = `
            <div class="data-status-banner success">
                <i data-lucide="check-circle"></i>
                <span><strong>Live Data</strong> from ClickUp API (${liveData.summary.total} active tasks, updated ${lastUpdated})</span>
            </div>
        `;
    } else {
        tasks = sampleData.tasks;
        dataStatusBanner = `
            <div class="data-status-banner warning">
                <i data-lucide="alert-triangle"></i>
                <span><strong>Sample Data</strong> - Connect to ClickUp API for live task tracking</span>
            </div>
        `;
    }

    const totalTasks = tasks.overdue + tasks.dueToday + tasks.upcoming + (tasks.noDueDate || 0);

    return `
        <div class="page-header">
            <h2>Task Overview</h2>
            <p>ClickUp task summary - overdue, due today, by category</p>
        </div>

        ${dataStatusBanner}

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon ${tasks.overdue > 0 ? 'error' : 'success'}">
                    <i data-lucide="alert-circle"></i>
                </div>
                <div class="stat-label">Overdue Tasks</div>
                <div class="stat-value">${tasks.overdue}</div>
                <div class="stat-meta">Needs immediate attention</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon warning">
                    <i data-lucide="calendar"></i>
                </div>
                <div class="stat-label">Due Today</div>
                <div class="stat-value">${tasks.dueToday}</div>
                <div class="stat-meta">Complete by end of day</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="clock"></i>
                </div>
                <div class="stat-label">Upcoming</div>
                <div class="stat-value">${tasks.upcoming}</div>
                <div class="stat-meta">Future tasks</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="layers"></i>
                </div>
                <div class="stat-label">Total Tasks</div>
                <div class="stat-value">${totalTasks}</div>
                <div class="stat-meta">All active tasks</div>
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Tasks by Category</h3>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="categoryChart" data-chart="doughnut" data-chart-data='${JSON.stringify({
                            labels: tasks.byCategory.map(c => c.category),
                            datasets: [{
                                data: tasks.byCategory.map(c => c.count),
                                backgroundColor: generateColors(tasks.byCategory.length),
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
                        ${tasks.byCategory.map(cat => `
                            <li class="list-item">
                                <span>${cat.category}</span>
                                <strong>${cat.count}</strong>
                            </li>
                        `).join('')}
                        <li class="list-item" style="border-top: 2px solid var(--border); margin-top: var(--spacing-sm); padding-top: var(--spacing-md);">
                            <span><strong>Total</strong></span>
                            <strong>${tasks.byCategory.reduce((sum, c) => sum + c.count, 0)}</strong>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="card" style="margin-top: var(--spacing-lg);">
            <div class="card-header">
                <h3 class="card-title">Recent Tasks</h3>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Task</th>
                                <th>Category</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                ${isLive ? '<th>Priority</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${tasks.recentTasks.map(task => {
                                let statusBadge = 'info';
                                let statusText = task.status.replace('-', ' ');
                                if (task.status === 'overdue') {
                                    statusBadge = 'error';
                                } else if (task.status === 'due-today') {
                                    statusBadge = 'warning';
                                    statusText = 'due today';
                                }
                                
                                let priorityBadge = '';
                                if (isLive && task.priority) {
                                    const priorityMap = {
                                        1: { class: 'error', text: 'Urgent' },
                                        2: { class: 'warning', text: 'High' },
                                        3: { class: 'neutral', text: 'Normal' },
                                        4: { class: 'neutral', text: 'Low' }
                                    };
                                    const p = priorityMap[task.priority] || { class: 'neutral', text: 'None' };
                                    priorityBadge = `<td><span class="badge ${p.class}">${p.text}</span></td>`;
                                }
                                
                                return `
                                    <tr>
                                        <td><strong>${task.title}</strong></td>
                                        <td><span class="badge neutral">${task.category}</span></td>
                                        <td>${task.dueDate}</td>
                                        <td><span class="badge ${statusBadge}">${statusText}</span></td>
                                        ${priorityBadge}
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="card" style="margin-top: var(--spacing-lg);">
            <div class="card-header">
                <h3 class="card-title">Task Priority Summary</h3>
            </div>
            <div class="card-body">
                <div style="margin-bottom: var(--spacing-lg);">
                    <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--spacing-xs);">
                        Immediate Attention (Overdue)
                    </div>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar error" style="width: ${totalTasks > 0 ? (tasks.overdue / totalTasks) * 100 : 0}%">
                            ${tasks.overdue}
                        </div>
                    </div>
                </div>
                <div style="margin-bottom: var(--spacing-lg);">
                    <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--spacing-xs);">
                        Today (Due Today)
                    </div>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar warning" style="width: ${totalTasks > 0 ? (tasks.dueToday / totalTasks) * 100 : 0}%">
                            ${tasks.dueToday}
                        </div>
                    </div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--spacing-xs);">
                        Planned (Upcoming)
                    </div>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar info" style="width: ${totalTasks > 0 ? (tasks.upcoming / totalTasks) * 100 : 0}%">
                            ${tasks.upcoming}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Transform ClickUp task to dashboard format
function transformTask(task, status) {
    let dueDate = 'No due date';
    if (task.dueDate) {
        const date = new Date(task.dueDate);
        dueDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    return {
        title: task.name,
        category: task.list,
        dueDate: dueDate,
        status: status,
        priority: task.priority || null,
        url: task.url
    };
}

// Generate color palette for chart (supports any number of categories)
function generateColors(count) {
    const baseColors = [
        'rgba(99, 102, 241, 0.8)',   // Indigo
        'rgba(16, 185, 129, 0.8)',   // Green
        'rgba(245, 158, 11, 0.8)',   // Amber
        'rgba(239, 68, 68, 0.8)',    // Red
        'rgba(59, 130, 246, 0.8)',   // Blue
        'rgba(168, 85, 247, 0.8)',   // Purple
        'rgba(236, 72, 153, 0.8)',   // Pink
        'rgba(20, 184, 166, 0.8)',   // Teal
        'rgba(251, 146, 60, 0.8)',   // Orange
        'rgba(132, 204, 22, 0.8)'    // Lime
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
}

// Legacy sync export for backwards compatibility
export function renderTasks() {
    return `
        <div class="page-header">
            <h2>Task Overview</h2>
            <p>Loading ClickUp task data...</p>
        </div>
        <div class="data-status-banner info">
            <i data-lucide="loader"></i>
            <span>Fetching task data from ClickUp API...</span>
        </div>
    `;
}
