// Focus View - "What Should I Be Doing Right Now?"
// Big, bold, single-task interface inspired by Task Randomizer

export async function renderFocusAsync() {
    const container = document.getElementById('page-container');
    
    // Fetch current priority item (will implement priority algorithm later)
    const focusItem = await getCurrentFocus();
    
    container.innerHTML = `
        <div class="focus-container">
            ${focusItem ? renderFocusCard(focusItem) : renderNoFocusState()}
        </div>
    `;
}

async function getCurrentFocus() {
    // TODO: Implement priority algorithm
    // For now, return sample data to build the UI
    
    // Priority order:
    // 1. Meeting happening now
    // 2. Site monitoring alerts
    // 3. Overdue tasks (sales priority)
    // 4. Meeting in next 2 hours
    // 5. Tasks due today (sales priority)
    // 6. BNI 121s below target
    // 7. Time log gaps
    // 8. Proactive work suggestions
    
    // Sample data for UI development
    return {
        type: 'task',
        title: 'Follow up with Creating Community - Discovery Call',
        context: 'This is overdue by 2 days, and it\'s a sales followup - your highest revenue priority. You last contacted them on Feb 15.',
        dueDate: '2026-02-21T15:00:00',
        estimatedMinutes: 15,
        priority: 'urgent',
        category: 'sales',
        source: 'ClickUp',
        nextItems: [
            { title: 'Client call prep - Tech Solutions Inc', time: '2:00 PM' },
            { title: 'Review site monitoring alerts', time: null },
            { title: 'Log time entries for this morning', time: null }
        ]
    };
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
                <div class="meta-item">
                    <i data-lucide="calendar"></i>
                    <span>${statusText}</span>
                </div>
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
                <button class="btn btn-primary btn-large" onclick="handleComplete()">
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
    if (!item.dueDate) return 'No due date';
    
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

// Quick action handlers (will implement properly later)
window.handleComplete = function() {
    console.log('Complete action - will implement time logging + task update');
    // TODO: Open modal to log time spent and notes
    // TODO: Update ClickUp task status
    // TODO: Write to time log file
    // TODO: Refresh focus view with next item
    alert('Complete functionality coming soon!');
};

window.handleSnooze = function() {
    console.log('Snooze action - will implement snooze options');
    // TODO: Show snooze options modal (30min, 1hr, 2hr, tomorrow)
    // TODO: Store snooze in local storage
    // TODO: Refresh focus view with next item
    alert('Snooze functionality coming soon!');
};

window.handleSkip = function() {
    console.log('Skip action - move to next without snoozing');
    // TODO: Just skip to next item in queue
    // TODO: Don't mark as complete or snoozed
    alert('Skip functionality coming soon!');
};
