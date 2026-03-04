import { db } from './firebase-config.js';
import { 
    collection, addDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 內部狀態儲存
let cart = [];

/**
 * 演算法優化：計算取餐時間
 * 核心邏輯：獲取當前哈佛當地時間，並往後推延 1 小時
 */
function getEstimatedPickupTime() {
    // 抽象化：獲取當前美國東部時間 (EST)
    const now = new Date();
    const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    // 演算法：增加 1 小時
    estTime.setHours(estTime.getHours() + 1);

    // 格式化顯示 (例如: 10:54 AM)
    const options = { hour: '2-digit', minute: '2-digit', hour12: true };
    return estTime.toLocaleTimeString('en-US', options);
}

/**
 * 渲染邏輯：更新訂單摘要
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

    if (emptyMsg) emptyMsg.style.display = 'none';
    if (formContent) formContent.style.display = 'block';

    const pickupTime = getEstimatedPickupTime();
    let subtotal = 0;
    const customerName = document.getElementById('cust-id')?.value || 'Guest';
    
    let itemsLines = `🛒 Order Detail for ${customerName}\n`;
    itemsLines += `============================\n`;

    cart.forEach(item => {
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;
        itemsLines += `• ${item.name} x${item.quantity}: $${lineTotal.toFixed(2)}\n`;
    });

    itemsLines += `============================\n`;
    // 實施新邏輯：顯示 1 小時後的取餐時間
    itemsLines += `ESTIMATED PICKUP: After ${pickupTime}\n`;
    itemsLines += `(Final confirmation with staff at pickup)\n`;
    itemsLines += `============================\n`;
    itemsLines += `Standard Total: $${subtotal.toFixed(2)}\n`;
    itemsLines += `🎓 Harvard Price: $${(subtotal * 0.9).toFixed(2)}\n`;
    itemsLines += `============================\n`;
    itemsLines += `Medical Integrity. Chef's Precision. 🔬`;

    summaryText.innerText = itemsLines;
}

/**
 * 加入購物車 (配合你的 Firebase ID 修改計畫)
 * 這裡採用最穩定的四參數傳入
 */
window.handleAddToCart = (itemId, itemName, price, safeId) => {
    // 如果你修改了 Firebase ID 且不含特殊字元，safeId 就會等於 itemId
    const targetId = safeId || itemId;
    const qtyInput = document.getElementById(`qty-${targetId}`);
    
    if (!qtyInput) {
        console.error("Boundary Check: Input not found", targetId);
        return;
    }
    
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
 * 下單邏輯
 */
window.submitOrder = async () => {
    const custId = document.getElementById('cust-id')?.value.trim();
    const custPhone = document.getElementById('cust-phone')?.value.trim();
    if (!custId || !custPhone) return alert("Please enter Name and Phone.");

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerText = "PROCESSING...";

    try {
        const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        const pickupTime = getEstimatedPickupTime();

        await addDoc(collection(db, "orders"), {
            customer: { name: custId, phone: custPhone },
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

// 監聽 ID 輸入同步更新摘要
document.addEventListener('input', (e) => {
    if (e.target.id === 'cust-id') renderSummary();
});

renderSummary();
