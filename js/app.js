// Main App - Router & Navigation
import { renderHome } from './dashboards/home.js';
import { renderFocusAsync } from './dashboards/focus.js';
import { renderSalesAsync, initSales } from './dashboards/sales.js';
import { renderEOS, initEOS } from './dashboards/eos.js';
import { renderCRM } from './dashboards/crm.js';
import { renderMonitoring } from './dashboards/monitoring.js';
import { renderTime } from './dashboards/time.js';
import { renderTasksAsync } from './dashboards/tasks.js';
import { renderKitchen } from './dashboards/kitchen.js';
import { renderRoadmap } from './dashboards/roadmap.js';

// Page renderers map
const pages = {
    home: renderHome,
    focus: renderFocusAsync,
    sales: renderSalesAsync,
    eos: renderEOS,
    crm: renderCRM,
    monitoring: renderMonitoring,
    time: renderTime,
    tasks: renderTasksAsync,
    kitchen: renderKitchen,
    roadmap: renderRoadmap
};

// Toast notification system
export function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        error: 'alert-circle',
        warning: 'alert-triangle',
        success: 'check-circle',
        info: 'info'
    };
    
    const titles = {
        error: 'Error',
        warning: 'Warning',
        success: 'Success',
        info: 'Info'
    };
    
    toast.innerHTML = `
        <div class="toast-icon ${type}">
            <i data-lucide="${icons[type]}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${titles[type]}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Close">
            <i data-lucide="x"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Initialize icons in toast
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    // Close button handler
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        removeToast(toast);
    });
    
    // Auto-dismiss after duration
    if (duration > 0) {
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    }
}

function removeToast(toast) {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
        toast.remove();
    }, 300);
}

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
    if (page === 'eos') {
        initEOS();
    }

    if (page === 'sales') {
        initSales();
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
