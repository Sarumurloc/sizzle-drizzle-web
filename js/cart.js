import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let cart = [];

/**
 * 抽象化：獲取哈佛當地時間 (EST) 並增加 1 小時作為取餐緩衝
 */
function getEstimatedPickupTime() {
    const now = new Date();
    const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    estTime.setHours(estTime.getHours() + 1);
    return estTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * 渲染摘要：嚴格控制 UI 顯示邏輯
 */
function renderSummary() {
    const emptyMsg = document.getElementById('empty-cart-msg');
    const formContent = document.getElementById('order-form-content');
    const summaryText = document.getElementById('summary-text');
    
    if (cart.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        if (formContent) formContent.style.display = 'none';
        return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';
    if (formContent) formContent.style.display = 'flex'; 

    const customerID = document.getElementById('guest-id')?.value.trim() || 'Guest';
    let subtotal = 0;
    let lines = `🛒 Patient Order: ${customerID}\n`;
    lines += `----------------------------\n`;

    cart.forEach(item => {
        const linePrice = item.unitPrice * item.quantity;
        subtotal += linePrice;
        lines += `• ${item.name} x${item.quantity}: $${linePrice.toFixed(2)}\n`;
    });

    lines += `----------------------------\n`;
    lines += `ESTIMATED PICKUP: After ${getEstimatedPickupTime()}\n`;
    lines += `Standard Total: $${subtotal.toFixed(2)}\n`;
    lines += `🎓 Harvard Discount: $${(subtotal * 0.9).toFixed(2)}\n`;
    lines += `----------------------------\n`;
    lines += `Status: Verified Nutrition Integrity`;

    summaryText.textContent = lines;
}

/**
 * 下單邏輯：Firebase 邊界防禦與清理
 */
window.submitOrder = async () => {
    const idVal = document.getElementById('guest-id')?.value.trim();
    const phoneVal = document.getElementById('guest-phone')?.value.trim();
    
    if (!idVal || !phoneVal) {
        alert("Input Error: Guest ID and Phone are required.");
        return;
    }

    const btn = document.querySelector('.place-order-btn');
    btn.disabled = true;
    btn.textContent = "TRANSMITTING...";

    try {
        await addDoc(collection(db, "orders"), {
            customer: { id: idVal, phone: phoneVal },
            items: cart,
            created_at: serverTimestamp(),
            status: "pending"
        });

        alert("Success! Your nutrition plan is being prepared.");
        cart = []; // 重置資料結構
        document.getElementById('guest-id').value = '';
        document.getElementById('guest-phone').value = '';
        renderSummary(); // 回到空狀態
    } catch (e) {
        console.error("Transmission Error:", e);
        alert("System Error: Unable to sync with database.");
    } finally {
        btn.disabled = false;
        btn.textContent = "PLACE ORDER";
    }
};

// 全域掛載加入購物車函數
window.handleAddToCart = (itemId, itemName, price, safeId) => {
    const targetId = safeId || itemId;
    const qty = parseInt(document.getElementById(`qty-${targetId}`)?.value) || 0;
    if (qty <= 0) return;

    const existing = cart.find(i => i.id === itemId);
    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({ id: itemId, name: itemName, unitPrice: parseFloat(price), quantity: qty });
    }
    renderSummary();
};

// 即時同步 ID 輸入
document.addEventListener('input', (e) => {
    if (e.target.id === 'guest-id') renderSummary();
});

renderSummary();
