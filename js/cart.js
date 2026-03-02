let cart = {}; // 資料結構：{ itemId: { name, price, quantity } }

// 將函數掛載到 window，確保 HTML onclick 能觸發
window.handleAddToCart = (itemId, name, price) => {
    const qtyInput = document.getElementById(`qty-${itemId}`);
    // 嚴謹邏輯：將字串轉為數字，並處理異常值
    const quantityToAdd = parseInt(qtyInput.value) || 1;

    if (quantityToAdd <= 0) return;

    // 演算法優化：歸併同類項
    if (cart[itemId]) {
        cart[itemId].quantity += quantityToAdd;
    } else {
        cart[itemId] = {
            name: name,
            price: price,
            quantity: quantityToAdd
        };
    }

    qtyInput.value = 1; // 重置輸入框
    updateSummary();
};

function updateSummary() {
    const summarySection = document.getElementById('group-order-summary');
    const summaryText = document.getElementById('summary-text');
    
    const itemKeys = Object.keys(cart);
    if (itemKeys.length === 0) {
        summarySection.style.display = 'none';
        return;
    }

    summarySection.style.display = 'block';
    let text = "📋 --- Sizzle & Drizzle Order List ---\n\n";
    let grandTotal = 0;

    itemKeys.forEach(id => {
        const item = cart[id];
        const itemTotal = item.price * item.quantity;
        grandTotal += itemTotal;
        text += `▪️ ${item.name} x ${item.quantity} = $${itemTotal.toFixed(2)}\n`;
    });

    text += `\n--------------------------\n`;
    text += `Grand Total: $${grandTotal.toFixed(2)}\n`;
    text += `\nOrder by: [Your Name/Group]`;
    
    summaryText.innerText = text;
}

window.copySummary = () => {
    const summaryText = document.getElementById('summary-text').innerText;
    navigator.clipboard.writeText(summaryText).then(() => {
        alert("Success! Order list copied to clipboard. Now paste it into WhatsApp!");
    });
};
