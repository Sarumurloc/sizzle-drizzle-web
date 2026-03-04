import { db } from './firebase-config.js';
import { 
    collection, addDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let cart = [];

/**
 * 抽象化：獲取哈佛當地時間 (EST)
 */
function getEstimatedPickupTime() {
    const now = new Date();
    const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    estTime.setHours(estTime.getHours() + 1); // 演算法：延後一小時
    const options = { hour: '2-digit', minute: '2-digit', hour12: true };
    return estTime.toLocaleTimeString('en-US', options);
}

/**
 * 渲染邏輯：嚴謹的 UI 狀態切換
 */
async function renderSummary() {
    const emptyMsg = document.getElementById('empty-cart-msg');
    const formContent = document.getElementById('order-form-content');
    const summaryText = document.getElementById('summary-text');
    if (!summaryText) return;

    if (cart.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        if (formContent) formContent.style.display = 'none';
        return;
    }

    // 魯棒性確保：切換為 flex 以啟用 CSS 佈局
    if (emptyMsg) emptyMsg.style.display = 'none';
    if (formContent) formContent.style.display = 'flex'; 

    const pickupTime = getEstimatedPickupTime();
    let subtotal = 0;
    
    // 即時獲取輸入 (對應 HTML ID: guest-id)
    const customerID = document.getElementById('guest-id')?.value.trim() || 'Guest';
    
    let itemsLines = `🛒 Order Detail for ${customerID}\n`;
    itemsLines += `============================\n`;

    cart.forEach(item => {
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;
        itemsLines += `• ${item.name} x${item.quantity}: $${lineTotal.toFixed(2)}\n`;
    });

    itemsLines += `============================\n`;
    itemsLines += `ESTIMATED PICKUP: After ${pickupTime}\n`;
    itemsLines += `============================\n`;
    itemsLines += `Standard Total: $${subtotal.toFixed(2)}\n`;
    itemsLines += `🎓 Harvard Price: $${(subtotal * 0.9).toFixed(2)}\n`;
    itemsLines += `============================\n`;
    itemsLines += `Medical Integrity. Chef's Precision. 🔬`;

    summaryText.textContent = itemsLines;
}

window.handleAddToCart = (itemId, itemName, price, safeId) => {
    const targetId = safeId || itemId;
    const qtyInput = document.getElementById(`qty-${targetId}`);
    if (!qtyInput) return;
    
    const quantity = parseInt(qtyInput.value) || 0;
    if (quantity <= 0) return;

    const existing = cart.find(i => i.id === itemId);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ id: itemId, name: itemName, unitPrice: parseFloat(price) || 0, quantity });
    }
    renderSummary();
};

/**
 * 下單邏輯：周全的防禦 (Boundary Check)
 */
window.submitOrder = async () => {
    const guestId = document.getElementById('guest-id')?.value.trim();
    const guestPhone = document.getElementById('guest-phone')?.value.trim();
    
    if (!guestId || !guestPhone) {
        alert("Please enter Name and Phone.");
        return;
    }

    const btn = document.querySelector('.place-order-btn'); 
    btn.disabled = true;
    btn.textContent = "PROCESSING...";

    try {
        const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        const pickupTime = getEstimatedPickupTime();

        await addDoc(collection(db, "orders"), {
            customer: { id: guestId, phone: guestPhone },
            items: cart,
            billing: { standard_total: subtotal, harvard_total: subtotal * 0.9 },
            pickup_info: { estimated_after: pickupTime },
            status: "pending",
            created_at: serverTimestamp()
        });

        alert("Order Received! Pickup after " + pickupTime);
        
        // 成功後的狀態清理
        cart = [];
        document.getElementById('guest-id').value = '';
        document.getElementById('guest-phone').value = '';
        renderSummary();
        
        btn.disabled = false;
        btn.textContent = "PLACE ORDER";

    } catch (e) {
        console.error("Firebase Error:", e);
        alert("Error: " + e.message);
        btn.disabled = false;
        btn.textContent = "PLACE ORDER";
    }
};

// 監聽 ID 輸入同步更新摘要
document.addEventListener('input', (e) => {
    if (e.target.id === 'guest-id') renderSummary();
});

renderSummary();
