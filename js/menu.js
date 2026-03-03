import { db } from './firebase-config.js'; 
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

window.toggleOrderSystem = () => {
    const section = document.getElementById('order-system-section');
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
};

async function fetchMenu() {
    const menuContainer = document.getElementById('menu-container');
    const categoryNav = document.getElementById('category-nav');
    if (!menuContainer || !categoryNav) return;

    try {
        const menuSnapshot = await getDocs(collection(db, "menu"));
        categoryNav.innerHTML = "";
        menuContainer.innerHTML = "";

        for (const categoryDoc of menuSnapshot.docs) {
            const categoryData = categoryDoc.data();
            const categoryId = categoryDoc.id;

            // Nav Button Logic
            const navBtn = document.createElement('button');
            navBtn.className = 'nav-btn';
            navBtn.innerText = categoryData.display_name || categoryId;
            navBtn.onclick = () => {
                document.querySelectorAll('.menu-category').forEach(sec => sec.style.display = 'none');
                document.getElementById(`section-${categoryId}`).style.display = 'block';
                document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
                navBtn.classList.add('active');
            };
            categoryNav.appendChild(navBtn);

            // Category Section
            const section = document.createElement('section');
            section.className = 'menu-category';
            section.id = `section-${categoryId}`;
            section.style.display = 'none';
            section.innerHTML = `<div class="items-grid" id="grid-${categoryId}"></div>`;
            menuContainer.appendChild(section);

            // Item Rendering with Nutrition Data (Algorithm Optimization)
            const itemsSnapshot = await getDocs(collection(db, `menu/${categoryId}/items`));
            const grid = document.getElementById(`grid-${categoryId}`);
            
            itemsSnapshot.forEach((itemDoc) => {
                const item = itemDoc.data();
                const itemId = itemDoc.id;
                // Boundary Check for nutritional values
                const cal = item.calories || "--";
                const protein = item.protein || "--";

                const itemCard = document.createElement('div');
                itemCard.className = 'item-card';
                itemCard.innerHTML = `
                    <h3 style="margin:0 0 5px 0;">${item.name}</h3>
                    <div style="margin-bottom: 10px;">
                        <span class="nutrition-badge badge-cal">🔥 ${cal} kcal</span>
                        <span class="nutrition-badge badge-protein">🥩 ${protein}g Protein</span>
                    </div>
                    <p style="font-weight:bold; color:#d9534f; margin: 10px 0;">$${item.base_price.toFixed(2)}</p>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <input type="number" id="qty-${itemId}" value="1" min="1" style="width:50px; padding:5px;">
                        <button onclick="window.handleAddToCart('${itemId}', '${item.name.replace(/'/g, "\\'")}', ${item.base_price})" 
                                style="flex:1; background:#007bff; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">
                            Add
                        </button>
                    </div>
                    <a href="science.html" style="display:block; font-size:0.8em; color:#007bff; margin-top:10px; text-decoration:none;">🔬 View Doctor's Analysis</a>
                `;
                grid.appendChild(itemCard);
            });
        }
        if (categoryNav.firstChild) categoryNav.firstChild.click();
    } catch (e) { console.error(e); }
}
fetchMenu();
