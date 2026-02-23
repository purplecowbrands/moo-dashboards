// CRM Overview Dashboard
import { sampleData } from '../data/sample-data.js';

export function renderCRM() {
    const { crm } = sampleData;

    return `
        <div class="page-header">
            <h2>CRM Overview</h2>
            <p>Contacts browser, interaction history, introduction tracking</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="users"></i>
                </div>
                <div class="stat-label">Total Contacts</div>
                <div class="stat-value">${crm.totalContacts.toLocaleString()}</div>
                <div class="stat-meta">All contacts in system</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon success">
                    <i data-lucide="message-circle"></i>
                </div>
                <div class="stat-label">Recent Interactions</div>
                <div class="stat-value">${crm.recentInteractions.length}</div>
                <div class="stat-meta">Last 7 days</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon warning">
                    <i data-lucide="user-plus"></i>
                </div>
                <div class="stat-label">Pending Introductions</div>
                <div class="stat-value">${crm.introductions.pending}</div>
                <div class="stat-meta">${crm.introductions.completed} completed</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="star"></i>
                </div>
                <div class="stat-label">Top Connections</div>
                <div class="stat-value">${crm.topContacts.length}</div>
                <div class="stat-meta">Most engaged contacts</div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Recent Interactions</h3>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Contact</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${crm.recentInteractions.map(interaction => `
                                <tr>
                                    <td><strong>${interaction.contactName}</strong></td>
                                    <td><span class="badge info">${interaction.type}</span></td>
                                    <td>${interaction.date}</td>
                                    <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${interaction.notes}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="card" style="margin-top: var(--spacing-lg);">
            <div class="card-header">
                <h3 class="card-title">Top Contacts</h3>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Company</th>
                                <th>Calendar Events</th>
                                <th>Connections</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${crm.topContacts.map(contact => `
                                <tr>
                                    <td><strong>${contact.name}</strong></td>
                                    <td>${contact.company}</td>
                                    <td>${contact.calendarEvents}</td>
                                    <td>${contact.connections}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="card" style="margin-top: var(--spacing-lg);">
            <div class="card-header">
                <h3 class="card-title">Introduction Tracking</h3>
            </div>
            <div class="card-body">
                ${crm.introductions.pending === 0 ? `
                    <div class="empty-state">
                        <i data-lucide="check-circle"></i>
                        <p>No pending introductions</p>
                        <p style="font-size: 0.875rem; color: var(--text-tertiary);">${crm.introductions.completed} introductions completed</p>
                    </div>
                ` : `
                    <p>Pending introductions will appear here</p>
                `}
            </div>
        </div>
    `;
}
