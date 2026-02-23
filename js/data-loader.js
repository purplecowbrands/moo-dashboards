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

// Generic data loader (public)
export async function loadData(url) {
    return fetchJSON(url);
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

    // Load monitoring index (page metadata)
    const indexData = await fetchJSON('/data/monitoring/index.json');
    
    // Load status data (parsed from latest monitoring log)
    const statusData = await fetchJSON('/data/monitoring/status.json');

    // Parse and aggregate data
    const sites = sitesData.sites || [];
    const platformCounts = {};
    
    sites.forEach(site => {
        platformCounts[site.platform] = (platformCounts[site.platform] || 0) + 1;
    });

    // Build site status list with real monitoring data
    const siteStatuses = sites.map(site => {
        const siteData = indexData?.sites?.[site.name];
        const monitoredPages = siteData?.pages?.filter(p => p.monitored) || [];
        const siteStatus = statusData?.sites?.[site.name];
        
        // Determine status: use real status if available, otherwise default to 'up'
        let status = 'up';
        let responseTime = null;
        
        if (siteStatus) {
            status = siteStatus.status;
            responseTime = siteStatus.responseTime;
        }
        
        return {
            name: site.name,
            url: site.url,
            platform: site.platform,
            pagesMonitored: monitoredPages.length,
            status: status,
            responseTime: responseTime,
            lastCheck: statusData?.lastUpdated || indexData?.lastUpdated || null
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

    // Parse alerts from status data
    const alerts = [];
    if (statusData?.hasAlerts && statusData.alertContent) {
        // Parse ALERT_PENDING.txt format
        // Format: "SITE_NAME: Issue description"
        const lines = statusData.alertContent.trim().split('\n');
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
        lastCheck: statusData?.lastUpdated || indexData?.lastUpdated || null,
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
// CLIENT HEALTH DATA
// =========================

export async function getClientHealthData() {
    const cached = getCached('clientHealth');
    if (cached) return cached;

    // Load monitoring data for sites list and status
    const monitoringData = await getMonitoringData();
    if (!monitoringData) return null;

    // Load MRR and upsell data
    const mrrData = await fetchJSON('/data/client-mrr.json');
    if (!mrrData) return null;

    const { sites } = monitoringData;
    const mrrMap = mrrData.mrr || {};

    // Build client health records
    const clientHealth = sites.map(site => {
        const mrr = mrrMap[site.name] || 0;
        
        // Determine health status based on site status and MRR
        let healthStatus = 'healthy';
        if (site.status === 'down') {
            healthStatus = 'critical';
        } else if (site.status === 'warning' || mrr === 0) {
            healthStatus = 'at-risk';
        }

        // Last update: use monitoring last check or default to "Recently"
        const lastUpdate = site.lastCheck 
            ? new Date(site.lastCheck).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'Recently';

        return {
            name: site.name,
            url: site.url,
            platform: site.platform,
            status: healthStatus,
            siteStatus: site.status, // up/down/warning
            lastUpdate,
            mrr,
            pagesMonitored: site.pagesMonitored || 0
        };
    });

    // Calculate totals
    const totalClients = clientHealth.length;
    const totalMRR = clientHealth.reduce((sum, c) => sum + c.mrr, 0);
    const upsellOpportunities = mrrData.upsellOpportunities || [];

    // Platform distribution (already have this from monitoring)
    const platformCounts = monitoringData.platforms;

    const data = {
        total: totalClients,
        totalMRR,
        health: clientHealth,
        byPlatform: platformCounts,
        upsellOpportunities,
        isLive: true
    };

    setCache('clientHealth', data);
    return data;
}

// =========================
// BNI METRICS DATA
// =========================

export async function getBNIData() {
    const cached = getCached('bni');
    if (cached) return cached;

    const bniData = await fetchJSON('/data/bni-metrics.json');
    if (!bniData) return null;

    const data = {
        ...bniData,
        isLive: true
    };

    setCache('bni', data);
    return data;
}

// Save BNI data (returns JSON string for manual update)
export function generateBNIJson(formData) {
    return JSON.stringify({
        chapter: formData.chapter,
        memberCount: parseInt(formData.memberCount),
        visitorCount: parseInt(formData.visitorCount),
        attendance: {
            thisMonth: parseInt(formData.attendanceThisMonth),
            lastMonth: parseInt(formData.attendanceLastMonth)
        },
        oneOnOnes: {
            thisWeek: parseInt(formData.oneOnOnesThisWeek),
            target: parseInt(formData.oneOnOnesTarget)
        },
        referralsGiven: parseInt(formData.referralsGiven),
        referralsReceived: parseInt(formData.referralsReceived),
        referralsPending: parseInt(formData.referralsPending),
        lastUpdated: new Date().toISOString(),
        notes: formData.notes || ''
    }, null, 2);
}

// =========================
// FINANCIAL DATA
// =========================

export async function getFinancialData() {
    const cached = getCached('financial');
    if (cached) return cached;

    const financialData = await fetchJSON('/data/financial.json');
    if (!financialData) return null;

    const data = {
        ...financialData,
        isLive: true
    };

    setCache('financial', data);
    return data;
}

// Save Financial data (returns JSON string for manual update)
export function generateFinancialJson(formData) {
    const monthlyRevenue = [];
    
    // Parse monthlyRevenue entries (dynamically from form)
    for (let i = 0; i < 12; i++) {
        const month = formData[`month_${i}`];
        const revenue = formData[`revenue_${i}`];
        if (month && revenue) {
            monthlyRevenue.push({
                month: month,
                revenue: parseInt(revenue)
            });
        }
    }

    return JSON.stringify({
        revenue: {
            current: parseInt(formData.revenueCurrent),
            target: parseInt(formData.revenueTarget),
            percentage: parseFloat(((parseInt(formData.revenueCurrent) / parseInt(formData.revenueTarget)) * 100).toFixed(1))
        },
        mrr: {
            current: parseInt(formData.mrrCurrent),
            target: parseInt(formData.mrrTarget),
            percentage: parseFloat(((parseInt(formData.mrrCurrent) / parseInt(formData.mrrTarget)) * 100).toFixed(1))
        },
        monthlyRevenue: monthlyRevenue,
        expenses: {
            payroll: parseInt(formData.expensePayroll),
            tools: parseInt(formData.expenseTools),
            marketing: parseInt(formData.expenseMarketing),
            overhead: parseInt(formData.expenseOverhead)
        },
        lastUpdated: new Date().toISOString(),
        notes: formData.notes || ''
    }, null, 2);
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
