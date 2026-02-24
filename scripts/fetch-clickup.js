#!/usr/bin/env node

/**
 * Fetch ClickUp tasks for Ben Porter
 * Outputs to data/clickup-tasks.json
 * 
 * Filters:
 * - Assigned to Ben (43195233)
 * - Excludes completed/archived statuses
 * - Includes all active lists (Moo Inbox, BNI Followups, etc.)
 */

const fs = require('fs');
const path = require('path');

const API_TOKEN = 'pk_94210091_QTUSFLES2AC62TZM99KGSJ86NBFR0NYZ';
const TEAM_ID = '9014754983';
const BEN_USER_ID = '43195233';

// Status filters - exclude completed work
const EXCLUDED_STATUSES = ['data', 'done', 'closed', 'completed', 'archived', 'cancelled'];

async function fetchClickUpTasks() {
    const headers = {
        'Authorization': API_TOKEN,
        'Content-Type': 'application/json'
    };

    try {
        // Fetch all of Ben's tasks from team endpoint
        // This gets tasks across all lists he has access to
        let allTasks = [];
        let page = 0;
        let hasMore = true;

        while (hasMore) {
            const url = `https://api.clickup.com/api/v2/team/${TEAM_ID}/task?assignees[]=${BEN_USER_ID}&page=${page}&subtasks=true&include_closed=false`;
            
            const response = await fetch(url, { headers });
            if (!response.ok) {
                throw new Error(`ClickUp API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.tasks || data.tasks.length === 0) {
                hasMore = false;
            } else {
                allTasks = allTasks.concat(data.tasks);
                page++;
            }
        }

        console.log(`Fetched ${allTasks.length} total tasks from ClickUp`);

        // Filter out excluded statuses (case-insensitive)
        const activeTasks = allTasks.filter(task => {
            const statusLower = task.status.status.toLowerCase();
            return !EXCLUDED_STATUSES.includes(statusLower);
        });

        console.log(`${activeTasks.length} active tasks after filtering`);

        // Categorize tasks
        const now = Date.now();
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const todayEndMs = todayEnd.getTime();

        const categorized = {
            overdue: [],
            dueToday: [],
            upcoming: [],
            noDueDate: []
        };

        activeTasks.forEach(task => {
            if (task.due_date) {
                const dueMs = parseInt(task.due_date);
                if (dueMs < now) {
                    categorized.overdue.push(task);
                } else if (dueMs <= todayEndMs) {
                    categorized.dueToday.push(task);
                } else {
                    categorized.upcoming.push(task);
                }
            } else {
                categorized.noDueDate.push(task);
            }
        });

        // Count by category (list name)
        const byCategory = {};
        activeTasks.forEach(task => {
            const listName = task.list?.name || 'No List';
            byCategory[listName] = (byCategory[listName] || 0) + 1;
        });

        // Convert to array format for dashboard
        const categoryArray = Object.entries(byCategory)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);

        // Build output
        const output = {
            lastUpdated: new Date().toISOString(),
            summary: {
                overdue: categorized.overdue.length,
                dueToday: categorized.dueToday.length,
                upcoming: categorized.upcoming.length,
                noDueDate: categorized.noDueDate.length,
                total: activeTasks.length
            },
            byCategory: categoryArray,
            tasks: {
                overdue: categorized.overdue.map(formatTask),
                dueToday: categorized.dueToday.map(formatTask),
                upcoming: categorized.upcoming.slice(0, 20).map(formatTask), // Limit upcoming to 20
                noDueDate: categorized.noDueDate.slice(0, 10).map(formatTask) // Limit no due date to 10
            }
        };

        // Write to file
        const outputPath = path.join(__dirname, '..', 'data', 'clickup-tasks.json');
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        
        console.log(`Written to ${outputPath}`);
        console.log(`Summary: ${output.summary.overdue} overdue, ${output.summary.dueToday} due today, ${output.summary.upcoming} upcoming, ${output.summary.noDueDate} no due date`);

    } catch (error) {
        console.error('Error fetching ClickUp tasks:', error.message);
        process.exit(1);
    }
}

function formatTask(task) {
    return {
        id: task.id,
        name: task.name,
        status: task.status.status,
        priority: task.priority,
        dueDate: task.due_date ? parseInt(task.due_date) : null,
        list: task.list?.name || 'No List',
        folder: task.folder?.name || null,
        url: task.url,
        tags: task.tags?.map(t => t.name) || [],
        timeEstimate: task.time_estimate || null
    };
}

// Run if called directly
if (require.main === module) {
    fetchClickUpTasks();
}

module.exports = { fetchClickUpTasks };
