import { db } from './firebase-config.js'; 
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 哨兵檢查 (Sentinel Check) ---
// 周全防禦：確保連線物件存在，否則不執行後續抓取邏輯
if (!db) {
    console.error("❌ 致命錯誤：Firebase db 物件未定義。請檢查 firebase-config.js 是否有正確 export");
}

async function fetchMenu() {
    const menuContainer = document.getElementById('menu-container');
    
    // 邊界檢查：確保 DOM 容器存在
    if (!menuContainer) return;

    try {
        console.log("✅ 連線成功，開始抓取菜單...");
        
        // 抓取第一層：分類 (menu)
        const menuSnapshot = await getDocs(collection(db, "menu"));

        if (menuSnapshot.empty) {
            menuContainer.innerHTML = "<p>目前菜單是空的，請主廚在後台新增分類。</p>";
            return;
        }

        // 清除載入中狀態
        menuContainer.innerHTML = "";

        // 使用 for...of 確保異步操作的順序性 (嚴謹邏輯)
        for (const categoryDoc of menuSnapshot.docs) {
            const categoryData = categoryDoc.data();
            const categoryId = categoryDoc.id;

            const section = document.createElement('section');
            section.className = 'menu-category';
            section.innerHTML = `
                <h2>${categoryData.display_name || categoryId}</h2>
                <div class="items-grid" id="grid-${categoryId}">載入菜色中...</div>
            `;
            menuContainer.appendChild(section);

            // 抓取第二層：該分類下的菜色 (items)
            const itemsSnapshot = await getDocs(collection(db, `menu/${categoryId}/items`));
            const grid = document.getElementById(`grid-${categoryId}`);
            grid.innerHTML = ""; 

            itemsSnapshot.forEach((itemDoc) => {
                const item = itemDoc.data();
                const itemId = itemDoc.id;
                const basePrice = item.base_price || 0;
                
                const itemCard = document.createElement('div');
                itemCard.className = 'item-card';
                itemCard.innerHTML = `
                    <h3>${item.name || '未命名菜色'}</h3>
                    <p class="price-tag">$${basePrice.toFixed(2)}</p>
                    <div style="margin: 10px 0;">
                        <input type="number" id="qty-${itemId}" value="1" min="1" style="width: 50px; padding: 5px;">
                    </div>
                    <button onclick="window.handleAddToCart('${itemId}', '${item.name}', ${basePrice})">Add to Order</button>
                `;
                grid.appendChild(itemCard);
            });
        }
    } catch (error) {
        console.error("Database Error:", error);
        menuContainer.innerHTML = `<p style="color:red;">❌ 無法載入菜單：${error.message}</p>`;
    }
}

fetchMenu();
