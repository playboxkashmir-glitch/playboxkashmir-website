/* ============================
   PlayBox Kashmir - Booking System
   ============================ */

// =====================
// CONFIGURATION
// =====================
const CONFIG = {
  facilities: {
    football: {
      name: 'Football & Cricket Turf',
      icon: 'fas fa-futbol',
      color: '#15803d',
      options: [
        { id: 'turf1', name: 'Main Turf (Football & Cricket)', price: 1800, peak_price: 1800 }
      ]
    },
    cricket: {
      name: 'Cricket Nets',
      icon: 'fas fa-baseball-ball',
      color: '#22c55e',
      comingSoon: true,
      options: [
        { id: 'net1', name: 'Net 1', price: 400, peak_price: 500 },
        { id: 'net2', name: 'Net 2', price: 400, peak_price: 500 },
        { id: 'net3', name: 'Net 3', price: 400, peak_price: 500 }
      ]
    },
    pickleball: {
      name: 'Pickleball Court',
      icon: 'fas fa-table-tennis',
      color: '#22c55e',
      comingSoon: true,
      options: [
        { id: 'pb_a', name: 'Court A', price: 300, peak_price: 400 },
        { id: 'pb_b', name: 'Court B', price: 300, peak_price: 400 }
      ]
    }
  },
  slots: {
    start: 9,   // 9 AM
    end: 26,    // 2 AM (next day)
    duration: 60 // minutes
  },
  peak_hours: [18, 19, 20, 21], // 6PM - 10PM
  weekend_days: [0, 6], // Sunday, Saturday
  gst_rate: 0,
  convenience_fee: 15,
  reservation_minutes: 10,
  promo_codes: {
    'PLAYBOX20': { type: 'percent', value: 20, min_amount: 500 },
    'FLAT100': { type: 'flat', value: 100, min_amount: 400 },
    'WELCOME10': { type: 'percent', value: 10, min_amount: 0 }
  }
};

// =====================
// BOOKING STATE
// =====================
let state = {
  step: 1,
  sport: null,
  sportName: null,
  facilityId: null,
  facilityName: null,
  facilityPrice: 0,
  date: null,
  dateFormatted: null,
  slotTime: null,
  slotLabel: null,
  customerName: null,
  customerPhone: null,
  customerEmail: null,
  customerNotes: null,
  promoCode: null,
  promoDiscount: 0,
  promoType: null,
  basePrice: 0,
  gstAmount: 0,
  totalAmount: 0,
  bookingId: null,
  reservationTimer: null,
  reservationSeconds: CONFIG.reservation_minutes * 60
};

// Simulated booked slots (in production, fetch from server)
let bookedSlots = {};

// =====================
// STEP NAVIGATION
// =====================
function goToStep(stepNum) {
  const currentStep = document.getElementById('step-' + state.step);
  const nextStep = document.getElementById('step-' + stepNum);
  
  if (!nextStep) return;
  
  if (currentStep) currentStep.style.display = 'none';
  nextStep.style.display = 'block';
  
  // Update step indicators
  for (let i = 1; i <= 5; i++) {
    const indicator = document.getElementById('step-indicator-' + i);
    if (!indicator) continue;
    indicator.classList.remove('active', 'completed');
    if (i < stepNum) indicator.classList.add('completed');
    if (i === stepNum) indicator.classList.add('active');
  }
  
  state.step = stepNum;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  if (stepNum === 2) renderCalendar();
  if (stepNum === 3) renderSummaryStep3();
  if (stepNum === 4) renderPaymentStep();
}

// =====================
// STEP 1: Sport & Facility Selection
// =====================
function selectSport(sport) {
  if (CONFIG.facilities[sport] && CONFIG.facilities[sport].comingSoon) {
    alert(CONFIG.facilities[sport].name + ' is coming soon. Bookings are not available yet.');
    return;
  }
  state.sport = sport;
  state.sportName = CONFIG.facilities[sport].name;
  state.facilityId = null;
  state.facilityName = null;
  state.facilityPrice = 0;
  
  // Update UI
  document.querySelectorAll('.sport-card').forEach(c => c.classList.remove('selected'));
  document.querySelector('[data-sport="' + sport + '"]').classList.add('selected');
  
  // Show facility selector
  const facilitySelector = document.getElementById('facilitySelector');
  const facilitiesList = document.getElementById('facilitiesList');
  facilitySelector.style.display = 'block';
  
  // Build facility buttons
  const options = CONFIG.facilities[sport].options;
  facilitiesList.innerHTML = options.map(opt => 
    '<button class="facility-btn" data-facility="' + opt.id + '" onclick="selectFacility(\'' + opt.id + '\', \'' + opt.name + '\', ' + opt.price + ', ' + opt.peak_price + ')">' + opt.name + '</button>'
  ).join('');
  
  checkStep1Complete();
}

function selectFacility(id, name, price, peakPrice) {
  state.facilityId = id;
  state.facilityName = name;
  state.facilityPrice = price;
  state.facilityPeakPrice = peakPrice;
  
  document.querySelectorAll('.facility-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector('[data-facility="' + id + '"]').classList.add('selected');
  
  checkStep1Complete();
}

function checkStep1Complete() {
  const btn = document.getElementById('btn-step1-next');
  if (btn) btn.disabled = !(state.sport && state.facilityId);
}

// =====================
// STEP 2: Calendar & Slots
// =====================
let currentCalDate = new Date();

function renderCalendar() {
  const year = currentCalDate.getFullYear();
  const month = currentCalDate.getMonth();
  
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('calMonthYear').textContent = monthNames[month] + ' ' + year;
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0,0,0,0);
  
  let html = '';
  
  // Empty cells for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="cal-day empty"></div>';
  }
  
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    date.setHours(0,0,0,0);
    const isToday = date.getTime() === today.getTime();
    const isPast = date < today;
    const isSelected = state.date && state.date.getTime() === date.getTime();
    
    let classes = 'cal-day';
    if (isToday) classes += ' today';
    if (isPast) classes += ' disabled';
    if (isSelected) classes += ' selected';
    
    if (isPast) {
      html += '<div class="' + classes + '">' + d + '</div>';
    } else {
      html += '<div class="' + classes + '" onclick="selectDate(' + year + ',' + month + ',' + d + ')">' + d + '</div>';
    }
  }
  
  document.getElementById('calDays').innerHTML = html;
}

function prevMonth() {
  currentCalDate.setMonth(currentCalDate.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentCalDate.setMonth(currentCalDate.getMonth() + 1);
  renderCalendar();
}

function selectDate(year, month, day) {
  state.date = new Date(year, month, day);
  state.slotTime = null;
  state.slotLabel = null;
  
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  state.dateFormatted = state.date.toLocaleDateString('en-IN', dateOptions);
  
  document.getElementById('selectedDateDisplay').innerHTML = 
    '<i class="fas fa-calendar-day"></i><span>' + state.dateFormatted + '</span>';
  
  renderCalendar();
  renderSlots();
  updateStep2Btn();
}

function renderSlots() {
  const slotsGrid = document.getElementById('slotsGrid');
  if (!state.date || !state.facilityId) return;
  
  const dateKey = state.date.toISOString().split('T')[0];
  const facilityBooked = (bookedSlots[state.facilityId] || {})[dateKey] || [];
  
  const today = new Date();
  const isToday = state.date.toDateString() === today.toDateString();
  const currentHour = today.getHours();
  
  const dayOfWeek = state.date.getDay();
  const isWeekend = CONFIG.weekend_days.includes(dayOfWeek);
  
  let html = '';
  
  for (let h = CONFIG.slots.start; h < CONFIG.slots.end; h++) {
    const startTime = formatTime(h);
    const endTime = formatTime(h + 1);
    const slotKey = h + ':00';
    const isBooked = facilityBooked.includes(slotKey);
    const isPast = isToday && h <= currentHour;
    
    const isPeak = CONFIG.peak_hours.includes(h);
    let price = state.facilityPrice;
    if (isPeak) price = state.facilityPeakPrice || price;
    
    const priceDisplay = isPeak ? '₹' + price + ' <span style="font-size:0.65rem;color:#f59e0b;">Peak</span>' : '₹' + price;
    
    let slotClass = 'slot-btn';
    if (isBooked || isPast) slotClass += ' booked';
    
    const isSelected = state.slotTime === slotKey;
    if (isSelected) slotClass += ' selected';
    
    if (isBooked || isPast) {
      html += '<button class="' + slotClass + '" disabled>' +
        '<span class="slot-time">' + startTime + ' - ' + endTime + '</span>' +
        '<span class="slot-price">Booked</span>' +
        '</button>';
    } else {
      html += '<button class="' + slotClass + '" onclick="selectSlot(\'' + slotKey + '\', \'' + startTime + ' - ' + endTime + '\', ' + price + ')">' +
        '<span class="slot-time">' + startTime + ' - ' + endTime + '</span>' +
        '<span class="slot-price">' + priceDisplay + '</span>' +
        '</button>';
    }
  }
  
  slotsGrid.innerHTML = html;
}

function formatTime(h) {
  var hh = h % 24;
  if (hh === 0) return '12:00 AM';
  if (hh === 12) return '12:00 PM';
  if (hh < 12) return hh + ':00 AM';
  return (hh - 12) + ':00 PM';
}

function selectSlot(slotKey, label, price) {
  state.slotTime = slotKey;
  state.slotLabel = label;
  state.basePrice = price;
  
  document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
  event.target.closest('.slot-btn').classList.add('selected');
  
  updateStep2Btn();
}

function updateStep2Btn() {
  const btn = document.getElementById('btn-step2-next');
  if (btn) btn.disabled = !(state.date && state.slotTime);
}

// =====================
// STEP 3: Customer Details
// =====================
function renderSummaryStep3() {
  const el = document.getElementById('summaryItems3');
  if (!el) return;
  el.innerHTML = buildSummaryRows();
  calculatePrice();
}

function buildSummaryRows() {
  return [
    ['Sport', state.sportName],
    ['Facility', state.facilityName],
    ['Date', state.dateFormatted],
    ['Time Slot', state.slotLabel],
    ['Booking Price (all inclusive)', '₹' + state.basePrice]
  ].map(([label, value]) => 
    '<div class="summary-row"><span class="label">' + label + '</span><span class="value">' + value + '</span></div>'
  ).join('');
}

function calculatePrice() {
  let price = state.basePrice;
  let discount = 0;
  
  if (state.promoCode && CONFIG.promo_codes[state.promoCode]) {
    const promo = CONFIG.promo_codes[state.promoCode];
    if (price >= promo.min_amount) {
      if (promo.type === 'percent') discount = Math.round(price * promo.value / 100);
      else discount = promo.value;
    }
  }
  
  state.promoDiscount = discount;
  const discounted = price - discount;
  const convenienceFee = CONFIG.convenience_fee;
  state.gstAmount = convenienceFee;
  state.totalAmount = discounted + convenienceFee;
}

function applyPromo() {
  const code = document.getElementById('promoCode').value.trim().toUpperCase();
  const resultEl = document.getElementById('promoResult');
  
  if (!code) {
    resultEl.textContent = 'Please enter a promo code.';
    resultEl.className = 'promo-result error';
    return;
  }
  
  if (CONFIG.promo_codes[code]) {
    const promo = CONFIG.promo_codes[code];
    if (state.basePrice < promo.min_amount) {
      resultEl.textContent = 'Minimum booking amount ₹' + promo.min_amount + ' required for this code.';
      resultEl.className = 'promo-result error';
      return;
    }
    state.promoCode = code;
    calculatePrice();
    const discountText = promo.type === 'percent' ? promo.value + '% off' : '₹' + promo.value + ' off';
    resultEl.textContent = '✓ Promo applied! ' + discountText;
    resultEl.className = 'promo-result success';
  } else {
    state.promoCode = null;
    state.promoDiscount = 0;
    resultEl.textContent = 'Invalid promo code. Please try again.';
    resultEl.className = 'promo-result error';
  }
}

function validateAndProceed() {
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  
  let valid = true;
  
  if (!name || name.length < 2) {
    document.getElementById('err-name').textContent = 'Please enter your full name.';
    valid = false;
  } else {
    document.getElementById('err-name').textContent = '';
  }
  
  if (!phone || phone.length < 10) {
    document.getElementById('err-phone').textContent = 'Please enter a valid phone number.';
    valid = false;
  } else {
    document.getElementById('err-phone').textContent = '';
  }
  
  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    document.getElementById('err-email').textContent = 'Please enter a valid email address.';
    valid = false;
  } else {
    document.getElementById('err-email').textContent = '';
  }
  
  if (!valid) return;
  
  state.customerName = name;
  state.customerPhone = phone;
  state.customerEmail = email;
  state.customerNotes = document.getElementById('custNotes').value.trim();
  
  calculatePrice();
  goToStep(4);
}

// =====================
// STEP 4: Payment
// =====================
function renderPaymentStep() {
  calculatePrice();
  
  const finalSummary = document.getElementById('finalSummary');
  if (finalSummary) {
    finalSummary.innerHTML = buildSummaryRows() + 
      '<div class="summary-row"><span class="label">Customer</span><span class="value">' + state.customerName + '</span></div>' +
      '<div class="summary-row"><span class="label">Email</span><span class="value">' + state.customerEmail + '</span></div>';
  }
  
  document.getElementById('pay-slot-price').textContent = '₹' + state.basePrice;
  document.getElementById('pay-gst').textContent = '₹' + state.gstAmount;
  document.getElementById('pay-total').innerHTML = '<strong>₹' + state.totalAmount + '</strong>';
  document.getElementById('btnPayAmount').textContent = '₹' + state.totalAmount;
  
  const discRow = document.getElementById('discountRow');
  if (state.promoDiscount > 0) {
    discRow.style.display = 'flex';
    document.getElementById('pay-discount').textContent = '-₹' + state.promoDiscount;
  } else {
    discRow.style.display = 'none';
  }
  
  startReservationTimer();
}

function startReservationTimer() {
  const timerEl = document.getElementById('reservationTimer');
  const display = document.getElementById('timerDisplay');
  if (!timerEl || !display) return;
  
  timerEl.style.display = 'block';
  state.reservationSeconds = CONFIG.reservation_minutes * 60;
  
  if (state.reservationTimer) clearInterval(state.reservationTimer);
  
  state.reservationTimer = setInterval(() => {
    state.reservationSeconds--;
    const mins = Math.floor(state.reservationSeconds / 60);
    const secs = state.reservationSeconds % 60;
    display.textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
    
    if (state.reservationSeconds <= 0) {
      clearInterval(state.reservationTimer);
      timerEl.style.display = 'none';
      alert('Your slot reservation has expired. Please select a new slot.');
      goToStep(2);
    }
  }).catch((err) => {
    hideLoading();
    alert(err && err.message ? err.message : 'Could not start payment. Please try again.');
  });
}

function stopReservationTimer() {
  if (state.reservationTimer) clearInterval(state.reservationTimer);
  const timerEl = document.getElementById('reservationTimer');
  if (timerEl) timerEl.style.display = 'none';
}

// =====================
// PAYMENT (Razorpay Integration)
// =====================
function initiatePayment() {
  showLoading('Initializing payment...');
  
  // Generate booking ID
  state.bookingId = 'PBK' + Date.now().toString(36).toUpperCase();
  
  // Create order on the server (Razorpay Orders API) before opening checkout
  createRazorpayOrder().then(() => {
    hideLoading();
    
    // Check if Razorpay script is loaded
    if (typeof Razorpay === 'undefined') {
      // Load Razorpay script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = openRazorpay;
      script.onerror = () => {
        alert('Payment gateway could not be loaded. Please check your internet connection and try again.');
      };
      document.head.appendChild(script);
    } else {
      openRazorpay();
    }
  }, 1000);
}

// Create a Razorpay order via the serverless API (/api/create-order)
function createRazorpayOrder() {
  return fetch('/api/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: Math.round(state.totalAmount * 100),
      currency: 'INR',
      receipt: state.bookingId,
      notes: {
        booking_id: state.bookingId,
        facility: state.facilityName,
        date: state.dateFormatted,
        slot: state.slotLabel
      }
    })
  }).then(function (res) {
    if (!res.ok) { throw new Error('Order creation failed. Please try again.'); }
    return res.json();
  }).then(function (data) {
    if (!data || !data.id) { throw new Error('Invalid order response from server.'); }
    state.razorpayOrderId = data.id;
    return data.id;
  });
}

// Verify the payment signature on the server (/api/verify-payment) before confirming
function verifyAndConfirm(response) {
  showLoading('Verifying payment...');
  fetch('/api/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature
    })
  }).then(function (res) {
    return res.json().then(function (data) { return { ok: res.ok, data: data }; });
  }).then(function (result) {
    hideLoading();
    if (result.ok && result.data && result.data.verified) {
      handlePaymentSuccess(response);
    } else {
      alert('Payment could not be verified. If money was deducted, it will be refunded. Please contact support.');
    }
  }).catch(function () {
    hideLoading();
    alert('Payment verification failed due to a network error. Please contact support with your payment ID.');
  });
}

function openRazorpay() {
  const options = {
    key: 'rzp_test_YourKeyHere', // Replace with actual Razorpay key
    amount: state.totalAmount * 100, // Amount in paise
    currency: 'INR',
    name: 'PlayBox Kashmir',
    description: state.facilityName + ' - ' + state.slotLabel + ' on ' + state.dateFormatted,
    image: 'https://playboxkashmir.com/assets/images/logo.png',
    order_id: state.razorpayOrderId,
    prefill: {
      name: state.customerName,
      email: state.customerEmail,
      contact: state.customerPhone
    },
    notes: {
      booking_id: state.bookingId,
      sport: state.sportName,
      facility: state.facilityName,
      date: state.dateFormatted,
      slot: state.slotLabel
    },
    theme: {
      color: '#15803d'
    },
    handler: function(response) {
      verifyAndConfirm(response);
    },
    modal: {
      ondismiss: function() {
        showPaymentCancelled();
      }
    }
  };
  
  // For demo purposes (no real Razorpay key), simulate payment
  if (options.key === 'rzp_test_YourKeyHere') {
    simulatePayment();
    return;
  }
  
  try {
    const rzp = new Razorpay(options);
    rzp.open();
  } catch(e) {
    hideLoading();
    alert('Unable to open the payment gateway. Please refresh and try again.');
  }
}

// Demo payment simulation
function simulatePayment() {
  showLoading('Opening payment gateway...');
  setTimeout(() => {
    hideLoading();
    
    // Create a demo confirmation dialog
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem;';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:20px;padding:2.5rem;max-width:440px;width:100%;text-align:center;">
        <div style="font-size:3rem;margin-bottom:1rem;">💳</div>
        <h3 style="font-size:1.25rem;font-weight:800;margin-bottom:0.5rem;">Demo Payment</h3>
        <p style="color:#6b7280;margin-bottom:1.5rem;">This is a demo booking. In production, Razorpay payment gateway will appear here.</p>
        <div style="background:#f9fafb;border-radius:12px;padding:1rem;margin-bottom:1.5rem;text-align:left;">
          <div style="font-size:0.85rem;color:#6b7280;margin-bottom:0.25rem;">Amount to pay</div>
          <div style="font-size:1.75rem;font-weight:900;color:#15803d;">₹${state.totalAmount}</div>
        </div>
        <button onclick="this.closest('div').parentElement.remove(); handlePaymentSuccess({razorpay_payment_id:'pay_demo_'+Date.now(),razorpay_order_id:'order_demo',razorpay_signature:'sig_demo'})" 
          style="background:#15803d;color:#fff;border:none;padding:0.85rem 2rem;border-radius:50px;font-size:1rem;font-weight:700;cursor:pointer;width:100%;margin-bottom:0.75rem;font-family:inherit;">
          ✓ Confirm Booking (Demo)
        </button>
        <button onclick="this.closest('div').parentElement.remove();showPaymentCancelled();" 
          style="background:#f3f4f6;color:#374151;border:none;padding:0.85rem 2rem;border-radius:50px;font-size:0.9rem;font-weight:600;cursor:pointer;width:100%;font-family:inherit;">
          Cancel
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
  }, 1500);
}

function handlePaymentSuccess(response) {
  showLoading('Confirming booking...');
  stopReservationTimer();
  
  // Mark slot as booked
  const dateKey = state.date.toISOString().split('T')[0];
  if (!bookedSlots[state.facilityId]) bookedSlots[state.facilityId] = {};
  if (!bookedSlots[state.facilityId][dateKey]) bookedSlots[state.facilityId][dateKey] = [];
  bookedSlots[state.facilityId][dateKey].push(state.slotTime);
  
  // In production: verify payment on server with webhook
  setTimeout(() => {
    hideLoading();
    showConfirmation(response);
  }, 1500);
}

function showPaymentCancelled() {
  const msg = document.createElement('div');
  msg.style.cssText = 'position:fixed;top:80px;right:1rem;background:#ef4444;color:#fff;padding:0.75rem 1.25rem;border-radius:10px;z-index:9999;font-weight:600;font-size:0.875rem;box-shadow:0 8px 24px rgba(0,0,0,0.2);';
  msg.textContent = 'Payment cancelled. Your slot is still reserved for ' + CONFIG.reservation_minutes + ' minutes.';
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 4000);
}

function showConfirmation(paymentResponse) {
  // Safety: remove any leftover demo/payment overlay so the confirmation is never dimmed
  document.querySelectorAll('div').forEach(function(d){
    if(d.style && d.style.position==='fixed' && d.style.zIndex==='99999'){ d.remove(); }
  });
  const confirmCard = document.getElementById('confirmCard');
  if (confirmCard) {
    confirmCard.innerHTML = `
      <div class="summary-row"><span class="label">Booking ID</span><span class="value" style="font-family:monospace;font-size:0.875rem;">${state.bookingId}</span></div>
      <div class="summary-row"><span class="label">Sport</span><span class="value">${state.sportName}</span></div>
      <div class="summary-row"><span class="label">Facility</span><span class="value">${state.facilityName}</span></div>
      <div class="summary-row"><span class="label">Date</span><span class="value">${state.dateFormatted}</span></div>
      <div class="summary-row"><span class="label">Time Slot</span><span class="value">${state.slotLabel}</span></div>
      <div class="summary-row"><span class="label">Customer</span><span class="value">${state.customerName}</span></div>
      <div class="summary-row"><span class="label">Email</span><span class="value">${state.customerEmail}</span></div>
      <div class="summary-row"><span class="label">Amount Paid</span><span class="value" style="color:#15803d;font-weight:800;">₹${state.totalAmount}</span></div>
      <div class="summary-row"><span class="label">Payment ID</span><span class="value" style="font-family:monospace;font-size:0.8rem;">${paymentResponse.razorpay_payment_id}</span></div>
      <div class="summary-row"><span class="label">Status</span><span class="value" style="color:#10b981;">✓ Confirmed</span></div>
    `;
  }
  
  goToStep(5);
}

// =====================
// RESET
// =====================
function resetBooking() {
  state = {
    step: 1, sport: null, sportName: null, facilityId: null, facilityName: null,
    facilityPrice: 0, date: null, dateFormatted: null, slotTime: null, slotLabel: null,
    customerName: null, customerPhone: null, customerEmail: null, customerNotes: null,
    promoCode: null, promoDiscount: 0, promoType: null, basePrice: 0, gstAmount: 0,
    totalAmount: 0, bookingId: null, reservationTimer: null, reservationSeconds: CONFIG.reservation_minutes * 60
  };
  
  // Reset form
  ['custName','custPhone','custEmail','custNotes','promoCode'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  
  ['promoResult'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  
  goToStep(1);
}

// =====================
// UTILITIES
// =====================
function showLoading(text) {
  document.getElementById('loadingOverlay').style.display = 'flex';
  document.getElementById('loadingText').textContent = text || 'Processing...';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

// =====================
// INIT
// =====================
document.addEventListener('DOMContentLoaded', () => {
  // Check URL params for pre-selected sport
  const urlParams = new URLSearchParams(window.location.search);
  const sportParam = urlParams.get('sport');
  if (sportParam && CONFIG.facilities[sportParam]) {
    setTimeout(() => selectSport(sportParam), 100);
  }
  
  // Navbar scroll
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }
  
  console.log('PlayBox Kashmir Booking System - v2.0 initialized');
});
