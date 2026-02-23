// BNI Metrics Dashboard
import { sampleData } from '../../data/sample-data.js';
import { getBNIData, generateBNIJson, isLiveData } from '../data-loader.js';

export async function renderBNI() {
    // Try loading live data, fall back to sample data
    let bni = null;
    let dataStatus = 'sample';
    
    try {
        const liveData = await getBNIData();
        if (liveData && isLiveData(liveData)) {
            bni = liveData;
            dataStatus = 'live';
        }
    } catch (error) {
        console.error('Error loading BNI data:', error);
    }
    
    // Fallback to sample data if live data unavailable
    if (!bni) {
        bni = sampleData.bni;
    }

    const oneOnOneProgress = (bni.oneOnOnes.thisWeek / bni.oneOnOnes.target) * 100;
    const lastUpdated = bni.lastUpdated 
        ? new Date(bni.lastUpdated).toLocaleString('en-US', { 
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
                <h2>BNI Metrics</h2>
                <p>${bni.chapter} Chapter - member count, visitor tracking, referral pipeline, attendance</p>
            </div>
            <button id="editBniBtn" class="btn btn-primary">
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
                <div class="stat-icon info">
                    <i data-lucide="users"></i>
                </div>
                <div class="stat-label">Chapter Members</div>
                <div class="stat-value">${bni.memberCount}</div>
                <div class="stat-meta">${bni.chapter}</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon success">
                    <i data-lucide="user-plus"></i>
                </div>
                <div class="stat-label">Visitors This Month</div>
                <div class="stat-value">${bni.visitorCount}</div>
                <div class="stat-meta">Potential members</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon ${bni.attendance.thisMonth >= 90 ? 'success' : 'warning'}">
                    <i data-lucide="calendar-check"></i>
                </div>
                <div class="stat-label">Attendance Rate</div>
                <div class="stat-value">${bni.attendance.thisMonth}%</div>
                <div class="stat-meta">Last month: ${bni.attendance.lastMonth}%</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon ${bni.oneOnOnes.thisWeek >= bni.oneOnOnes.target ? 'success' : 'warning'}">
                    <i data-lucide="coffee"></i>
                </div>
                <div class="stat-label">121s This Week</div>
                <div class="stat-value">${bni.oneOnOnes.thisWeek}/${bni.oneOnOnes.target}</div>
                <div class="stat-meta">Target: ${bni.oneOnOnes.target}/week</div>
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Referral Activity</h3>
                </div>
                <div class="card-body">
                    <ul class="list">
                        <li class="list-item">
                            <span>Referrals Given</span>
                            <strong style="color: var(--success);">${bni.referralsGiven}</strong>
                        </li>
                        <li class="list-item">
                            <span>Referrals Received</span>
                            <strong style="color: var(--info);">${bni.referralsReceived}</strong>
                        </li>
                        <li class="list-item">
                            <span>Pending Follow-up</span>
                            <strong style="color: var(--warning);">${bni.referralsPending}</strong>
                        </li>
                    </ul>
                    <div style="margin-top: var(--spacing-lg);">
                        <div class="chart-container">
                            <canvas id="referralChart" data-chart="bar" data-chart-data='${JSON.stringify({
                                labels: ['Given', 'Received', 'Pending'],
                                datasets: [{
                                    label: 'Referrals',
                                    data: [bni.referralsGiven, bni.referralsReceived, bni.referralsPending],
                                    backgroundColor: [
                                        'rgba(16, 185, 129, 0.5)',
                                        'rgba(59, 130, 246, 0.5)',
                                        'rgba(245, 158, 11, 0.5)'
                                    ],
                                    borderColor: [
                                        'rgb(16, 185, 129)',
                                        'rgb(59, 130, 246)',
                                        'rgb(245, 158, 11)'
                                    ],
                                    borderWidth: 2
                                }]
                            })}'></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">121 Progress</h3>
                </div>
                <div class="card-body">
                    <div style="text-align: center; margin-bottom: var(--spacing-lg);">
                        <div style="font-size: 3rem; font-weight: 700; color: ${oneOnOneProgress >= 100 ? 'var(--success)' : 'var(--warning)'};">
                            ${oneOnOneProgress.toFixed(0)}%
                        </div>
                        <div style="color: var(--text-secondary);">
                            ${bni.oneOnOnes.thisWeek} of ${bni.oneOnOnes.target} meetings
                        </div>
                    </div>
                    <div class="progress" style="height: 16px;">
                        <div class="progress-bar ${oneOnOneProgress >= 100 ? 'success' : 'warning'}" style="width: ${Math.min(oneOnOneProgress, 100)}%"></div>
                    </div>
                    <div style="margin-top: var(--spacing-lg); padding-top: var(--spacing-lg); border-top: 1px solid var(--border);">
                        <p style="color: var(--text-secondary); font-size: 0.875rem;">
                            ${oneOnOneProgress >= 100 ? 
                                '✓ Great job! You\'ve hit your weekly target.' : 
                                `Need ${bni.oneOnOnes.target - bni.oneOnOnes.thisWeek} more 121s to hit target.`
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="card" style="margin-top: var(--spacing-lg);">
            <div class="card-header">
                <h3 class="card-title">Attendance Trend</h3>
            </div>
            <div class="card-body">
                <div class="chart-container">
                    <canvas id="attendanceChart" data-chart="line" data-chart-data='${JSON.stringify({
                        labels: ['Last Month', 'This Month'],
                        datasets: [{
                            label: 'Attendance %',
                            data: [bni.attendance.lastMonth, bni.attendance.thisMonth],
                            borderColor: 'rgb(99, 102, 241)',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            borderWidth: 3,
                            fill: true
                        }]
                    })}'></canvas>
                </div>
            </div>
        </div>

        <div class="card" style="margin-top: var(--spacing-lg);">
            <div class="card-header">
                <h3 class="card-title">Chapter Info</h3>
            </div>
            <div class="card-body">
                <ul class="list">
                    <li class="list-item">
                        <span>Chapter Name</span>
                        <strong>${bni.chapter}</strong>
                    </li>
                    <li class="list-item">
                        <span>Total Members</span>
                        <strong>${bni.memberCount}</strong>
                    </li>
                    <li class="list-item">
                        <span>Meeting Day</span>
                        <strong>Tuesday 7:00 AM</strong>
                    </li>
                    ${bni.notes ? `
                        <li class="list-item" style="flex-direction: column; align-items: flex-start;">
                            <span>Notes</span>
                            <div style="color: var(--text-secondary); font-size: 0.875rem; margin-top: var(--spacing-xs);">${bni.notes}</div>
                        </li>
                    ` : ''}
                </ul>
            </div>
        </div>

        <!-- Edit Form Modal (hidden by default) -->
        <div id="bniEditModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 1000; padding: var(--spacing-lg); overflow-y: auto;">
            <div style="max-width: 600px; margin: 0 auto; background: var(--card-bg); border-radius: var(--radius); padding: var(--spacing-xl); box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
                    <h3 style="margin: 0;">Edit BNI Metrics</h3>
                    <button id="closeBniModal" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.5rem; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">×</button>
                </div>

                <form id="bniEditForm">
                    <div style="display: grid; gap: var(--spacing-md);">
                        <div>
                            <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">Chapter Name</label>
                            <input type="text" name="chapter" value="${bni.chapter}" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
                            <div>
                                <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">Total Members</label>
                                <input type="number" name="memberCount" value="${bni.memberCount}" min="0" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">Visitors This Month</label>
                                <input type="number" name="visitorCount" value="${bni.visitorCount}" min="0" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
                            <div>
                                <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">Attendance This Month (%)</label>
                                <input type="number" name="attendanceThisMonth" value="${bni.attendance.thisMonth}" min="0" max="100" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">Attendance Last Month (%)</label>
                                <input type="number" name="attendanceLastMonth" value="${bni.attendance.lastMonth}" min="0" max="100" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
                            <div>
                                <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">121s This Week</label>
                                <input type="number" name="oneOnOnesThisWeek" value="${bni.oneOnOnes.thisWeek}" min="0" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">121s Target</label>
                                <input type="number" name="oneOnOnesTarget" value="${bni.oneOnOnes.target}" min="0" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--spacing-md);">
                            <div>
                                <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">Referrals Given</label>
                                <input type="number" name="referralsGiven" value="${bni.referralsGiven}" min="0" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">Referrals Received</label>
                                <input type="number" name="referralsReceived" value="${bni.referralsReceived}" min="0" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">Pending Follow-up</label>
                                <input type="number" name="referralsPending" value="${bni.referralsPending}" min="0" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text);">
                            </div>
                        </div>

                        <div>
                            <label style="display: block; margin-bottom: var(--spacing-xs); font-weight: 500;">Notes (Optional)</label>
                            <textarea name="notes" rows="3" style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text); resize: vertical;">${bni.notes || ''}</textarea>
                        </div>

                        <div style="display: flex; gap: var(--spacing-md); margin-top: var(--spacing-lg);">
                            <button type="button" id="saveBniBtn" class="btn btn-primary" style="flex: 1;">
                                <i data-lucide="save" style="width: 16px; height: 16px;"></i>
                                Generate Update JSON
                            </button>
                            <button type="button" id="cancelBniBtn" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </form>

                <!-- JSON Output (hidden until generated) -->
                <div id="bniJsonOutput" style="display: none; margin-top: var(--spacing-lg); padding: var(--spacing-md); background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
                        <strong>Updated JSON:</strong>
                        <button type="button" id="copyBniJsonBtn" class="btn btn-sm btn-secondary">
                            <i data-lucide="copy" style="width: 14px; height: 14px;"></i>
                            Copy to Clipboard
                        </button>
                    </div>
                    <pre id="bniJsonContent" style="background: var(--code-bg); padding: var(--spacing-md); border-radius: var(--radius); overflow-x: auto; font-size: 0.875rem; margin: 0;"></pre>
                    <p style="margin-top: var(--spacing-md); color: var(--text-secondary); font-size: 0.875rem;">
                        <strong>Instructions:</strong> Copy this JSON and save it to <code>data/bni-metrics.json</code> in the repo, then commit and push to GitHub. The dashboard will update automatically.
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Initialize event listeners after render
export function initBNI() {
    const editBtn = document.getElementById('editBniBtn');
    const modal = document.getElementById('bniEditModal');
    const closeBtn = document.getElementById('closeBniModal');
    const cancelBtn = document.getElementById('cancelBniBtn');
    const saveBtn = document.getElementById('saveBniBtn');
    const form = document.getElementById('bniEditForm');
    const jsonOutput = document.getElementById('bniJsonOutput');
    const jsonContent = document.getElementById('bniJsonContent');
    const copyBtn = document.getElementById('copyBniJsonBtn');

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
        const json = generateBNIJson(data);
        
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
