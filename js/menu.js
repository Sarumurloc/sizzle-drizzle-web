import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 營養素拆解函數
function formatNutrients(nutrientString) {
    if (!nutrientString) return "";
    return nutrientString.split(/(?=[A-Z])/).map(tag => 
        `<span class="nutrient-tag">${tag}</span>`
    ).join('');
}

async function fetchMenu() {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;

    try {
        const q = query(collection(db, "menu"), orderBy("category_id", "asc"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            menuContainer.innerHTML = "<p>No menu items found in Database.</p>";
            return;
        }

        const categories = {};
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const catName = data.category_name || "General";
            if (!categories[catName]) categories[catName] = [];
            categories[catName].push({ id: doc.id, ...data });
        });

        menuContainer.innerHTML = '';

        for (const [catName, items] of Object.entries(categories)) {
            const section = document.createElement('section');
            section.innerHTML = `<h2 class="menu-section-title">${catName}</h2>`;
            
            const grid = document.createElement('div');
            grid.className = 'items-grid';

            items.forEach(item => {
                const finalPrice = item.is_discounted ? item.discount_price : item.price;
                const nutrientHTML = formatNutrients(item.nutrients);

                grid.innerHTML += `
                    <div class="item-card">
                        <h3>${item.name}</h3>
                        <div class="nutrient-container">${nutrientHTML}</div>
                        <div class="price-row">
                            <span class="current-price">$${finalPrice.toFixed(2)}</span>
                            ${item.is_discounted ? `<span class="old-price">$${item.price.toFixed(2)}</span>` : ''}
                        </div>
                        <p style="font-size: 0.75rem; color: #888;">Stock: ${item.stock}</p>
                        <div style="display: flex; gap: 8px; margin-top: 15px;">
                            <input type="number" id="qty-${item.id}" value="1" min="1" max="${item.stock}" style="width: 45px; text-align: center;">
                            <button class="add-btn" onclick="window.handleAddToCart('${item.id}', '${item.name}', ${finalPrice})">Add to Order</button>
                        </div>
                    </div>
                `;
            });
            section.appendChild(grid);
            menuContainer.appendChild(section);
        }
    } catch (error) {
        console.error("Firebase Fetch Error:", error);
        menuContainer.innerHTML = `<p style="color:red;">Sync Error: ${error.message}</p>`;
    }
}

// 執行初始化
fetchMenu();
