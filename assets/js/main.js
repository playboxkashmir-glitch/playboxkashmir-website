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
        <p><strong>24+ hours before booking:</strong> Full refund</p>
        <p style="margin-top:0.75rem;"><strong>12-24 hours before booking:</strong> 50% refund</p>
        <p style="margin-top:0.75rem;"><strong>Less than 12 hours:</strong> No refund</p>
        <p style="margin-top:0.75rem;"><strong>No-shows:</strong> No refund</p>
        <p style="margin-top:1rem;">To cancel a booking, visit your booking confirmation email and click "Cancel Booking", or contact us directly.</p>
      `
    },
    privacy: {
      title: 'Privacy Policy',
      content: `
        <h3 style="margin-bottom:1rem;">Privacy Policy</h3>
        <p>PlayBox Kashmir collects personal information (name, email, phone) solely for booking purposes. We do not share your data with third parties except Razorpay for payment processing.</p>
        <p style="margin-top:0.75rem;">Your data is stored securely and used only for booking confirmation, support, and service improvement.</p>
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