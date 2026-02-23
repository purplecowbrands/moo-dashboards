// Roadmap Data - Kanban Board Structure
// Features organized by status (column) with architecture categories as tags

export const architectureCategories = {
    foundation: 'Foundation',
    dataConnections: 'Data Connections',
    focusEngine: 'Focus Engine',
    dashboardUI: 'Dashboard UI',
    inputFeedback: 'Input/Feedback',
    writeCapabilities: 'Write Capabilities',
    polish: 'Polish'
};

export const roadmapFeatures = [
    // ===== COMPLETE =====
    {
        id: 'p1-f1',
        name: 'Complete SPA shell with sidebar navigation',
        description: 'Single-page app framework with hash-based routing',
        status: 'complete',
        category: 'foundation'
    },
    {
        id: 'p1-f2',
        name: '11 dashboard pages with realistic UI',
        description: 'Home, Sales, EOS, CRM, Clients, Monitoring, Time, BNI, Financial, Tasks, Kitchen',
        status: 'complete',
        category: 'dashboardUI'
    },
    {
        id: 'p1-f3',
        name: 'Sample data matching real schemas',
        description: 'Mock data for all dashboards to test UI',
        status: 'complete',
        category: 'foundation'
    },
    {
        id: 'p1-f4',
        name: 'Responsive design (mobile + desktop)',
        description: 'CSS grid and flexbox for adaptive layouts',
        status: 'complete',
        category: 'foundation'
    },
    {
        id: 'p1-f5',
        name: 'Dark mode theming',
        description: 'CSS custom properties for light/dark themes',
        status: 'complete',
        category: 'foundation'
    },
    {
        id: 'p1-f6',
        name: 'Chart.js visualizations',
        description: 'Integration for data visualization',
        status: 'complete',
        category: 'dashboardUI'
    },
    {
        id: 'p1-f7',
        name: 'Cloudflare Pages deployment pipeline',
        description: 'Auto-deploy from GitHub main branch',
        status: 'complete',
        category: 'foundation'
    },
    
    // ===== BACKLOG (was "planned") =====
    {
        id: 'p2-f1',
        name: 'CRM file loader',
        description: 'Load contacts, interactions, introductions from JSON files',
        status: 'backlog',
        category: 'dataConnections'
    },
    {
        id: 'p2-f2',
        name: 'Kitchen file loader',
        description: 'Load meal plans and inventory from JSON files',
        status: 'backlog',
        category: 'dataConnections'
    },
    {
        id: 'p2-f3',
        name: 'Monitoring file loader',
        description: 'Load site status and alerts from monitoring data',
        status: 'backlog',
        category: 'dataConnections'
    },
    {
        id: 'p2-f4',
        name: 'Time log parser',
        description: 'Parse markdown time logs into structured data',
        status: 'backlog',
        category: 'dataConnections'
    },
    {
        id: 'p2-f5',
        name: 'Google Calendar API',
        description: 'Fetch events, meetings, 121 counts from Google Calendar',
        status: 'backlog',
        category: 'dataConnections'
    },
    {
        id: 'p2-f6',
        name: 'ClickUp API integration',
        description: 'Fetch all tasks, statuses, custom fields from ClickUp',
        status: 'backlog',
        category: 'dataConnections'
    },
    {
        id: 'p2-f7',
        name: 'Manual data entry forms',
        description: 'Forms for EOS metrics, financial data, BNI stats',
        status: 'backlog',
        category: 'inputFeedback'
    },
    {
        id: 'p2-f8',
        name: 'Data caching layer',
        description: 'Cache strategy with 5-15 min refresh intervals',
        status: 'backlog',
        category: 'dataConnections'
    },
    {
        id: 'p2-f9',
        name: 'Error handling UI',
        description: 'Graceful error states for failed data loads',
        status: 'backlog',
        category: 'dashboardUI'
    },
    {
        id: 'p3-f1',
        name: 'Priority algorithm logic',
        description: 'Decision engine to determine "What Should I Be Doing Right Now?"',
        status: 'backlog',
        category: 'focusEngine'
    },
    {
        id: 'p3-f2',
        name: 'Focus view UI',
        description: 'Full-screen takeover with single task display',
        status: 'backlog',
        category: 'focusEngine'
    },
    {
        id: 'p3-f3',
        name: 'Meeting detection (now)',
        description: 'Real-time detection of current meetings',
        status: 'backlog',
        category: 'focusEngine'
    },
    {
        id: 'p3-f4',
        name: 'Quick action handlers',
        description: 'Complete, snooze, skip, dismiss buttons',
        status: 'backlog',
        category: 'focusEngine'
    },
    {
        id: 'p3-f5',
        name: 'Context builder (Moo)',
        description: 'AI-generated context and reasoning for priority decisions',
        status: 'backlog',
        category: 'focusEngine'
    },
    {
        id: 'p3-f6',
        name: 'Snooze system',
        description: 'Defer tasks for 30min/1hr/2hr/tomorrow',
        status: 'backlog',
        category: 'focusEngine'
    },
    {
        id: 'p3-f7',
        name: 'Next-in-queue display',
        description: 'Show next 3 tasks after current priority',
        status: 'backlog',
        category: 'focusEngine'
    },
    {
        id: 'p3-f8',
        name: 'Time estimation',
        description: 'Estimate task completion time based on historical data',
        status: 'backlog',
        category: 'focusEngine'
    },
    {
        id: 'p4-f1',
        name: 'Task completion form',
        description: 'Log time spent, notes, outcome when completing tasks',
        status: 'backlog',
        category: 'inputFeedback'
    },
    {
        id: 'p4-f2',
        name: 'Time entry UI',
        description: 'Quick log interface for time tracking',
        status: 'backlog',
        category: 'inputFeedback'
    },
    {
        id: 'p4-f3',
        name: 'Write to time log file',
        description: 'Append entries to daily markdown time logs',
        status: 'backlog',
        category: 'writeCapabilities'
    },
    {
        id: 'p4-f4',
        name: 'Meeting feedback form',
        description: 'Rate meetings, log outcomes, create followups',
        status: 'backlog',
        category: 'inputFeedback'
    },
    {
        id: 'p4-f5',
        name: 'Quick task creation',
        description: 'Single-line task creation with smart defaults',
        status: 'backlog',
        category: 'inputFeedback'
    },
    {
        id: 'p5-f1',
        name: 'Calendar event creation',
        description: 'Create Google Calendar events from dashboard',
        status: 'backlog',
        category: 'writeCapabilities'
    },
    {
        id: 'p5-f2',
        name: 'ClickUp task creation',
        description: 'Create new tasks via ClickUp API',
        status: 'backlog',
        category: 'writeCapabilities'
    },
    {
        id: 'p5-f3',
        name: 'ClickUp task updates',
        description: 'Update task status, dates, assignees, comments',
        status: 'backlog',
        category: 'writeCapabilities'
    },
    {
        id: 'p5-f4',
        name: 'CRM interaction logging',
        description: 'Log new interactions to interactions.json',
        status: 'backlog',
        category: 'writeCapabilities'
    },
    {
        id: 'p5-f5',
        name: 'CRM contact creation',
        description: 'Add new contacts to contacts.json',
        status: 'backlog',
        category: 'writeCapabilities'
    },
    {
        id: 'p5-f6',
        name: 'OpenClaw relay setup',
        description: 'WebSocket/HTTP relay for dashboard to send write commands to agent',
        status: 'backlog',
        category: 'writeCapabilities'
    },
    {
        id: 'p5-f7',
        name: 'File write validation',
        description: 'Agent validates and enriches data before writing',
        status: 'backlog',
        category: 'writeCapabilities'
    },
    {
        id: 'p5-f8',
        name: 'Git auto-commit on write',
        description: 'Automatically commit and push changes after file writes',
        status: 'backlog',
        category: 'writeCapabilities'
    },
    
    // ===== IDEAS (risky/big changes needing approval) =====
    {
        id: 'p4-f6',
        name: 'Voice input',
        description: 'Voice-to-text for task creation and notes',
        status: 'idea',
        category: 'inputFeedback'
    },
    {
        id: 'p6-f1',
        name: 'Browser notifications',
        description: 'Push notifications for meetings, alerts, tasks',
        status: 'idea',
        category: 'polish'
    },
    {
        id: 'p6-f2',
        name: 'Keyboard shortcuts',
        description: 'Hotkeys for navigation and quick actions',
        status: 'idea',
        category: 'polish'
    },
    {
        id: 'p6-f3',
        name: 'PWA install prompt',
        description: 'Progressive Web App installation',
        status: 'idea',
        category: 'polish'
    },
    {
        id: 'p6-f4',
        name: 'Offline mode',
        description: 'Service worker for offline data access',
        status: 'idea',
        category: 'polish'
    },
    {
        id: 'p6-f5',
        name: 'Time tracking analytics',
        description: 'Advanced analytics and trends from time logs',
        status: 'idea',
        category: 'dashboardUI'
    },
    {
        id: 'p6-f6',
        name: 'Voice commands',
        description: 'Voice control for common actions',
        status: 'idea',
        category: 'inputFeedback'
    },
    {
        id: 'p6-f7',
        name: 'Gmail integration',
        description: 'Inbox triage and email management',
        status: 'idea',
        category: 'dataConnections'
    },
    {
        id: 'p6-f8',
        name: 'Predictive scheduling',
        description: 'ML-based suggestions for optimal task timing',
        status: 'idea',
        category: 'focusEngine'
    },
    {
        id: 'idea-1',
        name: 'Habit tracking',
        description: 'Daily push-ups, dog walks, meal prep, sleep quality',
        status: 'idea',
        category: 'dashboardUI'
    },
    {
        id: 'idea-2',
        name: 'Energy level tracking',
        description: 'Correlate energy with productivity patterns',
        status: 'idea',
        category: 'inputFeedback'
    },
    {
        id: 'idea-3',
        name: 'Focus mode',
        description: 'Block distracting websites during deep work',
        status: 'idea',
        category: 'polish'
    },
    {
        id: 'idea-4',
        name: 'Pomodoro timer',
        description: 'Integrated with time tracking',
        status: 'idea',
        category: 'inputFeedback'
    },
    {
        id: 'idea-5',
        name: 'Weekly review automation',
        description: 'Auto-generated summary of accomplishments and gaps',
        status: 'idea',
        category: 'dashboardUI'
    },
    {
        id: 'idea-6',
        name: 'Delegation tracker',
        description: 'Track tasks assigned to team members with followup reminders',
        status: 'idea',
        category: 'dashboardUI'
    },
    {
        id: 'idea-7',
        name: 'Client satisfaction score',
        description: 'Track NPS or simple ratings per client',
        status: 'idea',
        category: 'dataConnections'
    },
    {
        id: 'idea-8',
        name: 'Referral source attribution',
        description: 'Which BNI members send the best leads?',
        status: 'idea',
        category: 'dataConnections'
    },
    {
        id: 'idea-9',
        name: 'Meeting cost calculator',
        description: 'Show dollar value of time spent in meetings',
        status: 'idea',
        category: 'dashboardUI'
    },
    {
        id: 'idea-10',
        name: 'Smart batching',
        description: 'Group similar tasks together (sales calls, admin work)',
        status: 'idea',
        category: 'focusEngine'
    },
    {
        id: 'idea-11',
        name: 'Context switching penalty',
        description: 'Warn when jumping between very different task types',
        status: 'idea',
        category: 'focusEngine'
    },
    {
        id: 'idea-12',
        name: 'Network map visualization',
        description: 'Visualize BNI connections and referral paths',
        status: 'idea',
        category: 'dashboardUI'
    },
    {
        id: 'idea-13',
        name: 'Client gifting tracker',
        description: 'Track birthdays, anniversaries, thank-you gifts',
        status: 'idea',
        category: 'dataConnections'
    },
    {
        id: 'idea-14',
        name: 'Testimonial collector',
        description: 'Request and store client reviews',
        status: 'idea',
        category: 'dataConnections'
    },
    {
        id: 'idea-15',
        name: 'Pricing calculator',
        description: 'Quote generator for proposals',
        status: 'idea',
        category: 'dashboardUI'
    }
];
