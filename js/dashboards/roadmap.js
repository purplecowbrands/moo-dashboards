// Roadmap Dashboard - Interactive Feature Planning
import { roadmapData } from '../../data/roadmap-data.js';

// Load user feedback from localStorage
function loadFeedback() {
    const stored = localStorage.getItem('moo-roadmap-feedback');
    return stored ? JSON.parse(stored) : {};
}

// Save user feedback to localStorage
function saveFeedback(feedback) {
    localStorage.setItem('moo-roadmap-feedback', JSON.stringify(feedback));
}

// Get feedback for a specific feature
function getFeatureFeedback(featureId) {
    const feedback = loadFeedback();
    return feedback[featureId] || {
        priority: null,
        decision: null,
        notes: ''
    };
}

// Update feedback for a feature
function updateFeatureFeedback(featureId, updates) {
    const feedback = loadFeedback();
    feedback[featureId] = {
        ...getFeatureFeedback(featureId),
        ...updates,
        updatedAt: new Date().toISOString()
    };
    saveFeedback(feedback);
    
    // Re-render the page (direct innerHTML update since this is a re-render, not initial load)
    const container = document.getElementById('page-container');
    if (container) {
        container.innerHTML = renderRoadmap();
        // Re-init Lucide icons after re-render
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

// Get priority badge HTML
function getPriorityBadge(priority, userPriority = null) {
    const displayPriority = userPriority || priority;
    const badges = {
        critical: '<span class="badge error">Critical</span>',
        high: '<span class="badge warning">High</span>',
        medium: '<span class="badge info">Medium</span>',
        low: '<span class="badge neutral">Low</span>',
        'very-high': '<span class="badge error">Very High</span>'
    };
    return badges[displayPriority] || badges.medium;
}

// Get complexity badge HTML
function getComplexityBadge(complexity) {
    const badges = {
        low: '<span class="badge success">Low</span>',
        medium: '<span class="badge info">Medium</span>',
        high: '<span class="badge warning">High</span>',
        'very-high': '<span class="badge error">Very High</span>'
    };
    return badges[complexity] || badges.medium;
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        complete: '<span class="badge success">Complete</span>',
        'in-progress': '<span class="badge warning">In Progress</span>',
        planned: '<span class="badge info">Planned</span>',
        idea: '<span class="badge neutral">Idea</span>'
    };
    return badges[status] || badges.idea;
}

// Get decision badge HTML
function getDecisionBadge(decision) {
    const badges = {
        approved: '<span class="badge success">✓ Approved</span>',
        rejected: '<span class="badge error">✗ Rejected</span>',
        skip: '<span class="badge neutral">~ Skipped</span>'
    };
    return badges[decision] || '';
}

// Render feature card
function renderFeatureCard(feature, phaseId) {
    const feedback = getFeatureFeedback(feature.id);
    const hasFeedback = feedback.priority || feedback.decision || feedback.notes;
    
    return `
        <div class="roadmap-feature ${hasFeedback ? 'has-feedback' : ''}" data-feature-id="${feature.id}">
            <div class="feature-header">
                <div class="feature-title">
                    <strong>${feature.name}</strong>
                    ${feedback.decision ? getDecisionBadge(feedback.decision) : ''}
                </div>
                <div class="feature-badges">
                    ${getPriorityBadge(feature.priority, feedback.priority)}
                    ${getComplexityBadge(feature.complexity)}
                    ${getStatusBadge(feature.status)}
                </div>
            </div>
            
            <div class="feature-description">
                ${feature.description}
            </div>
            
            ${feature.dependencies && feature.dependencies.length > 0 ? `
                <div class="feature-dependencies">
                    <strong>Dependencies:</strong> ${feature.dependencies.join(', ')}
                </div>
            ` : ''}
            
            <div class="feature-controls">
                <div class="control-group">
                    <label>Priority:</label>
                    <div class="btn-group">
                        <button class="btn btn-sm ${feedback.priority === 'critical' ? 'active' : ''}" 
                                onclick="updatePriority('${feature.id}', 'critical')">Critical</button>
                        <button class="btn btn-sm ${feedback.priority === 'high' ? 'active' : ''}" 
                                onclick="updatePriority('${feature.id}', 'high')">High</button>
                        <button class="btn btn-sm ${feedback.priority === 'medium' ? 'active' : ''}" 
                                onclick="updatePriority('${feature.id}', 'medium')">Medium</button>
                        <button class="btn btn-sm ${feedback.priority === 'low' ? 'active' : ''}" 
                                onclick="updatePriority('${feature.id}', 'low')">Low</button>
                    </div>
                </div>
                
                <div class="control-group">
                    <label>Decision:</label>
                    <div class="btn-group">
                        <button class="btn btn-sm ${feedback.decision === 'approved' ? 'active btn-success' : ''}" 
                                onclick="updateDecision('${feature.id}', 'approved')">✓ Approve</button>
                        <button class="btn btn-sm ${feedback.decision === 'skip' ? 'active' : ''}" 
                                onclick="updateDecision('${feature.id}', 'skip')">~ Skip</button>
                        <button class="btn btn-sm ${feedback.decision === 'rejected' ? 'active btn-error' : ''}" 
                                onclick="updateDecision('${feature.id}', 'rejected')">✗ Reject</button>
                    </div>
                </div>
            </div>
            
            <div class="feature-notes">
                <label>Notes:</label>
                <textarea 
                    placeholder="Add your feedback or notes..."
                    onblur="updateNotes('${feature.id}', this.value)"
                >${feedback.notes || ''}</textarea>
            </div>
        </div>
    `;
}

// Render phase section
function renderPhase(phase) {
    const phaseClass = phase.status === 'complete' ? 'phase-complete' : 
                       phase.status === 'idea' ? 'phase-idea' : 'phase-active';
    
    return `
        <div class="roadmap-phase ${phaseClass}">
            <div class="phase-header" onclick="togglePhase('${phase.id}')">
                <div class="phase-title">
                    <h3>${phase.name}</h3>
                    ${getStatusBadge(phase.status)}
                    <span class="phase-count">${phase.features.length} features</span>
                </div>
                <i data-lucide="chevron-down" class="phase-toggle"></i>
            </div>
            
            <div class="phase-content" id="phase-${phase.id}">
                <div class="features-grid">
                    ${phase.features.map(f => renderFeatureCard(f, phase.id)).join('')}
                </div>
            </div>
        </div>
    `;
}

// Render Ben's feedback summary
function renderFeedbackSummary() {
    const feedback = loadFeedback();
    const feedbackItems = Object.entries(feedback).filter(([_, data]) => 
        data.priority || data.decision || data.notes
    );
    
    if (feedbackItems.length === 0) {
        return `
            <div class="empty-state">
                <i data-lucide="clipboard"></i>
                <p>No feedback yet. Start reviewing features below!</p>
            </div>
        `;
    }
    
    // Find feature details for each feedback item
    const allFeatures = roadmapData.phases.flatMap(p => 
        p.features.map(f => ({ ...f, phaseName: p.name }))
    );
    
    return `
        <div class="feedback-list">
            ${feedbackItems.map(([featureId, data]) => {
                const feature = allFeatures.find(f => f.id === featureId);
                if (!feature) return '';
                
                return `
                    <div class="feedback-item">
                        <div class="feedback-header">
                            <strong>${feature.name}</strong>
                            <span class="badge neutral">${feature.phaseName}</span>
                        </div>
                        ${data.decision ? `<div>Decision: ${getDecisionBadge(data.decision)}</div>` : ''}
                        ${data.priority ? `<div>Priority updated to: ${getPriorityBadge(null, data.priority)}</div>` : ''}
                        ${data.notes ? `<div class="feedback-notes">${data.notes}</div>` : ''}
                        <div class="feedback-meta">Updated: ${new Date(data.updatedAt).toLocaleDateString()}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Render filters
function renderFilters() {
    return `
        <div class="roadmap-filters">
            <div class="filter-group">
                <label>Search:</label>
                <input type="text" id="roadmap-search" placeholder="Search features..." 
                       oninput="filterFeatures()">
            </div>
            
            <div class="filter-group">
                <label>Status:</label>
                <select id="filter-status" onchange="filterFeatures()">
                    <option value="">All</option>
                    <option value="complete">Complete</option>
                    <option value="in-progress">In Progress</option>
                    <option value="planned">Planned</option>
                    <option value="idea">Idea</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label>Priority:</label>
                <select id="filter-priority" onchange="filterFeatures()">
                    <option value="">All</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label>Phase:</label>
                <select id="filter-phase" onchange="filterFeatures()">
                    <option value="">All</option>
                    ${roadmapData.phases.map(p => `
                        <option value="${p.id}">${p.name}</option>
                    `).join('')}
                </select>
            </div>
            
            <div class="filter-group">
                <label>Decision:</label>
                <select id="filter-decision" onchange="filterFeatures()">
                    <option value="">All</option>
                    <option value="approved">Approved</option>
                    <option value="skip">Skipped</option>
                    <option value="rejected">Rejected</option>
                    <option value="pending">Pending Review</option>
                </select>
            </div>
            
            <button class="btn btn-secondary" onclick="clearFilters()">Clear Filters</button>
            <button class="btn btn-secondary" onclick="exportFeedback()">Export Feedback</button>
        </div>
    `;
}

// Main render function
function renderRoadmap() {
    return `
        <div class="page-header">
            <h2>Product Roadmap</h2>
            <p>Interactive feature planning and prioritization for Moo Dashboards</p>
        </div>
        
        <div class="card" style="margin-bottom: 2rem;">
            <div class="card-header">
                <h3 class="card-title">
                    <i data-lucide="message-square"></i>
                    Ben's Feedback Summary
                </h3>
            </div>
            <div class="card-body">
                ${renderFeedbackSummary()}
            </div>
        </div>
        
        ${renderFilters()}
        
        <div class="roadmap-container">
            ${roadmapData.phases.map(renderPhase).join('')}
        </div>
        
        <style>
            .roadmap-filters {
                display: flex;
                gap: 1rem;
                margin-bottom: 2rem;
                flex-wrap: wrap;
                align-items: flex-end;
            }
            
            .roadmap-phase {
                margin-bottom: 2rem;
                border: 1px solid var(--border);
                border-radius: 8px;
                overflow: hidden;
            }
            
            .phase-header {
                padding: 1.5rem;
                background: var(--bg-secondary);
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: background 0.2s;
            }
            
            .phase-header:hover {
                background: var(--bg-tertiary);
            }
            
            .phase-title {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .phase-title h3 {
                margin: 0;
                font-size: 1.25rem;
            }
            
            .phase-count {
                color: var(--text-secondary);
                font-size: 0.875rem;
            }
            
            .phase-content {
                padding: 1.5rem;
                background: var(--bg-primary);
            }
            
            .phase-content.collapsed {
                display: none;
            }
            
            .features-grid {
                display: grid;
                gap: 1rem;
            }
            
            .roadmap-feature {
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 1.5rem;
                background: var(--bg-primary);
                transition: all 0.2s;
            }
            
            .roadmap-feature.has-feedback {
                border-color: var(--accent);
                box-shadow: 0 0 0 1px var(--accent);
            }
            
            .roadmap-feature.hidden {
                display: none;
            }
            
            .feature-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 1rem;
                gap: 1rem;
            }
            
            .feature-title {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            
            .feature-badges {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            
            .feature-description {
                color: var(--text-secondary);
                margin-bottom: 1rem;
                line-height: 1.6;
            }
            
            .feature-dependencies {
                font-size: 0.875rem;
                color: var(--text-tertiary);
                margin-bottom: 1rem;
            }
            
            .feature-controls {
                display: flex;
                gap: 2rem;
                margin-bottom: 1rem;
                flex-wrap: wrap;
            }
            
            .control-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .control-group label {
                font-size: 0.875rem;
                font-weight: 600;
                color: var(--text-secondary);
            }
            
            .btn-group {
                display: flex;
                gap: 0.5rem;
            }
            
            .btn-sm {
                padding: 0.5rem 1rem;
                font-size: 0.875rem;
            }
            
            .btn-group .btn {
                background: var(--bg-secondary);
                color: var(--text-primary);
                border: 1px solid var(--border);
            }
            
            .btn-group .btn:hover {
                background: var(--bg-tertiary);
            }
            
            .btn-group .btn.active {
                background: var(--accent);
                color: white;
                border-color: var(--accent);
            }
            
            .btn-group .btn-success.active {
                background: var(--success);
                border-color: var(--success);
            }
            
            .btn-group .btn-error.active {
                background: var(--error);
                border-color: var(--error);
            }
            
            .feature-notes textarea {
                width: 100%;
                min-height: 60px;
                padding: 0.75rem;
                border: 1px solid var(--border);
                border-radius: 6px;
                background: var(--bg-primary);
                color: var(--text-primary);
                font-family: inherit;
                font-size: 0.9rem;
                resize: vertical;
            }
            
            .feature-notes label {
                display: block;
                margin-bottom: 0.5rem;
                font-size: 0.875rem;
                font-weight: 600;
                color: var(--text-secondary);
            }
            
            .feedback-list {
                display: grid;
                gap: 1rem;
            }
            
            .feedback-item {
                padding: 1rem;
                border: 1px solid var(--border);
                border-radius: 6px;
                background: var(--bg-secondary);
            }
            
            .feedback-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }
            
            .feedback-notes {
                margin-top: 0.5rem;
                padding: 0.5rem;
                background: var(--bg-primary);
                border-radius: 4px;
                font-style: italic;
            }
            
            .feedback-meta {
                margin-top: 0.5rem;
                font-size: 0.75rem;
                color: var(--text-tertiary);
            }
        </style>
    `;
}

// Global functions for onclick handlers
window.updatePriority = function(featureId, priority) {
    const current = getFeatureFeedback(featureId);
    updateFeatureFeedback(featureId, { 
        priority: current.priority === priority ? null : priority 
    });
};

window.updateDecision = function(featureId, decision) {
    const current = getFeatureFeedback(featureId);
    updateFeatureFeedback(featureId, { 
        decision: current.decision === decision ? null : decision 
    });
};

window.updateNotes = function(featureId, notes) {
    updateFeatureFeedback(featureId, { notes: notes.trim() });
};

window.togglePhase = function(phaseId) {
    const content = document.getElementById(`phase-${phaseId}`);
    if (content) {
        content.classList.toggle('collapsed');
        const toggle = content.previousElementSibling.querySelector('.phase-toggle');
        if (toggle) {
            toggle.setAttribute('data-lucide', 
                content.classList.contains('collapsed') ? 'chevron-right' : 'chevron-down'
            );
            if (window.lucide) window.lucide.createIcons();
        }
    }
};

window.filterFeatures = function() {
    const searchTerm = document.getElementById('roadmap-search')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('filter-status')?.value || '';
    const priorityFilter = document.getElementById('filter-priority')?.value || '';
    const phaseFilter = document.getElementById('filter-phase')?.value || '';
    const decisionFilter = document.getElementById('filter-decision')?.value || '';
    
    const feedback = loadFeedback();
    
    document.querySelectorAll('.roadmap-feature').forEach(card => {
        const featureId = card.dataset.featureId;
        
        // Find feature data
        let feature = null;
        let phaseId = null;
        for (const phase of roadmapData.phases) {
            feature = phase.features.find(f => f.id === featureId);
            if (feature) {
                phaseId = phase.id;
                break;
            }
        }
        
        if (!feature) return;
        
        const featureFeedback = feedback[featureId] || {};
        const text = `${feature.name} ${feature.description}`.toLowerCase();
        
        // Apply filters
        const matchesSearch = !searchTerm || text.includes(searchTerm);
        const matchesStatus = !statusFilter || feature.status === statusFilter;
        const matchesPriority = !priorityFilter || 
            (featureFeedback.priority || feature.priority) === priorityFilter;
        const matchesPhase = !phaseFilter || phaseId === phaseFilter;
        const matchesDecision = !decisionFilter || 
            (decisionFilter === 'pending' ? !featureFeedback.decision : featureFeedback.decision === decisionFilter);
        
        if (matchesSearch && matchesStatus && matchesPriority && matchesPhase && matchesDecision) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
};

window.clearFilters = function() {
    document.getElementById('roadmap-search').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-priority').value = '';
    document.getElementById('filter-phase').value = '';
    document.getElementById('filter-decision').value = '';
    filterFeatures();
};

window.exportFeedback = function() {
    const feedback = loadFeedback();
    const blob = new Blob([JSON.stringify(feedback, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moo-roadmap-feedback-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

export { renderRoadmap };
