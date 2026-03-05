import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function loadMenu() {
    const container = document.getElementById('menu-container');
    container.innerHTML = '<p>Analyzing ingredients...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "menu_items"));
        const items = [];
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });

        const categories = {
            "01. Fresh Produce": items.filter(i => i.category === "Fresh Produce"),
            "02. Chef's Special Dishes": items.filter(i => i.category === "Chef's Special Dishes")
        };

        let html = '';

        for (const [categoryName, catItems] of Object.entries(categories)) {
            if (catItems.length === 0) continue;

            html += `<h2 class="menu-section-title">${categoryName}</h2>`;
            html += `<div class="items-grid">`;

            catItems.forEach(item => {
                const nutrientsHtml = (item.nutrients || [])
                    .map(n => `<span class="nutrient-tag">${n}</span>`)
                    .join('');

                const safeId = item.id.replace(/\s+/g, '-');

                // 【嚴謹的邏輯 (if)】：動態決定價格的顯示範圍與顏色
                let priceHtml = '';
                if (item.originalPrice && item.originalPrice > item.price) {
                    // 如果有原價且大於現價 -> 顯示紅色特價 + 灰色刪除線原價
                    priceHtml = `
                        <span class="sale-price">$${item.price.toFixed(2)}</span>
                        <span class="original-price">$${item.originalPrice.toFixed(2)}</span>
                    `;
                } else {
                    // 一般商品 -> 顯示黑色正常價
                    priceHtml = `<span class="regular-price">$${item.price.toFixed(2)}</span>`;
                }

                html += `
                    <div class="item-card">
                        <h3>${item.name}</h3>
                        
                        <div class="nutrient-container">
                            ${nutrientsHtml}
                        </div>
                        
                        <div class="price-row">
                            <div class="price-display">
                                ${priceHtml}
                            </div>
                            <span style="font-size: 0.8rem; color: #888; font-weight: normal;">Stock: ${item.stock}</span>
                        </div>

                        <div class="add-to-cart-controls">
                            <input type="number" id="qty-${safeId}" value="1" min="1" max="${item.stock}">
                            <button onclick="window.handleAddToCart('${item.id}', '${item.name}', ${item.price}, '${safeId}')">Add to Order</button>
                        </div>
                    </div>
                `;
            });

            html += `</div>`; 
        }

        container.innerHTML = html;

    } catch (error) {
        console.error("Error loading menu:", error);
        container.innerHTML = `<p style="color:red;">Error loading precision menu. Please check database connection.</p>`;
    }
}

loadMenu();
