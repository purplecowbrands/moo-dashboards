// Roadmap Dashboard - Kanban Board for Feature Planning
import { roadmapFeatures, architectureCategories } from '../../data/roadmap-data.js';

const STATUS = {
    IDEA: 'idea',
    BACKLOG: 'backlog',
    BUILDING: 'buildingNext',
    REVIEW: 'review',
    COMPLETE: 'complete',
    BLOCKED: 'blocked'
};

const ROADMAP_STATE_KEY = 'moo-roadmap-state';
const PENDING_EVENTS_KEY = 'moo-roadmap-pending-events';
const API_BASE = window.MOO_FEEDBACK_API || localStorage.getItem('moo-feedback-api') || ''; // ex: https://moo-feedback-api.<subdomain>.workers.dev
let backendBootstrapped = false;

function getDefaultState() {
    const state = {};
    roadmapFeatures.forEach(f => {
        state[f.id] = {
            status: f.status,
            notes: '',
            rejected: false,
            buildNow: false,
            reviewComment: ''
        };
    });
    return state;
}

function loadState() {
    const stored = localStorage.getItem(ROADMAP_STATE_KEY);
    if (stored) {
        try {
            return { ...getDefaultState(), ...JSON.parse(stored) };
        } catch (e) {
            console.error('Failed to parse roadmap state:', e);
        }
    }
    return getDefaultState();
}

function saveState(state) {
    localStorage.setItem(ROADMAP_STATE_KEY, JSON.stringify(state));
}

function loadPendingEvents() {
    const stored = localStorage.getItem(PENDING_EVENTS_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

function savePendingEvents(events) {
    localStorage.setItem(PENDING_EVENTS_KEY, JSON.stringify(events));
}

function enqueuePendingEvent(event) {
    const queue = loadPendingEvents();
    queue.push(event);
    savePendingEvents(queue);
}

async function postEvent(event) {
    if (!API_BASE) return false;

    const response = await fetch(`${API_BASE}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
    });

    return response.ok;
}

async function flushPendingEvents() {
    if (!API_BASE) return;

    const queue = loadPendingEvents();
    if (queue.length === 0) return;

    const unsent = [];
    for (const evt of queue) {
        try {
            const ok = await postEvent(evt);
            if (!ok) unsent.push(evt);
        } catch {
            unsent.push(evt);
        }
    }

    savePendingEvents(unsent);
}

async function syncEvent(featureId, patch, eventType) {
    const event = {
        module: 'roadmap',
        actionType: eventType,
        entityType: 'feature',
        entityId: featureId,
        payload: patch,
        source: 'dashboard-ui',
        clientTimestamp: new Date().toISOString(),
        requiresAttention: Number(eventType === 'review_comment_updated' || eventType === 'changes_requested' || eventType === 'note_updated')
    };

    try {
        const ok = await postEvent(event);
        if (!ok) enqueuePendingEvent(event);
    } catch {
        enqueuePendingEvent(event);
    }
}

async function bootstrapFromBackend() {
    if (backendBootstrapped || !API_BASE) return;
    backendBootstrapped = true;

    try {
        const response = await fetch(`${API_BASE}/api/state/roadmap`);
        if (!response.ok) return;
        const data = await response.json();
        if (!Array.isArray(data?.items)) return;

        const backendState = {};
        for (const item of data.items) {
            if (item.entityType === 'feature' && item.entityId) {
                backendState[item.entityId] = item.state || {};
            }
        }

        const merged = {
            ...getDefaultState(),
            ...backendState,
            ...loadState()
        };
        saveState(merged);
        await flushPendingEvents();
        renderPage();
    } catch (err) {
        console.warn('Backend bootstrap failed, using local fallback only.', err);
    }
}

function getFeatureState(featureId) {
    const state = loadState();
    const fallback = roadmapFeatures.find(f => f.id === featureId);
    return {
        ...(state[featureId] || {}),
        status: state[featureId]?.status || fallback?.status || STATUS.IDEA
    };
}

function getViewMode() {
    return localStorage.getItem('moo-roadmap-view') || 'production';
}

function setViewMode(mode) {
    localStorage.setItem('moo-roadmap-view', mode);
}

function getCategoryFilter() {
    return localStorage.getItem('moo-roadmap-category-filter') || '';
}

function setCategoryFilter(category) {
    localStorage.setItem('moo-roadmap-category-filter', category);
}

function getCompleteCollapsed() {
    return localStorage.getItem('moo-roadmap-complete-collapsed') === 'true';
}

function setCompleteCollapsed(collapsed) {
    localStorage.setItem('moo-roadmap-complete-collapsed', collapsed.toString());
}

function updateFeatureState(featureId, patch, eventType = 'state_updated') {
    const state = loadState();
    state[featureId] = {
        ...(state[featureId] || {}),
        ...patch,
        updatedAt: new Date().toISOString()
    };
    saveState(state);
    syncEvent(featureId, patch, eventType);
}

function moveFeature(featureId, newStatus) {
    const current = getFeatureState(featureId);
    const patch = { status: newStatus };

    if (newStatus !== STATUS.BUILDING) {
        patch.buildNow = false;
    }

    if (newStatus === STATUS.REVIEW) {
        patch.reviewEnteredAt = new Date().toISOString();
    }

    if (newStatus === STATUS.COMPLETE) {
        patch.reviewDecision = 'approved';
        patch.reviewCompletedAt = new Date().toISOString();
    }

    if (current.status === STATUS.REVIEW && newStatus === STATUS.BACKLOG) {
        patch.reviewDecision = 'changes-requested';
    }

    updateFeatureState(featureId, patch, 'status_changed');
    renderPage();
}

function markBuildNow(featureId) {
    updateFeatureState(featureId, {
        status: STATUS.BUILDING,
        buildNow: true,
        buildNowAt: new Date().toISOString()
    }, 'build_now');
    renderPage();
}

function rejectFeature(featureId) {
    updateFeatureState(featureId, {
        rejected: true
    }, 'feature_rejected');
    renderPage();
}

function updateNotes(featureId, notes) {
    updateFeatureState(featureId, {
        notes: notes.trim()
    }, 'note_updated');
}

function updateReviewComment(featureId, comment) {
    updateFeatureState(featureId, {
        reviewComment: comment.trim()
    }, 'review_comment_updated');
}

function approveReview(featureId) {
    const current = getFeatureState(featureId);
    updateFeatureState(featureId, {
        status: STATUS.COMPLETE,
        reviewDecision: 'approved',
        reviewCompletedAt: new Date().toISOString(),
        reviewComment: current.reviewComment || ''
    }, 'review_approved');
    renderPage();
}

function requestChanges(featureId) {
    const current = getFeatureState(featureId);
    updateFeatureState(featureId, {
        status: STATUS.BACKLOG,
        buildNow: false,
        reviewDecision: 'changes-requested',
        reviewRequestedAt: new Date().toISOString(),
        reviewComment: current.reviewComment || ''
    }, 'changes_requested');
    renderPage();
}

function getCategoryBadge(category) {
    const categoryName = architectureCategories[category] || 'Unknown';
    const colors = {
        foundation: 'var(--text-tertiary)',
        dataConnections: '#3b82f6',
        focusEngine: '#8b5cf6',
        dashboardUI: '#10b981',
        inputFeedback: '#f59e0b',
        writeCapabilities: '#ef4444',
        polish: '#ec4899'
    };
    const color = colors[category] || 'var(--text-secondary)';
    return `<span class="category-badge" style="background: ${color}20; color: ${color}; border: 1px solid ${color}40;">${categoryName}</span>`;
}

function renderBuildQueue(features, state) {
    const candidates = features
        .filter(f => {
            const s = state[f.id]?.status || f.status;
            return s === STATUS.BUILDING || s === STATUS.BACKLOG;
        })
        .map(f => ({
            ...f,
            featureState: state[f.id] || {},
            status: state[f.id]?.status || f.status
        }))
        .sort((a, b) => {
            const aNow = a.featureState.buildNow ? 1 : 0;
            const bNow = b.featureState.buildNow ? 1 : 0;
            if (aNow !== bNow) return bNow - aNow;
            if (a.status !== b.status) {
                if (a.status === STATUS.BUILDING) return -1;
                if (b.status === STATUS.BUILDING) return 1;
            }
            const aDate = new Date(a.featureState.updatedAt || 0).getTime();
            const bDate = new Date(b.featureState.updatedAt || 0).getTime();
            return bDate - aDate;
        });

    return `
        <div class="build-queue-panel">
            <div class="build-queue-header">
                <h3><i data-lucide="list-ordered"></i> Build Queue (Roadmap Source of Truth)</h3>
                <p>Queue order follows roadmap statuses + Ben's Build Now selections</p>
            </div>
            <ol class="build-queue-list">
                ${candidates.slice(0, 8).map((f, idx) => `
                    <li class="build-queue-item ${f.featureState.buildNow ? 'priority-now' : ''}">
                        <span class="queue-rank">${idx + 1}</span>
                        <div class="queue-text">
                            <strong>${f.name}</strong>
                            <small>${f.status === STATUS.BUILDING ? 'Building' : 'Planned/Backlog'}${f.featureState.buildNow ? ' - Build Now' : ''}</small>
                        </div>
                    </li>
                `).join('')}
                ${candidates.length === 0 ? '<li class="empty-column">No queued features</li>' : ''}
            </ol>
        </div>
    `;
}

function renderCard(feature) {
    const featureState = getFeatureState(feature.id);

    if (featureState.rejected) return '';

    const currentStatus = featureState.status || feature.status;
    const isReview = currentStatus === STATUS.REVIEW;

    return `
        <div class="kanban-card" data-feature-id="${feature.id}">
            <div class="card-header-row">
                <strong class="card-title">${feature.name}</strong>
                ${getCategoryBadge(feature.category)}
            </div>
            <p class="card-desc">${feature.description}</p>
            <div class="card-actions">
                <button class="btn-build ${featureState.buildNow ? 'active' : ''}" 
                        onclick="window.roadmapBuildNow('${feature.id}')"
                        title="Force prioritize this feature into Building">
                    <i data-lucide="zap"></i> Build Now
                </button>
                <button class="btn-reject" 
                        onclick="window.roadmapReject('${feature.id}')"
                        title="Reject/Veto this feature">
                    <i data-lucide="x"></i> Reject
                </button>
            </div>

            ${currentStatus === STATUS.BUILDING ? `
                <button class="btn-flow btn-review" onclick="window.roadmapSendToReview('${feature.id}')">
                    <i data-lucide="rocket"></i> Launch -> Review
                </button>
            ` : ''}

            ${isReview ? `
                <div class="review-box">
                    <label>Review comments</label>
                    <textarea 
                        class="card-notes"
                        placeholder="Add launch feedback or change requests..."
                        onblur="window.roadmapUpdateReviewComment('${feature.id}', this.value)"
                    >${featureState.reviewComment || ''}</textarea>
                    <div class="review-actions">
                        <button class="btn-flow btn-approve" onclick="window.roadmapApprove('${feature.id}')">
                            <i data-lucide="check"></i> Approve
                        </button>
                        <button class="btn-flow btn-request" onclick="window.roadmapRequestChanges('${feature.id}')">
                            <i data-lucide="rotate-ccw"></i> Request Changes
                        </button>
                    </div>
                </div>
            ` : `
                <textarea 
                    class="card-notes" 
                    placeholder="Add notes..."
                    onblur="window.roadmapUpdateNotes('${feature.id}', this.value)"
                >${featureState.notes || ''}</textarea>
            `}
        </div>
    `;
}

function renderColumn(columnId, title, features, collapsible = false) {
    const collapsed = collapsible && getCompleteCollapsed();
    const count = features.length;

    return `
        <div class="kanban-column ${collapsed ? 'collapsed' : ''}" data-column="${columnId}">
            <div class="column-header" ${collapsible ? `onclick="window.roadmapToggleComplete()"` : ''}>
                <div class="column-title-row">
                    <h3>${title}</h3>
                    <span class="column-count">${count}</span>
                </div>
                ${collapsible ? '<i data-lucide="chevron-down" class="toggle-icon"></i>' : ''}
            </div>
            <div class="column-body">
                ${features.map(renderCard).join('')}
                ${count === 0 ? '<div class="empty-column">No features</div>' : ''}
            </div>
        </div>
    `;
}

function renderProductionView() {
    const state = loadState();
    const categoryFilter = getCategoryFilter();

    const features = roadmapFeatures.filter(f => {
        const featureState = state[f.id] || {};
        if (featureState.rejected) return false;
        if (categoryFilter && f.category !== categoryFilter) return false;
        return true;
    });

    const columns = {
        idea: features.filter(f => (state[f.id]?.status || f.status) === STATUS.IDEA),
        backlog: features.filter(f => (state[f.id]?.status || f.status) === STATUS.BACKLOG),
        buildingNext: features.filter(f => (state[f.id]?.status || f.status) === STATUS.BUILDING),
        review: features.filter(f => (state[f.id]?.status || f.status) === STATUS.REVIEW),
        blocked: features.filter(f => (state[f.id]?.status || f.status) === STATUS.BLOCKED),
        complete: features.filter(f => (state[f.id]?.status || f.status) === STATUS.COMPLETE)
    };

    return `
        ${renderBuildQueue(features, state)}
        <div class="kanban-board">
            ${renderColumn('idea', 'Idea', columns.idea)}
            ${renderColumn('backlog', 'Planned / Backlog', columns.backlog)}
            ${renderColumn('buildingNext', 'Building', columns.buildingNext)}
            ${renderColumn('review', 'Review', columns.review)}
            ${renderColumn('blocked', 'Blocked', columns.blocked)}
            ${renderColumn('complete', 'Complete', columns.complete, true)}
        </div>
    `;
}

function renderArchitectureView() {
    const state = loadState();
    const features = roadmapFeatures.filter(f => !((state[f.id] || {}).rejected));

    const categories = {};
    Object.keys(architectureCategories).forEach(key => {
        categories[key] = features.filter(f => f.category === key);
    });

    return `
        <div class="architecture-view">
            ${Object.entries(categories).map(([key, categoryFeatures]) => `
                <div class="architecture-category">
                    <div class="category-header">
                        <h3>${architectureCategories[key]}</h3>
                        <span class="category-count">${categoryFeatures.length} features</span>
                    </div>
                    <div class="category-breakdown">
                        ${renderStatusBreakdown(categoryFeatures, state)}
                    </div>
                    <div class="category-features">
                        ${categoryFeatures.map(renderCard).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderStatusBreakdown(features, state) {
    const statusCounts = {
        complete: 0,
        review: 0,
        buildingNext: 0,
        backlog: 0,
        idea: 0,
        blocked: 0
    };

    features.forEach(f => {
        const status = state[f.id]?.status || f.status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return `
        <div class="status-breakdown">
            ${statusCounts.complete > 0 ? `<span class="status-pill complete">${statusCounts.complete} complete</span>` : ''}
            ${statusCounts.review > 0 ? `<span class="status-pill review">${statusCounts.review} review</span>` : ''}
            ${statusCounts.buildingNext > 0 ? `<span class="status-pill building">${statusCounts.buildingNext} building</span>` : ''}
            ${statusCounts.backlog > 0 ? `<span class="status-pill backlog">${statusCounts.backlog} backlog</span>` : ''}
            ${statusCounts.idea > 0 ? `<span class="status-pill idea">${statusCounts.idea} idea</span>` : ''}
            ${statusCounts.blocked > 0 ? `<span class="status-pill blocked">${statusCounts.blocked} blocked</span>` : ''}
        </div>
    `;
}

function renderControls() {
    const viewMode = getViewMode();
    const categoryFilter = getCategoryFilter();

    return `
        <div class="roadmap-controls">
            <div class="view-toggle">
                <button class="btn ${viewMode === 'production' ? 'active' : ''}" 
                        onclick="window.roadmapSetView('production')">
                    <i data-lucide="trello"></i> Production View
                </button>
                <button class="btn ${viewMode === 'architecture' ? 'active' : ''}" 
                        onclick="window.roadmapSetView('architecture')">
                    <i data-lucide="layers"></i> Architecture View
                </button>
            </div>

            <div class="category-filter">
                <label>Filter by category:</label>
                <select onchange="window.roadmapSetCategory(this.value)">
                    <option value="">All Categories</option>
                    ${Object.entries(architectureCategories).map(([key, name]) => `
                        <option value="${key}" ${categoryFilter === key ? 'selected' : ''}>${name}</option>
                    `).join('')}
                </select>
            </div>

            <button class="btn btn-secondary" onclick="window.roadmapExport()">
                <i data-lucide="download"></i> Export State
            </button>
        </div>
    `;
}

function renderRoadmap() {
    bootstrapFromBackend();
    const viewMode = getViewMode();

    return `
        <div class="page-header">
            <h2>Product Roadmap</h2>
            <p>Roadmap is backend-first with local fallback. Flow: Idea -> Planned/Backlog -> Building -> Review -> Complete.</p>
        </div>

        ${renderControls()}

        ${viewMode === 'production' ? renderProductionView() : renderArchitectureView()}

        <style>
            .roadmap-controls { display: flex; gap: 2rem; align-items: center; margin-bottom: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; flex-wrap: wrap; }
            .view-toggle { display: flex; gap: 0.5rem; }
            .view-toggle .btn { padding: 0.5rem 1rem; border: 1px solid var(--border); background: var(--bg-primary); display: flex; align-items: center; gap: 0.5rem; }
            .view-toggle .btn.active { background: var(--accent); color: white; border-color: var(--accent); }
            .category-filter { display: flex; align-items: center; gap: 0.5rem; }
            .category-filter label { font-size: 0.875rem; color: var(--text-secondary); }
            .category-filter select { padding: 0.5rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-primary); color: var(--text-primary); }

            .build-queue-panel { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
            .build-queue-header h3 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
            .build-queue-header p { margin: 0.4rem 0 0; color: var(--text-secondary); font-size: 0.85rem; }
            .build-queue-list { margin: 0.75rem 0 0; padding: 0; list-style: none; display: grid; gap: 0.5rem; }
            .build-queue-item { display: flex; gap: 0.75rem; align-items: center; padding: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 6px; }
            .build-queue-item.priority-now { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
            .queue-rank { width: 1.5rem; height: 1.5rem; border-radius: 999px; background: var(--bg-tertiary); display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; }
            .queue-text small { color: var(--text-secondary); display: block; }

            .kanban-board { display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem; }
            .kanban-column { min-width: 280px; flex-shrink: 0; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border); display: flex; flex-direction: column; max-height: calc(100vh - 300px); }
            .kanban-column.collapsed .column-body { display: none; }
            .column-header { padding: 0.75rem 1rem; border-bottom: 2px solid var(--border); background: var(--bg-tertiary); border-radius: 8px 8px 0 0; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
            .column-title-row { display: flex; align-items: center; gap: 0.5rem; }
            .column-header h3 { margin: 0; font-size: 0.95rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
            .column-count { background: var(--bg-primary); padding: 0.125rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); }
            .column-body { padding: 0.75rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 0.75rem; }
            .empty-column { text-align: center; padding: 1rem; color: var(--text-tertiary); font-size: 0.875rem; }

            .kanban-card { background: var(--bg-primary); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem; font-size: 0.875rem; transition: box-shadow 0.2s; }
            .kanban-card:hover { box-shadow: 0 2px 8px var(--shadow); }
            .card-header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem; }
            .card-title { font-size: 0.875rem; font-weight: 600; line-height: 1.3; flex: 1; }
            .category-badge { padding: 0.125rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; white-space: nowrap; flex-shrink: 0; }
            .card-desc { color: var(--text-secondary); font-size: 0.8rem; line-height: 1.4; margin-bottom: 0.75rem; }
            .card-actions { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
            .card-actions button, .btn-flow { flex: 1; padding: 0.375rem 0.5rem; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary); font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.25rem; transition: all 0.2s; }
            .card-actions button svg, .btn-flow svg { width: 14px; height: 14px; }
            .btn-build:hover, .btn-build.active { background: var(--accent); color: white; border-color: var(--accent); }
            .btn-reject:hover { background: var(--error); color: white; border-color: var(--error); }
            .btn-review:hover { background: #8b5cf6; color: white; border-color: #8b5cf6; }
            .btn-approve:hover { background: var(--success); color: white; border-color: var(--success); }
            .btn-request:hover { background: var(--warning); color: black; border-color: var(--warning); }
            .review-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
            .review-box label { font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.35rem; }
            .card-notes { width: 100%; min-height: 50px; padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary); font-size: 0.75rem; font-family: inherit; resize: vertical; }
            .card-notes:focus { outline: none; border-color: var(--accent); }

            .architecture-view { display: grid; gap: 2rem; }
            .architecture-category { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; }
            .category-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 2px solid var(--border); }
            .category-header h3 { margin: 0; font-size: 1.25rem; }
            .category-count { color: var(--text-secondary); font-size: 0.875rem; }
            .status-breakdown { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
            .status-pill { padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
            .status-pill.complete { background: rgba(16, 185, 129, 0.2); color: var(--success); }
            .status-pill.review { background: rgba(245, 158, 11, 0.2); color: var(--warning); }
            .status-pill.building { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
            .status-pill.backlog { background: rgba(59, 130, 246, 0.2); color: var(--info); }
            .status-pill.idea { background: rgba(107, 114, 128, 0.2); color: var(--text-secondary); }
            .status-pill.blocked { background: rgba(239, 68, 68, 0.2); color: var(--error); }
            .category-features { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }

            @media (max-width: 768px) {
                .kanban-board { flex-direction: column; }
                .kanban-column { min-width: 100%; max-height: none; }
            }
        </style>
    `;
}

function renderPage() {
    const container = document.getElementById('page-container');
    if (container) {
        container.innerHTML = renderRoadmap();
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

window.roadmapBuildNow = function(featureId) {
    const currentStatus = getFeatureState(featureId).status;
    if (currentStatus === STATUS.BUILDING && getFeatureState(featureId).buildNow) {
        moveFeature(featureId, STATUS.BACKLOG);
    } else {
        markBuildNow(featureId);
    }
};

window.roadmapSendToReview = function(featureId) {
    moveFeature(featureId, STATUS.REVIEW);
};

window.roadmapApprove = function(featureId) {
    approveReview(featureId);
};

window.roadmapRequestChanges = function(featureId) {
    requestChanges(featureId);
};

window.roadmapReject = function(featureId) {
    if (confirm('Are you sure you want to reject this feature? It will be hidden from the roadmap.')) {
        rejectFeature(featureId);
    }
};

window.roadmapUpdateNotes = function(featureId, notes) {
    updateNotes(featureId, notes);
};

window.roadmapUpdateReviewComment = function(featureId, comment) {
    updateReviewComment(featureId, comment);
};

window.roadmapSetView = function(view) {
    setViewMode(view);
    setCategoryFilter('');
    renderPage();
};

window.roadmapSetCategory = function(category) {
    setCategoryFilter(category);
    renderPage();
};

window.roadmapToggleComplete = function() {
    setCompleteCollapsed(!getCompleteCollapsed());
    renderPage();
};

window.roadmapExport = function() {
    const state = loadState();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moo-roadmap-state-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

export { renderRoadmap };
