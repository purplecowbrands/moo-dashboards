// Roadmap Data - Parsed from ROADMAP.md
// This file is auto-generated from ROADMAP.md by the hourly sync job

export const roadmapData = {
    phases: [
        {
            id: 'phase1',
            name: 'Phase 1: Foundation',
            status: 'complete',
            features: [
                {
                    id: 'p1-f1',
                    name: 'Complete SPA shell with sidebar navigation',
                    description: 'Single-page app framework with hash-based routing',
                    priority: 'high',
                    complexity: 'medium',
                    status: 'complete',
                    dependencies: []
                },
                {
                    id: 'p1-f2',
                    name: '11 dashboard pages with realistic UI',
                    description: 'Home, Sales, EOS, CRM, Clients, Monitoring, Time, BNI, Financial, Tasks, Kitchen',
                    priority: 'high',
                    complexity: 'high',
                    status: 'complete',
                    dependencies: ['p1-f1']
                },
                {
                    id: 'p1-f3',
                    name: 'Sample data matching real schemas',
                    description: 'Mock data for all dashboards to test UI',
                    priority: 'medium',
                    complexity: 'low',
                    status: 'complete',
                    dependencies: []
                },
                {
                    id: 'p1-f4',
                    name: 'Responsive design (mobile + desktop)',
                    description: 'CSS grid and flexbox for adaptive layouts',
                    priority: 'high',
                    complexity: 'medium',
                    status: 'complete',
                    dependencies: []
                },
                {
                    id: 'p1-f5',
                    name: 'Dark mode theming',
                    description: 'CSS custom properties for light/dark themes',
                    priority: 'medium',
                    complexity: 'low',
                    status: 'complete',
                    dependencies: []
                },
                {
                    id: 'p1-f6',
                    name: 'Chart.js visualizations',
                    description: 'Integration for data visualization',
                    priority: 'medium',
                    complexity: 'low',
                    status: 'complete',
                    dependencies: []
                },
                {
                    id: 'p1-f7',
                    name: 'Cloudflare Pages deployment pipeline',
                    description: 'Auto-deploy from GitHub main branch',
                    priority: 'high',
                    complexity: 'medium',
                    status: 'complete',
                    dependencies: []
                }
            ]
        },
        {
            id: 'phase2',
            name: 'Phase 2: Live Data Connections (Read-Only)',
            status: 'planned',
            features: [
                {
                    id: 'p2-f1',
                    name: 'CRM file loader',
                    description: 'Load contacts, interactions, introductions from JSON files',
                    priority: 'high',
                    complexity: 'low',
                    status: 'planned',
                    dependencies: []
                },
                {
                    id: 'p2-f2',
                    name: 'Kitchen file loader',
                    description: 'Load meal plans and inventory from JSON files',
                    priority: 'high',
                    complexity: 'low',
                    status: 'planned',
                    dependencies: []
                },
                {
                    id: 'p2-f3',
                    name: 'Monitoring file loader',
                    description: 'Load site status and alerts from monitoring data',
                    priority: 'high',
                    complexity: 'low',
                    status: 'planned',
                    dependencies: []
                },
                {
                    id: 'p2-f4',
                    name: 'Time log parser',
                    description: 'Parse markdown time logs into structured data',
                    priority: 'high',
                    complexity: 'medium',
                    status: 'planned',
                    dependencies: []
                },
                {
                    id: 'p2-f5',
                    name: 'Google Calendar API',
                    description: 'Fetch events, meetings, 121 counts from Google Calendar',
                    priority: 'high',
                    complexity: 'high',
                    status: 'planned',
                    dependencies: []
                },
                {
                    id: 'p2-f6',
                    name: 'ClickUp API integration',
                    description: 'Fetch all tasks, statuses, custom fields from ClickUp',
                    priority: 'high',
                    complexity: 'high',
                    status: 'planned',
                    dependencies: []
                },
                {
                    id: 'p2-f7',
                    name: 'Manual data entry forms',
                    description: 'Forms for EOS metrics, financial data, BNI stats',
                    priority: 'medium',
                    complexity: 'medium',
                    status: 'planned',
                    dependencies: []
                },
                {
                    id: 'p2-f8',
                    name: 'Data caching layer',
                    description: 'Cache strategy with 5-15 min refresh intervals',
                    priority: 'high',
                    complexity: 'medium',
                    status: 'planned',
                    dependencies: ['p2-f1', 'p2-f2', 'p2-f3', 'p2-f4', 'p2-f5', 'p2-f6']
                },
                {
                    id: 'p2-f9',
                    name: 'Error handling UI',
                    description: 'Graceful error states for failed data loads',
                    priority: 'medium',
                    complexity: 'low',
                    status: 'planned',
                    dependencies: ['p2-f8']
                }
            ]
        },
        {
            id: 'phase3',
            name: 'Phase 3: The Focus Engine',
            status: 'planned',
            features: [
                {
                    id: 'p3-f1',
                    name: 'Priority algorithm logic',
                    description: 'Decision engine to determine "What Should I Be Doing Right Now?"',
                    priority: 'critical',
                    complexity: 'high',
                    status: 'planned',
                    dependencies: ['p2-f5', 'p2-f6', 'p2-f1']
                },
                {
                    id: 'p3-f2',
                    name: 'Focus view UI',
                    description: 'Full-screen takeover with single task display',
                    priority: 'critical',
                    complexity: 'medium',
                    status: 'planned',
                    dependencies: []
                },
                {
                    id: 'p3-f3',
                    name: 'Meeting detection (now)',
                    description: 'Real-time detection of current meetings',
                    priority: 'critical',
                    complexity: 'medium',
                    status: 'planned',
                    dependencies: ['p2-f5']
                },
                {
                    id: 'p3-f4',
                    name: 'Quick action handlers',
                    description: 'Complete, snooze, skip, dismiss buttons',
                    priority: 'critical',
                    complexity: 'medium',
                    status: 'planned',
                    dependencies: []
                },
                {
                    id: 'p3-f5',
                    name: 'Context builder (Moo)',
                    description: 'AI-generated context and reasoning for priority decisions',
                    priority: 'critical',
                    complexity: 'high',
                    status: 'planned',
                    dependencies: ['p3-f1', 'p2-f1', 'p2-f5', 'p2-f6']
                },
                {
                    id: 'p3-f6',
                    name: 'Snooze system',
                    description: 'Defer tasks for 30min/1hr/2hr/tomorrow',
                    priority: 'medium',
                    complexity: 'medium',
                    status: 'planned',
                    dependencies: []
                },
                {
                    id: 'p3-f7',
                    name: 'Next-in-queue display',
                    description: 'Show next 3 tasks after current priority',
                    priority: 'medium',
                    complexity: 'low',
                    status: 'planned',
                    dependencies: ['p3-f1']
                },
                {
                    id: 'p3-f8',
                    name: 'Time estimation',
                    description: 'Estimate task completion time based on historical data',
                    priority: 'low',
                    complexity: 'low',
                    status: 'planned',
                    dependencies: ['p2-f4']
                }
            ]
        },
        {
            id: 'phase4',
            name: 'Phase 4: Input & Feedback UI',
            status: 'planned',
            features: [
                {
                    id: 'p4-f1',
                    name: 'Task completion form',
                    description: 'Log time spent, notes, outcome when completing tasks',
                    priority: 'high',
                    complexity: 'medium',
                    status: 'planned',
                    dependencies: ['p3-f4']
                },
                {
                    id: 'p4-f2',
                    name: 'Time entry UI',
                    description: 'Quick log interface for time tracking',
                    priority: 'high',
                    complexity: 'medium',
                    status: 'planned',
                    dependencies: ['p2-f4']
                },
                {
                    id: 'p4-f3',
                    name: 'Write to time log file',
                    description: 'Append entries to daily markdown time logs',
                    priority: 'high',
                    complexity: 'medium',
                    status: 'planned',
                    dependencies: []
                },
                {
                    id: 'p4-f4',
                    name: 'Meeting feedback form',
                    description: 'Rate meetings, log outcomes, create followups',
                    priority: 'medium',
                    complexity: 'medium',
                    status: 'planned',
                    dependencies: ['p2-f5']
                },
                {
                    id: 'p4-f5',
                    name: 'Quick task creation',
                    description: 'Single-line task creation with smart defaults',
                    priority: 'medium',
                    complexity: 'low',
                    status: 'planned',
                    dependencies: ['p2-f6']
                },
                {
                    id: 'p4-f6',
                    name: 'Voice input (future)',
                    description: 'Voice-to-text for task creation and notes',
                    priority: 'low',
                    complexity: 'high',
                    status: 'idea',
                    dependencies: []
                }
            ]
        },
        {
            id: 'phase5',
            name: 'Phase 5: Write Capabilities',
            status: 'planned',
            features: [
                {
                    id: 'p5-f1',
                    name: 'Calendar event creation',
                    description: 'Create Google Calendar events from dashboard',
                    priority: 'high',
                    complexity: 'high',
                    status: 'planned',
                    dependencies: ['p2-f5']
                },
                {
                    id: 'p5-f2',
                    name: 'ClickUp task creation',
                    description: 'Create new tasks via ClickUp API',
                    priority: 'high',
                    complexity: 'medium',
                    status: 'planned',
                    dependencies: ['p2-f6']
                },
                {
                    id: 'p5-f3',
                    name: 'ClickUp task updates',
                    description: 'Update task status, dates, assignees, comments',
                    priority: 'medium',
                    complexity: 'medium',
                    status: 'planned',
                    dependencies: ['p2-f6']
                },
                {
                    id: 'p5-f4',
                    name: 'CRM interaction logging',
                    description: 'Log new interactions to interactions.json',
                    priority: 'medium',
                    complexity: 'medium',
                    status: 'planned',
                    dependencies: []
                },
                {
                    id: 'p5-f5',
                    name: 'CRM contact creation',
                    description: 'Add new contacts to contacts.json',
                    priority: 'medium',
                    complexity: 'low',
                    status: 'planned',
                    dependencies: []
                },
                {
                    id: 'p5-f6',
                    name: 'OpenClaw relay setup',
                    description: 'WebSocket/HTTP relay for dashboard to send write commands to agent',
                    priority: 'critical',
                    complexity: 'high',
                    status: 'planned',
                    dependencies: []
                },
                {
                    id: 'p5-f7',
                    name: 'File write validation',
                    description: 'Agent validates and enriches data before writing',
                    priority: 'medium',
                    complexity: 'medium',
                    status: 'planned',
                    dependencies: ['p5-f6']
                },
                {
                    id: 'p5-f8',
                    name: 'Git auto-commit on write',
                    description: 'Automatically commit and push changes after file writes',
                    priority: 'medium',
                    complexity: 'low',
                    status: 'planned',
                    dependencies: ['p5-f6']
                }
            ]
        },
        {
            id: 'phase6',
            name: 'Phase 6: Polish & Advanced Features',
            status: 'idea',
            features: [
                {
                    id: 'p6-f1',
                    name: 'Browser notifications',
                    description: 'Push notifications for meetings, alerts, tasks',
                    priority: 'low',
                    complexity: 'low',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'p6-f2',
                    name: 'Keyboard shortcuts',
                    description: 'Hotkeys for navigation and quick actions',
                    priority: 'low',
                    complexity: 'low',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'p6-f3',
                    name: 'PWA install prompt',
                    description: 'Progressive Web App installation',
                    priority: 'low',
                    complexity: 'low',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'p6-f4',
                    name: 'Offline mode',
                    description: 'Service worker for offline data access',
                    priority: 'low',
                    complexity: 'high',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'p6-f5',
                    name: 'Time tracking analytics',
                    description: 'Advanced analytics and trends from time logs',
                    priority: 'low',
                    complexity: 'medium',
                    status: 'idea',
                    dependencies: ['p2-f4']
                },
                {
                    id: 'p6-f6',
                    name: 'Voice commands',
                    description: 'Voice control for common actions',
                    priority: 'low',
                    complexity: 'high',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'p6-f7',
                    name: 'Gmail integration',
                    description: 'Inbox triage and email management',
                    priority: 'low',
                    complexity: 'high',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'p6-f8',
                    name: 'Predictive scheduling',
                    description: 'ML-based suggestions for optimal task timing',
                    priority: 'low',
                    complexity: 'very-high',
                    status: 'idea',
                    dependencies: []
                }
            ]
        },
        {
            id: 'backlog',
            name: 'Ideas Backlog',
            status: 'idea',
            features: [
                {
                    id: 'idea-1',
                    name: 'Habit tracking',
                    description: 'Daily push-ups, dog walks, meal prep, sleep quality',
                    priority: 'low',
                    complexity: 'low',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'idea-2',
                    name: 'Energy level tracking',
                    description: 'Correlate energy with productivity patterns',
                    priority: 'low',
                    complexity: 'medium',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'idea-3',
                    name: 'Focus mode',
                    description: 'Block distracting websites during deep work',
                    priority: 'low',
                    complexity: 'medium',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'idea-4',
                    name: 'Pomodoro timer',
                    description: 'Integrated with time tracking',
                    priority: 'low',
                    complexity: 'low',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'idea-5',
                    name: 'Weekly review automation',
                    description: 'Auto-generated summary of accomplishments and gaps',
                    priority: 'medium',
                    complexity: 'medium',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'idea-6',
                    name: 'Delegation tracker',
                    description: 'Track tasks assigned to team members with followup reminders',
                    priority: 'medium',
                    complexity: 'medium',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'idea-7',
                    name: 'Client satisfaction score',
                    description: 'Track NPS or simple ratings per client',
                    priority: 'medium',
                    complexity: 'low',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'idea-8',
                    name: 'Referral source attribution',
                    description: 'Which BNI members send the best leads?',
                    priority: 'medium',
                    complexity: 'medium',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'idea-9',
                    name: 'Meeting cost calculator',
                    description: 'Show dollar value of time spent in meetings',
                    priority: 'low',
                    complexity: 'low',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'idea-10',
                    name: 'Smart batching',
                    description: 'Group similar tasks together (sales calls, admin work)',
                    priority: 'medium',
                    complexity: 'high',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'idea-11',
                    name: 'Context switching penalty',
                    description: 'Warn when jumping between very different task types',
                    priority: 'low',
                    complexity: 'medium',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'idea-12',
                    name: 'Network map visualization',
                    description: 'Visualize BNI connections and referral paths',
                    priority: 'low',
                    complexity: 'high',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'idea-13',
                    name: 'Client gifting tracker',
                    description: 'Track birthdays, anniversaries, thank-you gifts',
                    priority: 'low',
                    complexity: 'low',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'idea-14',
                    name: 'Testimonial collector',
                    description: 'Request and store client reviews',
                    priority: 'medium',
                    complexity: 'low',
                    status: 'idea',
                    dependencies: []
                },
                {
                    id: 'idea-15',
                    name: 'Pricing calculator',
                    description: 'Quote generator for proposals',
                    priority: 'medium',
                    complexity: 'medium',
                    status: 'idea',
                    dependencies: []
                }
            ]
        }
    ]
};
