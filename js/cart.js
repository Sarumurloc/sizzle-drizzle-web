import { db } from './firebase-config.js';
import { 
    collection, query, where, getDocs, orderBy, doc, 
    addDoc, runTransaction, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let cart = [];

// --- 1. 獲取可用時段 (EST 校準) ---
async function getNextAvailableSlot() {
    try {
        const estTime = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            hour: 'numeric', minute: 'numeric', hour12: false
        }).formatToParts(new Date());

        const hours = parseInt(estTime.find(p => p.type === 'hour').value);
        const minutes = parseInt(estTime.find(p => p.type === 'minute').value);
        const currentTimeId = hours * 100 + minutes;

        const slotsRef = collection(db, "pickup_slots");
        const q = query(slotsRef, where("is_active", "==", true), orderBy("__name__"));
        const querySnapshot = await getDocs(q);

        for (const docSnap of querySnapshot.docs) {
            const slotId = parseInt(docSnap.id);
            const data = docSnap.data();
            if (slotId >= currentTimeId && data.current_booked < data.max_capacity) {
                return { id: docSnap.id, ...data };
            }
        }
        return null;
    } catch (e) {
        console.error("Slot Error:", e);
        return null;
    }
}

// --- 2. 核心：renderSummary 函數 ---
// 嚴謹邏輯：不隱藏 Sidebar，只切換內容
async function renderSummary() {
    const emptyMsg = document.getElementById('empty-cart-msg');
    const formContent = document.getElementById('order-form-content');
    const summaryText = document.getElementById('summary-text');
    const custIdInput = document.getElementById('cust-id');

    // 魯棒性檢查：確保元素存在
    if (!summaryText) return;

    if (cart.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        if (formContent) formContent.style.display = 'none';
        return;
    }

    // 有內容時
    if (emptyMsg) emptyMsg.style.display = 'none';
    if (formContent) formContent.style.display = 'block';

    const slot = await getNextAvailableSlot();
    let subtotal = 0;
    // 防禦性處理：防止 input 沒抓到導致報錯
    const customerName = custIdInput ? custIdInput.value || 'Guest' : 'Guest';
    
    let itemsLines = `🛒 Order Detail for ${customerName}\n`;
    itemsLines += `============================\n`;

    cart.forEach(item => {
        const lineTotal = item.unitPrice * item.quantity;
        subtotal += lineTotal;
        itemsLines += `• ${item.name} x${item.quantity}: $${lineTotal.toFixed(2)}\n`;
    });

    itemsLines += `============================\n`;
    itemsLines += `ESTIMATED PICKUP: ${slot ? slot.time_label : 'CHEF BUSY'}\n`;
    itemsLines += `Standard Total: $${subtotal.toFixed(2)}\n`;
    itemsLines += `🎓 Harvard Price: $${(subtotal * 0.9).toFixed(2)}\n`;
    itemsLines += `============================\n`;
    itemsLines += `Medical-Grade Nutrients Verified 🔬`;

    summaryText.innerText = itemsLines;
}

// --- 3. 全局掛載：讓 HTML 按鈕能點擊 (重要！) ---
// 因為 type="module"，必須手動掛載到 window
window.handleAddToCart = (itemId, itemName, price) => {
    const qtyInput = document.getElementById(`qty-${itemId}`);
    if (!qtyInput) return;
    
    const quantity = parseInt(qtyInput.value);
    if (isNaN(quantity) || quantity <= 0) return;

    const existing = cart.find(i => i.id === itemId);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ id: itemId, name: itemName, unitPrice: price, quantity });
    }

    renderSummary();
};

window.submitOrder = async () => {
    const custId = document.getElementById('cust-id')?.value.trim();
    const custPhone = document.getElementById('cust-phone')?.value.trim();

    if (!custId || !custPhone) {
        alert("Please enter Name and Phone.");
        return;
    }

    const slot = await getNextAvailableSlot();
    if (!slot) return alert("All slots are currently full.");

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerText = "Processing...";

    try {
        await runTransaction(db, async (transaction) => {
            const slotRef = doc(db, "pickup_slots", slot.id);
            const slotSnap = await transaction.get(slotRef);
            
            if (slotSnap.data().current_booked >= slotSnap.data().max_capacity) {
                throw "Slot is full!";
            }

            const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

            const orderData = {
                customer: { name: custId, phone: custPhone },
                items: cart,
                billing: { standard_total: subtotal, harvard_total: subtotal * 0.9 },
                pickup_info: { slot_id: slot.id, time_label: slot.time_label },
                status: "pending",
                created_at: serverTimestamp()
            };

            transaction.update(slotRef, { current_booked: slotSnap.data().current_booked + 1 });
            await addDoc(collection(db, "orders"), orderData);
        });

        alert("Order Successful! Sizzle & Drizzle starts cooking now.");
        cart = [];
        window.location.reload();
    } catch (e) {
        alert("Order Error: " + e);
        btn.disabled = false;
        btn.innerText = "CONFIRM & PREPARE";
    }
};

// 讓摘要隨姓名輸入即時變動
document.addEventListener('input', (e) => {
    if (e.target.id === 'cust-id') renderSummary();
});

// 初始化
renderSummary();
