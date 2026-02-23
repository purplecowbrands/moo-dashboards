// CRM Overview Dashboard
import { sampleData } from '../../data/sample-data.js';
import { getCRMData, isLiveData } from '../data-loader.js';

export async function renderCRM() {
    // Try to load live data, fallback to sample
    let crmData = await getCRMData();
    let isLive = false;
    
    if (!crmData) {
        crmData = sampleData.crm;
    } else {
        isLive = true;
    }

    // Transform live data to match expected structure
    let crm;
    if (isLive) {
        const contacts = crmData.contacts || [];
        const interactions = crmData.interactions || [];
        const introductions = crmData.introductions || [];

        // Filter recent interactions (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentInteractions = interactions
            .filter(i => {
                const intDate = new Date(i.date);
                return intDate >= sevenDaysAgo;
            })
            .slice(0, 10) // Show latest 10
            .map(i => ({
                contactName: i.contactName || 'Unknown',
                type: i.type || 'other',
                date: i.date,
                notes: i.notes || ''
            }));

        // Calculate top contacts (by interaction count)
        const contactInteractionCount = {};
        interactions.forEach(i => {
            const name = i.contactName;
            if (name) {
                contactInteractionCount[name] = (contactInteractionCount[name] || 0) + 1;
            }
        });

        // Get top 10 contacts by interaction count
        const topContactNames = Object.entries(contactInteractionCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));

        // Enrich with contact details
        const topContacts = topContactNames.map(tc => {
            const contact = contacts.find(c => c.name === tc.name);
            return {
                name: tc.name,
                company: contact?.company || 'Unknown',
                calendarEvents: 0, // Would need calendar integration
                connections: tc.count
            };
        });

        // Count introductions
        const pendingIntros = introductions.filter(i => i.status === 'pending').length;
        const completedIntros = introductions.filter(i => i.status === 'completed').length;

        crm = {
            totalContacts: contacts.length,
            recentInteractions,
            topContacts,
            introductions: {
                pending: pendingIntros,
                completed: completedIntros
            }
        };
    } else {
        crm = crmData;
    }

    const dataStatusBanner = isLive ? `
        <div class="alert success" style="margin-bottom: var(--spacing-lg);">
            <i data-lucide="wifi"></i>
            <div>
                <strong>Live Data</strong>
                <p>Connected to workspace CRM files (${crm.totalContacts.toLocaleString()} contacts)</p>
            </div>
        </div>
    ` : `
        <div class="alert warning" style="margin-bottom: var(--spacing-lg);">
            <i data-lucide="wifi-off"></i>
            <div>
                <strong>Sample Data</strong>
                <p>Live data not available - showing sample data</p>
            </div>
        </div>
    `;

    return `
        <div class="page-header">
            <h2>CRM Overview</h2>
            <p>Contacts browser, interaction history, introduction tracking</p>
        </div>

        ${dataStatusBanner}

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
                ${crm.recentInteractions.length > 0 ? `
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
                ` : `
                    <div class="empty-state">
                        <i data-lucide="message-circle-off"></i>
                        <p>No recent interactions</p>
                        <p style="font-size: 0.875rem; color: var(--text-tertiary);">Interactions from the last 7 days will appear here</p>
                    </div>
                `}
            </div>
        </div>

        <div class="card" style="margin-top: var(--spacing-lg);">
            <div class="card-header">
                <h3 class="card-title">Top Contacts</h3>
            </div>
            <div class="card-body">
                ${crm.topContacts.length > 0 ? `
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
                ` : `
                    <div class="empty-state">
                        <i data-lucide="users-round"></i>
                        <p>No top contacts yet</p>
                        <p style="font-size: 0.875rem; color: var(--text-tertiary);">Contacts with the most interactions will appear here</p>
                    </div>
                `}
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
