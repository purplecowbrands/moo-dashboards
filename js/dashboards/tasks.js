// Tasks Dashboard - Status grouped task table layout
import { sampleData } from '../../data/sample-data.js';
import { getClickUpData, isLiveData } from '../data-loader.js';

const STATUS_ORDER = ['do next', 'in progress', 'coming up', 'backlog'];

export async function renderTasksAsync() {
    const liveData = await getClickUpData();
    const live = isLiveData(liveData);

    const tasks = live ? buildFromClickUp(liveData) : buildFromSampleData();
    const statusBanner = buildStatusBanner(live, liveData, tasks.totalCount);

    const groups = STATUS_ORDER
        .map(status => ({
            key: status,
            label: formatStatusLabel(status),
            tasks: tasks.byStatus[status] || []
        }))
        .filter(group => group.tasks.length > 0);

    const noStatusTasks = tasks.unmapped || [];

    return `
        <div class="page-header">
            <h2>Tasks</h2>
            <p>Clean ClickUp task view grouped by status</p>
        </div>

        ${statusBanner}

        ${groups.map(group => renderStatusGroup(group.label, group.tasks)).join('')}

        ${noStatusTasks.length > 0 ? renderStatusGroup('Other', noStatusTasks) : ''}
    `;
}

function renderStatusGroup(label, items) {
    const totalEstimateMs = items.reduce((sum, task) => sum + (task.timeEstimate || 0), 0);

    return `
        <div class="card" style="margin-bottom: var(--spacing-lg);">
            <div class="card-header">
                <h3 class="card-title">${label}</h3>
                <span class="badge info">${items.length} tasks • ${formatDuration(totalEstimateMs)}</span>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Location</th>
                                <th>Time Estimate</th>
                                <th>Due Date</th>
                                <th>Comments</th>
                                <th>Task Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(task => `
                                <tr>
                                    <td>
                                        <div class="task-name-cell ${task.isSubtask ? 'subtask' : ''}">
                                            ${task.isSubtask ? '<span class="task-indent">↳</span>' : ''}
                                            <a href="${task.url || '#'}" target="_blank" rel="noopener noreferrer" class="task-link">${escapeHtml(task.name)}</a>
                                        </div>
                                    </td>
                                    <td>${escapeHtml(task.location || 'Unassigned')}</td>
                                    <td>${formatDuration(task.timeEstimate)}</td>
                                    <td>${task.dueDate ? formatDate(task.dueDate) : 'No due date'}</td>
                                    <td>${task.commentsCount ?? 'n/a'}</td>
                                    <td><span class="badge neutral">${escapeHtml(task.taskType || 'Task')}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function buildFromClickUp(data) {
    const allTasks = [
        ...(data.tasks.overdue || []),
        ...(data.tasks.dueToday || []),
        ...(data.tasks.upcoming || []),
        ...(data.tasks.noDueDate || [])
    ];

    const byStatus = {};
    const unmapped = [];

    allTasks.forEach(task => {
        const normalizedStatus = (task.status || '').toLowerCase();
        const row = {
            name: task.name,
            url: task.url,
            location: buildBreadcrumb(task),
            timeEstimate: task.timeEstimate || 0,
            dueDate: task.dueDate,
            commentsCount: task.commentsCount,
            taskType: inferTaskType(task),
            isSubtask: Boolean(task.parent)
        };

        if (STATUS_ORDER.includes(normalizedStatus)) {
            if (!byStatus[normalizedStatus]) byStatus[normalizedStatus] = [];
            byStatus[normalizedStatus].push(row);
        } else {
            unmapped.push(row);
        }
    });

    Object.keys(byStatus).forEach(status => {
        byStatus[status].sort((a, b) => sortByDueDate(a, b));
    });

    unmapped.sort((a, b) => sortByDueDate(a, b));

    return {
        byStatus,
        unmapped,
        totalCount: allTasks.length
    };
}

function buildFromSampleData() {
    const sample = sampleData.tasks;
    const byStatus = {
        'do next': (sample.recentTasks || []).slice(0, 5).map(task => ({
            name: task.title,
            location: task.category,
            timeEstimate: null,
            dueDate: null,
            commentsCount: 'n/a',
            taskType: 'Task',
            isSubtask: false
        })),
        backlog: (sample.recentTasks || []).slice(5, 12).map(task => ({
            name: task.title,
            location: task.category,
            timeEstimate: null,
            dueDate: null,
            commentsCount: 'n/a',
            taskType: 'Task',
            isSubtask: false
        }))
    };

    return {
        byStatus,
        unmapped: [],
        totalCount: (sample.recentTasks || []).length
    };
}

function buildStatusBanner(live, liveData, totalCount) {
    if (live) {
        const lastUpdated = new Date(liveData.lastUpdated).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });

        return `
            <div class="data-status-banner success" style="margin-bottom: var(--spacing-lg);">
                <i data-lucide="check-circle"></i>
                <span><strong>Live Data</strong> from ClickUp (${totalCount} active tasks, updated ${lastUpdated})</span>
            </div>
        `;
    }

    return `
        <div class="data-status-banner warning" style="margin-bottom: var(--spacing-lg);">
            <i data-lucide="alert-triangle"></i>
            <span><strong>Sample Data</strong> - Connect ClickUp to see full grouped task table</span>
        </div>
    `;
}

function buildBreadcrumb(task) {
    const parts = [];
    if (task.folder && task.folder !== 'Shared with me') parts.push(task.folder);
    if (task.list) parts.push(task.list);
    return parts.join(' / ') || task.list || 'General';
}

function inferTaskType(task) {
    if ((task.list || '').toLowerCase().includes('sales')) return 'Sales';
    if ((task.list || '').toLowerCase().includes('inbox')) return 'Inbox';
    if ((task.list || '').toLowerCase().includes('admin')) return 'Admin';
    return 'Task';
}

function formatStatusLabel(status) {
    if (status === 'do next') return 'Do Next';
    if (status === 'coming up') return 'Coming Up';
    if (status === 'in progress') return 'In Progress';
    return 'Backlog';
}

function sortByDueDate(a, b) {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate - b.dueDate;
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatDuration(ms) {
    if (!ms || ms <= 0) return 'No estimate';
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.round((ms % 3600000) / 60000);

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function renderTasks() {
    return `
        <div class="page-header">
            <h2>Tasks</h2>
            <p>Loading task data...</p>
        </div>
        <div class="data-status-banner info">
            <i data-lucide="loader"></i>
            <span>Fetching task data...</span>
        </div>
    `;
}
