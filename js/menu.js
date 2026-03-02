import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. 抽象化：定義抓取菜單的通用函數
async function fetchMenu() {
    try {
        // 取得 menu 集合，並依照文件 ID 排序 (確保 01 在 02 前面)
        const menuQuery = query(collection(db, "menu"), orderBy("__name__"));
        const menuSnapshot = await getDocs(menuQuery);

        for (const categoryDoc of menuSnapshot.docs) {
            const categoryData = categoryDoc.data();
            const categoryId = categoryDoc.id;
            
            // 渲染分類標題 (例如 Fresh Produce)
            renderCategory(categoryId, categoryData.display_name);

            // 2. 嚴謹邏輯：抓取該分類下的 items 子集合
            const itemsRef = collection(db, `menu/${categoryId}/items`);
            const itemsSnapshot = await getDocs(itemsRef);
            
            itemsSnapshot.forEach((itemDoc) => {
                renderItem(categoryId, itemDoc.id, itemDoc.data());
            });
        }
    } catch (error) {
        console.error("Error fetching menu: ", error);
    }
}

// 3. UI 渲染邏輯 (這就是哈佛學生看到的畫面)
function renderCategory(id, name) {
    const container = document.getElementById('menu-container');
    const section = document.createElement('section');
    section.id = `section-${id}`;
    section.innerHTML = `<h2>${name}</h2><div class="items-grid" id="grid-${id}"></div>`;
    container.appendChild(section);
}

function renderItem(categoryId, itemId, item) {
    const grid = document.getElementById(`grid-${categoryId}`);
    const itemEl = document.createElement('div');
    itemEl.className = 'item-card';
    
    // 判斷是否打折 (邏輯對齊)
    const priceDisplay = item.is_discounted 
        ? `<span class="original-price">$${item.base_price}</span> <span class="discount-price">$${(item.base_price * item.discount_rate).toFixed(2)}</span>`
        : `<span>$${item.base_price}</span>`;

    itemEl.innerHTML = `
        <h3>${item.name}</h3>
        <p>${priceDisplay}</p>
        <p>Stock: ${item.stock}</p>
        <button onclick="addToCart('${itemId}', '${item.name}', ${item.base_price})">Add to Order</button>
    `;
    grid.appendChild(itemEl);
}

// 啟動程式
fetchMenu();
