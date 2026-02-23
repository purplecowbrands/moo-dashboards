// Financial Overview Dashboard
import { sampleData } from '../../data/sample-data.js';
import { getFinancialData, generateFinancialJson, isLiveData } from '../data-loader.js';

export async function renderFinancial() {
    // Try loading live data, fall back to sample data
    let financial = null;
    let dataStatus = 'sample';
    
    try {
        const liveData = await getFinancialData();
        if (liveData && isLiveData(liveData)) {
            financial = liveData;
            dataStatus = 'live';
        }
    } catch (error) {
        console.error('Error loading Financial data:', error);
    }
    
    // Fallback to sample data if live data unavailable
    if (!financial) {
        financial = sampleData.financial;
    }

    const totalExpenses = Object.values(financial.expenses).reduce((sum, val) => sum + val, 0);
    const latestRevenue = financial.monthlyRevenue[financial.monthlyRevenue.length - 1].revenue;
    const lastUpdated = financial.lastUpdated 
        ? new Date(financial.lastUpdated).toLocaleString('en-US', { 
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
                <h2>Financial Overview</h2>
                <p>Revenue vs $285k target, MRR tracking toward $25k</p>
            </div>
            <button id="editFinancialBtn" class="btn btn-primary">
                <i data-lucide="edit-3" style="width: 16px; height: 16px;"></i>
                Edit Financial Data
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
                <span><strong>Sample Data</strong> - Click "Edit Financial Data" to set up live tracking</span>
            </div>
        `}

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon ${financial.revenue.percentage >= 50 ? 'success' : 'warning'}">
                    <i data-lucide="trending-up"></i>
                </div>
                <div class="stat-label">Annual Revenue</div>
                <div class="stat-value">$${(financial.revenue.current / 1000).toFixed(0)}k</div>
                <div class="stat-meta">
                    ${financial.revenue.percentage.toFixed(1)}% of $${(financial.revenue.target / 1000).toFixed(0)}k target
                </div>
                <div class="progress">
                    <div class="progress-bar ${financial.revenue.percentage >= 50 ? 'success' : 'warning'}" style="width: ${financial.revenue.percentage}%"></div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="repeat"></i>
                </div>
                <div class="stat-label">Monthly Recurring Revenue</div>
                <div class="stat-value">$${(financial.mrr.current / 1000).toFixed(1)}k</div>
                <div class="stat-meta">
                    ${financial.mrr.percentage.toFixed(1)}% of $${(financial.mrr.target / 1000).toFixed(0)}k target
                </div>
                <div class="progress">
                    <div class="progress-bar info" style="width: ${financial.mrr.percentage}%"></div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon success">
                    <i data-lucide="calendar"></i>
                </div>
                <div class="stat-label">Last Month Revenue</div>
                <div class="stat-value">$${(latestRevenue / 1000).toFixed(1)}k</div>
                <div class="stat-meta">${financial.monthlyRevenue[financial.monthlyRevenue.length - 1].month}</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon warning">
                    <i data-lucide="minus-circle"></i>
                </div>
                <div class="stat-label">Monthly Expenses</div>
                <div class="stat-value">$${(totalExpenses / 1000).toFixed(1)}k</div>
                <div class="stat-meta">Fixed costs</div>
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Revenue Trend</h3>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="revenueChart" data-chart="line" data-chart-data='${JSON.stringify({
                            labels: financial.monthlyRevenue.map(m => m.month),
                            datasets: [{
                                label: 'Monthly Revenue',
                                data: financial.monthlyRevenue.map(m => m.revenue),
                                borderColor: 'rgb(99, 102, 241)',
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                borderWidth: 3,
                                fill: true
                            }]
                        })}'></canvas>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Expense Breakdown</h3>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="expenseChart" data-chart="doughnut" data-chart-data='${JSON.stringify({
                            labels: Object.keys(financial.expenses).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
                            datasets: [{
                                data: Object.values(financial.expenses),
                                backgroundColor: [
                                    'rgba(99, 102, 241, 0.8)',
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
        </div>

        <div class="dashboard-grid" style="margin-top: var(--spacing-lg);">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Monthly Expenses</h3>
                </div>
                <div class="card-body">
                    <ul class="list">
                        ${Object.entries(financial.expenses).map(([key, value]) => `
                            <li class="list-item">
                                <span>${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                <strong>$${value.toLocaleString()}</strong>
                            </li>
                        `).join('')}
                        <li class="list-item" style="border-top: 2px solid var(--border); margin-top: var(--spacing-sm); padding-top: var(--spacing-md);">
                            <span><strong>Total</strong></span>
                            <strong>$${totalExpenses.toLocaleString()}</strong>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Goals & Targets</h3>
                </div>
                <div class="card-body">
                    <ul class="list">
                        <li class="list-item">
                            <div>
                                <strong>Annual Revenue Goal</strong>
                                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                    $${(financial.revenue.target - financial.revenue.current).toLocaleString()} remaining
                                </div>
                            </div>
                            <strong>$${(financial.revenue.target / 1000).toFixed(0)}k</strong>
                        </li>
                        <li class="list-item">
                            <div>
                                <strong>MRR Goal</strong>
                                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                    $${(financial.mrr.target - financial.mrr.current).toLocaleString()}/mo remaining
                                </div>
                            </div>
                            <strong>$${(financial.mrr.target / 1000).toFixed(0)}k</strong>
                        </li>
                        <li class="list-item">
                            <div>
                                <strong>Net Monthly</strong>
                                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                    Revenue minus expenses
                                </div>
                            </div>
                            <strong style="color: var(--success);">$${((latestRevenue - totalExpenses) / 1000).toFixed(1)}k</strong>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Edit Form Modal (hidden by default) -->
        <div id="financialEditModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 1000; padding: var(--spacing-lg); overflow-y: auto;">
            <div style="max-width: 700px; margin: 0 auto; background: var(--card-bg); border-radius: var(--radius); padding: var(--spacing-xl); box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
                    <h3 style="margin: 0;">Edit Financial Data</h3>
                    <button id="closeFinancialModal" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.5rem; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">×</button>
                </div>

                <form id="financialEditForm">
                    <div style="display: grid; gap: var(--spacing-md);">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
                            <div>
                                <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">Current Annual Revenue ($)</label>
                                <input type="number" name="revenueCurrent" value="${financial.revenue.current}" min="0" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">Annual Revenue Target ($)</label>
                                <input type="number" name="revenueTarget" value="${financial.revenue.target}" min="0" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
                            <div>
                                <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">Current MRR ($)</label>
                                <input type="number" name="mrrCurrent" value="${financial.mrr.current}" min="0" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">MRR Target ($)</label>
                                <input type="number" name="mrrTarget" value="${financial.mrr.target}" min="0" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                            </div>
                        </div>

                        <div>
                            <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">Monthly Revenue (Last 6 Months)</label>
                            <div style="display: grid; gap: var(--spacing-sm);">
                                ${Array.from({ length: 6 }, (_, i) => {
                                    const idx = Math.max(0, financial.monthlyRevenue.length - 6 + i);
                                    const entry = financial.monthlyRevenue[idx] || { month: '', revenue: 0 };
                                    return `
                                        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: var(--spacing-sm);">
                                            <input type="text" name="month_${i}" value="${entry.month}" placeholder="Month (e.g., Feb 2026)" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                                            <input type="number" name="revenue_${i}" value="${entry.revenue}" min="0" placeholder="Revenue ($)" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <div>
                            <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">Monthly Expenses</label>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
                                <div>
                                    <label style="display: block; margin-bottom: var(--spacing-xs); font-size: 0.875rem;">Payroll ($)</label>
                                    <input type="number" name="expensePayroll" value="${financial.expenses.payroll}" min="0" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: var(--spacing-xs); font-size: 0.875rem;">Tools & Software ($)</label>
                                    <input type="number" name="expenseTools" value="${financial.expenses.tools}" min="0" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: var(--spacing-xs); font-size: 0.875rem;">Marketing ($)</label>
                                    <input type="number" name="expenseMarketing" value="${financial.expenses.marketing}" min="0" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: var(--spacing-xs); font-size: 0.875rem;">Overhead ($)</label>
                                    <input type="number" name="expenseOverhead" value="${financial.expenses.overhead}" min="0" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">Notes (Optional)</label>
                            <textarea name="notes" rows="3" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text); resize: vertical;">${financial.notes || ''}</textarea>
                        </div>

                        <div style="display: flex; gap: var(--spacing-md); margin-top: var(--spacing-lg);">
                            <button type="button" id="saveFinancialBtn" class="btn btn-primary" style="flex: 1;">
                                <i data-lucide="save" style="width: 16px; height: 16px;"></i>
                                Generate Update JSON
                            </button>
                            <button type="button" id="cancelFinancialBtn" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </form>

                <!-- JSON Output (hidden until generated) -->
                <div id="financialJsonOutput" style="display: none; margin-top: var(--spacing-lg); padding: var(--spacing-md); background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
                        <strong>Updated JSON:</strong>
                        <button type="button" id="copyFinancialJsonBtn" class="btn btn-sm btn-secondary">
                            <i data-lucide="copy" style="width: 14px; height: 14px;"></i>
                            Copy to Clipboard
                        </button>
                    </div>
                    <pre id="financialJsonContent" style="background: var(--code-bg); padding: var(--spacing-md); border-radius: var(--radius); overflow-x: auto; font-size: 0.875rem; margin: 0;"></pre>
                    <p style="margin-top: var(--spacing-md); color: var(--text-secondary); font-size: 0.875rem;">
                        <strong>Instructions:</strong> Copy this JSON and save it to <code>data/financial.json</code> in the repo, then commit and push to GitHub. The dashboard will update automatically.
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Initialize event listeners after render
export function initFinancial() {
    const editBtn = document.getElementById('editFinancialBtn');
    const modal = document.getElementById('financialEditModal');
    const closeBtn = document.getElementById('closeFinancialModal');
    const cancelBtn = document.getElementById('cancelFinancialBtn');
    const saveBtn = document.getElementById('saveFinancialBtn');
    const form = document.getElementById('financialEditForm');
    const jsonOutput = document.getElementById('financialJsonOutput');
    const jsonContent = document.getElementById('financialJsonContent');
    const copyBtn = document.getElementById('copyFinancialJsonBtn');

    if (!editBtn || !modal) return;

    // Open modal
    editBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        jsonOutput.style.display = 'none';
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

    // Generate JSON
    saveBtn.addEventListener('click', () => {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const json = generateFinancialJson(data);
        
        jsonContent.textContent = json;
        jsonOutput.style.display = 'block';
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
