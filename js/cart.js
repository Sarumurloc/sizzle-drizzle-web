import { db } from './firebase-config.js';
import { 
    collection, query, where, getDocs, orderBy, doc, 
    addDoc, runTransaction, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let cart = [];
let currentSelectedSlot = null;

// --- 1. 獲取可用時段 (對齊後台 11:30~11:45 邏輯) ---
async function getNextAvailableSlot() {
    try {
        const now = new Date();
        const currentTimeId = now.getHours() * 100 + now.getMinutes();
        const slotsRef = collection(db, "pickup_slots");
        const q = query(slotsRef, where("is_active", "==", true), orderBy("__name__"));
        const querySnapshot = await getDocs(q);

        for (const docSnap of querySnapshot.docs) {
            const slotId = parseInt(docSnap.id);
            const data = docSnap.data();
            if (slotId >= currentTimeId && data.current_booked < data.max_capacity) {
                currentSelectedSlot = { id: docSnap.id, ...data };
                return currentSelectedSlot;
            }
        }
        return null;
    } catch (e) { console.error("Slot Error:", e); return null; }
}

// --- 2. 核心提交功能 (修正：移除預設 0.9) ---
window.submitOrder = async () => {
    if (cart.length === 0) return alert("Your cart is empty!");
    if (!currentSelectedSlot) return alert("No pickup slots available.");

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerText = "Processing...";

    try {
        await runTransaction(db, async (transaction) => {
            const slotRef = doc(db, "pickup_slots", currentSelectedSlot.id);
            const slotSnap = await transaction.get(slotRef);
            
            if (slotSnap.data().current_booked >= slotSnap.data().max_capacity) {
                throw "This slot just filled up! Please refresh.";
            }

            // 計算標準總價 (不包含身分折扣)
            const standardTotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

            const orderData = {
                items: cart,
                standard_total: standardTotal,
                harvard_total: standardTotal * 0.9, // 僅供後台參考
                pickup_slot: currentSelectedSlot.id,
                pickup_time: currentSelectedSlot.time_label,
                created_at: serverTimestamp(),
                status: "pending",
                verification_needed: true // 標記需要現場驗證證件
            };

            const ordersRef = collection(db, "orders");
            transaction.update(slotRef, { current_booked: slotSnap.data().current_booked + 1 });
            await addDoc(ordersRef, orderData);
        });

        alert("✅ Order Placed! Please pay at the counter.");
        cart = [];
        renderSummary();
        window.location.reload();
    } catch (e) {
        alert("Order Failed: " + e);
        btn.disabled = false;
        btn.innerText = "Confirm & Place Order";
    }
};

// --- 3. 加入購物車 (保持 item.unitPrice 是來自 menu.js 的 finalPrice) ---
window.handleAddToCart = (itemId, itemName, price) => {
    const qtyInput = document.getElementById(`qty-${itemId}`);
    const quantity = parseInt(qtyInput.value);
    const maxStock = parseInt(qtyInput.getAttribute('max'));

    if (quantity <= 0 || quantity > maxStock) return alert("Invalid quantity.");

    const existing = cart.find(i => i.id === itemId);
    if (existing) existing.quantity += quantity;
    else cart.push({ id: itemId, name: itemName, unitPrice: price, quantity });

    renderSummary();
};

// --- 4. 渲染摘要 (修正 UI：清楚區分標準價與學生價) ---
async function renderSummary() {
    const summarySection = document.getElementById('group-order-summary');
    const summaryText = document.getElementById('summary-text');
    
    if (cart.length === 0) {
        summarySection.style.display = 'none';
        return;
    }

    summarySection.style.display = 'block';
    const slot = await getNextAvailableSlot();
    
    let subtotal = 0;
    let itemsLines = `🛒 Order Details\n====================\n`;

    cart.forEach(item => {
        const lineTotal = item.unitPrice * item.quantity;
        subtotal += lineTotal;
        itemsLines += `• ${item.name} x${item.quantity}: $${lineTotal.toFixed(2)}\n`;
    });

    const harvardTotal = subtotal * 0.9;

    itemsLines += `====================\n`;
    itemsLines += `PICKUP: ${slot ? slot.time_label : 'FETCHING...'}\n`;
    itemsLines += `--------------------\n`;
    itemsLines += `STANDARD TOTAL: $${subtotal.toFixed(2)}\n`;
    itemsLines += `🎓 HARVARD PRICE: $${harvardTotal.toFixed(2)}\n`;
    itemsLines += `====================\n`;
    itemsLines += `*Harvard price requires ID at pickup.\n`;
    itemsLines += `Precision Billing Enabled 🔬`;

    summaryText.innerText = itemsLines;
}
