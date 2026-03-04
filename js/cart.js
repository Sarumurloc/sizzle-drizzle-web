import { db } from './firebase-config.js';
import { 
    collection, addDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let cart = [];

function getEstimatedPickupTime() {
    const now = new Date();
    const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    estTime.setHours(estTime.getHours() + 1);
    const options = { hour: '2-digit', minute: '2-digit', hour12: true };
    return estTime.toLocaleTimeString('en-US', options);
}

/**
 * 渲染邏輯：修正 ID 抓取路徑 (guest-id)
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

    // 魯棒性修正：確保切換為 flex 以配合 CSS 佈局
    if (emptyMsg) emptyMsg.style.display = 'none';
    if (formContent) formContent.style.display = 'flex'; 

    const pickupTime = getEstimatedPickupTime();
    let subtotal = 0;
    
    // 關鍵修正：對應 HTML 中的 guest-id
    const customerID = document.getElementById('guest-id')?.value || 'Guest';
    
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
    itemsLines += `(Final confirmation at pickup)\n`;
    itemsLines += `============================\n`;
    itemsLines += `Standard Total: $${subtotal.toFixed(2)}\n`;
    itemsLines += `🎓 Harvard Price: $${(subtotal * 0.9).toFixed(2)}\n`;
    itemsLines += `============================\n`;
    itemsLines += `Medical Integrity. Chef's Precision. 🔬`;

    summaryText.innerText = itemsLines;
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
 * 下單邏輯：修正欄位抓取與按鈕狀態管理
 */
window.submitOrder = async () => {
    // 關鍵修正：對應 HTML 中的 guest-id 與 guest-phone
    const guestId = document.getElementById('guest-id')?.value.trim();
    const guestPhone = document.getElementById('guest-phone')?.value.trim();
    
    if (!guestId || !guestPhone) {
        alert("Please enter both ID and Phone number.");
        return;
    }

    const btn = document.querySelector('.place-order-btn'); // 修正選擇器路徑
    btn.disabled = true;
    btn.innerText = "PROCESSING...";

    try {
        const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        const pickupTime = getEstimatedPickupTime();

        await addDoc(collection(db, "orders"), {
            customer: { id: guestId, phone: guestPhone },
            items: cart,
            billing: { standard_total: subtotal, harvard_total: subtotal * 0.9 },
            pickup_info: { 
                estimated_after: pickupTime,
                note: "Confirm with staff at pickup" 
            },
            status: "pending",
            created_at: serverTimestamp()
        });

        alert("Order Received! Pickup estimated after " + pickupTime);
        location.reload();
    } catch (e) {
        alert("Error: " + e.message);
        btn.disabled = false;
        btn.innerText = "PLACE ORDER";
    }
};

/**
 * 監聽輸入：當用戶打字時，即時更新訂單摘要中的名字
 */
document.addEventListener('input', (e) => {
    if (e.target.id === 'guest-id') renderSummary();
});

renderSummary();
