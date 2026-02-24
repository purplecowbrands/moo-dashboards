// Focus View - "What Should I Be Doing Right Now?"
// Big, bold, single-task interface inspired by Task Randomizer

import { getCalendarData, getClickUpData, getMonitoringData, getCRMData } from '../data-loader.js';

export async function renderFocusAsync() {
    const container = document.getElementById('page-container');
    
    // Show loading state
    container.innerHTML = `
        <div class="focus-container">
            <div class="focus-card loading">
                <div class="loading-spinner"></div>
                <p>Finding your top priority...</p>
            </div>
        </div>
    `;
    
    // Fetch current priority item
    const focusItem = await getCurrentFocus();
    
    container.innerHTML = `
        <div class="focus-container">
            ${focusItem ? renderFocusCard(focusItem) : renderNoFocusState()}
        </div>
    `;
}

async function getCurrentFocus() {
    // Fetch all data sources in parallel
    const [calendar, tasks, monitoring, crm] = await Promise.all([
        getCalendarData(),
        getClickUpData(),
        getMonitoringData(),
        getCRMData()
    ]);
    
    // Priority Algorithm (high to low):
    // 1. Meeting happening RIGHT NOW
    // 2. Site monitoring alerts (client sites down)
    // 3. Overdue tasks (sales category priority)
    // 4. Meeting in next 2 hours (prep time)
    // 5. Tasks due today (sales category priority)
    // 6. BNI 121s below target (from calendar)
    // 7. Time log gaps (detect unlogged time)
    // 8. Proactive work suggestions
    
    const now = new Date();
    
    // 1. Check for meeting happening now
    if (calendar && calendar.events) {
        const currentMeeting = calendar.events.find(event => {
            const start = new Date(event.start);
            const end = new Date(event.end);
            return now >= start && now <= end;
        });
        
        if (currentMeeting) {
            return {
                type: 'meeting',
                title: currentMeeting.summary,
                context: `This meeting is happening RIGHT NOW. ${currentMeeting.attendees ? `With: ${currentMeeting.attendees.join(', ')}` : ''}`,
                dueDate: currentMeeting.start,
                estimatedMinutes: Math.round((new Date(currentMeeting.end) - new Date(currentMeeting.start)) / 60000),
                priority: 'urgent',
                category: 'meeting',
                source: 'Calendar',
                link: currentMeeting.link,
                nextItems: getNextItems(calendar, tasks, 1) // Skip current meeting
            };
        }
    }
    
    // 2. Check for site monitoring alerts
    if (monitoring && monitoring.alerts && monitoring.alerts.length > 0) {
        const alert = monitoring.alerts[0]; // Most critical alert
        const site = monitoring.sites.find(s => s.name === alert.site);
        
        return {
            type: 'alert',
            title: `🚨 Site Down: ${alert.site}`,
            context: `${alert.issue}. This is a client-facing emergency that needs immediate attention.`,
            dueDate: null,
            estimatedMinutes: 30,
            priority: 'urgent',
            category: 'emergency',
            source: 'Site Monitoring',
            link: site?.url,
            nextItems: getNextItems(calendar, tasks, 0)
        };
    }
    
    // 3. Check for overdue tasks (sales priority)
    if (tasks && tasks.overdue && tasks.overdue.length > 0) {
        // Sort by category - sales first, then client work, then admin
        const sorted = tasks.overdue.sort((a, b) => {
            const priorityOrder = { sales: 0, client: 1, admin: 2, other: 3 };
            const aCategory = getCategoryType(a.list);
            const bCategory = getCategoryType(b.list);
            return (priorityOrder[aCategory] || 3) - (priorityOrder[bCategory] || 3);
        });
        
        const task = sorted[0];
        const daysOverdue = Math.floor((now - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
        const category = getCategoryType(task.list);
        
        return {
            type: 'task',
            title: task.name,
            context: `This is overdue by ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'}. ${category === 'sales' ? 'Sales followups are your highest revenue priority.' : 'Client work needs attention to maintain satisfaction.'} ${task.list ? `From: ${task.list}` : ''}`,
            dueDate: task.dueDate,
            estimatedMinutes: task.timeEstimate || 30,
            priority: 'urgent',
            category: category,
            source: 'ClickUp',
            link: task.url,
            nextItems: getNextItems(calendar, tasks, 1)
        };
    }
    
    // 4. Check for meeting in next 2 hours
    if (calendar && calendar.events) {
        const upcomingMeeting = calendar.events.find(event => {
            const start = new Date(event.start);
            const diffMs = start - now;
            const diffHours = diffMs / (1000 * 60 * 60);
            return diffHours > 0 && diffHours <= 2;
        });
        
        if (upcomingMeeting) {
            const start = new Date(upcomingMeeting.start);
            const minutesUntil = Math.round((start - now) / 60000);
            
            return {
                type: 'meeting',
                title: `Prep: ${upcomingMeeting.summary}`,
                context: `Meeting starts in ${minutesUntil} minutes. Time to prepare notes, agenda, and get in the right headspace.`,
                dueDate: upcomingMeeting.start,
                estimatedMinutes: 15,
                priority: 'high',
                category: 'meeting-prep',
                source: 'Calendar',
                link: upcomingMeeting.link,
                nextItems: getNextItems(calendar, tasks, 1)
            };
        }
    }
    
    // 5. Check for tasks due today (sales priority)
    if (tasks && tasks.dueToday && tasks.dueToday.length > 0) {
        // Sort by category - sales first
        const sorted = tasks.dueToday.sort((a, b) => {
            const priorityOrder = { sales: 0, client: 1, admin: 2, other: 3 };
            const aCategory = getCategoryType(a.list);
            const bCategory = getCategoryType(b.list);
            return (priorityOrder[aCategory] || 3) - (priorityOrder[bCategory] || 3);
        });
        
        const task = sorted[0];
        const category = getCategoryType(task.list);
        
        return {
            type: 'task',
            title: task.name,
            context: `Due today. ${category === 'sales' ? 'Sales work drives revenue - prioritize this.' : 'Get this done before end of day.'} ${task.list ? `From: ${task.list}` : ''}`,
            dueDate: task.dueDate,
            estimatedMinutes: task.timeEstimate || 30,
            priority: 'high',
            category: category,
            source: 'ClickUp',
            link: task.url,
            nextItems: getNextItems(calendar, tasks, 1)
        };
    }
    
    // 6. Check BNI 121s target (if below 6/week)
    if (calendar && calendar.oneOnOnes !== undefined && calendar.oneOnOnes < 6) {
        const remaining = 6 - calendar.oneOnOnes;
        
        return {
            type: 'followup',
            title: `Schedule ${remaining} more 121${remaining > 1 ? 's' : ''} this week`,
            context: `You're at ${calendar.oneOnOnes}/6 for your weekly BNI 121 target. Networking drives referrals. Who haven't you talked to in a while?`,
            dueDate: null,
            estimatedMinutes: 45,
            priority: 'medium',
            category: 'networking',
            source: 'BNI Goals',
            nextItems: getNextItems(calendar, tasks, 0)
        };
    }
    
    // 7. Time log gaps (placeholder - would need to check today's time log)
    // TODO: Implement time log gap detection by reading memory/timelog/YYYY-MM-DD.md
    // For now, skip this one
    
    // 8. Proactive work suggestions
    if (tasks && tasks.upcoming && tasks.upcoming.length > 0) {
        // Get first upcoming task (not due today, but coming up)
        const task = tasks.upcoming[0];
        const category = getCategoryType(task.list);
        
        return {
            type: 'suggestion',
            title: task.name,
            context: `No urgent items right now. Great time to get ahead on upcoming work. ${task.list ? `From: ${task.list}` : ''}`,
            dueDate: task.dueDate,
            estimatedMinutes: task.timeEstimate || 30,
            priority: 'low',
            category: category,
            source: 'ClickUp',
            link: task.url,
            nextItems: getNextItems(calendar, tasks, 1)
        };
    }
    
    // No priority items found
    return null;
}

// Get category type from list name
function getCategoryType(listName) {
    if (!listName) return 'other';
    
    const lower = listName.toLowerCase();
    
    if (lower.includes('sales') || lower.includes('deal') || lower.includes('bni') || lower.includes('followup')) {
        return 'sales';
    }
    
    if (lower.includes('client') || lower.includes('project')) {
        return 'client';
    }
    
    if (lower.includes('admin') || lower.includes('overhead')) {
        return 'admin';
    }
    
    return 'other';
}

// Get next 3 items in queue
function getNextItems(calendar, tasks, skipCount = 0) {
    const items = [];
    const now = new Date();
    
    // Add upcoming meetings
    if (calendar && calendar.events) {
        const upcomingMeetings = calendar.events
            .filter(event => new Date(event.start) > now)
            .sort((a, b) => new Date(a.start) - new Date(b.start))
            .slice(0, 2);
        
        upcomingMeetings.forEach(meeting => {
            const start = new Date(meeting.start);
            items.push({
                title: meeting.summary,
                time: start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            });
        });
    }
    
    // Add overdue tasks
    if (tasks && tasks.overdue) {
        const sorted = tasks.overdue
            .sort((a, b) => {
                const priorityOrder = { sales: 0, client: 1, admin: 2, other: 3 };
                const aCategory = getCategoryType(a.list);
                const bCategory = getCategoryType(b.list);
                return (priorityOrder[aCategory] || 3) - (priorityOrder[bCategory] || 3);
            })
            .slice(skipCount, skipCount + 2);
        
        sorted.forEach(task => {
            items.push({
                title: task.name,
                time: null
            });
        });
    }
    
    // Add due today tasks
    if (tasks && tasks.dueToday && items.length < 3) {
        const sorted = tasks.dueToday
            .sort((a, b) => {
                const priorityOrder = { sales: 0, client: 1, admin: 2, other: 3 };
                const aCategory = getCategoryType(a.list);
                const bCategory = getCategoryType(b.list);
                return (priorityOrder[aCategory] || 3) - (priorityOrder[bCategory] || 3);
            })
            .slice(0, 3 - items.length);
        
        sorted.forEach(task => {
            items.push({
                title: task.name,
                time: null
            });
        });
    }
    
    return items.slice(0, 3);
}

function renderFocusCard(item) {
    const priorityIcon = getPriorityIcon(item.type);
    const priorityClass = item.priority || 'normal';
    const statusText = getStatusText(item);
    
    return `
        <div class="focus-card ${priorityClass}">
            <div class="focus-header">
                <div class="focus-icon">${priorityIcon}</div>
                <div class="focus-label">RIGHT NOW</div>
            </div>
            
            <h1 class="focus-title">${item.title}</h1>
            
            <div class="focus-meta">
                ${statusText ? `
                <div class="meta-item">
                    <i data-lucide="calendar"></i>
                    <span>${statusText}</span>
                </div>
                ` : ''}
                ${item.estimatedMinutes ? `
                <div class="meta-item">
                    <i data-lucide="clock"></i>
                    <span>~${item.estimatedMinutes} minutes</span>
                </div>
                ` : ''}
                <div class="meta-item">
                    <i data-lucide="tag"></i>
                    <span>${item.category}</span>
                </div>
            </div>
            
            <div class="focus-context">
                ${item.context}
            </div>
            
            <div class="focus-actions">
                <button class="btn btn-primary btn-large" onclick="handleComplete('${item.link || ''}')">
                    <i data-lucide="check"></i>
                    <span>Mark Complete</span>
                </button>
                <button class="btn btn-secondary btn-large" onclick="handleSnooze()">
                    <i data-lucide="clock"></i>
                    <span>Snooze</span>
                </button>
                <button class="btn btn-ghost btn-large" onclick="handleSkip()">
                    <i data-lucide="skip-forward"></i>
                    <span>Skip</span>
                </button>
            </div>
            
            ${item.link ? `
            <div class="focus-link">
                <a href="${item.link}" target="_blank" class="external-link">
                    <i data-lucide="external-link"></i>
                    <span>Open in ${item.source}</span>
                </a>
            </div>
            ` : ''}
            
            ${item.nextItems && item.nextItems.length > 0 ? `
            <div class="focus-queue">
                <h3>Next Up</h3>
                <ul class="next-items">
                    ${item.nextItems.map((next, idx) => `
                        <li>
                            <span class="queue-number">${idx + 1}</span>
                            <span class="queue-title">${next.title}</span>
                            ${next.time ? `<span class="queue-time">${next.time}</span>` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
    `;
}

function renderNoFocusState() {
    return `
        <div class="focus-card no-focus">
            <div class="focus-icon">🎉</div>
            <h1 class="focus-title">All Clear!</h1>
            <div class="focus-context">
                No urgent items right now. Great time to work on proactive projects or take a break.
            </div>
            <div class="focus-suggestions">
                <h3>Suggestions:</h3>
                <ul>
                    <li>Reach out to a BNI contact for a 121</li>
                    <li>Review your pipeline for follow-up opportunities</li>
                    <li>Plan tomorrow's priorities</li>
                    <li>Take a walk with Tango 🐕</li>
                </ul>
            </div>
        </div>
    `;
}

function getPriorityIcon(type) {
    const icons = {
        meeting: '📅',
        alert: '🚨',
        task: '🎯',
        followup: '💬',
        reminder: '⏰',
        suggestion: '💡'
    };
    return icons[type] || '📋';
}

function getStatusText(item) {
    if (!item.dueDate) return '';
    
    const due = new Date(item.dueDate);
    const now = new Date();
    const diffMs = due - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMs < 0) {
        const overdueDays = Math.abs(diffDays);
        return `Overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`;
    }
    
    if (diffHours < 2) {
        const mins = Math.round(diffMs / 60000);
        if (mins < 60) {
            return `Due in ${mins} minutes`;
        }
        return 'Due in less than 2 hours';
    }
    
    if (diffDays === 0) {
        return `Due today at ${due.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    
    if (diffDays === 1) {
        return 'Due tomorrow';
    }
    
    return `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

// Quick action handlers
window.handleComplete = function(link) {
    // If there's a link, open it and let user mark complete there
    if (link) {
        window.open(link, '_blank');
        setTimeout(() => {
            if (confirm('Did you complete this task? (This will refresh the Focus view)')) {
                // Refresh the page to get next priority
                location.reload();
            }
        }, 1000);
    } else {
        // For items without links, just refresh
        if (confirm('Mark as complete and move to next item?')) {
            location.reload();
        }
    }
    // TODO: In future, implement actual completion logging:
    // - Open modal to log time spent and notes
    // - Update ClickUp task status via API
    // - Write to time log file
};

window.handleSnooze = function() {
    const options = [
        { label: '30 minutes', value: 30 },
        { label: '1 hour', value: 60 },
        { label: '2 hours', value: 120 },
        { label: 'Tomorrow', value: 1440 }
    ];
    
    const choice = prompt('Snooze for how long?\n1 = 30 min\n2 = 1 hour\n3 = 2 hours\n4 = Tomorrow');
    
    if (choice >= 1 && choice <= 4) {
        const minutes = options[choice - 1].value;
        // TODO: Store snooze in localStorage with expiration time
        alert(`Snoozed for ${options[choice - 1].label}. (Snooze persistence coming soon!)`);
        location.reload();
    }
};

window.handleSkip = function() {
    if (confirm('Skip to next item without marking complete?')) {
        // TODO: Store skip in localStorage to avoid showing again today
        location.reload();
    }
};
