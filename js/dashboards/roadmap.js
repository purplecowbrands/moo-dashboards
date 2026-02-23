// Roadmap Dashboard - Kanban Board for Feature Planning
import { roadmapFeatures, architectureCategories } from '../../data/roadmap-data.js';

// Load state from localStorage
function loadState() {
    const stored = localStorage.getItem('moo-roadmap-state');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse roadmap state:', e);
        }
    }
    // Initialize with default statuses from data
    const state = {};
    roadmapFeatures.forEach(f => {
        state[f.id] = {
            status: f.status,
            notes: '',
            rejected: false
        };
    });
    return state;
}

// Save state to localStorage
function saveState(state) {
    localStorage.setItem('moo-roadmap-state', JSON.stringify(state));
}

// Get current view mode
function getViewMode() {
    return localStorage.getItem('moo-roadmap-view') || 'production';
}

// Set view mode
function setViewMode(mode) {
    localStorage.setItem('moo-roadmap-view', mode);
}

// Get category filter
function getCategoryFilter() {
    return localStorage.getItem('moo-roadmap-category-filter') || '';
}

// Set category filter
function setCategoryFilter(category) {
    localStorage.setItem('moo-roadmap-category-filter', category);
}

// Get Complete column collapsed state
function getCompleteCollapsed() {
    return localStorage.getItem('moo-roadmap-complete-collapsed') === 'true';
}

// Set Complete column collapsed state
function setCompleteCollapsed(collapsed) {
    localStorage.setItem('moo-roadmap-complete-collapsed', collapsed.toString());
}

// Move feature to new status
function moveFeature(featureId, newStatus) {
    const state = loadState();
    state[featureId] = {
        ...state[featureId],
        status: newStatus,
        updatedAt: new Date().toISOString()
    };
    saveState(state);
    renderPage();
}

// Reject feature
function rejectFeature(featureId) {
    const state = loadState();
    state[featureId] = {
        ...state[featureId],
        rejected: true,
        updatedAt: new Date().toISOString()
    };
    saveState(state);
    renderPage();
}

// Update feature notes
function updateNotes(featureId, notes) {
    const state = loadState();
    state[featureId] = {
        ...state[featureId],
        notes: notes.trim(),
        updatedAt: new Date().toISOString()
    };
    saveState(state);
}

// Get category badge
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

// Render feature card
function renderCard(feature) {
    const state = loadState();
    const featureState = state[feature.id] || {};
    
    if (featureState.rejected) return '';
    
    const currentStatus = featureState.status || feature.status;
    
    return `
        <div class="kanban-card" data-feature-id="${feature.id}">
            <div class="card-header-row">
                <strong class="card-title">${feature.name}</strong>
                ${getCategoryBadge(feature.category)}
            </div>
            <p class="card-desc">${feature.description}</p>
            <div class="card-actions">
                <button class="btn-build ${currentStatus === 'buildingNext' ? 'active' : ''}" 
                        onclick="window.roadmapBuildNow('${feature.id}')"
                        title="Move to Building Next">
                    <i data-lucide="zap"></i> Build Now
                </button>
                <button class="btn-reject" 
                        onclick="window.roadmapReject('${feature.id}')"
                        title="Reject/Veto this feature">
                    <i data-lucide="x"></i> Reject
                </button>
            </div>
            <textarea 
                class="card-notes" 
                placeholder="Add notes or feedback..."
                onblur="window.roadmapUpdateNotes('${feature.id}', this.value)"
            >${featureState.notes || ''}</textarea>
        </div>
    `;
}

// Render Kanban column
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

// Render Production View (Kanban)
function renderProductionView() {
    const state = loadState();
    const categoryFilter = getCategoryFilter();
    
    // Filter features by category if needed
    let features = roadmapFeatures.filter(f => {
        const featureState = state[f.id] || {};
        if (featureState.rejected) return false;
        if (categoryFilter && f.category !== categoryFilter) return false;
        return true;
    });
    
    // Group by status
    const columns = {
        idea: features.filter(f => (state[f.id]?.status || f.status) === 'idea'),
        backlog: features.filter(f => (state[f.id]?.status || f.status) === 'backlog'),
        buildingNext: features.filter(f => (state[f.id]?.status || f.status) === 'buildingNext'),
        blocked: features.filter(f => (state[f.id]?.status || f.status) === 'blocked'),
        complete: features.filter(f => (state[f.id]?.status || f.status) === 'complete')
    };
    
    return `
        <div class="kanban-board">
            ${renderColumn('idea', 'Idea', columns.idea)}
            ${renderColumn('backlog', 'Backlog', columns.backlog)}
            ${renderColumn('buildingNext', 'Building Next', columns.buildingNext)}
            ${renderColumn('blocked', 'Blocked', columns.blocked)}
            ${renderColumn('complete', 'Complete', columns.complete, true)}
        </div>
    `;
}

// Render Architecture View
function renderArchitectureView() {
    const state = loadState();
    
    // Filter out rejected features
    const features = roadmapFeatures.filter(f => {
        const featureState = state[f.id] || {};
        return !featureState.rejected;
    });
    
    // Group by architecture category
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

// Render status breakdown for Architecture view
function renderStatusBreakdown(features, state) {
    const statusCounts = {
        complete: 0,
        buildingNext: 0,
        backlog: 0,
        idea: 0,
        blocked: 0
    };
    
    features.forEach(f => {
        const status = state[f.id]?.status || f.status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const total = features.length;
    
    return `
        <div class="status-breakdown">
            ${statusCounts.complete > 0 ? `<span class="status-pill complete">${statusCounts.complete} complete</span>` : ''}
            ${statusCounts.buildingNext > 0 ? `<span class="status-pill building">${statusCounts.buildingNext} building</span>` : ''}
            ${statusCounts.backlog > 0 ? `<span class="status-pill backlog">${statusCounts.backlog} backlog</span>` : ''}
            ${statusCounts.idea > 0 ? `<span class="status-pill idea">${statusCounts.idea} idea</span>` : ''}
            ${statusCounts.blocked > 0 ? `<span class="status-pill blocked">${statusCounts.blocked} blocked</span>` : ''}
        </div>
    `;
}

// Render controls
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

// Main render function
function renderRoadmap() {
    const viewMode = getViewMode();
    
    return `
        <div class="page-header">
            <h2>Product Roadmap</h2>
            <p>Kanban board for feature planning and prioritization</p>
        </div>
        
        ${renderControls()}
        
        ${viewMode === 'production' ? renderProductionView() : renderArchitectureView()}
        
        <style>
            .roadmap-controls {
                display: flex;
                gap: 2rem;
                align-items: center;
                margin-bottom: 2rem;
                padding: 1rem;
                background: var(--bg-secondary);
                border-radius: 8px;
                flex-wrap: wrap;
            }
            
            .view-toggle {
                display: flex;
                gap: 0.5rem;
            }
            
            .view-toggle .btn {
                padding: 0.5rem 1rem;
                border: 1px solid var(--border);
                background: var(--bg-primary);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .view-toggle .btn.active {
                background: var(--accent);
                color: white;
                border-color: var(--accent);
            }
            
            .category-filter {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .category-filter label {
                font-size: 0.875rem;
                color: var(--text-secondary);
            }
            
            .category-filter select {
                padding: 0.5rem;
                border: 1px solid var(--border);
                border-radius: 6px;
                background: var(--bg-primary);
                color: var(--text-primary);
            }
            
            /* Kanban Board */
            .kanban-board {
                display: flex;
                gap: 1rem;
                overflow-x: auto;
                padding-bottom: 1rem;
            }
            
            .kanban-column {
                min-width: 280px;
                flex-shrink: 0;
                background: var(--bg-secondary);
                border-radius: 8px;
                border: 1px solid var(--border);
                display: flex;
                flex-direction: column;
                max-height: calc(100vh - 300px);
            }
            
            .kanban-column.collapsed .column-body {
                display: none;
            }
            
            .column-header {
                padding: 0.75rem 1rem;
                border-bottom: 2px solid var(--border);
                background: var(--bg-tertiary);
                border-radius: 8px 8px 0 0;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .column-title-row {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .column-header h3 {
                margin: 0;
                font-size: 0.95rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            .column-count {
                background: var(--bg-primary);
                padding: 0.125rem 0.5rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
                color: var(--text-secondary);
            }
            
            .column-body {
                padding: 0.75rem;
                overflow-y: auto;
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            
            .empty-column {
                text-align: center;
                padding: 2rem 1rem;
                color: var(--text-tertiary);
                font-size: 0.875rem;
            }
            
            /* Kanban Cards */
            .kanban-card {
                background: var(--bg-primary);
                border: 1px solid var(--border);
                border-radius: 6px;
                padding: 0.75rem;
                font-size: 0.875rem;
                transition: box-shadow 0.2s;
            }
            
            .kanban-card:hover {
                box-shadow: 0 2px 8px var(--shadow);
            }
            
            .card-header-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
            }
            
            .card-title {
                font-size: 0.875rem;
                font-weight: 600;
                line-height: 1.3;
                flex: 1;
            }
            
            .category-badge {
                padding: 0.125rem 0.5rem;
                border-radius: 4px;
                font-size: 0.7rem;
                font-weight: 600;
                white-space: nowrap;
                flex-shrink: 0;
            }
            
            .card-desc {
                color: var(--text-secondary);
                font-size: 0.8rem;
                line-height: 1.4;
                margin-bottom: 0.75rem;
            }
            
            .card-actions {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 0.75rem;
            }
            
            .card-actions button {
                flex: 1;
                padding: 0.375rem 0.5rem;
                border: 1px solid var(--border);
                border-radius: 4px;
                background: var(--bg-secondary);
                color: var(--text-primary);
                font-size: 0.75rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.25rem;
                transition: all 0.2s;
            }
            
            .card-actions button svg {
                width: 14px;
                height: 14px;
            }
            
            .btn-build:hover {
                background: var(--accent);
                color: white;
                border-color: var(--accent);
            }
            
            .btn-build.active {
                background: var(--accent);
                color: white;
                border-color: var(--accent);
            }
            
            .btn-reject:hover {
                background: var(--error);
                color: white;
                border-color: var(--error);
            }
            
            .card-notes {
                width: 100%;
                min-height: 50px;
                padding: 0.5rem;
                border: 1px solid var(--border);
                border-radius: 4px;
                background: var(--bg-secondary);
                color: var(--text-primary);
                font-size: 0.75rem;
                font-family: inherit;
                resize: vertical;
            }
            
            .card-notes:focus {
                outline: none;
                border-color: var(--accent);
            }
            
            /* Architecture View */
            .architecture-view {
                display: grid;
                gap: 2rem;
            }
            
            .architecture-category {
                background: var(--bg-secondary);
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 1.5rem;
            }
            
            .category-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid var(--border);
            }
            
            .category-header h3 {
                margin: 0;
                font-size: 1.25rem;
            }
            
            .category-count {
                color: var(--text-secondary);
                font-size: 0.875rem;
            }
            
            .category-breakdown {
                margin-bottom: 1rem;
            }
            
            .status-breakdown {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            
            .status-pill {
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .status-pill.complete {
                background: rgba(16, 185, 129, 0.2);
                color: var(--success);
            }
            
            .status-pill.building {
                background: rgba(139, 92, 246, 0.2);
                color: #8b5cf6;
            }
            
            .status-pill.backlog {
                background: rgba(59, 130, 246, 0.2);
                color: var(--info);
            }
            
            .status-pill.idea {
                background: rgba(107, 114, 128, 0.2);
                color: var(--text-secondary);
            }
            
            .status-pill.blocked {
                background: rgba(239, 68, 68, 0.2);
                color: var(--error);
            }
            
            .category-features {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 1rem;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .kanban-board {
                    flex-direction: column;
                }
                
                .kanban-column {
                    min-width: 100%;
                }
            }
        </style>
    `;
}

// Re-render page
function renderPage() {
    const container = document.getElementById('page-container');
    if (container) {
        container.innerHTML = renderRoadmap();
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

// Global functions for onclick handlers
window.roadmapBuildNow = function(featureId) {
    const state = loadState();
    const currentStatus = state[featureId]?.status || roadmapFeatures.find(f => f.id === featureId)?.status;
    
    // Toggle: if already in buildingNext, move back to backlog
    if (currentStatus === 'buildingNext') {
        moveFeature(featureId, 'backlog');
    } else {
        moveFeature(featureId, 'buildingNext');
    }
};

window.roadmapReject = function(featureId) {
    if (confirm('Are you sure you want to reject this feature? It will be hidden from the roadmap.')) {
        rejectFeature(featureId);
    }
};

window.roadmapUpdateNotes = function(featureId, notes) {
    updateNotes(featureId, notes);
};

window.roadmapSetView = function(view) {
    setViewMode(view);
    setCategoryFilter(''); // Clear category filter when switching views
    renderPage();
};

window.roadmapSetCategory = function(category) {
    setCategoryFilter(category);
    renderPage();
};

window.roadmapToggleComplete = function() {
    const collapsed = getCompleteCollapsed();
    setCompleteCollapsed(!collapsed);
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
