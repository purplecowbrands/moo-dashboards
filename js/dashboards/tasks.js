// Task Overview Dashboard
import { sampleData } from '../../data/sample-data.js';

export function renderTasks() {
    const { tasks } = sampleData;
    const totalTasks = tasks.overdue + tasks.dueToday + tasks.upcoming;

    return `
        <div class="page-header">
            <h2>Task Overview</h2>
            <p>ClickUp task summary - overdue, due today, by category</p>
        </div>

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
                                backgroundColor: [
                                    'rgba(99, 102, 241, 0.8)',
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
                                return `
                                    <tr>
                                        <td><strong>${task.title}</strong></td>
                                        <td><span class="badge neutral">${task.category}</span></td>
                                        <td>${task.dueDate}</td>
                                        <td><span class="badge ${statusBadge}">${statusText}</span></td>
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
                        <div class="progress-bar error" style="width: ${(tasks.overdue / totalTasks) * 100}%">
                            ${tasks.overdue}
                        </div>
                    </div>
                </div>
                <div style="margin-bottom: var(--spacing-lg);">
                    <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--spacing-xs);">
                        Today (Due Today)
                    </div>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar warning" style="width: ${(tasks.dueToday / totalTasks) * 100}%">
                            ${tasks.dueToday}
                        </div>
                    </div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--spacing-xs);">
                        Planned (Upcoming)
                    </div>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar info" style="width: ${(tasks.upcoming / totalTasks) * 100}%">
                            ${tasks.upcoming}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
