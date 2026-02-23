// Kitchen/Meal Prep Dashboard
import { sampleData } from '../../data/sample-data.js';
import { getKitchenData, isLiveData } from '../data-loader.js';

export async function renderKitchen() {
    // Try to load live data, fallback to sample
    let kitchenData = await getKitchenData();
    let isLive = false;
    
    if (!kitchenData) {
        kitchenData = sampleData.kitchen;
    } else {
        isLive = true;
    }

    // Transform live data to match expected structure
    let kitchen;
    if (isLive) {
        const mealPlan = kitchenData.mealPlan;
        const inventory = kitchenData.inventory;
        
        kitchen = {
            currentWeek: {
                prepDate: mealPlan.lastUpdated || 'This Week',
                recipes: (mealPlan.thisWeekPicks || []).map(r => ({
                    name: r.name,
                    effort: r.effort || 'normal'
                }))
            },
            nextWeek: {
                recipes: (mealPlan.tentativeNextWeek || []).map(r => ({
                    name: r.name,
                    effort: r.effort || 'normal'
                }))
            },
            shoppingList: [], // Would need to pull from ClickUp or separate file
            inventory: {
                proteins: inventory.proteins || [],
                pantry: (inventory.pantry || []).slice(0, 10), // Top 10 items
                fridge: inventory.fridge || []
            }
        };
    } else {
        kitchen = kitchenData;
    }

    const dataStatusBanner = isLive ? `
        <div class="alert success" style="margin-bottom: var(--spacing-lg);">
            <i data-lucide="wifi"></i>
            <div>
                <strong>Live Data</strong>
                <p>Connected to workspace files (last updated: ${kitchen.currentWeek.prepDate})</p>
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
            <h2>Kitchen & Meal Prep</h2>
            <p>Current inventory, week's plan, shopping list</p>
        </div>

        ${dataStatusBanner}

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon success">
                    <i data-lucide="calendar"></i>
                </div>
                <div class="stat-label">This Week's Meals</div>
                <div class="stat-value">${kitchen.currentWeek.recipes.length}</div>
                <div class="stat-meta">Prep: ${kitchen.currentWeek.prepDate}</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="chef-hat"></i>
                </div>
                <div class="stat-label">Next Week's Meals</div>
                <div class="stat-value">${kitchen.nextWeek.recipes.length}</div>
                <div class="stat-meta">Planned recipes</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon ${kitchen.shoppingList.length > 0 ? 'warning' : 'success'}">
                    <i data-lucide="shopping-cart"></i>
                </div>
                <div class="stat-label">Shopping List Items</div>
                <div class="stat-value">${kitchen.shoppingList.length}</div>
                <div class="stat-meta">${kitchen.shoppingList.length > 0 ? 'Need to buy' : 'All set'}</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="package"></i>
                </div>
                <div class="stat-label">Inventory Items</div>
                <div class="stat-value">${(kitchen.inventory.proteins?.length || 0) + (kitchen.inventory.pantry?.length || 0) + (kitchen.inventory.fridge?.length || 0)}</div>
                <div class="stat-meta">Tracked items</div>
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">This Week (${kitchen.currentWeek.prepDate})</h3>
                </div>
                <div class="card-body">
                    ${kitchen.currentWeek.recipes.length > 0 ? `
                        <ul class="list">
                            ${kitchen.currentWeek.recipes.map(recipe => `
                                <li class="list-item">
                                    <div>
                                        <strong>${recipe.name}</strong>
                                        <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                            Effort: ${recipe.effort}
                                        </div>
                                    </div>
                                    <span class="badge ${recipe.effort === 'easy' ? 'success' : 'info'}">${recipe.effort}</span>
                                </li>
                            `).join('')}
                        </ul>
                    ` : `
                        <div class="empty-state">
                            <i data-lucide="calendar-x"></i>
                            <p>No meals planned for this week</p>
                        </div>
                    `}
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Next Week (Planned)</h3>
                </div>
                <div class="card-body">
                    ${kitchen.nextWeek.recipes.length > 0 ? `
                        <ul class="list">
                            ${kitchen.nextWeek.recipes.map(recipe => `
                                <li class="list-item">
                                    <div>
                                        <strong>${recipe.name}</strong>
                                        <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                            Effort: ${recipe.effort}
                                        </div>
                                    </div>
                                    <span class="badge ${recipe.effort === 'easy' ? 'success' : 'info'}">${recipe.effort}</span>
                                </li>
                            `).join('')}
                        </ul>
                    ` : `
                        <div class="empty-state">
                            <i data-lucide="calendar-x"></i>
                            <p>No meals planned for next week yet</p>
                        </div>
                    `}
                </div>
            </div>
        </div>

        ${kitchen.shoppingList.length > 0 ? `
            <div class="card" style="margin-top: var(--spacing-lg);">
                <div class="card-header">
                    <h3 class="card-title">Shopping List</h3>
                </div>
                <div class="card-body">
                    <ul class="list">
                        ${kitchen.shoppingList.map(item => `
                            <li class="list-item">
                                <span>${item}</span>
                                <i data-lucide="circle"></i>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        ` : ''}

        <div class="dashboard-grid" style="margin-top: var(--spacing-lg);">
            ${kitchen.inventory.proteins && kitchen.inventory.proteins.length > 0 ? `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Proteins (Freezer)</h3>
                    </div>
                    <div class="card-body">
                        <ul class="list">
                            ${kitchen.inventory.proteins.map(protein => `
                                <li class="list-item">
                                    <span>${protein.item}</span>
                                    <strong>${protein.quantity}</strong>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            ` : ''}

            ${kitchen.inventory.pantry && kitchen.inventory.pantry.length > 0 ? `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Pantry Staples</h3>
                    </div>
                    <div class="card-body">
                        <ul class="list">
                            ${kitchen.inventory.pantry.map(item => `
                                <li class="list-item">
                                    <div>
                                        <span>${item.item}</span>
                                        ${item.note ? `<div style="color: var(--text-secondary); font-size: 0.875rem;">${item.note}</div>` : ''}
                                        ${item.quantity && item.quantity.includes('need restock') ? '<div style="color: var(--error); font-size: 0.875rem;">Need restock</div>' : ''}
                                    </div>
                                    <strong>${item.quantity || 'On hand'}</strong>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            ` : ''}
        </div>

        ${kitchen.inventory.fridge && kitchen.inventory.fridge.length > 0 ? `
            <div class="card" style="margin-top: var(--spacing-lg);">
                <div class="card-header">
                    <h3 class="card-title">Fridge</h3>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${kitchen.inventory.fridge.map(item => `
                                    <tr>
                                        <td>${item.item}</td>
                                        <td><strong>${item.quantity || 'On hand'}</strong></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        ` : ''}
    `;
}
