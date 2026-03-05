import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const mockItems = [
    {
        id: "mock-01",
        name: "Harvard Apple (Demo)",
        category: "Fresh Produce",
        price: 2.5,
        originalPrice: 3.5, 
        stock: 50,
        nutrients: ["Vitamin C", "Fiber"]
    },
    {
        id: "mock-02",
        name: "Grilled Salmon (Demo)",
        category: "Chef's Special Dishes",
        price: 15.0,
        originalPrice: 15.0, 
        stock: 20,
        nutrients: ["Omega-3", "Protein"]
    }
];

async function loadMenu() {
    const container = document.getElementById('menu-container');
    if (!container) return;

    console.log("System: Executing loadMenu...");
    let items = [];

    try {
        const querySnapshot = await getDocs(collection(db, "menu"));
        if (querySnapshot.empty) {
            console.warn("System Warning: 資料庫為空，啟動 Demo 菜單。");
            items = mockItems; 
        } else {
            querySnapshot.forEach((doc) => { items.push({ id: doc.id, ...doc.data() }); });
        }
    } catch (error) {
        console.error("Firebase Error:", error);
        items = mockItems; 
    }

    const categories = {};
    items.forEach(item => {
        const cat = item.category || "Uncategorized";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(item);
    });

    let html = '';
    for (const [categoryName, catItems] of Object.entries(categories)) {
        html += `<h2 class="menu-section-title">${categoryName}</h2><div class="items-grid">`;

        catItems.forEach(item => {
            const nutrientsHtml = (Array.isArray(item.nutrients) ? item.nutrients : [])
                .map(n => `<span class="nutrient-tag">${n}</span>`).join('');
            const safeId = item.id.replace(/\s+/g, '-');
            const currentPrice = Number(item.price) || 0;
            const originalPrice = Number(item.originalPrice) || 0;

            let priceHtml = '';
            if (originalPrice > currentPrice && currentPrice > 0) {
                priceHtml = `
                    <span style="color: var(--harvard-red); font-weight: bold; font-size: 1.2rem;">$${currentPrice.toFixed(2)}</span>
                    <span style="color: #94a3b8; text-decoration: line-through; font-size: 0.9rem; margin-left: 5px;">$${originalPrice.toFixed(2)}</span>
                `;
            } else {
                priceHtml = `<span style="color: var(--text-main); font-weight: bold; font-size: 1.2rem;">$${currentPrice.toFixed(2)}</span>`;
            }

            html += `
                <div class="item-card">
                    <h3>${item.name || 'Unnamed Item'}</h3>
                    <div class="nutrient-container">${nutrientsHtml}</div>
                    <div class="price-row">
                        <div class="price-display">${priceHtml}</div>
                        <span style="font-size: 0.8rem; color: #888;">Stock: ${item.stock || 0}</span>
                    </div>
                    <div class="add-to-cart-controls">
                        <input type="number" id="qty-${safeId}" value="1" min="1" max="${item.stock || 99}">
                        <button onclick="window.handleAddToCart('${item.id}', '${item.name || 'Item'}', ${currentPrice}, '${safeId}')">Add to Order</button>
                    </div>
                </div>
            `;
        });
        html += `</div>`; 
    }
    container.innerHTML = html;
}

loadMenu();
