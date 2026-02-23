// Sample Data for Dashboards
// Based on real schemas from workspace files

export const sampleData = {
    // Sales Pipeline Data
    sales: {
        weeklyTarget: 6,
        currentWeek: 4,
        weeklyScorecard: [
            { week: 'W1', count: 7, target: 6 },
            { week: 'W2', count: 5, target: 6 },
            { week: 'W3', count: 6, target: 6 },
            { week: 'W4', count: 4, target: 6 }
        ],
        pipeline: [
            { stage: 'New Leads', count: 12, value: 48000 },
            { stage: 'Contacted', count: 8, value: 32000 },
            { stage: 'Qualified', count: 5, value: 20000 },
            { stage: 'Proposal Sent', count: 3, value: 12000 },
            { stage: 'Closed Won', count: 2, value: 8000 }
        ],
        recentDeals: [
            { name: 'Creating Community | Addison Duckworth', status: 'backlog', lastActivity: '2026-01-28' },
            { name: 'Realtor going independent | Abby', status: 'Closed', lastActivity: '2026-01-22' }
        ]
    },

    // EOS Scorecard
    eos: {
        metrics: [
            { name: 'Weekly 121s', target: 6, actual: 4, status: 'warning' },
            { name: 'New Prospects', target: 3, actual: 5, status: 'success' },
            { name: 'Proposals Sent', target: 2, actual: 1, status: 'error' },
            { name: 'Client Check-ins', target: 5, actual: 6, status: 'success' },
            { name: 'Blog Posts', target: 1, actual: 0, status: 'error' },
            { name: 'Revenue ($k)', target: 24, actual: 19, status: 'warning' }
        ]
    },

    // CRM Data
    crm: {
        totalContacts: 116675,
        recentInteractions: [
            { contactName: 'Mantas Auk', type: 'text', date: '2026-02-19', notes: 'Personalized outreach text referencing Vicki Gouge recommendation' },
            { contactName: 'Anthony Omini', type: 'text', date: '2026-02-19', notes: 'Mentioned wanting to discuss US phone for VA + referrals' },
            { contactName: 'John Laverde', type: 'text', date: '2026-02-19', notes: 'Pitched fellow web designer referral exchange' }
        ],
        introductions: {
            pending: 0,
            completed: 0
        },
        topContacts: [
            { name: 'Aaron Hale', company: 'White Horse Painting', calendarEvents: 5, connections: 5 },
            { name: 'Adrian Munoz Contreras', company: 'Car Detailer', calendarEvents: 5, connections: 5 },
            { name: 'AJ Stevenson', company: 'PreventPro', calendarEvents: 1, connections: 5 }
        ]
    },

    // Client Health
    clients: {
        total: 32,
        byPlatform: {
            framer: 19,
            wordpress: 10,
            shopify: 3
        },
        health: [
            { name: 'purplecowbrands.com', status: 'healthy', platform: 'framer', lastUpdate: '2026-02-20', mrr: 500 },
            { name: 'meadowsgaragedoors.com', status: 'healthy', platform: 'framer', lastUpdate: '2026-02-19', mrr: 350 },
            { name: 'wacohealingroom.com', status: 'attention', platform: 'framer', lastUpdate: '2026-01-15', mrr: 200 },
            { name: 'smcworldwide.net', status: 'healthy', platform: 'shopify', lastUpdate: '2026-02-18', mrr: 450 }
        ],
        upsellOpportunities: [
            { client: 'wacohealingroom.com', opportunity: 'SEO Package', potential: 300 },
            { client: 'hdnbc.org', opportunity: 'Blog Management', potential: 200 }
        ]
    },

    // Site Monitoring
    monitoring: {
        totalSites: 32,
        lastCheck: '2026-02-22 03:00 AM',
        status: {
            up: 30,
            down: 1,
            warning: 1
        },
        alerts: [
            { site: 'republicoftexasnation.com', issue: 'Slow response time', severity: 'warning', detected: '2026-02-21' }
        ],
        recentChecks: [
            { site: 'purplecowbrands.com', status: 'up', responseTime: 245 },
            { site: 'meadowsgaragedoors.com', status: 'up', responseTime: 312 },
            { site: 'wacohealingroom.com', status: 'up', responseTime: 198 },
            { site: 'republicoftexasnation.com', status: 'warning', responseTime: 2340 }
        ]
    },

    // Time Tracking
    time: {
        today: {
            total: 24.0,
            sleep: 9.5,
            work: 0.5,
            personal: 8.0,
            break: 6.0
        },
        week: {
            totalWork: 28.5,
            totalPersonal: 42.0,
            totalSleep: 56.0,
            totalBreak: 35.5
        },
        categories: [
            { name: 'Sleep', hours: 56.0, percentage: 33.3 },
            { name: 'Work', hours: 28.5, percentage: 17.0 },
            { name: 'Personal', hours: 42.0, percentage: 25.0 },
            { name: 'Break', hours: 35.5, percentage: 21.1 }
        ],
        recentEntries: [
            { date: '2026-02-22', category: 'Work', description: 'Client calls + proposals', hours: 4.5 },
            { date: '2026-02-22', category: 'Personal', description: 'Meal prep + dog walk', hours: 3.0 },
            { date: '2026-02-21', category: 'Work', description: 'BNI meeting + followups', hours: 6.0 }
        ]
    },

    // BNI Metrics
    bni: {
        chapter: 'Preston Center',
        memberCount: 42,
        visitorCount: 8,
        referralsPending: 3,
        referralsGiven: 12,
        referralsReceived: 7,
        attendance: {
            lastMonth: 85,
            thisMonth: 90
        },
        oneOnOnes: {
            thisWeek: 4,
            target: 6
        }
    },

    // Financial Overview
    financial: {
        revenue: {
            current: 142000,
            target: 285000,
            percentage: 49.8
        },
        mrr: {
            current: 12500,
            target: 25000,
            percentage: 50.0
        },
        monthlyRevenue: [
            { month: 'Jan', revenue: 18000 },
            { month: 'Feb', revenue: 22000 },
            { month: 'Mar', revenue: 19000 },
            { month: 'Apr', revenue: 24000 },
            { month: 'May', revenue: 21000 },
            { month: 'Jun', revenue: 23000 }
        ],
        expenses: {
            payroll: 8500,
            tools: 1200,
            marketing: 800,
            overhead: 600
        }
    },

    // Task Overview
    tasks: {
        overdue: 5,
        dueToday: 8,
        upcoming: 23,
        byCategory: [
            { category: 'Sales', count: 12 },
            { category: 'Client Work', count: 15 },
            { category: 'BNI Followups', count: 6 },
            { category: 'Admin', count: 3 }
        ],
        recentTasks: [
            { title: 'Follow up with Creating Community', status: 'overdue', dueDate: '2026-02-20', category: 'Sales' },
            { title: 'Update hdnbc.org blog', status: 'due-today', dueDate: '2026-02-22', category: 'Client Work' },
            { title: 'Send proposal to new lead', status: 'upcoming', dueDate: '2026-02-24', category: 'Sales' }
        ]
    },

    // Kitchen/Meal Prep
    kitchen: {
        currentWeek: {
            recipes: [
                { name: 'No-Bean Chili', effort: 'easy' },
                { name: 'Coconut Lime Chicken Curry', effort: 'easy' }
            ],
            prepDate: '2026-02-22'
        },
        nextWeek: {
            recipes: [
                { name: 'Taco Beef Bowls', effort: 'easy' },
                { name: 'Greek Beef & Potato Skillet', effort: 'normal' }
            ]
        },
        inventory: {
            proteins: [
                { item: 'Ground beef (1 lb packs)', quantity: '22 lbs' },
                { item: 'Chicken wings', quantity: '5 lbs' },
                { item: 'Organ pate packets', quantity: '8 x 8oz' }
            ],
            pantry: [
                { item: 'Rice (organic white)', quantity: '10-15 lbs' },
                { item: 'Coconut milk (canned)', quantity: '6 cans' },
                { item: 'Diced tomatoes', quantity: '0 cans (need restock)' }
            ],
            fridge: [
                { item: 'Eggs (pasture raised)', quantity: '40' },
                { item: 'Yellow onions', quantity: '2' },
                { item: 'Organic bananas', quantity: '3 lbs' }
            ]
        },
        shoppingList: [
            'Diced tomatoes (organic, 3+ cans)',
            'Fresh ginger',
            'Mushrooms (bella, 1.5 lbs)'
        ]
    }
};
