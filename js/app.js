// Main App - Router & Navigation
import { renderHome } from './dashboards/home.js';
import { renderSales } from './dashboards/sales.js';
import { renderEOS } from './dashboards/eos.js';
import { renderCRM } from './dashboards/crm.js';
import { renderClients } from './dashboards/clients.js';
import { renderMonitoring } from './dashboards/monitoring.js';
import { renderTime } from './dashboards/time.js';
import { renderBNI, initBNI } from './dashboards/bni.js';
import { renderFinancial, initFinancial } from './dashboards/financial.js';
import { renderTasks } from './dashboards/tasks.js';
import { renderKitchen } from './dashboards/kitchen.js';
import { renderRoadmap } from './dashboards/roadmap.js';

// Page renderers map
const pages = {
    home: renderHome,
    sales: renderSales,
    eos: renderEOS,
    crm: renderCRM,
    clients: renderClients,
    monitoring: renderMonitoring,
    time: renderTime,
    bni: renderBNI,
    financial: renderFinancial,
    tasks: renderTasks,
    kitchen: renderKitchen,
    roadmap: renderRoadmap
};

// Router
async function router() {
    const hash = window.location.hash.slice(1) || '/';
    const page = hash === '/' ? 'home' : hash.slice(1);
    
    const container = document.getElementById('page-container');
    const renderFn = pages[page] || pages.home;
    
    // Show loading state
    container.innerHTML = '<div style="padding: 2rem; text-align: center;">Loading...</div>';
    
    // Render page (handle both sync and async renderers)
    const content = await renderFn();
    container.innerHTML = content;
    
    // Update active nav
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
    
    // Re-init Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    // Initialize charts if Chart.js is loaded
    if (window.Chart && page !== 'home') {
        setTimeout(initCharts, 100);
    }
    
    // Initialize page-specific features
    if (page === 'bni') {
        initBNI();
    }
    if (page === 'financial') {
        initFinancial();
    }
}

// Initialize charts for current page
function initCharts() {
    document.querySelectorAll('canvas[data-chart]').forEach(canvas => {
        const chartType = canvas.dataset.chart;
        const chartData = JSON.parse(canvas.dataset.chartData || '{}');
        
        new Chart(canvas, {
            type: chartType,
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: chartData.datasets?.length > 1
                    }
                }
            }
        });
    });
}

// Theme toggle
function initTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        
        // Update icon
        const icon = themeToggle.querySelector('i');
        icon.setAttribute('data-lucide', next === 'light' ? 'moon' : 'sun');
        window.lucide.createIcons();
    });
}

// Sidebar toggle
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        const icon = menuToggle.querySelector('i');
        const isCollapsed = sidebar.classList.contains('collapsed');
        icon.setAttribute('data-lucide', isCollapsed ? 'chevron-right' : 'chevron-left');
        window.lucide.createIcons();
    });
}

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    router();
    
    // Listen for hash changes
    window.addEventListener('hashchange', router);
    
    // Initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
});
