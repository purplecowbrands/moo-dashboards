// Kitchen Dashboard - redesigned per Ben feedback
import { sampleData } from '../../data/sample-data.js';
import { getKitchenData } from '../data-loader.js';

function normalizeRecipeName(recipe) {
    if (!recipe) return '';
    if (typeof recipe === 'string') return recipe;
    return recipe.name || recipe.meal || '';
}

function buildSwapOptions(currentRecipes, nextRecipes) {
    const seen = new Set();
    const options = [];

    [...currentRecipes, ...nextRecipes].forEach(recipe => {
        const name = normalizeRecipeName(recipe);
        if (!name) return;
        if (seen.has(name.toLowerCase())) return;
        seen.add(name.toLowerCase());
        options.push(name);
    });

    return options;
}

export async function renderKitchen() {
    const kitchenData = await getKitchenData();
    const isLive = !!kitchenData;

    let kitchen;
    if (isLive) {
        const mealPlan = kitchenData.mealPlan || {};
        const inventory = kitchenData.inventory || {};

        const thisWeekRecipes = mealPlan.thisWeekPicks || [];
        const nextWeekRecipes = mealPlan.tentativeNextWeek || [];

        const preppedFood = [
            ...(inventory.preparedMeals || []),
            ...(inventory.freezerTop?.preparedMeals || [])
        ];

        kitchen = {
            currentWeek: {
                prepDate: mealPlan.lastUpdated || 'This Week',
                recipes: thisWeekRecipes.map(r => ({
                    name: normalizeRecipeName(r),
                    effort: r.effort || 'normal'
                }))
            },
            nextWeek: {
                recipes: nextWeekRecipes.map(r => ({
                    name: normalizeRecipeName(r),
                    effort: r.effort || 'normal'
                }))
            },
            shoppingList: inventory.shoppingList || [],
            inventory: {
                preppedFood,
                proteins: [
                    ...(inventory.freezerTop?.proteins || []),
                    ...(inventory.freezerChest?.proteins || [])
                ],
                pantry: inventory.pantry || [],
                fridge: inventory.fridge || [],
                freezer: [
                    ...(inventory.freezerTop?.fats || []),
                    ...(inventory.freezerTop?.vegetables || []),
                    ...(inventory.freezerTop?.fruit || []),
                    ...(inventory.freezerTop?.other || []),
                    ...(inventory.freezerChest?.bones || []),
                    ...(inventory.freezerChest?.vegetables || [])
                ]
            }
        };
    } else {
        kitchen = {
            ...sampleData.kitchen,
            inventory: {
                ...(sampleData.kitchen.inventory || {}),
                preppedFood: []
            }
        };
    }

    const swapOptions = buildSwapOptions(kitchen.currentWeek.recipes, kitchen.nextWeek.recipes);

    const dataStatusBanner = isLive ? `
        <div class="alert success" style="margin-bottom: var(--spacing-md);">
            <i data-lucide="wifi"></i>
            <div>
                <strong>Live Data</strong>
                <p>Connected to kitchen inventory and meal plan files</p>
            </div>
        </div>
    ` : `
        <div class="alert warning" style="margin-bottom: var(--spacing-md);">
            <i data-lucide="wifi-off"></i>
            <div>
                <strong>Sample Data</strong>
                <p>Live kitchen files unavailable</p>
            </div>
        </div>
    `;

    return `
        <div class="page-header">
            <h2>Kitchen</h2>
            <p>Meal plan, recipe swaps, shopping list, and inventory</p>
        </div>

        ${dataStatusBanner}

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
                                        <div style="font-size: 0.8rem; color: var(--text-secondary);">Effort: ${recipe.effort}</div>
                                    </div>
                                    <button class="btn btn-sm btn-secondary recipe-swap-btn" data-current="${recipe.name.replace(/"/g, '&quot;')}">
                                        Swap
                                    </button>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p>No meals planned for this week</p>'}
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
                                        <div style="font-size: 0.8rem; color: var(--text-secondary);">Effort: ${recipe.effort}</div>
                                    </div>
                                    <button class="btn btn-sm btn-secondary recipe-swap-btn" data-current="${recipe.name.replace(/"/g, '&quot;')}">
                                        Swap
                                    </button>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p>No meals planned for next week</p>'}
                </div>
            </div>
        </div>

        <div class="card" style="margin-top: var(--spacing-md);">
            <div class="card-header">
                <h3 class="card-title">Shopping List</h3>
            </div>
            <div class="card-body">
                ${kitchen.shoppingList.length > 0 ? `
                    <ul class="list">
                        ${kitchen.shoppingList.map(item => `<li class="list-item"><span>${item}</span></li>`).join('')}
                    </ul>
                ` : '<p>No shopping items right now</p>'}
            </div>
        </div>

        <div class="dashboard-grid" style="margin-top: var(--spacing-md);">
            <div class="card">
                <div class="card-header"><h3 class="card-title">Prepped Food</h3></div>
                <div class="card-body">
                    ${kitchen.inventory.preppedFood.length > 0 ? `
                        <ul class="list">
                            ${kitchen.inventory.preppedFood.map(item => `
                                <li class="list-item">
                                    <div>
                                        <strong>${item.meal || item.item}</strong>
                                        ${item.note ? `<div style="font-size: 0.8rem; color: var(--text-secondary);">${item.note}</div>` : ''}
                                    </div>
                                    <span class="badge info">${item.servings || item.quantity || 'On hand'}</span>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p>No prepped food tracked</p>'}
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3 class="card-title">Proteins</h3></div>
                <div class="card-body">
                    ${kitchen.inventory.proteins.length > 0 ? `
                        <ul class="list">
                            ${kitchen.inventory.proteins.map(item => `
                                <li class="list-item"><span>${item.item}</span><strong>${item.quantity || 'On hand'}</strong></li>
                            `).join('')}
                        </ul>
                    ` : '<p>No proteins tracked</p>'}
                </div>
            </div>
        </div>

        <div class="dashboard-grid" style="margin-top: var(--spacing-md);">
            <div class="card">
                <div class="card-header"><h3 class="card-title">Pantry</h3></div>
                <div class="card-body" style="max-height: 320px; overflow:auto;">
                    ${kitchen.inventory.pantry.length > 0 ? `
                        <ul class="list">
                            ${kitchen.inventory.pantry.map(item => `
                                <li class="list-item">
                                    <div>
                                        <span>${item.item}</span>
                                        ${item.note ? `<div style="font-size: 0.8rem; color: var(--text-secondary);">${item.note}</div>` : ''}
                                    </div>
                                    <strong>${item.quantity || 'On hand'}</strong>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p>No pantry items tracked</p>'}
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3 class="card-title">Fridge</h3></div>
                <div class="card-body" style="max-height: 320px; overflow:auto;">
                    ${kitchen.inventory.fridge.length > 0 ? `
                        <ul class="list">
                            ${kitchen.inventory.fridge.map(item => `
                                <li class="list-item"><span>${item.item}</span><strong>${item.quantity || 'On hand'}</strong></li>
                            `).join('')}
                        </ul>
                    ` : '<p>No fridge items tracked</p>'}
                </div>
            </div>
        </div>

        <div class="card" style="margin-top: var(--spacing-md);">
            <div class="card-header"><h3 class="card-title">Freezer</h3></div>
            <div class="card-body" style="max-height: 320px; overflow:auto;">
                ${kitchen.inventory.freezer.length > 0 ? `
                    <ul class="list">
                        ${kitchen.inventory.freezer.map(item => `
                            <li class="list-item">
                                <div>
                                    <span>${item.item || item.meal}</span>
                                    ${item.note ? `<div style="font-size: 0.8rem; color: var(--text-secondary);">${item.note}</div>` : ''}
                                </div>
                                <strong>${item.quantity || item.servings || 'On hand'}</strong>
                            </li>
                        `).join('')}
                    </ul>
                ` : '<p>No freezer items tracked</p>'}
            </div>
        </div>

        <script>
            (function() {
                const options = ${JSON.stringify(swapOptions)};
                document.querySelectorAll('.recipe-swap-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const current = btn.getAttribute('data-current');
                        const suggestionPool = options.filter(name => name !== current);
                        const suggestion = suggestionPool[0] || 'No alternatives yet';
                        alert('Swap helper\n\nCurrent: ' + current + '\nSuggested: ' + suggestion + '\n\nNext step: connect write-back to meal-plan-state.json.');
                    });
                });
            })();
        </script>
    `;
}
