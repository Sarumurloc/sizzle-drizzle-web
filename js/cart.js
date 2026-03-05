import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let cart = [];

function getEstimatedPickupTime() {
    const now = new Date();
    const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    estTime.setHours(estTime.getHours() + 1);
    return estTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function renderSummary() {
    const emptyMsg = document.getElementById('empty-cart-msg');
    const formContent = document.getElementById('order-form-content');
    const summaryText = document.getElementById('summary-text');
    
    if (!emptyMsg || !formContent) return;

    if (cart.length === 0) {
        emptyMsg.style.display = 'block';
        formContent.style.display = 'none';
        return;
    }

    emptyMsg.style.display = 'none';
    formContent.style.display = 'flex'; 

    const guestId = document.getElementById('guest-id')?.value.trim() || 'Guest';
    let subtotal = 0;
    
    let lines = `🛒 Patient Order: ${guestId}\n----------------------------\n`;

    cart.forEach(item => {
        const itemTotal = item.unitPrice * item.quantity;
        subtotal += itemTotal;
        lines += `• ${item.name} x${item.quantity}: $${itemTotal.toFixed(2)}\n`;
    });

    lines += `----------------------------\nESTIMATED PICKUP: After ${getEstimatedPickupTime()}\nStandard Total: $${subtotal.toFixed(2)}\n🎓 Harvard Discount: $${(subtotal * 0.9).toFixed(2)}\n----------------------------\nStatus: Medical-Grade Precision`;

    if (summaryText) summaryText.textContent = lines;
}

window.handleAddToCart = (id, name, price, safeId) => {
    const qtyInput = document.getElementById(`qty-${safeId || id}`);
    const qty = parseInt(qtyInput?.value) || 0;
    if (qty <= 0) return;

    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({ id, name, unitPrice: parseFloat(price), quantity: qty });
    }
    renderSummary();
};

window.submitOrder = async () => {
    const idField = document.getElementById('guest-id');
    const phoneField = document.getElementById('guest-phone');
    if (!idField?.value.trim() || !phoneField?.value.trim()) {
        alert("Boundary Error: ID and Phone are required.");
        return;
    }

    const btn = document.querySelector('.place-order-btn');
    btn.disabled = true;
    btn.textContent = "TRANSMITTING...";

    try {
        const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        await addDoc(collection(db, "orders"), {
            customer: { id: idField.value, phone: phoneField.value },
            items: cart,
            billing: { standard_total: subtotal, final_total: subtotal * 0.9 },
            created_at: serverTimestamp(),
            status: "pending"
        });
        alert("Success! Your nutrition plan is being prepared.");
        cart = [];
        idField.value = '';
        phoneField.value = '';
        renderSummary();
    } catch (e) {
        console.error("Transmission Error:", e);
        alert("System Error: Unable to sync with database.");
    } finally {
        btn.disabled = false;
        btn.textContent = "PLACE ORDER";
    }
};

document.addEventListener('input', (e) => {
    if (e.target.id === 'guest-id') renderSummary();
});

renderSummary();
