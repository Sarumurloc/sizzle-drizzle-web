import { db } from './firebase-config.js';
import { 
    collection, getDocs, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * 抽象化：將營養標籤字串轉化為 HTML 標籤
 * 目的：剝離原始字串細節，轉換為結構化的 UI 元素
 */
function formatNutrients(nutrientString) {
    if (!nutrientString) return "";
    // 透過正則表達式拆分大寫字母開頭的單字
    return nutrientString.split(/(?=[A-Z])/).map(tag => 
        `<span class="nutrient-tag">${tag.trim()}</span>`
    ).join('');
}

/**
 * 核心演算法：雙層異步抓取
 * 1. 抓取 menu 集合下的「類別文件」
 * 2. 深入抓取每個文件下的「items 子集合」
 */
async function fetchMenu() {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;

    try {
        // 第一層：獲取類別 (例如：01_fresh_produce)
        const categoriesSnapshot = await getDocs(collection(db, "menu"));
        
        if (categoriesSnapshot.empty) {
            menuContainer.innerHTML = "<p>No categories found in 'menu' collection.</p>";
            return;
        }

        menuContainer.innerHTML = ''; // 清除加載中狀態

        // 第二層：遍歷類別並抓取其 sub-collection "items"
        for (const catDoc of categoriesSnapshot.docs) {
            const catData = catDoc.data();
            const catDisplayName = catData.display_name || catDoc.id;
            
            // 指向嵌套路徑：menu -> {catDoc.id} -> items
            const itemsRef = collection(db, "menu", catDoc.id, "items");
            const itemsSnapshot = await getDocs(itemsRef);

            if (!itemsSnapshot.empty) {
                // 創建類別區塊
                const section = document.createElement('section');
                section.style.marginBottom = "40px";
                section.innerHTML = `<h2 class="menu-section-title">${catDisplayName}</h2>`;
                
                const grid = document.createElement('div');
                grid.className = 'items-grid';

                itemsSnapshot.forEach(itemDoc => {
                    const item = itemDoc.data();
                    // 邏輯處理：判斷是否有折扣價
                    const finalPrice = item.is_discounted ? item.discount_price : item.price;
                    const nutrientHTML = formatNutrients(item.nutrients);

                    grid.innerHTML += `
                        <div class="item-card">
                            <h3 style="margin-top:0;">${item.name}</h3>
                            <div class="nutrient-container">${nutrientHTML}</div>
                            <div class="price-row" style="margin: 10px 0; font-weight: 800; font-size: 1.1rem;">
                                ${item.is_discounted ? 
                                    `<span style="color:#e63946;">$${finalPrice.toFixed(2)}</span> 
                                     <span style="text-decoration:line-through; color:#999; font-size:0.8rem; margin-left:5px;">$${item.price.toFixed(2)}</span>` : 
                                    `<span>$${item.price.toFixed(2)}</span>`
                                }
                            </div>
                            <p style="font-size: 0.7rem; color: #888; margin-bottom:15px;">Stock: ${item.stock}</p>
                            
                            <div style="display: flex; gap: 8px; margin-top: auto;">
                                <input type="number" id="qty-${itemDoc.id}" value="1" min="1" max="${item.stock}" 
                                    style="width: 50px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; text-align: center;">
                                <button class="add-btn" 
                                    onclick="window.handleAddToCart('${itemDoc.id}', '${item.name}', ${finalPrice})"
                                    style="flex-grow: 1; padding: 10px; background: #333E48; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                                    Add to Order
                                </button>
                            </div>
                        </div>
                    `;
                });
                
                section.appendChild(grid);
                menuContainer.appendChild(section);
            }
        }
    } catch (error) {
        console.error("Firebase Fetch Error:", error);
        // 魯棒性：提供友善的錯誤回饋
        menuContainer.innerHTML = `
            <div style="color: #A51C30; padding: 20px; border: 1px solid #ffccd5; background: #fff5f5; border-radius: 8px;">
                <strong>Sync Error:</strong> ${error.message}<br>
                Please check if Firestore rules allow read access.
            </div>
        `;
    }
}

// 初始化執行
fetchMenu();
