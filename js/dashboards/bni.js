// BNI Metrics Dashboard
import { sampleData } from '../data/sample-data.js';

export function renderBNI() {
    const { bni } = sampleData;
    const oneOnOneProgress = (bni.oneOnOnes.thisWeek / bni.oneOnOnes.target) * 100;

    return `
        <div class="page-header">
            <h2>BNI Metrics</h2>
            <p>${bni.chapter} Chapter - member count, visitor tracking, referral pipeline, attendance</p>
        </div>

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
                </ul>
            </div>
        </div>
    `;
}
