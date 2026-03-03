import { db } from './firebase-config.js'; 
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function fetchMenu() {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;

    try {
        const menuSnapshot = await getDocs(collection(db, "menu"));
        menuContainer.innerHTML = ""; 

        for (const categoryDoc of menuSnapshot.docs) {
            const categoryData = categoryDoc.data();
            const categoryId = categoryDoc.id;

            const section = document.createElement('section');
            section.innerHTML = `
                <h2 style="margin: 40px 0 20px 0; border-left: 5px solid #d9534f; padding-left: 15px;">
                    ${categoryData.display_name || categoryId}
                </h2>
                <div class="items-grid" id="grid-${categoryId}"></div>
            `;
            menuContainer.appendChild(section);

            const itemsSnapshot = await getDocs(collection(db, `menu/${categoryId}/items`));
            const grid = document.getElementById(`grid-${categoryId}`);

            itemsSnapshot.forEach((itemDoc) => {
                const item = itemDoc.data();
                const itemId = itemDoc.id;
                const basePrice = item.base_price || 0;
                const stock = item.stock || 0; // 庫存數據抽象化

                // --- 嚴謹邏輯：打折與價格計算 ---
                let priceHtml = "";
                let finalPrice = basePrice;
                if (item.is_discounted && item.discount_rate) {
                    finalPrice = basePrice * item.discount_rate;
                    priceHtml = `
                        <span style="text-decoration: line-through; color: #999; font-size: 0.9em;">$${basePrice.toFixed(2)}</span>
                        <span style="color: #d9534f; font-weight: bold; margin-left: 5px;">$${finalPrice.toFixed(2)}</span>
                        <span class="discount-tag">Special!</span>
                    `;
                } else {
                    priceHtml = `<span style="font-weight: bold;">$${basePrice.toFixed(2)}</span>`;
                }

                // --- 邊界處理：庫存狀態顯示 ---
                let stockHtml = "";
                const isOutOfStock = stock <= 0;
                if (isOutOfStock) {
                    stockHtml = `<span style="color: #d9534f; font-weight: bold;">🚫 Out of Stock</span>`;
                } else if (stock <= 10) {
                    stockHtml = `<span style="color: #f39c12; font-weight: bold;">⏳ Only ${stock} left!</span>`;
                } else {
                    stockHtml = `<span style="color: #666;">Stock: ${stock}</span>`;
                }

                // --- 營養標籤渲染 (保留先前優化) ---
                let tagHtml = "";
                if (item.nutrition_tags && typeof item.nutrition_tags === 'object') {
                    Object.entries(item.nutrition_tags).forEach(([key, value]) => {
                        if (value === true) tagHtml += `<span class="nutrition-badge">${key}</span>`;
                    });
                }

                const itemCard = document.createElement('div');
                itemCard.className = `item-card ${isOutOfStock ? 'out-of-stock' : ''}`;
                itemCard.innerHTML = `
                    <h3 style="margin:0;">${item.name}</h3>
                    <div style="margin: 10px 0; min-height: 25px;">${tagHtml}</div>
                    
                    <div style="margin: 10px 0;">${priceHtml}</div>
                    <div style="margin-bottom: 15px; font-size: 0.85em;">${stockHtml}</div>

                    <div style="display:flex; gap:10px; align-items:center;">
                        <input type="number" id="qty-${itemId}" value="1" min="1" max="${stock}" 
                               ${isOutOfStock ? 'disabled' : ''} 
                               style="width:45px; padding:8px; border:1px solid #ddd; border-radius:5px;">
                        <button class="add-btn" 
                                onclick="window.handleAddToCart('${itemId}', '${item.name.replace(/'/g, "\\'")}', ${finalPrice})"
                                ${isOutOfStock ? 'disabled' : ''}
                                style="${isOutOfStock ? 'background:#ccc; cursor:not-allowed;' : ''}">
                            ${isOutOfStock ? 'Sold Out' : 'Add to Order'}
                        </button>
                    </div>
                    <a href="science.html" style="margin-top:15px; font-size:0.8em; color:#007bff; text-decoration:none;">🔬 Nutritional Analysis</a>
                `;
                grid.appendChild(itemCard);
            });
        }
    } catch (error) { console.error("Error loading menu:", error); }
}
fetchMenu();
