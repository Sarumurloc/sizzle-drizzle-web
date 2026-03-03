import { db } from './firebase-config.js'; 
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 介面控制邏輯 (明確範圍) ---
window.toggleOrderSystem = () => {
    const orderSystem = document.getElementById('order-system-section');
    if (orderSystem.style.display === 'none' || orderSystem.style.display === '') {
        orderSystem.style.display = 'block';
        // 嚴謹邏輯：顯示後自動滾動到點餐區
        orderSystem.scrollIntoView({ behavior: 'smooth' });
    } else {
        orderSystem.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

async function fetchMenu() {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;

    try {
        console.log("✅ Firebase 連線成功，載入菜單數據...");
        const menuSnapshot = await getDocs(collection(db, "menu"));

        for (const categoryDoc of menuSnapshot.docs) {
            const categoryData = categoryDoc.data();
            const categoryId = categoryDoc.id;

            const section = document.createElement('section');
            section.className = 'menu-category';
            section.innerHTML = `
                <h2 style="border-left: 5px solid #d9534f; padding-left: 15px;">${categoryData.display_name || categoryId}</h2>
                <div class="items-grid" id="grid-${categoryId}"></div>
            `;
            menuContainer.appendChild(section);

            const itemsSnapshot = await getDocs(collection(db, `menu/${categoryId}/items`));
            const grid = document.getElementById(`grid-${categoryId}`);

            itemsSnapshot.forEach((itemDoc) => {
                const item = itemDoc.data();
                const itemId = itemDoc.id;
                const basePrice = item.base_price || 0;
                
                const itemCard = document.createElement('div');
                itemCard.className = 'item-card';
                
                // 周全防禦：轉義單引號，防止菜名包含引號導致 JS 報錯
                const safeItemName = item.name.replace(/'/g, "\\'");

                itemCard.innerHTML = `
                    <h3 style="margin-top:0;">${item.name || '未命名'}</h3>
                    <p class="price-tag">$${basePrice.toFixed(2)}</p>
                    <div style="margin: 15px 0;">
                        <label>數量 Qty: </label>
                        <input type="number" id="qty-${itemId}" value="1" min="1" 
                               style="width: 60px; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    <button onclick="window.handleAddToCart('${itemId}', '${safeItemName}', ${basePrice})" 
                            style="width:100%; padding:12px; background:#007bff; color:white; border:none; border-radius:8px; font-weight:bold;">
                        加入代訂清單
                    </button>
                `;
                grid.appendChild(itemCard);
            });
        }
    } catch (error) {
        console.error("Database Error:", error);
        menuContainer.innerHTML = `<p style="color:red; text-align:center;">抱歉，目前無法載入菜單：${error.message}</p>`;
    }
}

// 啟動抓取
fetchMenu();
