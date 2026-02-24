// CRM Overview Dashboard - redesigned per Ben's feedback
import { sampleData } from '../../data/sample-data.js';
import { getCRMData } from '../data-loader.js';

function formatDate(dateString) {
    if (!dateString) return 'No contact logged';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysSince(dateString) {
    if (!dateString) return 9999;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 9999;
    const now = new Date();
    return Math.floor((now - date) / (1000 * 60 * 60 * 24));
}

export async function renderCRM() {
    const crmData = await getCRMData();
    const isLive = !!crmData;

    if (!isLive) {
        return `
            <div class="page-header">
                <h2>CRM Overview</h2>
                <p>Contacts browser, interaction history, and follow-up queue</p>
            </div>

            <div class="alert warning" style="margin-bottom: var(--spacing-lg);">
                <i data-lucide="wifi-off"></i>
                <div>
                    <strong>Sample Data</strong>
                    <p>Live CRM files unavailable. Showing sample dashboard data.</p>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Recent Interactions</h3>
                </div>
                <div class="card-body">
                    <p>Live CRM data is required for this redesigned layout.</p>
                </div>
            </div>
        `;
    }

    const contacts = crmData.contacts || [];
    const interactions = (crmData.interactions || [])
        .filter(i => i && i.contactName)
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const recentInteractions = interactions.slice(0, 5);

    const lastInteractionByContact = {};
    interactions.forEach(interaction => {
        const key = (interaction.contactName || '').trim().toLowerCase();
        if (!key) return;
        const existing = lastInteractionByContact[key];
        const currentDate = new Date(interaction.date || 0);
        if (!existing || currentDate > existing) {
            lastInteractionByContact[key] = currentDate;
        }
    });

    const followUps = contacts
        .map(contact => {
            const key = (contact.name || '').trim().toLowerCase();
            const interactionDate = lastInteractionByContact[key];
            const lastTouch = interactionDate ? interactionDate.toISOString().slice(0, 10) : (contact.lastContact || '');
            const daysSince = getDaysSince(lastTouch);

            let score = 0;
            if (!lastTouch) score += 60;
            if (daysSince > 60) score += 40;
            else if (daysSince > 30) score += 30;
            else if (daysSince > 14) score += 20;
            else if (daysSince > 7) score += 10;

            const relationship = (contact.relationship || '').toLowerCase();
            if (relationship === 'hot') score += 20;
            if (relationship === 'warm') score += 12;
            if ((contact.triage || '').toLowerCase() === 'delete') score -= 100;

            return {
                name: contact.name || 'Unknown',
                company: contact.company || 'Unknown',
                relationship: contact.relationship || 'unknown',
                triage: contact.triage || 'untriaged',
                email: contact.email || '',
                phone: contact.phone || '',
                lastTouch,
                daysSince,
                score
            };
        })
        .filter(c => c.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    const browserRows = contacts.slice(0, 400).map(contact => {
        const key = (contact.name || '').trim().toLowerCase();
        const interactionDate = lastInteractionByContact[key];
        const lastTouch = interactionDate ? interactionDate.toISOString().slice(0, 10) : (contact.lastContact || '');
        return {
            name: contact.name || 'Unknown',
            company: contact.company || 'Unknown',
            triage: contact.triage || 'untriaged',
            relationship: contact.relationship || 'unknown',
            email: contact.email || '',
            phone: contact.phone || '',
            lastTouch
        };
    });

    return `
        <div class="page-header">
            <h2>CRM Overview</h2>
            <p>Recent activity, next follow-ups, and searchable contact browser</p>
        </div>

        <div class="alert success" style="margin-bottom: var(--spacing-lg);">
            <i data-lucide="wifi"></i>
            <div>
                <strong>Live Data</strong>
                <p>${contacts.length.toLocaleString()} contacts loaded from CRM files</p>
            </div>
        </div>

        <div class="crm-priority-grid">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Recent Interactions (Last 5)</h3>
                </div>
                <div class="card-body">
                    ${recentInteractions.length ? `
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
                                    ${recentInteractions.map(i => `
                                        <tr>
                                            <td><strong>${i.contactName || 'Unknown'}</strong></td>
                                            <td><span class="badge info">${i.type || 'other'}</span></td>
                                            <td>${formatDate(i.date)}</td>
                                            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${i.notes || ''}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `<p>No interactions found.</p>`}
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Next Follow-Ups (Top 5)</h3>
                </div>
                <div class="card-body">
                    ${followUps.length ? `
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Contact</th>
                                        <th>Last Touch</th>
                                        <th>Relationship</th>
                                        <th>Best Contact</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${followUps.map(f => `
                                        <tr>
                                            <td>
                                                <strong>${f.name}</strong>
                                                <div style="font-size: 0.8rem; color: var(--text-secondary);">${f.company}</div>
                                            </td>
                                            <td>${f.lastTouch ? `${formatDate(f.lastTouch)} (${f.daysSince}d)` : 'Never'}</td>
                                            <td><span class="badge warning" style="text-transform: capitalize;">${f.relationship}</span></td>
                                            <td style="font-size: 0.8rem; color: var(--text-secondary);">${f.email || f.phone || 'No contact method'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `<p>No follow-ups suggested yet.</p>`}
                </div>
            </div>
        </div>

        <div class="card" style="margin-top: var(--spacing-lg);">
            <div class="card-header crm-browser-header">
                <h3 class="card-title">Contact Browser</h3>
                <div class="crm-browser-controls">
                    <input id="crm-search" type="text" placeholder="Search name, company, email" class="crm-search-input" />
                    <select id="crm-triage-filter" class="crm-filter-select">
                        <option value="all">All triage groups</option>
                        <option value="follow-up">Follow-up</option>
                        <option value="later">Later</option>
                        <option value="watch">Watch</option>
                        <option value="untriaged">Untriaged</option>
                        <option value="delete">Delete</option>
                    </select>
                </div>
            </div>
            <div class="card-body">
                <p style="margin-bottom: 0.75rem; color: var(--text-secondary); font-size: 0.875rem;">Showing first ${browserRows.length} contacts for fast browsing. Use search and triage filter to narrow.</p>
                <div class="table-container">
                    <table id="crm-browser-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Company</th>
                                <th>Triage</th>
                                <th>Relationship</th>
                                <th>Last Touch</th>
                                <th>Contact</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${browserRows.map(c => `
                                <tr data-search="${`${c.name} ${c.company} ${c.email}`.toLowerCase()}" data-triage="${(c.triage || 'untriaged').toLowerCase()}">
                                    <td><strong>${c.name}</strong></td>
                                    <td>${c.company}</td>
                                    <td><span class="badge info" style="text-transform: capitalize;">${c.triage || 'untriaged'}</span></td>
                                    <td><span class="badge" style="text-transform: capitalize;">${c.relationship || 'unknown'}</span></td>
                                    <td>${formatDate(c.lastTouch)}</td>
                                    <td style="font-size: 0.8rem; color: var(--text-secondary);">${c.email || c.phone || 'No contact method'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <style>
            .crm-priority-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--spacing-lg);
            }

            @media (max-width: 1100px) {
                .crm-priority-grid {
                    grid-template-columns: 1fr;
                }
            }

            .crm-browser-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 0.75rem;
                flex-wrap: wrap;
            }

            .crm-browser-controls {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }

            .crm-search-input,
            .crm-filter-select {
                border: 1px solid var(--border);
                background: var(--bg-secondary);
                color: var(--text-primary);
                border-radius: 6px;
                padding: 0.45rem 0.65rem;
                font-size: 0.85rem;
            }

            .crm-search-input {
                min-width: 240px;
            }
        </style>

        <script>
            (function() {
                const searchInput = document.getElementById('crm-search');
                const triageFilter = document.getElementById('crm-triage-filter');
                const rows = Array.from(document.querySelectorAll('#crm-browser-table tbody tr'));

                function applyFilter() {
                    const search = (searchInput.value || '').toLowerCase().trim();
                    const triage = (triageFilter.value || 'all').toLowerCase();

                    rows.forEach(row => {
                        const haystack = row.getAttribute('data-search') || '';
                        const rowTriage = row.getAttribute('data-triage') || 'untriaged';

                        const matchesSearch = !search || haystack.includes(search);
                        const matchesTriage = triage === 'all' || rowTriage === triage;

                        row.style.display = (matchesSearch && matchesTriage) ? '' : 'none';
                    });
                }

                searchInput?.addEventListener('input', applyFilter);
                triageFilter?.addEventListener('change', applyFilter);
            })();
        </script>
    `;
}
