/* ============================
   PlayBox Kashmir - Booking System
   ============================ */

// =====================
// CONFIGURATION
// =====================
// Sport metadata (icon/colour/coming-soon flag) that isn't stored in the
// database. Facility list, live prices, and promo codes are loaded from the
// backend APIs below so that changes made in the admin dashboard (pricing,
// promos) show up here automatically without editing this file.
const SPORT_META = {
   football: { name: 'Football Turf', icon: 'fas fa-futbol', color: '#15803d', comingSoon: false }, boxcricket: { name: 'Box Cricket', icon: 'fas fa-baseball-ball', color: '#ea580c', comingSoon: false },
   cricket: { name: 'Cricket Nets', icon: 'fas fa-baseball-ball', color: '#22c55e', comingSoon: true },
   pickleball: { name: 'Pickleball Court', icon: 'fas fa-table-tennis', color: '#22c55e', comingSoon: true }
};

const CONFIG = {
   facilities: {}, // populated at runtime by loadFacilities() from /api/facilities
   slots: {
      start: 5, // 5 AM
      end: 26, // 2 AM (next day)
      duration: 60 // minutes
   },
   peak_hours: [18, 19, 20, 21], // 6PM - 10PM
   weekend_days: [0, 6], // Sunday, Saturday
   gst_rate: 0,
   convenience_fee: 7,
   reservation_minutes: 10
};

// =====================
// BOOKING STATE
// =====================
let state = {
   step: 1,
   sport: null,
   sportName: null,
   facilityId: null,
   facilityDbId: null,
   facilityName: null,
   facilityPrice: 0,
   facilityPeakPrice: 0,
   date: null,
   dateFormatted: null,
   slotTime: null,
   slotLabel: null, selectedHours: [],
   customerName: null,
   customerPhone: null,
   customerEmail: null,
   customerNotes: null,
   promoCode: null,
   promoType: null,
   promoValue: 0,
   promoMinAmount: 0,
   promoDiscount: 0,
   basePrice: 0,
   gstAmount: 0,
   totalAmount: 0,
   bookingId: null,
   reservationTimer: null,
   reservationSeconds: CONFIG.reservation_minutes * 60
};

// =====================
// LIVE DATA (facilities/pricing from the backend)
// =====================
async function loadFacilities() {
   try {
      const res = await fetch('/api/facilities');
      if (!res.ok) throw new Error('Failed to load facilities');
      const data = await res.json();
      const facilities = {};
      (data.facilities || []).forEach(function (f) {
         const meta = SPORT_META[f.sport_key] || { name: f.sport_name, icon: 'fas fa-star', color: '#15803d', comingSoon: false };
         if (!facilities[f.sport_key]) {
            facilities[f.sport_key] = {
               name: meta.name,
               icon: meta.icon,
               color: meta.color,
               comingSoon: meta.comingSoon,
               options: []
            };
         }
         if (f.is_active !== false) {
            facilities[f.sport_key].options.push({
               id: f.option_id,
               dbId: f.id,
               name: f.option_name,
               price: Number(f.base_price),
               peak_price: Number(f.peak_price)
            });
         }
      });
      CONFIG.facilities = facilities;
      updateStaticPriceDisplays();
   } catch (err) {
      console.error('Could not load facilities from server:', err);
   }
}

// Loads site-wide pricing settings (e.g. convenience fee) from /api/settings
// so that changing them in the admin dashboard reflects here automatically.
async function loadSettings() {
     try {
            const res = await fetch('/api/settings');
            if (!res.ok) return;
            const data = await res.json();
            const fee = parseFloat(data.convenience_fee);
            if (!isNaN(fee)) {
                     CONFIG.convenience_fee = fee;
            }
     } catch (err) {
            console.error('Could not load settings from server:', err);
     }
}


// Keeps any static "starting from" price teasers elsewhere on the page (e.g.
// the homepage facility cards) in sync with the live price from the database.
function updateStaticPriceDisplays() {
   document.querySelectorAll('[data-live-price]').forEach(function (el) {
      const optionId = el.getAttribute('data-live-price');
      for (const sportKey in CONFIG.facilities) {
         const match = CONFIG.facilities[sportKey].options.find(function (o) { return o.id === optionId; });
         if (match) {
            el.textContent = '₹' + match.price;
         }
      }
   });
}

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
   else if (i === stepNum) indicator.classList.add('active');
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
   if (!CONFIG.facilities[sport]) {
      alert('Facility data is still loading. Please try again in a moment.');
      return;
   }
   if (CONFIG.facilities[sport].comingSoon) {
      alert(CONFIG.facilities[sport].name + ' is coming soon. Bookings are not available yet.');
      return;
   }
   state.sport = sport;
   state.sportName = CONFIG.facilities[sport].name;
   state.facilityId = null;
   state.facilityDbId = null;
   state.facilityName = null;
   state.facilityPrice = 0;
   // Update UI
document.querySelectorAll('.sport-card').forEach(function (el) { el.classList.remove('selected'); });
   const card = document.querySelector('[data-sport="' + sport + '"]');
   if (card) card.classList.add('selected');
   // Show facility selector
const facilitySelector = document.getElementById('facilitySelector');
   const facilitiesList = document.getElementById('facilitiesList');
   if (facilitySelector) facilitySelector.style.display = 'block';
   // Build facility buttons
const options = CONFIG.facilities[sport].options;
   if (facilitiesList) {
      facilitiesList.innerHTML = options.map(function (opt) {
         return '<button class="facility-btn" data-facility="' + opt.id + '" onclick="selectFacility(\'' + opt.id + '\', ' + opt.dbId + ', \'' + opt.name + '\', ' + opt.price + ', ' + opt.peak_price + ')">' + opt.name + '</button>';
      }).join('');
   }
   checkStep1Complete();
}

function selectFacility(id, dbId, name, price, peakPrice) {
   state.facilityId = id;
   state.facilityDbId = dbId;
   state.facilityName = name;
   state.facilityPrice = price;
   state.facilityPeakPrice = peakPrice;
   document.querySelectorAll('.facility-btn').forEach(function (el) { el.classList.remove('selected'); });
   const btn = document.querySelector('[data-facility="' + id + '"]');
   if (btn) btn.classList.add('selected');
   checkStep1Complete();
}

function checkStep1Complete() {
   const btn = document.getElementById('btn-step1-next');
   if (!btn) return;
   btn.disabled = !(state.sport && state.facilityId);
}

// =====================
// STEP 2: Calendar & Slots
// =====================
let currentCalDate = new Date();

function renderCalendar() {
   const year = currentCalDate.getFullYear();
   const month = currentCalDate.getMonth();
   const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
   const monthYearEl = document.getElementById('calMonthYear');
   if (monthYearEl) monthYearEl.textContent = monthNames[month] + ' ' + year;
   const firstDay = new Date(year, month, 1).getDay();
   const daysInMonth = new Date(year, month + 1, 0).getDate();
   const today = new Date();
   today.setHours(0, 0, 0, 0);
   let html = '';
   for (let i = 0; i < firstDay; i++) {
      html += '<div class="cal-day empty"></div>';
   }
   for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      date.setHours(0, 0, 0, 0);
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
   const calDaysEl = document.getElementById('calDays');
   if (calDaysEl) calDaysEl.innerHTML = html;
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
   state.slotLabel = null; state.selectedHours = []; state.basePrice = 0;
   const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
   state.dateFormatted = state.date.toLocaleDateString('en-IN', dateOptions);
   const displayEl = document.getElementById('selectedDateDisplay');
   if (displayEl) displayEl.innerHTML = '<i class="fas fa-calendar-day"></i><span>' + state.dateFormatted + '</span>';
   renderCalendar();
   renderSlots();
   updateStep2Btn();
}

// Fetches real booked slots for the selected date/facility from the server
// (instead of a client-side simulation) so double-booking is accurate and
// admin-created bookings immediately show as unavailable on the website.
async function renderSlots() {
   const slotsGrid = document.getElementById('slotsGrid');
   if (!slotsGrid || !state.date || !state.facilityId) return;
   const dateKey = state.date.toISOString().split('T')[0];
   slotsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#9ca3af;">Loading available slots...</p>';
   let bookedTimes = [];
   try {
      const res = await fetch('/api/bookings?resource=availability&date=' + dateKey + '&facility_id=' + state.facilityDbId);
      if (res.ok) {
         const data = await res.json();
         bookedTimes = (data.blocked || []).map(function (b) { return b.start_time; });
      }
   } catch (err) {
      console.error('Could not check slot availability:', err);
   }
   // If the user changed date/facility while this request was in flight, drop
// the stale response instead of rendering it.
if (!state.date || state.date.toISOString().split('T')[0] !== dateKey) return;

const today = new Date();
   const isToday = state.date.toDateString() === today.toDateString();
   const currentHour = today.getHours();
   let html = '';
   for (let hour = CONFIG.slots.start; hour < CONFIG.slots.end; hour++) {
      const startTime = formatTime(hour % 24);
      const endTime = formatTime((hour + 1) % 24);
      const slotKey = (hour % 24) + ':00';
      const isBooked = bookedTimes.indexOf(slotKey) !== -1;
      const isPast = isToday && (hour % 24) <= currentHour;
      const isPeak = CONFIG.peak_hours.includes(hour % 24);
      let price = isPeak ? state.facilityPeakPrice : state.facilityPrice;
      const priceDisplay = isPeak ? ('₹' + price + ' <span style="font-size:0.65rem;color:#f59e0b;">Peak</span>') : ('₹' + price);
      let slotClass = 'slot-btn';
      if (isBooked || isPast) slotClass += ' booked';
      const isSelected = state.slotTime === slotKey;
      if (isSelected) slotClass += ' selected';
      if (isBooked || isPast) {
         html += '<button class="' + slotClass + '" disabled><span class="slot-time">' + startTime + ' - ' + endTime + '</span><span class="slot-price">Booked</span></button>';
      } else {
         html += '<button class="' + slotClass + '" onclick="selectSlot(\'' + slotKey + '\', \'' + startTime + ' - ' + endTime + '\', ' + price + ')"><span class="slot-time">' + startTime + ' - ' + endTime + '</span><span class="slot-price">' + priceDisplay + '</span></button>';
      }
   }
   slotsGrid.innerHTML = html;
}

function formatTime(hour) {
   if (hour === 0) return '12:00 AM';
   if (hour === 12) return '12:00 PM';
   if (hour < 12) return hour + ':00 AM';
   return (hour - 12) + ':00 PM';
}

function selectSlot(slotKey, label, price) {
   state.slotTime = slotKey;
   state.slotLabel = label;
   state.basePrice = price;
   document.querySelectorAll('.slot-btn').forEach(function (el) { el.classList.remove('selected'); });
   const target = event && event.target ? event.target.closest('.slot-btn') : null;
   if (target) target.classList.add('selected');
   updateStep2Btn();
}

function updateStep2Btn() {
   const btn = document.getElementById('btn-step2-next');
   if (!btn) return;
   btn.disabled = !(state.date && state.slotTime);
}

// =====================
// STEP 3: Customer Details
// =====================
function renderSummaryStep3() {
   const el = document.getElementById('summaryItems3');
   if (!el) return;
   calculatePrice();
   el.innerHTML = buildSummaryRows();
}

function buildSummaryRows() {
   const rows = [
      ['Sport', state.sportName],
      ['Facility', state.facilityName],
      ['Date', state.dateFormatted],
      ['Time Slot', state.slotLabel],
      ['Price', '₹' + state.basePrice]
      ];
   return rows.map(function (r) {
      return '<div class="summary-row"><span class="label">' + r[0] + '</span><span class="value">' + r[1] + '</span></div>';
   }).join('');
}

// Discount is applied using whichever promo was last validated by the server
// via applyPromo() below - no promo details are hardcoded in the frontend.
function calculatePrice() {
   let price = state.basePrice;
   let discount = 0;
   if (state.promoCode && price >= state.promoMinAmount) {
      if (state.promoType === 'percent') {
         discount = Math.round(price * state.promoValue / 100);
      } else {
         discount = state.promoValue;
      }
   }
   state.promoDiscount = discount;
   const discounted = price - discount;
   const convenienceFee = CONFIG.convenience_fee;
   state.gstAmount = convenienceFee;
   state.totalAmount = Math.round((discounted + convenienceFee) * 100) / 100;
}

// Validates the promo code against the live database (/api/promos?validate=)
// instead of a hardcoded list, so promo codes created/edited/disabled in the
// admin dashboard take effect immediately on the website.
async function applyPromo() {
   const codeInput = document.getElementById('promoCode');
   const resultEl = document.getElementById('promoResult');
   const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
   if (!resultEl) return;
   if (!code) {
      resultEl.textContent = 'Please enter a promo code.';
      resultEl.className = 'promo-result error';
      return;
   }
   resultEl.textContent = 'Checking promo code...';
   resultEl.className = 'promo-result';
   try {
      const res = await fetch('/api/promos?validate=' + encodeURIComponent(code));
      const data = await res.json();
      if (!res.ok || !data.promo) {
         state.promoCode = null;
         state.promoType = null;
         state.promoValue = 0;
         state.promoMinAmount = 0;
         calculatePrice();
         resultEl.textContent = (data && data.error) || 'Invalid promo code. Please try again.';
         resultEl.className = 'promo-result error';
         return;
      }
      const promo = data.promo;
      const minAmount = Number(promo.min_amount);
      if (state.basePrice < minAmount) {
         resultEl.textContent = 'Minimum booking amount ₹' + minAmount + ' required for this code.';
         resultEl.className = 'promo-result error';
         return;
      }
      state.promoCode = promo.code;
      state.promoType = promo.type;
      state.promoValue = Number(promo.value);
      state.promoMinAmount = minAmount;
      calculatePrice();
      const discountText = promo.type === 'percent' ? (promo.value + '% off') : ('₹' + promo.value + ' off');
      resultEl.textContent = '✓ Promo applied! ' + discountText;
      resultEl.className = 'promo-result success';
   } catch (err) {
      resultEl.textContent = 'Could not validate promo code. Please check your connection and try again.';
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
   if (!phone || phone.replace(/\D/g, '').length < 10) {
      document.getElementById('err-phone').textContent = 'Please enter a valid phone number.';
      valid = false;
   } else {
      document.getElementById('err-phone').textContent = '';
   }
   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('err-email').textContent = 'Please enter a valid email address.';
      valid = false;
   } else {
      document.getElementById('err-email').textContent = '';
   }
   if (!valid) return;
   state.customerName = name;
   state.customerPhone = phone;
   state.customerEmail = email;
   const notesEl = document.getElementById('custNotes');
   state.customerNotes = notesEl ? notesEl.value.trim() : '';
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
   const slotPriceEl = document.getElementById('pay-slot-price');
   if (slotPriceEl) slotPriceEl.textContent = '₹' + state.basePrice;
   const gstEl = document.getElementById('pay-gst');
   if (gstEl) gstEl.textContent = '₹' + state.gstAmount;
   const totalEl = document.getElementById('pay-total');
   if (totalEl) totalEl.innerHTML = '<strong>₹' + state.totalAmount + '</strong>';
   const payBtnAmount = document.getElementById('btnPayAmount');
   if (payBtnAmount) payBtnAmount.textContent = '₹' + state.totalAmount;
   const discRow = document.getElementById('discountRow');
   if (discRow) {
      if (state.promoDiscount > 0) {
         discRow.style.display = 'flex';
         const payDiscEl = document.getElementById('pay-discount');
         if (payDiscEl) payDiscEl.textContent = '-₹' + state.promoDiscount;
      } else {
         discRow.style.display = 'none';
      }
   }
   // Peak-hour upsell nudge: classic marketing tactic encouraging customers to
       // extend to a 2-hour slot before peak-hour demand fills up the remaining time.
       const upsellEl = document.getElementById('peakUpsellBanner');
       if (upsellEl) {
                const startHour = state.slotTime ? parseInt(String(state.slotTime).split(':')[0], 10) : null;
                const isPeakSlot = startHour !== null && CONFIG.peak_hours.indexOf(startHour) !== -1;
                upsellEl.style.display = isPeakSlot ? 'flex' : 'none';
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
   state.reservationTimer = setInterval(function () {
      state.reservationSeconds--;
      const mins = Math.floor(state.reservationSeconds / 60);
      const secs = state.reservationSeconds % 60;
      display.textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
      if (state.reservationSeconds <= 0) {
         clearInterval(state.reservationTimer);
         timerEl.style.display = 'none';
         alert('Your slot reservation has expired. Please select a new slot.');
         goToStep(1);
      }
   }, 1000);
}

function stopReservationTimer() {
   if (state.reservationTimer) {
      clearInterval(state.reservationTimer);
      state.reservationTimer = null;
   }
   const timerEl = document.getElementById('reservationTimer');
   if (timerEl) timerEl.style.display = 'none';
}

// =====================
// PAYMENT (Razorpay Integration)
// =====================
function initiatePayment() {
   // Require agreement to Privacy Policy, Terms & Conditions and Cancellation Policy
var agreeBox = document.getElementById('agree-terms');
   if (agreeBox && !agreeBox.checked) {
      var wrap = document.getElementById('agree-terms-wrap');
      if (wrap) wrap.classList.add('error');
      if (typeof showToast === 'function') {
         showToast('Please accept the Privacy Policy and Terms & Conditions to continue.', 'error');
      } else {
         alert('Please accept the Privacy Policy and Terms & Conditions to continue.');
      }
      if (agreeBox.scrollIntoView) agreeBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
   }
   showLoading('Initializing payment...');
   // Generate booking ID
state.bookingId = 'PBK' + Date.now().toString(36).toUpperCase();
   // Create order on the server (Razorpay Orders API) before opening checkout
createRazorpayOrder().then(function () {
   hideLoading();
   // Check if Razorpay script is loaded
                           if (typeof Razorpay === 'undefined') {
                              // Load Razorpay script dynamically
   const script = document.createElement('script');
                              script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                              script.onload = openRazorpay;
                              script.onerror = function () {
                                 alert('Payment gateway could not be loaded. Please check your internet connection and try again.');
                              };
                              document.head.appendChild(script);
                           } else {
                              openRazorpay();
                           }
}).catch(function (err) {
   hideLoading();
   alert(err && err.message ? err.message : 'Could not start payment. Please try again.');
});
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
            sport: state.sport,
            facility_id: state.facilityId,
            facility: state.facilityName,
            customer_name: state.customerName,
            customer_email: state.customerEmail,
            customer_phone: state.customerPhone,
            booking_date: state.date ? state.date.toISOString().split('T')[0] : '',
            start_time: state.slotTime,
            end_time: (function () {
               var h = parseInt(String(state.slotTime).split(':')[0], 10);
               return ((h + 1) % 24) + ':00';
            })(),
            rate: state.basePrice,
            amount: state.totalAmount
         }
      })
   }).then(function (res) {
      if (!res.ok) throw new Error('Order creation failed. Please try again.');
      return res.json();
   }).then(function (data) {
      if (!data || !data.id) throw new Error('Invalid order response from server.');
      state.razorpayOrderId = data.id;
      return data;
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
      return res.json().then(function (data) { return { res: res, data: data }; });
   }).then(function (result) {
      hideLoading();
      if (result.res.ok && result.data && result.data.verified) {
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
      key: 'rzp_live_T90dB0bfW4qEMO',
      amount: Math.round(state.totalAmount * 100), // Amount in paise
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
      theme: { color: '#15803d' },
      handler: function (response) {
         verifyAndConfirm(response);
      },
      modal: {
         ondismiss: function () {
            showPaymentCancelled();
         }
      }
   };
   try {
      const rzp = new Razorpay(options);
      rzp.open();
   } catch (err) {
      hideLoading();
      alert('Unable to open the payment gateway. Please refresh and try again.');
   }
}

function showPaymentCancelled() {
   const msg = document.createElement('div');
   msg.style.cssText = 'position:fixed;top:80px;right:1rem;background:#ef4444;color:#fff;padding:0.75rem 1.25rem;border-radius:10px;z-index:99999;box-shadow:0 10px 25px rgba(0,0,0,0.2);';
   msg.textContent = 'Payment cancelled. Your slot is still reserved for ' + CONFIG.reservation_minutes + ' minutes.';
   document.body.appendChild(msg);
   setTimeout(function () { msg.remove(); }, 4000);
}

function showConfirmation(paymentResponse) {
   // Safety: remove any leftover demo/payment overlay so the confirmation is never dimmed
document.querySelectorAll('div').forEach(function (el) {
   if (el.style && el.style.position === 'fixed' && el.style.zIndex === '99999') {
      el.remove();
   }
});
   const confirmCard = document.getElementById('confirmCard');
   if (confirmCard) {
      confirmCard.innerHTML =
         '<div class="summary-row"><span class="label">Booking ID</span><span class="value" style="font-family:monospace;">' + state.bookingId + '</span></div>' +
         '<div class="summary-row"><span class="label">Sport</span><span class="value">' + state.sportName + '</span></div>' +
         '<div class="summary-row"><span class="label">Facility</span><span class="value">' + state.facilityName + '</span></div>' +
         '<div class="summary-row"><span class="label">Date</span><span class="value">' + state.dateFormatted + '</span></div>' +
         '<div class="summary-row"><span class="label">Time Slot</span><span class="value">' + state.slotLabel + '</span></div>' +
         '<div class="summary-row"><span class="label">Customer</span><span class="value">' + state.customerName + '</span></div>' +
         '<div class="summary-row"><span class="label">Email</span><span class="value">' + state.customerEmail + '</span></div>' +
         '<div class="summary-row"><span class="label">Amount Paid</span><span class="value" style="color:#15803d;font-weight:800;">₹' + state.totalAmount + '</span></div>' +
         '<div class="summary-row"><span class="label">Payment ID</span><span class="value" style="font-family:monospace;">' + (paymentResponse.razorpay_payment_id || '') + '</span></div>' +
         '<div class="summary-row"><span class="label">Status</span><span class="value" style="color:#10b981;">Confirmed</span></div>';
   }
   goToStep(5);
}

function handlePaymentSuccess(response) {
   showLoading('Confirming booking...');
   stopReservationTimer();
   // The actual booking record is written to the database and the confirmation
// email is sent server-side by the Razorpay webhook once payment.captured
// is received - see api/razorpay-webhook.js. We simply show the confirmation
// screen here; renderSlots() will reflect this slot as booked the next time
// availability is checked from the server.
setTimeout(function () {
   hideLoading();
   showConfirmation(response);
}, 1500);
}

// =====================
// RESET
// =====================
function resetBooking() {
   state = {
      step: 1,
      sport: null,
      sportName: null,
      facilityId: null,
      facilityDbId: null,
      facilityName: null,
      facilityPrice: 0,
      facilityPeakPrice: 0,
      date: null,
      dateFormatted: null,
      slotTime: null,
      slotLabel: null, selectedHours: [],
      customerName: null,
      customerPhone: null,
      customerEmail: null,
      customerNotes: null,
      promoCode: null,
      promoType: null,
      promoValue: 0,
      promoMinAmount: 0,
      promoDiscount: 0,
      basePrice: 0,
      gstAmount: 0,
      totalAmount: 0,
      bookingId: null,
      reservationTimer: null,
      reservationSeconds: CONFIG.reservation_minutes * 60
   };
   // Reset form
['custName', 'custPhone', 'custEmail', 'custNotes', 'promoCode'].forEach(function (id) {
   const el = document.getElementById(id);
   if (el) el.value = '';
});
   const promoResultEl = document.getElementById('promoResult');
   if (promoResultEl) promoResultEl.textContent = '';
   goToStep(1);
}

// =====================
// UTILITIES
// =====================
function showLoading(text) {
   const overlay = document.getElementById('loadingOverlay');
   if (overlay) overlay.style.display = 'flex';
   const textEl = document.getElementById('loadingText');
   if (textEl) textEl.textContent = text || 'Processing...';
}

function hideLoading() {
   const overlay = document.getElementById('loadingOverlay');
   if (overlay) overlay.style.display = 'none';
}

// =====================
// INIT
// =====================
document.addEventListener('DOMContentLoaded', async () => {
   // Load live facility/pricing data from the backend before the user can
                          // interact with sport/facility selection.
                          await loadFacilities();
   await loadSettings();

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
         navbar.classList.toggle('scrolled', window.scrollY > 50);
      });
   }

                          console.log('PlayBox Kashmir Booking System - v2.0 initialized');
});

// ---- Agreement checkbox gate (Privacy Policy / T&C / Cancellation) ----
function setupAgreeTermsGate() {
   var box = document.getElementById('agree-terms');
   var btn = document.getElementById('btnPay');
   if (!box) return;
   function sync() {
      if (btn) btn.disabled = !box.checked;
      var wrap = document.getElementById('agree-terms-wrap');
      if (box.checked && wrap) wrap.classList.remove('error');
   }
   box.addEventListener('change', sync);
   sync();
}
if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', setupAgreeTermsGate);
} else {
   setupAgreeTermsGate();
}
