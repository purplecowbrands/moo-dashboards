// Sales Pipeline Dashboard
import { sampleData } from '../../data/sample-data.js';
import { getCalendarData } from '../data-loader.js';

let salesViewState = null;

const EVENT_TYPES = ['121', 'event', 'other'];

function getWeekStart(dateInput) {
    const date = new Date(dateInput);
    const day = date.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diffToMonday);
    date.setHours(0, 0, 0, 0);
    return date;
}

function formatWeekLabel(weekStart) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startLabel} - ${endLabel}`;
}

function detectEventType(title) {
    const normalized = title.toLowerCase();

    const is121 = normalized.includes('121') ||
        normalized.includes('1:1') ||
        normalized.includes('1-1') ||
        normalized.includes('one-on-one') ||
        normalized.includes('bni 1-1') ||
        normalized.includes('1 on 1');

    if (is121) return '121';

    if (
        normalized.includes('network') ||
        normalized.includes('bni') ||
        normalized.includes('mixer') ||
        normalized.includes('lunch') ||
        normalized.includes('discovery') ||
        normalized.includes('meeting')
    ) {
        return 'event';
    }

    return 'other';
}

function cycleType(type) {
    const index = EVENT_TYPES.indexOf(type);
    return EVENT_TYPES[(index + 1) % EVENT_TYPES.length];
}

function buildWeekData(calendarData, sales) {
    if (!calendarData?.upcoming?.nextSevenDays?.length) {
        return sales.weeklyScorecard.map((week, index) => ({
            id: `sample-${index}`,
            label: week.week,
            oneOnOnes: week.count,
            events: []
        }));
    }

    const weeksMap = new Map();

    calendarData.upcoming.nextSevenDays.forEach((event) => {
        const weekStart = getWeekStart(event.start);
        const weekId = weekStart.toISOString().split('T')[0];

        if (!weeksMap.has(weekId)) {
            weeksMap.set(weekId, {
                id: weekId,
                label: formatWeekLabel(weekStart),
                weekStart,
                events: []
            });
        }

        weeksMap.get(weekId).events.push({
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            htmlLink: event.htmlLink,
            type: detectEventType(event.title)
        });
    });

    return Array.from(weeksMap.values())
        .sort((a, b) => a.weekStart - b.weekStart)
        .map((week) => ({
            ...week,
            oneOnOnes: week.events.filter((event) => event.type === '121').length
        }));
}

function renderCalendarRows() {
    const rowsContainer = document.getElementById('sales-calendar-rows');
    const weekTitle = document.getElementById('sales-selected-week-title');
    if (!rowsContainer || !salesViewState) return;

    const selectedWeek = salesViewState.weeks[salesViewState.selectedWeekIndex];
    if (!selectedWeek) {
        rowsContainer.innerHTML = '<tr><td colspan="4">No events found for this week.</td></tr>';
        return;
    }

    weekTitle.textContent = `Week of ${selectedWeek.label}`;

    if (!selectedWeek.events.length) {
        rowsContainer.innerHTML = '<tr><td colspan="4">No calendar events in this week yet.</td></tr>';
        return;
    }

    rowsContainer.innerHTML = selectedWeek.events
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .map((event, index) => {
            const start = new Date(event.start);
            const day = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const time = event.start.includes('T')
                ? start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                : 'All day';

            return `
                <tr>
                    <td>${day}</td>
                    <td>${time}</td>
                    <td>
                        ${event.htmlLink ? `<a href="${event.htmlLink}" target="_blank" rel="noopener" class="task-link">${event.title}</a>` : event.title}
                    </td>
                    <td>
                        <button class="sales-type-chip ${event.type}" data-event-index="${index}">
                            ${event.type.toUpperCase()}
                        </button>
                    </td>
                </tr>
            `;
        })
        .join('');

    rowsContainer.querySelectorAll('.sales-type-chip').forEach((button) => {
        button.addEventListener('click', () => {
            const eventIndex = Number(button.dataset.eventIndex);
            const currentType = selectedWeek.events[eventIndex].type;
            selectedWeek.events[eventIndex].type = cycleType(currentType);
            selectedWeek.oneOnOnes = selectedWeek.events.filter((event) => event.type === '121').length;

            renderScorecardButtons();
            renderCalendarRows();
        });
    });
}

function renderScorecardButtons() {
    const scorecard = document.getElementById('sales-week-scorecard');
    if (!scorecard || !salesViewState) return;

    scorecard.innerHTML = salesViewState.weeks.map((week, index) => `
        <button class="week-score-btn ${index === salesViewState.selectedWeekIndex ? 'active' : ''}" data-week-index="${index}">
            <span class="week-label">${week.label}</span>
            <span class="week-count">${week.oneOnOnes} / ${salesViewState.weeklyTarget}</span>
        </button>
    `).join('');

    scorecard.querySelectorAll('.week-score-btn').forEach((button) => {
        button.addEventListener('click', () => {
            salesViewState.selectedWeekIndex = Number(button.dataset.weekIndex);
            renderScorecardButtons();
            renderCalendarRows();
        });
    });
}

export function initSales() {
    if (!salesViewState) return;
    renderScorecardButtons();
    renderCalendarRows();
}

// Async rendering function for calendar integration
export async function renderSalesAsync() {
    const calendarData = await getCalendarData();
    const { sales } = sampleData;

    const hasCalendarData = calendarData !== null;
    const weeks = buildWeekData(calendarData, sales);
    const selectedWeekIndex = weeks.length > 0 ? 0 : -1;
    const selectedWeek = selectedWeekIndex >= 0 ? weeks[selectedWeekIndex] : null;

    const oneOnOneMeetingsThisWeek = selectedWeek ? selectedWeek.oneOnOnes : sales.currentWeek;
    const weeklyTarget = sales.weeklyTarget;
    const progressPercent = (oneOnOneMeetingsThisWeek / weeklyTarget) * 100;

    salesViewState = {
        weeklyTarget,
        selectedWeekIndex,
        weeks
    };

    return `
        <div class="page-header">
            <h2>Sales Pipeline</h2>
            <p>Weekly 121 tracking with calendar-level event correction</p>
            <div class="data-status" style="margin-top: 10px;">
                <span class="badge ${hasCalendarData ? 'success' : 'warning'}">${hasCalendarData ? 'Live Data' : 'Sample Data'}</span>
                ${hasCalendarData ? '<span style="margin-left: 10px; font-size: 0.9em; color: var(--text-secondary);">Click week cards, then re-tag events as 121/Event/Other</span>' : ''}
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-icon ${oneOnOneMeetingsThisWeek >= weeklyTarget ? 'success' : 'warning'}">
                        <i data-lucide="phone-call"></i>
                    </div>
                    <div class="stat-label">121s in Selected Week</div>
                </div>
                <div class="stat-value">${oneOnOneMeetingsThisWeek}</div>
                <div class="stat-meta">Target: ${weeklyTarget}/week</div>
                <div class="progress">
                    <div class="progress-bar ${oneOnOneMeetingsThisWeek >= weeklyTarget ? 'success' : 'warning'}" style="width: ${Math.min(progressPercent, 100)}%"></div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="calendar-days"></i>
                </div>
                <div class="stat-label">Events in Selected Week</div>
                <div class="stat-value">${selectedWeek?.events.length || 0}</div>
                <div class="stat-meta">Color coded by type</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon success">
                    <i data-lucide="trophy"></i>
                </div>
                <div class="stat-label">Closed Won</div>
                <div class="stat-value">${sales.pipeline.find(s => s.stage === 'Closed Won').count}</div>
                <div class="stat-meta">This period</div>
            </div>
        </div>

        <div class="card" style="margin-bottom: var(--spacing-lg);">
            <div class="card-header">
                <h3 class="card-title">Weekly 121 Scorecard</h3>
            </div>
            <div class="card-body">
                <div id="sales-week-scorecard" class="week-score-grid"></div>
            </div>
        </div>

        <div class="card" style="margin-bottom: var(--spacing-lg);">
            <div class="card-header">
                <h3 class="card-title" id="sales-selected-week-title">Weekly Calendar</h3>
                <div class="sales-type-legend">
                    <span class="sales-type-dot type-121">121</span>
                    <span class="sales-type-dot type-event">Event</span>
                    <span class="sales-type-dot type-other">Other</span>
                </div>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Day</th>
                                <th>Time</th>
                                <th>Event</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody id="sales-calendar-rows">
                            <tr><td colspan="4">Loading week events...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Recent Deals</h3>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Deal</th>
                                <th>Status</th>
                                <th>Last Activity</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sales.recentDeals.map(deal => `
                                <tr>
                                    <td>${deal.name}</td>
                                    <td><span class="badge ${deal.status.toLowerCase() === 'closed' ? 'success' : 'info'}">${deal.status}</span></td>
                                    <td>${deal.lastActivity}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// Legacy sync function - returns loading state, actual render happens async
export function renderSales() {
    return `
        <div class="page-header">
            <h2>Sales Pipeline</h2>
            <p>Loading calendar data...</p>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="loader"></i>
                </div>
                <div class="stat-label">Loading...</div>
                <div class="stat-value">-</div>
            </div>
        </div>
    `;
}
