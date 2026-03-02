import { db } from './firebase-config.js'; // 確保路徑正確
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function fetchMenu() {
    const menuContainer = document.getElementById('menu-container');
    const menuSnapshot = await getDocs(collection(db, "menu"));

    for (const categoryDoc of menuSnapshot.docs) {
        const categoryData = categoryDoc.data();
        const categoryId = categoryDoc.id;

        // 建立分類區塊
        const section = document.createElement('section');
        section.className = 'menu-category';
        section.innerHTML = `
            <h2>${categoryData.display_name || categoryId}</h2>
            <div class="items-grid" id="grid-${categoryId}"></div>
        `;
        menuContainer.appendChild(section);

        // 抓取該分類下的 items 集合
        const itemsSnapshot = await getDocs(collection(db, `menu/${categoryId}/items`));
        const grid = document.getElementById(`grid-${categoryId}`);

        itemsSnapshot.forEach((itemDoc) => {
            const item = itemDoc.data();
            const itemId = itemDoc.id;
            
            // 嚴謹邏輯：防禦 NaN 錯誤
            const basePrice = item.base_price || 0;
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            
            itemCard.innerHTML = `
                <h3>${item.name || 'Unnamed'}</h3>
                <p class="price-tag">$${basePrice.toFixed(2)}</p>
                <p class="stock-tag">Stock: ${item.stock || 0}</p>
                <div style="margin-bottom: 10px;">
                    <label>Qty: </label>
                    <input type="number" id="qty-${itemId}" value="1" min="1" max="${item.stock || 99}" style="width: 50px; padding: 5px;">
                </div>
                <button onclick="window.handleAddToCart('${itemId}', '${item.name}', ${basePrice})">Add to Order</button>
            `;
            grid.appendChild(itemCard);
        });
    }
}

fetchMenu();
