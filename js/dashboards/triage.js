// Contact Triage Dashboard
// 6-tier wizard for CRM cleanup: classify and decide on all contacts

import { showToast } from '../app.js';
import { getCRMData } from '../data-loader.js';

let triageState = {
  decisions: {}, // contactId -> 'keep' | 'delete' | 'important'
  currentTier: 1,
  sampleMode: {}, // tierId -> boolean
  dragSelected: new Set() // for bulk actions
};

const TIERS = [
  { id: 1, name: 'Most Likely Valid', icon: '✓', desc: 'BNI contacts and Kloudly-only contacts' },
  { id: 2, name: 'Quick Confirm', icon: '⚡', desc: 'Exist in both Kloudly and Pipedrive' },
  { id: 3, name: 'Pipedrive Rescue', icon: '🔍', desc: 'Pipedrive-only contacts' },
  { id: 4, name: 'Shared & Built', icon: '🏢', desc: 'Company contacts and Built Designs' },
  { id: 5, name: 'Untagged', icon: '❓', desc: 'No tags assigned' },
  { id: 6, name: 'Junk Cleanup', icon: '🗑️', desc: 'Pre-identified junk patterns' }
];

export async function renderTriageAsync() {
  const container = document.getElementById('dashboard-content');
  
  // Show loading state
  container.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading contacts for triage...</p>
    </div>
  `;

  try {
    const crmData = await getCRMData();
    
    // Check if we have contacts
    if (!crmData.contacts || crmData.contacts.length === 0) {
      container.innerHTML = `
        <div class="error-state">
          <i data-lucide="alert-circle"></i>
          <h3>No Contacts Found</h3>
          <p>Load your CRM contacts to begin triaging.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    // Classify contacts into tiers
    const tierData = classifyContactsIntoTiers(crmData.contacts);
    
    // Restore saved decisions
    crmData.contacts.forEach(c => {
      if (c.triage) triageState.decisions[c.id] = c.triage;
    });

    // Initialize sample mode for large tiers
    TIERS.forEach(t => {
      const count = t.id === 6 ? 
        Object.values(tierData[6]).reduce((s, cat) => s + cat.contacts.length, 0) :
        tierData[t.id].length;
      triageState.sampleMode[t.id] = count >= 100;
    });

    renderTriage(tierData, crmData.contacts);
    lucide.createIcons();
    
  } catch (error) {
    container.innerHTML = `
      <div class="error-state">
        <i data-lucide="alert-circle"></i>
        <h3>Failed to Load Contacts</h3>
        <p>${error.message}</p>
      </div>
    `;
    lucide.createIcons();
    showToast('Failed to load contacts: ' + error.message, 'error');
  }
}

function classifyContactsIntoTiers(contacts) {
  const tierData = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: {} };

  // Tier 6 junk patterns
  const junkIds = new Set();
  const junkCategories = {
    mb2: { label: 'MB2 Dental Locations', contacts: [], desc: 'Company contains "MB2"' },
    emailName: { label: 'Email as Name', contacts: [], desc: 'Name contains "@"' },
    generic: { label: 'Generic Names', contacts: [], desc: 'Accounting, Contact, Info, etc.' }
  };
  const genericNames = ['accounting','contact','info','admin','office','reception','front desk','billing','support','sales','marketing','hr','human resources','payroll','dispatch','operations','management','service','maintenance','general','main','fax'];

  contacts.forEach(c => {
    // Check junk patterns first
    if (c.company && c.company.toLowerCase().includes('mb2')) {
      junkCategories.mb2.contacts.push(c);
      junkIds.add(c.id);
      return;
    }
    if (c.name && c.name.includes('@')) {
      junkCategories.emailName.contacts.push(c);
      junkIds.add(c.id);
      return;
    }
    if (c.name && genericNames.some(g => c.name.toLowerCase().trim() === g)) {
      junkCategories.generic.contacts.push(c);
      junkIds.add(c.id);
      return;
    }

    // Tier classification
    const tags = c.tags || [];
    const hasBNI = tags.some(t => t.toLowerCase().includes('bni'));
    const hasKloudly = tags.includes('Kloudly | Ben');
    const hasPipedrive = tags.includes('Pipedrive Contacts');
    const hasShared = tags.includes('All Company Contacts (Shared)');
    const hasBuilt = tags.includes('Built Designs');
    const noTags = tags.length === 0;

    if (hasBNI || (hasKloudly && !hasPipedrive)) {
      tierData[1].push(c);
    } else if (hasKloudly && hasPipedrive) {
      tierData[2].push(c);
    } else if (hasPipedrive && !hasKloudly) {
      tierData[3].push(c);
    } else if (hasShared || hasBuilt) {
      tierData[4].push(c);
    } else if (noTags) {
      tierData[5].push(c);
    } else {
      tierData[5].push(c);
    }
  });

  tierData[6] = junkCategories;
  return tierData;
}

function renderTriage(tierData, allContacts) {
  const container = document.getElementById('dashboard-content');
  
  // Calculate tallies
  const tally = calculateTally(allContacts);
  
  container.innerHTML = `
    <div class="triage-header">
      <div class="triage-title">
        <h1>⚡ Contact Triage</h1>
        <p class="subtitle">Classify and clean up your CRM - 6-tier decision wizard</p>
      </div>
      
      <div class="triage-tally">
        <div class="tally-item keep">
          <i data-lucide="check"></i>
          <span>Recognize: <strong>${tally.keep}</strong></span>
        </div>
        <div class="tally-item delete">
          <i data-lucide="x"></i>
          <span>Don't Recognize: <strong>${tally.delete}</strong></span>
        </div>
        <div class="tally-item important">
          <i data-lucide="star"></i>
          <span>Important: <strong>${tally.important}</strong></span>
        </div>
        <div class="tally-item remain">
          <i data-lucide="circle"></i>
          <span>Remaining: <strong>${tally.remain}</strong></span>
        </div>
      </div>

      <div class="triage-actions">
        <button class="btn btn-primary" onclick="window.saveTriageProgress()">
          <i data-lucide="save"></i>
          Save Progress
        </button>
        <button class="btn btn-success" onclick="window.applyTriageClean()">
          <i data-lucide="trash-2"></i>
          Apply & Clean
        </button>
      </div>
    </div>

    <div class="triage-tabs">
      ${TIERS.map((t, i) => {
        const count = t.id === 6 ? 
          Object.values(tierData[6]).reduce((s, cat) => s + cat.contacts.length, 0) :
          tierData[t.id].length;
        return `
          <button class="triage-tab ${i === 0 ? 'active' : ''}" data-tier="${t.id}" onclick="window.switchTriageTier(${t.id})">
            <span class="tier-icon">${t.icon}</span>
            <span class="tier-name">${t.name}</span>
            <span class="tier-count">${count}</span>
          </button>
        `;
      }).join('')}
    </div>

    <div class="triage-search">
      <input 
        type="text" 
        id="globalTriageSearch" 
        placeholder="🔍 Search all contacts by name, company, email..." 
        oninput="window.handleTriageSearch(this.value)"
      >
    </div>

    <div class="triage-content">
      ${TIERS.map((t, i) => {
        return `<div class="tier-panel ${i === 0 ? 'active' : ''}" data-tier="${t.id}">
          ${renderTierContent(t, tierData[t.id], allContacts)}
        </div>`;
      }).join('')}
      
      <div class="tier-panel" data-tier="search" style="display: none;">
        <div id="searchResultsContent"></div>
      </div>
    </div>
  `;

  // Expose functions to window for onclick handlers
  window.switchTriageTier = (tierId) => switchTier(tierId, tierData, allContacts);
  window.handleTriageSearch = (query) => handleSearch(query, allContacts);
  window.saveTriageProgress = () => saveProgress(allContacts);
  window.applyTriageClean = () => applyClean(allContacts);
  window.triageDecide = (id, decision) => decide(id, decision, allContacts);
  window.triageDecideCompany = (company, decision, tierData) => decideCompany(company, decision, tierData, allContacts);
}

function renderTierContent(tier, tierContacts, allContacts) {
  if (tier.id === 6) {
    // Junk cleanup - special rendering
    return renderJunkTier(tierContacts);
  }

  const displayList = getSampleList(tierContacts, tier.id);
  const decided = tierContacts.filter(c => triageState.decisions[c.id]).length;

  return `
    <div class="tier-header">
      <h2>${tier.icon} ${tier.name}</h2>
      <p class="tier-description">${tier.desc}</p>
      <div class="tier-progress">
        <span>${decided} of ${tierContacts.length} reviewed</span>
      </div>
    </div>

    ${tierContacts.length >= 100 ? renderSampleBanner(tier.id, tierContacts.length) : ''}

    <div class="contacts-grid">
      ${displayList.map(c => renderContactCard(c)).join('')}
    </div>
  `;
}

function renderJunkTier(junkCategories) {
  return `
    <div class="tier-header">
      <h2>🗑️ Junk Cleanup</h2>
      <p class="tier-description">Pre-identified junk patterns. Review or bulk-mark.</p>
    </div>

    ${Object.entries(junkCategories).map(([key, cat]) => `
      <div class="junk-category card">
        <h3>${cat.label} - <span class="junk-count">${cat.contacts.length}</span> contacts</h3>
        <p class="category-desc">${cat.desc}</p>
        <div class="junk-actions">
          <button class="btn btn-sm btn-danger" onclick="window.bulkDecideJunk('${key}', 'delete')">
            <i data-lucide="x"></i> Don't Recognize All
          </button>
          <button class="btn btn-sm btn-success" onclick="window.bulkDecideJunk('${key}', 'keep')">
            <i data-lucide="check"></i> Recognize All
          </button>
          <button class="btn btn-sm btn-warning" onclick="window.bulkDecideJunk('${key}', 'important')">
            <i data-lucide="star"></i> Important All
          </button>
        </div>
        <div id="junk-expand-${key}" class="junk-contacts" style="display: none;">
          ${cat.contacts.map(c => renderContactCard(c)).join('')}
        </div>
        <button class="btn btn-sm" onclick="document.getElementById('junk-expand-${key}').style.display = document.getElementById('junk-expand-${key}').style.display === 'none' ? 'block' : 'none'">
          <i data-lucide="list"></i> Review Contacts
        </button>
      </div>
    `).join('')}
  `;
}

function renderContactCard(contact) {
  const decision = triageState.decisions[contact.id];
  const statusClass = decision === 'keep' ? 'kept' : decision === 'delete' ? 'deleted' : decision === 'important' ? 'important' : '';
  
  return `
    <div class="contact-card ${statusClass}" data-contact-id="${contact.id}">
      <div class="contact-info">
        <div class="contact-name">${escapeHtml(contact.name)}</div>
        <div class="contact-meta">
          ${contact.company ? `<span><i data-lucide="building-2"></i> ${escapeHtml(contact.company)}</span>` : ''}
          ${contact.title ? `<span>${escapeHtml(contact.title)}</span>` : ''}
          ${contact.email ? `<span><i data-lucide="mail"></i> ${escapeHtml(contact.email)}</span>` : ''}
          ${contact.phone ? `<span><i data-lucide="phone"></i> ${escapeHtml(contact.phone)}</span>` : ''}
        </div>
      </div>
      <div class="contact-actions">
        <button class="btn btn-sm btn-success" onclick="window.triageDecide('${contact.id}', 'keep')" title="Recognize">
          <i data-lucide="check"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="window.triageDecide('${contact.id}', 'delete')" title="Don't Recognize">
          <i data-lucide="x"></i>
        </button>
        <button class="btn btn-sm btn-warning" onclick="window.triageDecide('${contact.id}', 'important')" title="Important">
          <i data-lucide="star"></i>
        </button>
      </div>
    </div>
  `;
}

function renderSampleBanner(tierId, totalCount) {
  const isSampling = triageState.sampleMode[tierId];
  const sampleCount = Math.max(1, Math.ceil(totalCount * 0.02));
  
  if (isSampling) {
    return `
      <div class="sample-banner info">
        <div class="banner-content">
          <i data-lucide="bar-chart-2"></i>
          <span>Showing 2% random sample (<strong>${sampleCount}</strong> of ${totalCount} contacts)</span>
        </div>
        <button class="btn btn-sm" onclick="window.toggleSampleMode(${tierId})">
          Show All ${totalCount}
        </button>
      </div>
    `;
  } else {
    return `
      <div class="sample-banner info">
        <div class="banner-content">
          <i data-lucide="list"></i>
          <span>Showing all <strong>${totalCount}</strong> contacts</span>
        </div>
        <button class="btn btn-sm" onclick="window.toggleSampleMode(${tierId})">
          Show 2% Sample
        </button>
      </div>
    `;
  }
}

function getSampleList(fullList, tierId) {
  if (triageState.sampleMode[tierId] && fullList.length >= 100) {
    // Deterministic 2% sample
    const shuffled = [...fullList].sort((a, b) => hashId(a.id) - hashId(b.id));
    const count = Math.max(1, Math.ceil(fullList.length * 0.02));
    return shuffled.slice(0, count);
  }
  return fullList;
}

function hashId(id) {
  let hash = 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function switchTier(tierId, tierData, allContacts) {
  triageState.currentTier = tierId;
  
  // Update tabs
  document.querySelectorAll('.triage-tab').forEach(tab => {
    tab.classList.toggle('active', parseInt(tab.dataset.tier) === tierId);
  });
  
  // Update panels
  document.querySelectorAll('.tier-panel').forEach(panel => {
    if (panel.dataset.tier === 'search') {
      panel.style.display = 'none';
    } else {
      panel.classList.toggle('active', parseInt(panel.dataset.tier) === tierId);
    }
  });
  
  document.getElementById('globalTriageSearch').value = '';
  lucide.createIcons();
}

function handleSearch(query, allContacts) {
  const q = query.trim().toLowerCase();
  
  if (q.length < 2) {
    // Show current tier
    document.querySelectorAll('.tier-panel').forEach(panel => {
      if (panel.dataset.tier === 'search') {
        panel.style.display = 'none';
      } else {
        panel.classList.toggle('active', parseInt(panel.dataset.tier) === triageState.currentTier);
      }
    });
    return;
  }

  // Hide all tiers, show search results
  document.querySelectorAll('.tier-panel').forEach(panel => {
    if (panel.dataset.tier === 'search') {
      panel.style.display = 'block';
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  const results = allContacts.filter(c =>
    (c.name || '').toLowerCase().includes(q) ||
    (c.company || '').toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q)
  ).slice(0, 100);

  const searchContent = document.getElementById('searchResultsContent');
  searchContent.innerHTML = `
    <div class="search-results">
      <h3>🔍 Search Results: ${results.length}${results.length >= 100 ? ' (showing first 100)' : ''} matches for "${escapeHtml(query)}"</h3>
      <div class="contacts-grid">
        ${results.map(c => renderContactCard(c)).join('')}
      </div>
    </div>
  `;
  
  lucide.createIcons();
}

function decide(id, decision, allContacts) {
  triageState.decisions[id] = decision;
  
  const card = document.querySelector(`[data-contact-id="${id}"]`);
  if (card) {
    card.classList.remove('kept', 'deleted', 'important');
    if (decision === 'keep') card.classList.add('kept');
    else if (decision === 'delete') card.classList.add('deleted');
    else if (decision === 'important') card.classList.add('important');
  }
  
  updateTally(allContacts);
}

function decideCompany(companyName, decision, tierData, allContacts) {
  // Find all contacts with this company in current tier
  const currentTierContacts = tierData[triageState.currentTier] || [];
  currentTierContacts
    .filter(c => c.company === companyName)
    .forEach(c => {
      triageState.decisions[c.id] = decision;
      const card = document.querySelector(`[data-contact-id="${c.id}"]`);
      if (card) {
        card.classList.remove('kept', 'deleted', 'important');
        if (decision === 'keep') card.classList.add('kept');
        else if (decision === 'delete') card.classList.add('deleted');
        else if (decision === 'important') card.classList.add('important');
      }
    });
  
  updateTally(allContacts);
}

function calculateTally(allContacts) {
  let keep = 0, del = 0, imp = 0, remain = 0;
  allContacts.forEach(c => {
    const d = triageState.decisions[c.id];
    if (d === 'keep') keep++;
    else if (d === 'delete') del++;
    else if (d === 'important') imp++;
    else remain++;
  });
  return { keep, delete: del, important: imp, remain };
}

function updateTally(allContacts) {
  const tally = calculateTally(allContacts);
  
  const tallyItems = document.querySelectorAll('.tally-item strong');
  if (tallyItems.length >= 4) {
    tallyItems[0].textContent = tally.keep;
    tallyItems[1].textContent = tally.delete;
    tallyItems[2].textContent = tally.important;
    tallyItems[3].textContent = tally.remain;
  }
}

function saveProgress(allContacts) {
  const data = allContacts.map(c => {
    const out = { ...c };
    if (triageState.decisions[c.id]) out.triage = triageState.decisions[c.id];
    return out;
  });
  
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, 'contacts-triage.json', 'application/json');
  showToast('Triage progress saved to contacts-triage.json', 'success');
}

function applyClean(allContacts) {
  const remaining = allContacts.filter(c => triageState.decisions[c.id] !== 'delete');
  const importantContacts = allContacts.filter(c => triageState.decisions[c.id] === 'important');
  const undecided = allContacts.filter(c => !triageState.decisions[c.id]).length;

  if (undecided > 0) {
    if (!confirm(`⚠ ${undecided} contacts haven't been reviewed yet. They will be KEPT in the clean file. Continue?`)) return;
  }

  const deleted = allContacts.length - remaining.length;
  if (!confirm(`This will generate:\n• contacts-clean.json with ${deleted} contacts REMOVED (${remaining.length} kept)\n• flagged-important.json with ${importantContacts.length} important contacts\n\nDownload both?`)) return;

  // Generate clean contacts file
  const cleanData = remaining.map(c => {
    const out = { ...c };
    out.triage = triageState.decisions[c.id] || 'keep';
    return out;
  });
  downloadFile(JSON.stringify(cleanData, null, 2), 'contacts-clean.json', 'application/json');

  // Generate flagged-important file
  const importantData = importantContacts.map(c => {
    const out = { ...c };
    out.triage = 'important';
    return out;
  });
  setTimeout(() => {
    downloadFile(JSON.stringify(importantData, null, 2), 'flagged-important.json', 'application/json');
  }, 500);

  showToast('Files generated successfully', 'success');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
