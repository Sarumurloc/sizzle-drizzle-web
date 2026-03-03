import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 1. 核心邏輯：營養素字串拆解 (Regex Split) ---
// 目的：將 "StarchMicronutrients" 拆成 ["Starch", "Micronutrients"]
function formatNutrients(nutrientString) {
    if (!nutrientString) return "";
    
    // 使用正規表達式在大寫字母前切開，並加上標籤 HTML
    // 計算機思維：自動化處理減少人工標籤錄入錯誤
    return nutrientString
        .split(/(?=[A-Z])/) 
        .map(tag => `<span class="nutrient-tag">${tag}</span>`)
        .join('');
}

// --- 2. 獲取並渲染菜單 ---
async function fetchMenu() {
    const menuContainer = document.getElementById('menu-container');
    
    try {
        const q = query(collection(db, "menu"), orderBy("category_id", "asc"));
        const querySnapshot = await getDocs(q);
        
        // 按照類別分組數據 (例如: 01. Fresh Produce, 02. Chef's Specials)
        const categories = {};
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const catName = data.category_name || "General";
            if (!categories[catName]) categories[catName] = [];
            categories[catName].push({ id: doc.id, ...data });
        });

        // 清空加載中文字
        menuContainer.innerHTML = '';

        // 遍歷類別並生成 HTML
        for (const [catName, items] of Object.entries(categories)) {
            const section = document.createElement('section');
            section.className = 'menu-category';
            
            // 類別標題
            section.innerHTML = `<h2 class="menu-section-title">${catName}</h2>`;
            
            // 建立 Grid 容器 (這會觸發 index.html 中的 .items-grid 樣式)
            const grid = document.createElement('div');
            grid.className = 'items-grid';

            items.forEach(item => {
                const isDiscounted = item.is_discounted;
                const finalPrice = isDiscounted ? item.discount_price : item.price;
                
                // 處理營養素標籤
                const nutrientHTML = formatNutrients(item.nutrients);

                const card = `
                    <div class="item-card ${item.stock <= 0 ? 'out-of-stock' : ''}">
                        <div>
                            <h3>${item.name}</h3>
                            <div class="nutrient-container">
                                ${nutrientHTML}
                            </div>
                            
                            <div class="price-row">
                                <span class="current-price">$${finalPrice.toFixed(2)}</span>
                                ${isDiscounted ? `<span class="old-price">$${item.price.toFixed(2)}</span>` : ''}
                                ${isDiscounted ? `<span style="font-size:10px; color:#d9534f; font-weight:bold;">SPECIAL!</span>` : ''}
                            </div>
                            
                            <p style="font-size: 0.8rem; color: #888;">Availability: ${item.stock} in stock</p>
                        </div>

                        <div style="margin-top: 15px; display: flex; gap: 10px; align-items: center;">
                            <input type="number" id="qty-${item.id}" value="1" min="1" max="${item.stock}" 
                                   style="width: 45px; padding: 8px; border-radius: 6px; border: 1px solid #ddd;">
                            <button class="add-btn" onclick="handleAddToCart('${item.id}', '${item.name}', ${finalPrice})">
                                ADD TO ORDER
                            </button>
                        </div>
                        
                        <a href="science.html" style="font-size: 10px; color: #007bff; text-decoration: none; margin-top: 10px; display: block;">
                            🔬 View Nutritional Analysis
                        </a>
                    </div>
                `;
                grid.innerHTML += card;
            });

            section.appendChild(grid);
            menuContainer.appendChild(section);
        }

    } catch (error) {
        console.error("Error fetching menu:", error);
        menuContainer.innerHTML = `<p style="color:red; text-align:center;">Failed to load menu. System error: ${error.message}</p>`;
    }
}

// 初始化
fetchMenu();
