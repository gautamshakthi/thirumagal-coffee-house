// ==========================================
// 1. CONFIGURATION & BRAVE-COMPATIBLE SOUND
// ==========================================
const MY_UPI_ID = "9003705725@ybl"; 
const MY_PHONE = "919003705725";  
const CAFE_NAME = "Thirumagal Coffee House";

// Brave/iOS Fix: AudioContext must be resumed on user click
let audioCtx;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playZingSound() {
    try {
        initAudio();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(1500, audioCtx.currentTime); 
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1); 
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) { console.log("Sound blocked by Brave/Safari Shields"); }
}

// ==========================================
// 2. MENU DATA & STATE
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
        <div class="item-names"><h3>${item.eng}</h3><p>${item.tam}</p></div>
        <div class="qty-controller">
            <button class="btn-qty" onclick="updateQty(${item.id}, -1)">−</button>
            <span class="qty-count" id="qty-${item.id}">0</span>
            <button class="btn-qty" onclick="updateQty(${item.id}, 1)">+</button>
        </div>`;
    container.appendChild(card);
});

function updateQty(id, change) {
    initAudio(); // Warm up audio context on interaction
    cart[id] = (cart[id] || 0) + change;
    if (cart[id] < 0) cart[id] = 0;

    const countElement = document.getElementById(`qty-${id}`);
    if (countElement) {
        countElement.innerText = cart[id];
        countElement.style.color = "#ffffff";
        setTimeout(() => { countElement.style.color = "#ffd700"; }, 200);
    }
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
// 3. BRAVE-OPTIMIZED PAYMENT FLOW
// ==========================================
function processCheckout() {
    const total = document.getElementById('total-price').innerText.replace('₹', '');
    if (total === "0" || total === "") return alert("Oops! Your tray is empty. ☕");

    // Brave Fix: Store status in SessionStorage in case the browser kills the JS state
    sessionStorage.setItem('isPaymentPending', 'true');
    sessionStorage.setItem('pendingAmount', total);

    const upiLink = `upi://pay?pa=${MY_UPI_ID}&pn=${encodeURIComponent(CAFE_NAME)}&am=${total}&cu=INR&tn=CafeOrder`;
    
    // Attempt redirect
    window.location.href = upiLink;
}

// Detect return from GPay/PhonePe
function handleVisibility() {
    const isPending = sessionStorage.getItem('isPaymentPending');
    const amount = sessionStorage.getItem('pendingAmount');

    if (document.visibilityState === 'visible' && isPending === 'true') {
        setTimeout(() => { 
            showVerificationModal(amount);
            sessionStorage.removeItem('isPaymentPending');
        }, 1200);
    }
}

document.addEventListener('visibilitychange', handleVisibility);
// Initial check for Brave users who might trigger a page reload on return
window.addEventListener('load', handleVisibility);

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
                <p>Verify payment of <b>₹${amount}</b> to generate receipt.</p>
                <button onclick="finalizeOrder('${amount}')" class="checkout-btn" style="width:100%">I Have Paid Successfully</button>
                <button onclick="location.reload()" class="close-link">Cancel / Failed</button>
                <div id="popup-tip" style="display:none; background:#fff3cd; color:#856404; padding:10px; border-radius:10px; font-size:13px; margin-top:10px;">
                    <b>Brave Tip:</b> If WhatsApp doesn't open, click the button again.
                </div>
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
            itemHtml += `<div class="summary-line" style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:5px;">
                            <span>${item.eng} x ${qty}</span><b>₹${item.price * qty}</b>
                         </div>`;
            whatsappList += `• ${item.eng} x ${qty} = ₹${item.price * qty}\n`;
        }
    });

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('ID:'+orderID+'|Amt:'+amount)}`;
    document.getElementById('verify-area').style.display = 'none';
    const res = document.getElementById('success-area');
    res.style.display = 'block';

    res.innerHTML = `
        <div class="success-ui" style="text-align:center;">
            <div class="check-icon" style="font-size:60px; color:#27ae60;">✅</div>
            <h2>Order Verified!</h2>
            <img src="${qrUrl}" style="width:140px; margin:10px auto; border-radius:12px;">
            <div class="receipt-box" style="background:#fdfaf7; border:2px dashed #e0c097; padding:15px; border-radius:15px; text-align:left;">
                <p><b>Order #${orderID}</b></p>
                ${itemHtml}
                <hr><p style="display:flex; justify-content:space-between; font-weight:bold;"><span>TOTAL</span><span>₹${amount} ✅</span></p>
            </div>
            <button onclick='sendWhatsAppReceipt("${orderID}", "${amount}", ${JSON.stringify(whatsappList)})' class="checkout-btn" style="width:100%; background:#2d2424; margin-top:15px;">
                Open WhatsApp Receipt
            </button>
        </div>`;
}

function sendWhatsAppReceipt(id, amt, items) {
    const fullMessage = `✅ *PAYMENT SUCCESS*\n*ID:* #${id}\n*Items:*\n${items}*TOTAL: ₹${amt}* ✅`;
    const waUrl = `https://wa.me/${MY_PHONE}?text=${encodeURIComponent(fullMessage)}`;
    
    // Brave Shields often block automatic window.open
    const win = window.open(waUrl, '_blank');
    if (!win) {
        document.getElementById('popup-tip').style.display = 'block';
    }
}