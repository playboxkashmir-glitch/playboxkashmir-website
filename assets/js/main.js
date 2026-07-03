/* ============================
   PlayBox Kashmir - Main JS
   ============================ */

// Navbar scroll effect
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    navToggle.classList.toggle('active');
  });

  // Close menu when clicking a link
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      navToggle.classList.remove('active');
    });
  });
}

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

if (sections.length && navLinks.length) {
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 100) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  });
}

// Policy modals
window.showPolicy = function(type) {
  const policies = {
    cancellation: {
      title: 'Cancellation Policy',
      content: `
       <h3 style="margin-bottom:1rem;">Cancellation Policy</h3>

<p>We understand that plans can change. To ensure fairness to all players and efficient scheduling of our facilities, the following cancellation policy applies to all bookings:</p>

<div style="margin-top:1rem;padding:14px;border:1px solid #ddd;border-radius:8px;background:#f8f9fa;">
<p><strong>✔ More than 24 hours before your booking:</strong> Full refund.</p>

<p><strong>✔ Between 12 and 24 hours before your booking:</strong> 50% refund.</p>

<p><strong>✔ Less than 12 hours before your booking:</strong> No refund.</p>

<p><strong>✔ No-shows:</strong> No refund.</p>

<p><strong>✔ To cancel a booking:</strong> Click <strong>"Cancel Booking"</strong> in your booking confirmation email or contact PlayBox Kashmir through our official customer support channels before the applicable cancellation deadline.</p>
</div>

<h4 style="margin-top:1.5rem;">Detailed Terms</h4>

<p><strong>1. Acceptance of this Policy</strong><br>
By making a booking with PlayBox Kashmir, you acknowledge that you have read, understood, and agreed to this Cancellation & Refund Policy. This policy forms part of the contractual terms governing every booking.</p>

<p><strong>2. Refund Eligibility</strong><br>
Refund eligibility is determined solely by the time remaining before the scheduled booking start time.</p>

<ul style="padding-left:20px;line-height:1.8;">
<li>More than <strong>24 hours</strong> before the booking: <strong>100% refund.</strong></li>
<li>Between <strong>12 and 24 hours</strong>: <strong>50% refund.</strong></li>
<li>Less than <strong>12 hours</strong>: <strong>No refund.</strong></li>
<li><strong>No-show:</strong> No refund, credit or rescheduling.</li>
</ul>

<p><strong>3. Cancellation Procedure</strong><br>
A cancellation is considered valid only after it has been successfully submitted through the "Cancel Booking" option in the booking confirmation email or acknowledged by an authorized representative of PlayBox Kashmir.</p>

<p><strong>4. Refund Processing</strong><br>
Approved refunds shall be processed to the original payment method. Processing times may vary depending upon banks, payment gateways or financial institutions. PlayBox Kashmir shall not be responsible for delays caused by third-party payment processors.</p>

<p><strong>5. Booking & Payment Charges</strong><br>
Payment gateway fees, convenience charges, platform charges or similar third-party transaction fees, where applicable, may be non-refundable unless otherwise required under applicable law.</p>

<p><strong>6. Rescheduling</strong><br>
Rescheduling requests are subject to slot availability and are entirely at the discretion of PlayBox Kashmir. Approval of one rescheduling request shall not create any obligation to approve future requests.</p>

<p><strong>7. Late Arrival</strong><br>
Customers arriving late will not receive additional playing time or a partial refund. Bookings shall end at the originally scheduled end time.</p>

<p><strong>8. Partial Use</strong><br>
No refund or credit shall be issued where a customer voluntarily ends their session before the scheduled completion time.</p>

<p><strong>9. Weather & Operational Interruptions</strong><br>
If PlayBox Kashmir cancels a booking due to unsafe weather, maintenance, technical issues, government orders or operational necessity, we may, at our sole discretion, provide a rescheduled slot, booking credit or full refund.</p>

<p><strong>10. Fraud & Misuse</strong><br>
PlayBox Kashmir reserves the right to refuse refunds and cancel bookings involving suspected fraud, duplicate bookings, misuse of promotional offers, payment disputes or violations of our Terms of Service.</p>

<p><strong>11. Chargebacks</strong><br>
Customers agree to contact PlayBox Kashmir before initiating any payment dispute or chargeback. In the event of a chargeback, PlayBox Kashmir may submit booking records, payment confirmations, communication logs, system timestamps, IP logs and other relevant evidence to the payment processor or issuing bank.</p>

<p><strong>12. Limitation of Liability</strong><br>
To the maximum extent permitted by law, PlayBox Kashmir's total liability shall never exceed the amount paid for the affected booking. We shall not be liable for indirect, incidental, consequential or economic losses, including travel expenses, accommodation costs or loss of opportunity.</p>

<p><strong>13. Amendments</strong><br>
PlayBox Kashmir reserves the right to modify this Cancellation & Refund Policy at any time. The version in force at the time of booking shall apply to that booking unless otherwise required by law.</p>

<p><strong>14. Governing Law</strong><br>
This policy shall be governed by the laws of India. Any dispute arising from this policy or any booking shall be subject to the exclusive jurisdiction of the competent courts at Srinagar, Jammu & Kashmir.</p>
`
    },
    privacy: {
      title: 'Privacy Policy',
      content: `
<h3 style="margin-bottom:1rem;">Privacy Policy</h3>

<p>At <strong>PlayBox Kashmir</strong>, we are committed to protecting your privacy and ensuring that your personal information is handled responsibly, securely, and transparently. This Privacy Policy explains how we collect, use, store, protect, and disclose your information when you access our website, make a booking, or use any of our services.</p>

<div style="margin-top:1rem;padding:14px;border:1px solid #ddd;border-radius:8px;background:#f8f9fa;">
<p><strong>Summary</strong></p>

<p>• PlayBox Kashmir collects personal information (including your name, email address and phone number) solely for booking, customer support, and service-related purposes.</p>

<p>• Payment information is processed securely through <strong>Razorpay</strong>. We do not store your complete debit card, credit card, UPI PIN, banking credentials or other sensitive payment information.</p>

<p>• Your personal information is never sold, rented or shared with third parties for marketing purposes.</p>

<p>• Your information is used only for booking confirmations, payment verification, customer support, operational requirements, legal compliance and improving our services.</p>
</div>

<h4 style="margin-top:1.5rem;">1. Information We Collect</h4>

<p>Depending upon your interaction with PlayBox Kashmir, we may collect the following information:</p>

<ul style="padding-left:20px;line-height:1.8;">
<li>Full Name</li>
<li>Email Address</li>
<li>Mobile Number</li>
<li>Booking Details</li>
<li>Date and Time of Reservation</li>
<li>Sports Facility Booked</li>
<li>Payment Status</li>
<li>Transaction Reference Numbers</li>
<li>IP Address</li>
<li>Browser Type</li>
<li>Operating System</li>
<li>Device Information</li>
<li>Website Usage Statistics</li>
<li>Customer Support Communications</li>
<li>Feedback and Reviews voluntarily submitted by you</li>
</ul>

<h4 style="margin-top:1.5rem;">2. Information We Do Not Collect</h4>

<p>PlayBox Kashmir does not intentionally collect or store your complete debit card number, credit card number, CVV, banking passwords, UPI PIN, internet banking credentials or any other confidential payment authentication data.</p>

<p>All online payments are securely processed by our authorized payment partner, Razorpay.</p>

<h4 style="margin-top:1.5rem;">3. How We Use Your Information</h4>

<p>Your information may be used for the following legitimate purposes:</p>

<ul style="padding-left:20px;line-height:1.8;">
<li>Processing bookings and reservations.</li>
<li>Sending booking confirmations.</li>
<li>Issuing booking receipts and invoices.</li>
<li>Payment verification.</li>
<li>Customer support.</li>
<li>Responding to enquiries.</li>
<li>Managing cancellations and refunds.</li>
<li>Preventing fraud and unauthorized transactions.</li>
<li>Resolving disputes.</li>
<li>Improving website functionality and user experience.</li>
<li>Internal analytics and operational planning.</li>
<li>Compliance with applicable laws and governmental requests.</li>
</ul>

<h4 style="margin-top:1.5rem;">4. Payment Processing</h4>

<p>All online payments are processed through <strong>Razorpay</strong>, a secure third-party payment gateway. When you make a payment, certain information necessary to complete the transaction may be shared with Razorpay. Such information is governed by Razorpay's own Privacy Policy and security standards.</p>

<p>PlayBox Kashmir does not have access to or store your complete payment credentials.</p>

<h4 style="margin-top:1.5rem;">5. Sharing of Information</h4>

<p>We respect your privacy.</p>

<p>Your personal information is never sold, rented, licensed or commercially disclosed to third parties.</p>

<p>Your information may only be shared under the following circumstances:</p>

<ul style="padding-left:20px;line-height:1.8;">
<li>With Razorpay for payment processing.</li>
<li>When required under applicable law.</li>
<li>When required by a court, government authority or law enforcement agency.</li>
<li>To protect our legal rights.</li>
<li>To investigate fraud, cybercrime or misuse of our platform.</li>
<li>With professional advisers such as auditors or legal counsel where necessary.</li>
</ul>

<h4 style="margin-top:1.5rem;">6. Data Security</h4>

<p>PlayBox Kashmir implements commercially reasonable technical, physical and organizational security measures to protect your information from unauthorized access, alteration, disclosure, misuse or destruction.</p>

<p>Although we strive to use industry-standard security practices, no electronic storage or internet transmission can be guaranteed to be completely secure. Users acknowledge that information transmitted over the internet is at their own risk.</p>

<h4 style="margin-top:1.5rem;">7. Data Retention</h4>

<p>Your information may be retained only for as long as reasonably necessary to:</p>

<ul style="padding-left:20px;line-height:1.8;">
<li>Maintain booking records.</li>
<li>Provide customer support.</li>
<li>Resolve disputes.</li>
<li>Comply with tax, accounting and legal obligations.</li>
<li>Prevent fraudulent activities.</li>
</ul>

<p>When information is no longer required, it may be securely deleted or anonymized in accordance with our internal retention policies.</p>

<h4 style="margin-top:1.5rem;">8. Cookies and Analytics</h4>

<p>Our website may use cookies, browser storage and similar technologies to improve website functionality, remember user preferences, analyze website traffic and enhance user experience.</p>

<p>You may disable cookies through your browser settings; however, certain features of the website may not function correctly.</p>

<h4 style="margin-top:1.5rem;">9. Marketing Communications</h4>

<p>PlayBox Kashmir may occasionally send booking-related notifications, service updates or operational announcements.</p>

<p>We do not send unsolicited marketing communications without an appropriate legal basis or your consent where required.</p>

<h4 style="margin-top:1.5rem;">10. Children's Privacy</h4>

<p>Our services are not intended for children under the age of 18 acting independently. Where bookings involve minors, the booking should be made by a parent, legal guardian or other authorized adult.</p>

<h4 style="margin-top:1.5rem;">11. Third-Party Websites</h4>

<p>Our website may contain links to third-party websites or services. PlayBox Kashmir is not responsible for the privacy practices, security or content of external websites.</p>

<h4 style="margin-top:1.5rem;">12. User Rights</h4>

<p>Subject to applicable law, users may request access to, correction of or deletion of their personal information, or raise concerns regarding the processing of their personal data by contacting PlayBox Kashmir through our official communication channels.</p>

<h4 style="margin-top:1.5rem;">13. Legal Compliance</h4>

<p>We may preserve or disclose information where reasonably necessary to comply with applicable laws, legal proceedings, governmental requests, law enforcement investigations or to protect the rights, safety and property of PlayBox Kashmir, its customers or the public.</p>

<h4 style="margin-top:1.5rem;">14. Limitation of Liability</h4>

<p>To the fullest extent permitted by applicable law, PlayBox Kashmir shall not be liable for any unauthorized access, cyberattack, interception or disclosure resulting from events beyond our reasonable control, including failures of telecommunications networks, internet infrastructure, third-party service providers or force majeure events.</p>

<h4 style="margin-top:1.5rem;">15. Changes to this Privacy Policy</h4>

<p>PlayBox Kashmir reserves the right to modify or update this Privacy Policy at any time. The latest version published on our website shall supersede all previous versions and shall become effective immediately upon publication unless otherwise stated.</p>

<h4 style="margin-top:1.5rem;">16. Governing Law</h4>

<p>This Privacy Policy shall be governed by the laws of India. Any disputes arising from or relating to this Privacy Policy shall be subject to the exclusive jurisdiction of the competent courts at Srinagar, Jammu & Kashmir.</p>

<h4 style="margin-top:1.5rem;">17. Contact</h4>

<p>If you have any questions regarding this Privacy Policy or the processing of your personal information, you may contact PlayBox Kashmir through the official contact details provided on our website.</p>
      `
    },
    terms: {
      title: 'Terms of Service',
      content: `
        <h3 style="margin-bottom:1rem;">Terms of Service</h3>
        <ul style="padding-left:1.5rem;line-height:2;">
          <li>Bookings are confirmed only after payment</li>
          <li>Players must arrive 10 minutes before their slot</li>
          <li>Appropriate sports footwear required</li>
          <li>PlayBox Kashmir reserves the right to cancel bookings due to maintenance or weather</li>
          <li>Alcohol and smoking prohibited on premises</li>
        </ul>
      `
    }
  };

  const policy = policies[type];
  if (!policy) return;

  const modal = document.getElementById('policyModal');
  const content = document.getElementById('policyContent');
  if (modal && content) {
    content.innerHTML = policy.content;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
};

window.closePolicy = function() {
  const modal = document.getElementById('policyModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
};

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('policyModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) window.closePolicy();
    });
  }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const offset = 80;
      const targetPos = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: targetPos, behavior: 'smooth' });
    }
  });
});

// Animate elements on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

document.querySelectorAll('.facility-card, .feature-card, .gallery-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

console.log('PlayBox Kashmir - v2.0 loaded');
