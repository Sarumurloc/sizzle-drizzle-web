// 使用物件存儲購物車：{ itemId: { name, price, quantity } }
let cart = {};

// 暴露函數給全域，解決模組化作用域問題
window.handleAddToCart = (itemId, name, price) => {
    const qtyInput = document.getElementById(`qty-${itemId}`);
    const quantityToAdd = parseInt(qtyInput.value) || 1;

    if (quantityToAdd <= 0) return;

    // 嚴謹邏輯：更新或新增購物車項目
    if (cart[itemId]) {
        cart[itemId].quantity += quantityToAdd;
    } else {
        cart[itemId] = {
            name: name,
            price: price,
            quantity: quantityToAdd
        };
    }

    // 重置輸入框
    qtyInput.value = 1;
    updateSummary();
};

function updateSummary() {
    const summarySection = document.getElementById('group-order-summary');
    const summaryText = document.getElementById('summary-text');
    
    // 檢查購物車是否為空
    const itemKeys = Object.keys(cart);
    if (itemKeys.length === 0) {
        summarySection.style.display = 'none';
        return;
    }

    summarySection.style.display = 'block';
    let text = "📋 --- Group Order Summary ---\n\n";
    let grandTotal = 0;

    itemKeys.forEach(id => {
        const item = cart[id];
        const itemTotal = item.price * item.quantity;
        grandTotal += itemTotal;
        text += `${item.name} x ${item.quantity} = $${itemTotal.toFixed(2)}\n`;
    });

    text += `\n--------------------------\n`;
    text += `Total Amount: $${grandTotal.toFixed(2)}`;
    
    summaryText.innerText = text;
}

// 複製功能：周全的防禦，確保使用者體驗
window.copySummary = () => {
    const summaryText = document.getElementById('summary-text').innerText;
    navigator.clipboard.writeText(summaryText).then(() => {
        alert("Order list copied! You can now paste it into WhatsApp.");
    }).catch(err => {
        console.error('Copy failed', err);
    });
};
