// ==========================================
// 1. CONFIGURATION & ZING SOUND
// ==========================================
const MY_UPI_ID = "9003705725@ybl"; 
const MY_PHONE = "919003705725";  
const CAFE_NAME = "Thirumagal Coffee House";

let isPaymentPending = false;
let pendingAmount = 0;

function playZingSound() {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        // Zing Sound: High frequency and short duration
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1200, context.currentTime); 
        oscillator.frequency.exponentialRampToValueAtTime(800, context.currentTime + 0.1); 
        gainNode.gain.setValueAtTime(0.2, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.start(); oscillator.stop(context.currentTime + 0.15);
    } catch (e) { console.log("Audio blocked by user settings."); }
}

// ==========================================
// 2. MENU DATA
// ==========================================
const menuItems = [
    { id: 1, eng: "Tea", tam: "டீ", price: 15, img: "tea.jpg" },
    { id: 2, eng: "Coffee", tam: "காபி", price: 20, img: "coffee.jpg" },
    { id: 3, eng: "Milk", tam: "பால்", price: 15, img: "milk.jpg" },
    { id: 4, eng: "Boost", tam: "பூஸ்ட்", price: 25, img: "boost.jpg" },
    { id: 5, eng: "Horlicks", tam: "ஹார்லிக்ஸ்", price: 25, img: "horlicks.jpg" },
    { id: 6, eng: "Ginger Tea", tam: "இஞ்சி டீ", price: 20, img: "ginger-tea.jpg" },
    { id: 7, eng: "Ginger Milk", tam: "இஞ்சி பால்", price: 20, img: "ginger-milk.jpg" },
    { id: 8, eng: "Black Tea", tam: "பிளாக் டீ", price: 12, img: "black-tea.jpg" },
    { id: 9, eng: "Green Tea", tam: "கிரீன் டீ", price: 25, img: "green-tea.jpg" },
    { id: 10, eng: "Black Coffee", tam: "பிளாக் காபி", price: 18, img: "black-coffee.jpg" }
];

let cart = {};
const container = document.getElementById('menu-container');

menuItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
        <div class="price-tag">₹${item.price}</div>
        <img src="${item.img}" class="item-img" alt="${item.eng}" loading="lazy">
        <div class="item-names">
            <h3>${item.eng}</h3>
            <p>${item.tam}</p>
        </div>
        <div class="qty-controller">
            <button class="btn-qty" onclick="updateQty(${item.id}, -1)">−</button>
            <span id="qty-${item.id}">0</span>
            <button class="btn-qty" onclick="updateQty(${item.id}, 1)">+</button>
        </div>
    `;
    container.appendChild(card);
});

function updateQty(id, change) {
    cart[id] = (cart[id] || 0) + change;
    if (cart[id] < 0) cart[id] = 0;
    document.getElementById(`qty-${id}`).innerText = cart[id];
    calculateTotal();
}

function calculateTotal() {
    let total = 0; let count = 0;
    menuItems.forEach(item => {
        if (cart[item.id]) {
            total += cart[item.id] * item.price;
            count += cart[item.id];
        }
    });
    document.getElementById('total-price').innerText = `₹${total}`;
    document.getElementById('item-count').innerText = `${count} Items`;
}

// ==========================================
// 3. PAYMENT & AUTO-DETECTION
// ==========================================
function processCheckout() {
    const total = document.getElementById('total-price').innerText.replace('₹', '');
    if (total === "0" || total === "") {
        alert("Oops! Your tray is empty. ☕");
        return;
    }
    isPaymentPending = true;
    pendingAmount = total;
    const upiLink = `upi://pay?pa=${MY_UPI_ID}&pn=${encodeURIComponent(CAFE_NAME)}&am=${total}&cu=INR&tn=CafeOrder`;
    window.location.href = upiLink;
}

// Auto-Detect Return from UPI App
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isPaymentPending) {
        setTimeout(() => { 
            showVerificationModal(pendingAmount);
            isPaymentPending = false;
        }, 1000);
    }
});

function showVerificationModal(amount) {
    if (document.getElementById('statusOverlay')) return;
    const overlay = document.createElement('div');
    overlay.className = "payment-overlay active";
    overlay.id = "statusOverlay";
    overlay.innerHTML = `
        <div class="payment-card status-card">
            <div id="verify-area">
                <div class="payment-icon">⌛</div>
                <h3>Welcome Back!</h3>
                <p>Complete your payment of <b>₹${amount}</b> in your bank app? Click below to get your receipt.</p>
                <button onclick="finalizeOrder('${amount}')" class="checkout-btn" style="width:100%">I Have Paid Successfully</button>
                <button onclick="location.reload()" class="close-link">Payment Failed / Cancel</button>
                <div id="popup-tip" style="display:none; background:#fff3cd; color:#856404; padding:10px; border-radius:10px; font-size:13px; margin-top:15px; border:1px solid #ffeeba;"></div>
            </div>
            <div id="success-area" style="display:none;"></div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function finalizeOrder(amount) {
    playZingSound();
    const orderID = "TH" + Math.floor(Math.random() * 9000 + 1000);
    let itemHtml = ""; let whatsappText = "";

    menuItems.forEach(item => {
        const qty = cart[item.id] || 0;
        if (qty > 0) {
            const itemTotal = item.price * qty;
            itemHtml += `<div class="summary-line"><span>${item.eng} x ${qty}</span><b>₹${itemTotal}</b></div>`;
            whatsappText += `• ${item.eng} (₹${item.price}) x ${qty} = ₹${itemTotal}\n`;
        }
    });

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('ID:'+orderID+'|Amt:'+amount)}`;
    
    document.getElementById('verify-area').style.display = 'none';
    const res = document.getElementById('success-area');
    res.style.display = 'block';

    res.innerHTML = `
        <div class="success-ui">
            <div class="check-icon">✅</div>
            <h2 style="color:#27ae60">Payment Verified!</h2>
            <img src="${qrUrl}" class="qr-code">
            <div class="receipt-box">
                <p class="order-id">Order ID: #${orderID}</p>
                ${itemHtml}
                <hr>
                <p class="final-total">TOTAL PAID: ₹${amount} <span style="color:#27ae60">✔</span></p>
            </div>
            <button onclick="sendWhatsAppReceipt('${orderID}', '${amount}', ${JSON.stringify(whatsappText)})" class="pay-btn">
                Send Receipt to Owner
            </button>
            <button onclick="location.reload()" class="close-link">Back to Menu</button>
        </div>
    `;

    setTimeout(() => { sendWhatsAppReceipt(orderID, amount, whatsappText); }, 2500);
}

function sendWhatsAppReceipt(id, amt, items) {
    const fullMessage = `✅ *PAYMENT SUCCESS*\n` +
                        `--------------------------\n` +
                        `*Order ID:* #${id}\n` +
                        `*Items:*\n${items}` +
                        `--------------------------\n` +
                        `*TOTAL PAID: ₹${amt}* ✅\n` +
                        `--------------------------\n` +
                        `_Generated at Thirumagal Coffee House_`;

    const encodedMsg = encodeURIComponent(fullMessage);
    const waUrl = `https://wa.me/${MY_PHONE}?text=${encodedMsg}`;
    const newWindow = window.open(waUrl, '_blank');

    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        const tip = document.getElementById('popup-tip');
        if (tip) {
            tip.style.display = 'block';
            tip.innerHTML = `⚠️ <b>Popup Blocked:</b> Please click the blue button below to send the receipt!`;
        }
    }
}