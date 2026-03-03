// Data Structure: Using an object to manage items efficiently (Algorithm Optimization)
let cart = {};
let discountRate = 1.0;

// 1. Discount Logic (Boundary Check: Email Validation)
window.applyDiscount = () => {
    const email = document.getElementById('user-email').value;
    // Strict logic: Harvard domain check
    if (email.toLowerCase().endsWith('@harvard.edu')) {
        discountRate = 0.9;
        alert("Success! 10% Harvard discount applied to your order.");
        updateSummary();
    } else {
        alert("Please enter a valid @harvard.edu email address to claim the discount.");
    }
};

// 2. Add to Cart Logic (Abstraction: Merging duplicates)
window.handleAddToCart = (itemId, name, basePrice) => {
    const qtyInput = document.getElementById(`qty-${itemId}`);
    const quantity = parseInt(qtyInput.value) || 0;

    // Robustness: Ensure positive quantity
    if (quantity <= 0) {
        alert("Please enter a valid quantity (1 or more).");
        return;
    }

    if (cart[itemId]) {
        cart[itemId].quantity += quantity;
    } else {
        cart[itemId] = {
            name: name,
            price: basePrice,
            quantity: quantity
        };
    }

    qtyInput.value = 1; // Reset input field
    updateSummary();
};

// 3. Update Visual Summary (Explicit Scope: UI Feedback)
function updateSummary() {
    const summarySection = document.getElementById('group-order-summary');
    const summaryText = document.getElementById('summary-text');
    
    const items = Object.keys(cart);
    if (items.length === 0) {
        summarySection.style.display = 'none';
        return;
    }

    summarySection.style.display = 'block';
    
    // Formatting for the US audience
    let text = "📋 --- Sizzle & Drizzle Order Summary ---\n\n";
    let total = 0;

    items.forEach(id => {
        const item = cart[id];
        const finalPrice = item.price * discountRate;
        const subtotal = finalPrice * item.quantity;
        total += subtotal;
        
        // Formatting: "Item Name x Quantity = $Amount"
        text += `▪️ ${item.name} x ${item.quantity} = $${subtotal.toFixed(2)}\n`;
    });

    text += `\n----------------------------------\n`;
    text += `TOTAL AMOUNT: $${total.toFixed(2)}\n`;
    if (discountRate < 1.0) {
        text += `(10% Harvard Discount Applied ✅)\n`;
    }
    text += `\nOrdered by: [Enter Your Name]`;
    
    summaryText.innerText = text;
}

// 4. Clipboard Logic (Robustness: Error Handling)
window.copySummary = () => {
    const summaryText = document.getElementById('summary-text').innerText;
    if (!summaryText) return;

    navigator.clipboard.writeText(summaryText).then(() => {
        alert("Order list copied to clipboard! You can now paste it into WhatsApp or Slack.");
    }).catch(err => {
        console.error("Copy failed", err);
        alert("Failed to copy. Please manually select and copy the text.");
    });
};
