import { db } from './firebase-config.js'; 
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function fetchMenu() {
    const menuContainer = document.getElementById('menu-container');
    
    // 周全防禦：如果找不到容器，提早中斷避免崩潰
    if (!menuContainer) {
        console.error("Critical Error: menu-container not found!");
        return;
    }

    try {
        console.log("Starting to fetch menu from Firebase...");
        const menuSnapshot = await getDocs(collection(db, "menu"));

        if (menuSnapshot.empty) {
            menuContainer.innerHTML = "<p>Menu is currently empty. Please check back later!</p>";
            return;
        }

        menuSnapshot.forEach(async (categoryDoc) => {
            const categoryData = categoryDoc.data();
            const categoryId = categoryDoc.id;
            console.log(`Loading category: ${categoryId}`);

            const section = document.createElement('section');
            section.className = 'menu-category';
            section.innerHTML = `
                <h2>${categoryData.display_name || categoryId}</h2>
                <div class="items-grid" id="grid-${categoryId}">Loading items...</div>
            `;
            menuContainer.appendChild(section);

            // 抓取子集合：注意路徑必須嚴謹
            const itemsSnapshot = await getDocs(collection(db, `menu/${categoryId}/items`));
            const grid = document.getElementById(`grid-${categoryId}`);
            grid.innerHTML = ""; // 清除載入中文字

            itemsSnapshot.forEach((itemDoc) => {
                const item = itemDoc.data();
                const itemId = itemDoc.id;
                const basePrice = item.base_price || 0;
                
                const itemCard = document.createElement('div');
                itemCard.className = 'item-card';
                itemCard.innerHTML = `
                    <h3>${item.name || 'Unnamed'}</h3>
                    <p class="price-tag">$${basePrice.toFixed(2)}</p>
                    <div style="margin: 10px 0;">
                        <input type="number" id="qty-${itemId}" value="1" min="1" style="width: 50px;">
                    </div>
                    <button onclick="window.handleAddToCart('${itemId}', '${item.name}', ${basePrice})">Add to Order</button>
                `;
                grid.appendChild(itemCard);
            });
        });
    } catch (error) {
        // 魯棒性處理：發生錯誤時在網頁上顯示，而不是留白
        console.error("Database Error:", error);
        menuContainer.innerHTML = `<p style="color:red;">Error loading menu: ${error.message}</p>`;
    }
}

fetchMenu();
