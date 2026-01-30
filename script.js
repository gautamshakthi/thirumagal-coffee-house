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
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(1500, context.currentTime); 
        oscillator.frequency.exponentialRampToValueAtTime(1000, context.currentTime + 0.1); 
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.start(); oscillator.stop(context.currentTime + 0.15);
    } catch (e) { console.log("Sound blocked"); }
}

// ==========================================
// 2. MENU DATA & RENDERING
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
            <span class="qty-count" id="qty-${item.id}">0</span>
            <button class="btn-qty" onclick="updateQty(${item.id}, 1)">+</button>
        </div>`;
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
// 3. PAYMENT FLOW
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
                <p>Did you pay <b>₹${amount}</b>? Click below for your receipt.</p>
                <button onclick="finalizeOrder('${amount}')" class="checkout-btn" style="width:100%">I Have Paid Successfully</button>
                <button onclick="location.reload()" class="close-link">Payment Failed / Cancel</button>
                <div id="popup-tip" style="display:none; background:#fff3cd; color:#856404; padding:10px; border-radius:10px; font-size:13px; margin-top:15px; border:1px solid #ffeeba;"></div>
            </div>
            <div id="success-area" style="display:none;"></div>
        </div>`;
    document.body.appendChild(overlay);
}

function finalizeOrder(amount) {
    playZingSound();
    const orderID = "TH" + Math.floor(Math.random() * 9000 + 1000);
    let itemHtml = ""; 
    let whatsappList = "";

    menuItems.forEach(item => {
        const qty = cart[item.id] || 0;
        if (qty > 0) {
            const itemTotal = item.price * qty;
            itemHtml += `<div class="summary-line" style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:5px;">
                            <span>${item.eng} x ${qty}</span>
                            <b>₹${itemTotal}</b>
                         </div>`;
            whatsappList += `• ${item.eng} x ${qty} = ₹${itemTotal}\n`;
        }
    });

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('ID:'+orderID+'|Amt:'+amount)}`;
    
    document.getElementById('verify-area').style.display = 'none';
    const res = document.getElementById('success-area');
    res.style.display = 'block';

    // Inside finalizeOrder (UI part)
res.innerHTML = `
    <div class="success-ui" style="text-align:center;">
        <div class="check-icon-container">
            <span class="animated-tick">✅</span>
            <h2 style="color:#2d2424">Payment Verified!</h2>
        </div>
        <div id="receipt-preview-container">
             </div>
        <button onclick='sendWhatsAppReceipt("${orderID}", "${amount}", \`${whatsappList}\`)' class="checkout-btn" style="width:100%; background:#25D366">
            Share Visual Receipt to WhatsApp
        </button>
    </div>`;
}

async function sendWhatsAppReceipt(id, amt, items) {
    const dataUrl = await generateReceiptImage(id, amt, items);
    
    // Convert DataURL to File object for sharing
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `Receipt_${id}.png`, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'Cafe Receipt',
                text: `Order #${id} verified.`
            });
        } catch (err) {
            alert("Sharing failed. Please long-press the receipt image to save/copy.");
        }
    } else {
        // Fallback: Open image in new tab for manual saving
        const win = window.open();
        win.document.write(`<img src="${dataUrl}" style="width:100%"><p>Long press to save & send to WhatsApp</p>`);
    }
}

async function generateReceiptImage(orderID, amount, itemsArray) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 500;
    canvas.height = 700;

    // 1. Background & Border
    ctx.fillStyle = '#fdfaf7'; // var(--bg-cream)
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#e0c097'; // var(--crema)
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    // 2. Header
    ctx.fillStyle = '#2d2424'; // var(--espresso)
    ctx.font = 'bold 30px Arial';
    ctx.fillText('Thirumagal Coffee House', 60, 60);

    // 3. Security Timestamp (The "Anti-Fake" Marker)
    const now = new Date();
    const timestamp = `${now.toLocaleDateString()} | ${now.toLocaleTimeString()}`;
    ctx.fillStyle = '#b85c38'; // var(--latte)
    ctx.font = 'bold 16px Courier New';
    ctx.fillText(`VERIFIED: ${timestamp}`, 60, 100);

    // 4. Success Message & Icon
    ctx.fillStyle = '#27ae60';
    ctx.font = '40px Arial';
    ctx.fillText('● PAYMENT SUCCESS', 60, 160);

    // 5. Order Details
    ctx.fillStyle = '#2d2424';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(`Order ID: #${orderID}`, 60, 210);
    
    ctx.font = '18px Arial';
    let yPos = 250;
    itemsArray.split('\n').forEach(line => {
        ctx.fillText(line, 60, yPos);
        yPos += 30;
    });

    // 6. Total
    ctx.strokeStyle = '#ddd';
    ctx.beginPath(); ctx.moveTo(60, yPos); ctx.lineTo(440, yPos); ctx.stroke();
    yPos += 40;
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`TOTAL PAID: ₹${amount}`, 60, yPos);

    // 7. Render QR Code onto Canvas
    // We fetch the QR from the API and draw it
    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous"; 
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ID:${orderID}`;
    
    return new Promise((resolve) => {
        qrImg.onload = () => {
            ctx.drawImage(qrImg, 175, yPos + 40, 150, 150);
            resolve(canvas.toDataURL("image/png"));
        };
    });
}