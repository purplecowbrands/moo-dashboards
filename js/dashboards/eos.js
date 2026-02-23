// EOS Scorecard Dashboard
import { sampleData } from '../../data/sample-data.js';
import { getEOSData, generateEOSJson, isLiveData } from '../data-loader.js';

export async function renderEOS() {
    // Try loading live data, fall back to sample data
    let eos = null;
    let dataStatus = 'sample';
    
    try {
        const liveData = await getEOSData();
        if (liveData && isLiveData(liveData)) {
            eos = liveData;
            dataStatus = 'live';
        }
    } catch (error) {
        console.error('Error loading EOS data:', error);
    }
    
    // Fallback to sample data if live data unavailable
    if (!eos) {
        eos = sampleData.eos;
    }

    const successCount = eos.metrics.filter(m => m.status === 'success').length;
    const warningCount = eos.metrics.filter(m => m.status === 'warning').length;
    const errorCount = eos.metrics.filter(m => m.status === 'error').length;
    const lastUpdated = eos.lastUpdated 
        ? new Date(eos.lastUpdated).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })
        : 'Never';

    return `
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h2>EOS Scorecard</h2>
                <p>Weekly metrics tracker for Purple Cow Brands</p>
            </div>
            <button id="editEosBtn" class="btn btn-primary">
                <i data-lucide="edit-3" style="width: 16px; height: 16px;"></i>
                Edit Metrics
            </button>
        </div>

        ${dataStatus === 'live' ? `
            <div style="background: var(--success-bg); color: var(--success); padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--radius); margin-bottom: var(--spacing-md); font-size: 0.875rem; display: flex; align-items: center; gap: var(--spacing-sm);">
                <i data-lucide="database" style="width: 16px; height: 16px;"></i>
                <span><strong>Live Data</strong> - Last updated: ${lastUpdated}</span>
            </div>
        ` : `
            <div style="background: var(--warning-bg); color: var(--warning); padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--radius); margin-bottom: var(--spacing-md); font-size: 0.875rem; display: flex; align-items: center; gap: var(--spacing-sm);">
                <i data-lucide="alert-circle" style="width: 16px; height: 16px;"></i>
                <span><strong>Sample Data</strong> - Click "Edit Metrics" to set up live tracking</span>
            </div>
        `}

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon success">
                    <i data-lucide="check-circle"></i>
                </div>
                <div class="stat-label">On Track</div>
                <div class="stat-value">${successCount}</div>
                <div class="stat-meta">Metrics hitting targets</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon warning">
                    <i data-lucide="alert-circle"></i>
                </div>
                <div class="stat-label">At Risk</div>
                <div class="stat-value">${warningCount}</div>
                <div class="stat-meta">Metrics below target</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon error">
                    <i data-lucide="x-circle"></i>
                </div>
                <div class="stat-label">Off Track</div>
                <div class="stat-value">${errorCount}</div>
                <div class="stat-meta">Metrics need attention</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="target"></i>
                </div>
                <div class="stat-label">Total Metrics</div>
                <div class="stat-value">${eos.metrics.length}</div>
                <div class="stat-meta">Tracked weekly</div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Weekly Metrics</h3>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Target</th>
                                <th>Actual</th>
                                <th>Progress</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${eos.metrics.map(metric => {
                                const percent = (metric.actual / metric.target) * 100;
                                return `
                                    <tr>
                                        <td><strong>${metric.name}</strong></td>
                                        <td>${metric.target}</td>
                                        <td>${metric.actual}</td>
                                        <td>
                                            <div class="progress">
                                                <div class="progress-bar ${metric.status}" style="width: ${Math.min(percent, 100)}%"></div>
                                            </div>
                                            <small style="color: var(--text-secondary);">${percent.toFixed(0)}%</small>
                                        </td>
                                        <td><span class="badge ${metric.status}">${metric.status}</span></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Performance Overview</h3>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="eosChart" data-chart="doughnut" data-chart-data='${JSON.stringify({
                            labels: ['On Track', 'At Risk', 'Off Track'],
                            datasets: [{
                                data: [successCount, warningCount, errorCount],
                                backgroundColor: [
                                    'rgba(16, 185, 129, 0.8)',
                                    'rgba(245, 158, 11, 0.8)',
                                    'rgba(239, 68, 68, 0.8)'
                                ],
                                borderWidth: 2
                            }]
                        })}'></canvas>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Actions Needed</h3>
                </div>
                <div class="card-body">
                    <ul class="list">
                        ${eos.metrics.filter(m => m.status !== 'success').map(metric => `
                            <li class="list-item">
                                <div>
                                    <strong>${metric.name}</strong>
                                    <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                        ${metric.actual} / ${metric.target} - Need ${metric.target - metric.actual} more
                                    </div>
                                </div>
                                <span class="badge ${metric.status}">${metric.status}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>

        <!-- Edit Form Modal (hidden by default) -->
        <div id="eosEditModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 1000; padding: var(--spacing-lg); overflow-y: auto;">
            <div style="max-width: 800px; margin: 0 auto; background: var(--card-bg); border-radius: var(--radius); padding: var(--spacing-xl); box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
                    <h3 style="margin: 0;">Edit EOS Scorecard</h3>
                    <button id="closeEosModal" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.5rem; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">×</button>
                </div>

                <form id="eosEditForm">
                    <div style="display: grid; gap: var(--spacing-md);">
                        <div style="background: var(--info-bg); color: var(--info); padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--radius); font-size: 0.875rem;">
                            <strong>Weekly Metrics:</strong> Track your most important business metrics each week. Add or remove metrics to match your business needs.
                        </div>

                        <!-- Dynamic Metrics List -->
                        <div id="metricsContainer">
                            ${eos.metrics.map((metric, index) => `
                                <div class="metric-row" data-index="${index}" style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: var(--spacing-sm); align-items: start; padding: var(--spacing-md); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg);">
                                    <div>
                                        <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500; font-size: 0.875rem;">Metric Name</label>
                                        <input type="text" name="metric_name_${index}" value="${metric.name}" required style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--card-bg); color: var(--text);">
                                    </div>
                                    <div>
                                        <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500; font-size: 0.875rem;">Target</label>
                                        <input type="number" name="metric_target_${index}" value="${metric.target}" min="0" required style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--card-bg); color: var(--text);">
                                    </div>
                                    <div>
                                        <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500; font-size: 0.875rem;">Actual</label>
                                        <input type="number" name="metric_actual_${index}" value="${metric.actual}" min="0" required style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--card-bg); color: var(--text);">
                                    </div>
                                    <div style="padding-top: 24px;">
                                        <button type="button" class="remove-metric-btn" style="background: var(--error-bg); color: var(--error); border: none; border-radius: var(--radius); padding: var(--spacing-sm); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
                                            <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <button type="button" id="addMetricBtn" class="btn btn-secondary" style="width: fit-content;">
                            <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
                            Add Metric
                        </button>

                        <div>
                            <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">Notes (Optional)</label>
                            <textarea name="notes" rows="3" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text); resize: vertical;">${eos.notes || ''}</textarea>
                        </div>

                        <div style="display: flex; gap: var(--spacing-md); margin-top: var(--spacing-lg);">
                            <button type="button" id="saveEosBtn" class="btn btn-primary" style="flex: 1;">
                                <i data-lucide="save" style="width: 16px; height: 16px;"></i>
                                Generate Update JSON
                            </button>
                            <button type="button" id="cancelEosBtn" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </form>

                <!-- JSON Output (hidden until generated) -->
                <div id="eosJsonOutput" style="display: none; margin-top: var(--spacing-lg); padding: var(--spacing-md); background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
                        <strong>Updated JSON:</strong>
                        <button type="button" id="copyEosJsonBtn" class="btn btn-sm btn-secondary">
                            <i data-lucide="copy" style="width: 14px; height: 14px;"></i>
                            Copy to Clipboard
                        </button>
                    </div>
                    <pre id="eosJsonContent" style="background: var(--code-bg); padding: var(--spacing-md); border-radius: var(--radius); overflow-x: auto; font-size: 0.875rem; margin: 0;"></pre>
                    <p style="margin-top: var(--spacing-md); color: var(--text-secondary); font-size: 0.875rem;">
                        <strong>Instructions:</strong> Copy this JSON and save it to <code>data/eos-metrics.json</code> in the repo, then commit and push to GitHub. The dashboard will update automatically.
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Initialize event listeners after render
export function initEOS() {
    const editBtn = document.getElementById('editEosBtn');
    const modal = document.getElementById('eosEditModal');
    const closeBtn = document.getElementById('closeEosModal');
    const cancelBtn = document.getElementById('cancelEosBtn');
    const saveBtn = document.getElementById('saveEosBtn');
    const form = document.getElementById('eosEditForm');
    const jsonOutput = document.getElementById('eosJsonOutput');
    const jsonContent = document.getElementById('eosJsonContent');
    const copyBtn = document.getElementById('copyEosJsonBtn');
    const metricsContainer = document.getElementById('metricsContainer');
    const addMetricBtn = document.getElementById('addMetricBtn');

    if (!editBtn || !modal) return;

    let metricIndex = document.querySelectorAll('.metric-row').length;

    // Open modal
    editBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        jsonOutput.style.display = 'none';
        lucide.createIcons(); // Re-render icons in modal
    });

    // Close modal
    const closeModal = () => {
        modal.style.display = 'none';
        jsonOutput.style.display = 'none';
    };
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Add new metric row
    addMetricBtn.addEventListener('click', () => {
        const newRow = document.createElement('div');
        newRow.className = 'metric-row';
        newRow.setAttribute('data-index', metricIndex);
        newRow.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: var(--spacing-sm); align-items: start; padding: var(--spacing-md); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg);';
        newRow.innerHTML = `
            <div>
                <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500; font-size: 0.875rem;">Metric Name</label>
                <input type="text" name="metric_name_${metricIndex}" value="" required style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--card-bg); color: var(--text);">
            </div>
            <div>
                <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500; font-size: 0.875rem;">Target</label>
                <input type="number" name="metric_target_${metricIndex}" value="0" min="0" required style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--card-bg); color: var(--text);">
            </div>
            <div>
                <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500; font-size: 0.875rem;">Actual</label>
                <input type="number" name="metric_actual_${metricIndex}" value="0" min="0" required style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--card-bg); color: var(--text);">
            </div>
            <div style="padding-top: 24px;">
                <button type="button" class="remove-metric-btn" style="background: var(--error-bg); color: var(--error); border: none; border-radius: var(--radius); padding: var(--spacing-sm); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
            </div>
        `;
        metricsContainer.appendChild(newRow);
        metricIndex++;
        lucide.createIcons(); // Re-render icons
    });

    // Remove metric row (event delegation)
    metricsContainer.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-metric-btn');
        if (removeBtn) {
            const row = removeBtn.closest('.metric-row');
            if (metricsContainer.querySelectorAll('.metric-row').length > 1) {
                row.remove();
            } else {
                alert('You must have at least one metric.');
            }
        }
    });

    // Generate JSON
    saveBtn.addEventListener('click', () => {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const json = generateEOSJson(data);
        
        jsonContent.textContent = json;
        jsonOutput.style.display = 'block';
        lucide.createIcons();
    });

    // Copy to clipboard
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(jsonContent.textContent);
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i data-lucide="check" style="width: 14px; height: 14px;"></i> Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                lucide.createIcons();
            }, 2000);
        } catch (err) {
            alert('Failed to copy to clipboard. Please select and copy manually.');
        }
    });
}
