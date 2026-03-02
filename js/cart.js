// 1. 抽象化：購物車資料結構 (Item ID 為 Key，數量為 Value)
let cart = {};

// 2. 嚴謹邏輯：加入購物車函數
window.addToCart = function(itemId, itemName, price) {
    if (cart[itemId]) {
        cart[itemId].quantity += 1;
    } else {
        cart[itemId] = {
            name: itemName,
            price: price,
            quantity: 1
        };
    }
    console.log(`Added ${itemName} to cart.`);
    updateCartUI();
};

// 3. 演算法優化：更新 UI 與生成「代訂清單」
function updateCartUI() {
    const summarySection = document.getElementById('group-order-summary');
    const summaryText = document.getElementById('summary-text');
    
    // 如果購物車有東西，就顯示清單區塊
    const itemKeys = Object.keys(cart);
    if (itemKeys.length > 0) {
        summarySection.style.display = 'block';
        
        let total = 0;
        let textList = "🛒 Sizzle & Drizzle Order Summary:\n------------------\n";
        
        itemKeys.forEach(key => {
            const item = cart[key];
            const subtotal = item.price * item.quantity;
            total += subtotal;
            textList += `${item.name} x ${item.quantity} = $${subtotal.toFixed(2)}\n`;
        });
        
        textList += `------------------\nTotal: $${total.toFixed(2)}`;
        summaryText.innerText = textList;
    } else {
        summarySection.style.display = 'none';
    }
}

// 4. 周全防禦：一鍵複製功能 (方便 WhatsApp/iMessage 分享)
window.copySummary = function() {
    const summaryText = document.getElementById('summary-text').innerText;
    navigator.clipboard.writeText(summaryText).then(() => {
        alert("Order list copied to clipboard! Share it with your friends.");
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
};
