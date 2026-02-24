// Time Tracking Dashboard
import { sampleData } from '../../data/sample-data.js';
import { loadData } from '../data-loader.js';

// Helper function to render timeline view
function renderTimeline(timelineData) {
    const days = timelineData.days || [];
    const hours = Array.from({length: 24}, (_, i) => (i + 3) % 24); // 3am to 2am next day
    
    // Category colors matching the bar chart
    const categoryColors = {
        'Sleep': 'rgba(16, 185, 129, 0.8)',
        'Work': 'rgba(99, 102, 241, 0.8)',
        'Personal': 'rgba(245, 158, 11, 0.8)',
        'Break': 'rgba(236, 72, 153, 0.8)',
        'Untracked': 'rgba(156, 163, 175, 0.3)'
    };
    
    return `
        <div class="timeline-grid">
            <!-- Header row with day names -->
            <div class="timeline-header">
                <div class="timeline-time-label"></div>
                ${days.map(day => `
                    <div class="timeline-day-header">
                        <strong>${day.dayName}</strong>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">${day.date}</div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Hour rows -->
            ${hours.map(hour => `
                <div class="timeline-row">
                    <div class="timeline-time-label">
                        ${hour === 0 ? '12am' : hour < 12 ? hour + 'am' : hour === 12 ? '12pm' : (hour - 12) + 'pm'}
                    </div>
                    ${days.map(day => {
                        const blocks = (day.blocks || []).filter(b => {
                            const blockHour = parseInt(b.startTime.split(':')[0]);
                            return blockHour === hour;
                        });
                        
                        return `
                            <div class="timeline-cell">
                                ${blocks.map(block => `
                                    <div class="timeline-block" 
                                         style="background: ${categoryColors[block.category] || categoryColors['Untracked']}; 
                                                height: ${(block.durationMinutes / 60) * 100}%;"
                                         title="${block.category}: ${block.description || ''} (${block.startTime} - ${block.endTime})">
                                    </div>
                                `).join('')}
                            </div>
                        `;
                    }).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

export async function renderTime() {
    // Try to load live data, fallback to sample data
    const liveData = await loadData('/data/time-data.json');
    const time = liveData || sampleData.time;
    const isLive = !!liveData;

    return `
        <div class="page-header">
            <h2>Time Tracking</h2>
            <p>Daily logs visualized by category, weekly breakdown, and trends</p>
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

        <!-- NEW: Weekly Bar Chart -->
        ${time.dailyBreakdown ? `
            <div class="card" style="margin-top: var(--spacing-lg);">
                <div class="card-header">
                    <h3 class="card-title">Weekly Time Breakdown (by Day)</h3>
                </div>
                <div class="card-body">
                    <div class="chart-container" style="position: relative; height: 320px;">
                        <canvas id="weeklyBarChart"></canvas>
                    </div>
                    <div class="chart-legend" style="display: flex; justify-content: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 16px; height: 16px; background: rgba(16, 185, 129, 0.8); border-radius: 3px;"></div>
                            <span style="font-size: 0.875rem;">Sleep</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 16px; height: 16px; background: rgba(99, 102, 241, 0.8); border-radius: 3px;"></div>
                            <span style="font-size: 0.875rem;">Work</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 16px; height: 16px; background: rgba(245, 158, 11, 0.8); border-radius: 3px;"></div>
                            <span style="font-size: 0.875rem;">Personal</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 16px; height: 16px; background: rgba(236, 72, 153, 0.8); border-radius: 3px;"></div>
                            <span style="font-size: 0.875rem;">Break</span>
                        </div>
                    </div>
                </div>
            </div>
            <script>
                (function() {
                    const ctx = document.getElementById('weeklyBarChart');
                    if (ctx && window.Chart) {
                        const dailyData = ${JSON.stringify(time.dailyBreakdown)};
                        
                        new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: dailyData.map(d => d.dayName),
                                datasets: [
                                    {
                                        label: 'Sleep',
                                        data: dailyData.map(d => d.sleep),
                                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                                        borderWidth: 0
                                    },
                                    {
                                        label: 'Work',
                                        data: dailyData.map(d => d.work),
                                        backgroundColor: 'rgba(99, 102, 241, 0.8)',
                                        borderWidth: 0
                                    },
                                    {
                                        label: 'Personal',
                                        data: dailyData.map(d => d.personal),
                                        backgroundColor: 'rgba(245, 158, 11, 0.8)',
                                        borderWidth: 0
                                    },
                                    {
                                        label: 'Break',
                                        data: dailyData.map(d => d.break),
                                        backgroundColor: 'rgba(236, 72, 153, 0.8)',
                                        borderWidth: 0
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    x: {
                                        stacked: true,
                                        grid: {
                                            display: false
                                        }
                                    },
                                    y: {
                                        stacked: true,
                                        beginAtZero: true,
                                        max: 24,
                                        ticks: {
                                            stepSize: 4,
                                            callback: function(value) {
                                                return value + 'h';
                                            }
                                        },
                                        grid: {
                                            color: 'rgba(107, 114, 128, 0.1)'
                                        }
                                    }
                                },
                                plugins: {
                                    legend: {
                                        display: false
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: function(context) {
                                                return context.dataset.label + ': ' + context.parsed.y + 'h';
                                            },
                                            footer: function(items) {
                                                const total = items.reduce((sum, item) => sum + item.parsed.y, 0);
                                                return 'Total: ' + total.toFixed(1) + 'h';
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }
                })();
            </script>
        ` : ''}

        <!-- NEW: Weekly Timeline View (3am-3am blocks) -->
        ${time.timeline ? `
            <div class="card" style="margin-top: var(--spacing-lg);">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="card-title">Weekly Timeline</h3>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button id="prevWeek" class="btn btn-sm" style="padding: 0.25rem 0.75rem;">← Prev</button>
                        <span id="currentWeekLabel" style="font-size: 0.875rem; min-width: 140px; text-align: center;">This Week</span>
                        <button id="nextWeek" class="btn btn-sm" style="padding: 0.25rem 0.75rem;">Next →</button>
                        <div style="border-left: 1px solid var(--border-color); height: 24px; margin: 0 0.5rem;"></div>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer;">
                            <input type="checkbox" id="showCalendarOverlay" style="cursor: pointer;">
                            <span>Show Calendar Events</span>
                        </label>
                    </div>
                </div>
                <div class="card-body" style="overflow-x: auto;">
                    <div id="timelineView" style="min-width: 900px;">
                        ${renderTimeline(time.timeline)}
                    </div>
                </div>
            </div>
        ` : ''}

        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Time Distribution (This Week)</h3>
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

// Initialize time tracking page interactions
export function initTime() {
    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    const calendarOverlayCheckbox = document.getElementById('showCalendarOverlay');
    const currentWeekLabel = document.getElementById('currentWeekLabel');
    
    // Week navigation (placeholder - will connect to real data later)
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            console.log('Navigate to previous week');
            // TODO: Fetch previous week's time data
            alert('Previous week navigation - will load historical time data when connected to real data source');
        });
    }
    
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            console.log('Navigate to next week');
            // TODO: Check if future week or fetch next historical week
            alert('Next week navigation - will show future calendar events or next historical week');
        });
    }
    
    // Calendar overlay toggle
    if (calendarOverlayCheckbox) {
        calendarOverlayCheckbox.addEventListener('change', (e) => {
            const timelineView = document.getElementById('timelineView');
            if (e.target.checked) {
                console.log('Show calendar events overlay');
                // TODO: Fetch calendar events and overlay them on timeline
                alert('Calendar overlay - will fetch Google Calendar events and display them on the timeline when API is connected');
            } else {
                console.log('Hide calendar events overlay');
                // Remove calendar overlay elements if any
                const overlays = timelineView?.querySelectorAll('.calendar-event-overlay');
                overlays?.forEach(el => el.remove());
            }
        });
    }
}
