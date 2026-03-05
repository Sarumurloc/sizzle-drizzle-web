import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function loadMenu() {
    const container = document.getElementById('menu-container');
    container.innerHTML = '<p>Analyzing ingredients...</p>'; // 載入提示

    try {
        const querySnapshot = await getDocs(collection(db, "menu_items"));
        const items = [];
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });

        // 依據分類進行分組
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
                // 【嚴謹的邏輯】：將營養素陣列轉換為獨立的 HTML span 標籤
                const nutrientsHtml = (item.nutrients || [])
                    .map(n => `<span class="nutrient-tag">${n}</span>`)
                    .join('');

                const safeId = item.id.replace(/\s+/g, '-');

                html += `
                    <div class="item-card">
                        <h3>${item.name}</h3>
                        
                        <div class="nutrient-container">
                            ${nutrientsHtml}
                        </div>
                        
                        <div class="price-row">
                            <span>$${item.price.toFixed(2)}</span>
                            <span style="font-size: 0.8rem; color: #888; font-weight: normal;">Stock: ${item.stock}</span>
                        </div>

                        <div class="add-to-cart-controls">
                            <input type="number" id="qty-${safeId}" value="1" min="1" max="${item.stock}">
                            <button onclick="window.handleAddToCart('${item.id}', '${item.name}', ${item.price}, '${safeId}')">Add to Order</button>
                        </div>
                    </div>
                `;
            });

            html += `</div>`; // 結束 items-grid
        }

        container.innerHTML = html;

    } catch (error) {
        console.error("Error loading menu:", error);
        container.innerHTML = `<p style="color:red;">Error loading precision menu. Please check database connection.</p>`;
    }
}

// 頁面載入時執行
loadMenu();
