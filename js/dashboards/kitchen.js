// Kitchen/Meal Prep Dashboard
import { sampleData } from '../../data/sample-data.js';

export function renderKitchen() {
    const { kitchen } = sampleData;

    return `
        <div class="page-header">
            <h2>Kitchen & Meal Prep</h2>
            <p>Current inventory, week's plan, shopping list</p>
        </div>

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
                <div class="stat-icon warning">
                    <i data-lucide="shopping-cart"></i>
                </div>
                <div class="stat-label">Shopping List Items</div>
                <div class="stat-value">${kitchen.shoppingList.length}</div>
                <div class="stat-meta">Need to buy</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon info">
                    <i data-lucide="package"></i>
                </div>
                <div class="stat-label">Inventory Categories</div>
                <div class="stat-value">3</div>
                <div class="stat-meta">Proteins, Pantry, Fridge</div>
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">This Week (${kitchen.currentWeek.prepDate})</h3>
                </div>
                <div class="card-body">
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
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Next Week (Planned)</h3>
                </div>
                <div class="card-body">
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
                </div>
            </div>
        </div>

        <div class="card" style="margin-top: var(--spacing-lg);">
            <div class="card-header">
                <h3 class="card-title">Shopping List</h3>
            </div>
            <div class="card-body">
                ${kitchen.shoppingList.length > 0 ? `
                    <ul class="list">
                        ${kitchen.shoppingList.map(item => `
                            <li class="list-item">
                                <span>${item}</span>
                                <i data-lucide="circle"></i>
                            </li>
                        `).join('')}
                    </ul>
                ` : `
                    <div class="empty-state">
                        <i data-lucide="check-circle"></i>
                        <p>No items on shopping list</p>
                    </div>
                `}
            </div>
        </div>

        <div class="dashboard-grid" style="margin-top: var(--spacing-lg);">
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
                                    ${item.quantity === '0 cans (need restock)' ? '<div style="color: var(--error); font-size: 0.875rem;">⚠️ Need restock</div>' : ''}
                                </div>
                                <strong>${item.quantity}</strong>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>

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
                                    <td><strong>${item.quantity}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}
