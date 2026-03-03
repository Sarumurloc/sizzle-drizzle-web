import { db } from './firebase-config.js'; 
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- Interface Control (Explicit Scope) ---
window.toggleOrderSystem = () => {
    const orderSystem = document.getElementById('order-system-section');
    if (orderSystem.style.display === 'none' || orderSystem.style.display === '') {
        orderSystem.style.display = 'block';
        // Logic: Smooth scroll to the order section after revealing
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
        console.log("✅ Firebase connected. Fetching menu data...");
        const menuSnapshot = await getDocs(collection(db, "menu"));

        for (const categoryDoc of menuSnapshot.docs) {
            const categoryData = categoryDoc.data();
            const categoryId = categoryDoc.id;

            const section = document.createElement('section');
            section.className = 'menu-category';
            section.innerHTML = `
                <h2 style="border-left: 5px solid #d9534f; padding-left: 15px;">${categoryData.display_name || categoryId}</h2>
                <div class="items-grid" id="grid-${categoryId}">Loading items...</div>
            `;
            menuContainer.appendChild(section);

            const itemsSnapshot = await getDocs(collection(db, `menu/${categoryId}/items`));
            const grid = document.getElementById(`grid-${categoryId}`);
            grid.innerHTML = ""; // Clear loading text

            itemsSnapshot.forEach((itemDoc) => {
                const item = itemDoc.data();
                const itemId = itemDoc.id;
                const basePrice = item.base_price || 0;
                
                const itemCard = document.createElement('div');
                itemCard.className = 'item-card';
                
                // Robustness: Escaping single quotes in item names
                const safeItemName = item.name.replace(/'/g, "\\'");

                itemCard.innerHTML = `
                    <h3 style="margin-top:0;">${item.name || 'Unnamed Item'}</h3>
                    <p class="price-tag">$${basePrice.toFixed(2)}</p>
                    <div style="margin: 15px 0;">
                        <label>Quantity (Qty): </label>
                        <input type="number" id="qty-${itemId}" value="1" min="1" 
                               style="width: 60px; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    <button onclick="window.handleAddToCart('${itemId}', '${safeItemName}', ${basePrice})" 
                            style="width:100%; padding:12px; background:#007bff; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">
                        Add to Order List
                    </button>
                `;
                grid.appendChild(itemCard);
            });
        }
    } catch (error) {
        console.error("Database Error:", error);
        menuContainer.innerHTML = `<p style="color:red; text-align:center;">Sorry, we couldn't load the menu: ${error.message}</p>`;
    }
}

// Initialize Menu
fetchMenu();
