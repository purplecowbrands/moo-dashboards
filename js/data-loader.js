// Data Loader - Fetch real data from workspace files and APIs
// This module provides live data loading for all dashboards

// Use relative paths for data files (served from /data directory)
const DATA_CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache helper
function getCached(key) {
    const cached = DATA_CACHE.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return null;
}

function setCache(key, data) {
    DATA_CACHE.set(key, { data, timestamp: Date.now() });
}

// Generic fetch with error handling
async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
        return null;
    }
}

async function fetchText(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) return null; // File doesn't exist
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
        return null;
    }
}

// =========================
// MONITORING DATA
// =========================

export async function getMonitoringData() {
    const cached = getCached('monitoring');
    if (cached) return cached;

    // Load sites list
    const sitesData = await fetchJSON('/data/monitoring/sites.json');
    if (!sitesData) return null;

    // Load monitoring index (status data)
    const indexData = await fetchJSON('/data/monitoring/index.json');
    
    // Load alert file (may not exist)
    const alertText = await fetchText('/data/monitoring/ALERT_PENDING.txt');

    // Parse and aggregate data
    const sites = sitesData.sites || [];
    const platformCounts = {};
    
    sites.forEach(site => {
        platformCounts[site.platform] = (platformCounts[site.platform] || 0) + 1;
    });

    // Build site status list
    const siteStatuses = sites.map(site => {
        const siteData = indexData?.sites?.[site.name];
        const monitoredPages = siteData?.pages?.filter(p => p.monitored) || [];
        
        return {
            name: site.name,
            url: site.url,
            platform: site.platform,
            pagesMonitored: monitoredPages.length,
            status: 'up', // Default - would need to check actual status from monitoring runs
            responseTime: null,
            lastCheck: indexData?.lastUpdated || null
        };
    });

    // Sort: down/warning first, then by name
    siteStatuses.sort((a, b) => {
        if (a.status !== b.status) {
            const order = { down: 0, warning: 1, up: 2 };
            return order[a.status] - order[b.status];
        }
        return a.name.localeCompare(b.name);
    });

    // Count statuses
    const statusCounts = {
        up: siteStatuses.filter(s => s.status === 'up').length,
        down: siteStatuses.filter(s => s.status === 'down').length,
        warning: siteStatuses.filter(s => s.status === 'warning').length
    };

    // Parse alerts if any
    const alerts = [];
    if (alertText) {
        // Parse ALERT_PENDING.txt format
        // Format: "SITE_NAME: Issue description"
        const lines = alertText.trim().split('\n');
        lines.forEach(line => {
            const match = line.match(/^(\S+):\s*(.+)$/);
            if (match) {
                alerts.push({
                    site: match[1],
                    issue: match[2],
                    severity: 'critical'
                });
            }
        });
    }

    const data = {
        totalSites: sites.length,
        platforms: platformCounts,
        status: statusCounts,
        sites: siteStatuses,
        alerts,
        lastCheck: indexData?.lastUpdated || null,
        isLive: true
    };

    setCache('monitoring', data);
    return data;
}

// =========================
// CRM DATA
// =========================

export async function getCRMData() {
    const cached = getCached('crm');
    if (cached) return cached;

    const [contacts, interactions, introductions] = await Promise.all([
        fetchJSON('/data/crm/contacts.json'),
        fetchJSON('/data/crm/interactions.json'),
        fetchJSON('/data/crm/introductions.json')
    ]);

    if (!contacts) return null;

    const data = {
        contacts: Array.isArray(contacts) ? contacts : [],
        interactions: Array.isArray(interactions) ? interactions : [],
        introductions: Array.isArray(introductions) ? introductions : [],
        isLive: true
    };

    setCache('crm', data);
    return data;
}

// =========================
// KITCHEN DATA
// =========================

export async function getKitchenData() {
    const cached = getCached('kitchen');
    if (cached) return cached;

    const [mealPlan, inventory] = await Promise.all([
        fetchJSON('/data/kitchen/meal-plan-state.json'),
        fetchJSON('/data/kitchen/inventory.json')
    ]);

    if (!mealPlan || !inventory) return null;

    const data = {
        mealPlan,
        inventory,
        isLive: true
    };

    setCache('kitchen', data);
    return data;
}

// =========================
// HELPER: Check if data is live
// =========================

export function isLiveData(data) {
    return data && data.isLive === true;
}

// =========================
// CACHE MANAGEMENT
// =========================

export function clearCache() {
    DATA_CACHE.clear();
}

export function refreshData() {
    clearCache();
    // Trigger reload of current dashboard
    if (window.app && window.app.navigate) {
        const currentHash = window.location.hash.slice(1) || 'home';
        window.app.navigate(currentHash);
    }
}
