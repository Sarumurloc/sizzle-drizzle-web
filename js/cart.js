import { db } from './firebase-config.js';
import { collection, query, where, getDocs, orderBy, doc, addDoc, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let cart = [];
let currentSelectedSlot = null;

// --- 1. 獲取可用時段 (基於主廚產能) ---
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
            // 只要現在時間還沒過該時段，且主廚還有產能 (max_capacity)
            if (slotId >= currentTimeId && data.current_booked < data.max_capacity) {
                currentSelectedSlot = { id: docSnap.id, ...data };
                return currentSelectedSlot;
            }
        }
        return null;
    } catch (e) { return null; }
}

// --- 2. 提交訂單 (加入聯繫資訊校驗) ---
window.submitOrder = async () => {
    const custId = document.getElementById('cust-id').value.trim();
    const custPhone = document.getElementById('cust-phone').value.trim();

    // 邊界防禦：資訊完整性檢查
    if (!custId || !custPhone) {
        alert("Please provide your Name/ID and Phone Number to secure your order.");
        return;
    }

    if (cart.length === 0) return alert("Cart is empty!");
    if (!currentSelectedSlot) return alert("Chef is at full capacity. Please try a later slot.");

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerText = "Securing Kitchen Capacity...";

    try {
        await runTransaction(db, async (transaction) => {
            const slotRef = doc(db, "pickup_slots", currentSelectedSlot.id);
            const slotSnap = await transaction.get(slotRef);
            
            if (slotSnap.data().current_booked >= slotSnap.data().max_capacity) {
                throw "This time slot just reached chef's capacity. Please refresh.";
            }

            const standardTotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

            const orderData = {
                customer: { name_id: custId, phone: custPhone },
                items: cart,
                prices: { standard: standardTotal, harvard: standardTotal * 0.9 },
                slot_id: currentSelectedSlot.id,
                pickup_window: currentSelectedSlot.time_label,
                created_at: serverTimestamp(),
                status: "confirmed" // 只要訂單成立，主廚即開始備餐
            };

            transaction.update(slotRef, { current_booked: slotSnap.data().current_booked + 1 });
            await addDoc(collection(db, "orders"), orderData);
        });

        alert(`Thanks ${custId}! Chef is preparing your meal. Pickup at ${currentSelectedSlot.time_label}.`);
        cart = []; window.location.reload();
    } catch (e) {
        alert("Error: " + e);
        btn.disabled = false; btn.innerText = "PLACE MY ORDER";
    }
};

// --- 3. 渲染摘要 (雙價格顯示) ---
async function renderSummary() {
    const summarySection = document.getElementById('group-order-summary');
    const summaryText = document.getElementById('summary-text');
    if (cart.length === 0) { summarySection.style.display = 'none'; return; }

    summarySection.style.display = 'block';
    const slot = await getNextAvailableSlot();
    
    let subtotal = 0;
    let itemsLines = `🛒 Order for ${document.getElementById('cust-id').value || 'Customer'}\n`;
    itemsLines += `====================\n`;

    cart.forEach(item => {
        const lineTotal = item.unitPrice * item.quantity;
        subtotal += lineTotal;
        itemsLines += `• ${item.name} x${item.quantity}: $${lineTotal.toFixed(2)}\n`;
    });

    itemsLines += `====================\n`;
    itemsLines += `KITCHEN SLOT: ${slot ? slot.time_label : 'WAITLIST ONLY'}\n`;
    itemsLines += `--------------------\n`;
    itemsLines += `Standard Total: $${subtotal.toFixed(2)}\n`;
    itemsLines += `🎓 Harvard Total: $${(subtotal * 0.9).toFixed(2)}\n`;
    itemsLines += `====================\n`;
    itemsLines += `Chef starts cooking now! 🔬`;

    summaryText.innerText = itemsLines;
}

// 監聽輸入框，即時更新摘要中的姓名
document.getElementById('cust-id')?.addEventListener('input', renderSummary);

window.handleAddToCart = (itemId, itemName, price) => {
    const qtyInput = document.getElementById(`qty-${itemId}`);
    const quantity = parseInt(qtyInput.value);
    if (quantity <= 0 || quantity > parseInt(qtyInput.getAttribute('max'))) return alert("Invalid Qty");
    const existing = cart.find(i => i.id === itemId);
    if (existing) existing.quantity += quantity;
    else cart.push({ id: itemId, name: itemName, unitPrice: price, quantity });
    renderSummary();
};
