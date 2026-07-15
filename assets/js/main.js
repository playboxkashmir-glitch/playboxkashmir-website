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

const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    navToggle.classList.toggle('active');
  });

  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      navToggle.classList.remove('active');
    });
  });
}

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

window.showPolicy = async function(type) {

    const pages = {
        terms: "/terms.html",
        privacy: "/privacy.html",
        cancellation: "/cancellation.html"
    };

    if (!pages[type]) return;

    try {

        const response = await fetch(pages[type]);

        if (!response.ok) {
            throw new Error("Unable to load policy.");
        }

        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const policy = doc.querySelector(".policy");

        document.getElementById("policyContent").innerHTML =
            policy ? policy.innerHTML : "<p>Policy not found.</p>";

        document.getElementById("policyModal").style.display = "flex";

        document.body.style.overflow = "hidden";

    } catch (err) {

        document.getElementById("policyContent").innerHTML =
            "<p>Unable to load this policy.</p>";

        document.getElementById("policyModal").style.display = "flex";

    }

};

window.closePolicy = function() {

    const modal = document.getElementById("policyModal");

    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "";
    }

};

document.addEventListener("DOMContentLoaded", function() {

    const modal = document.getElementById("policyModal");

    if (modal) {

        modal.addEventListener("click", function(e) {

            if (e.target === modal) {
                window.closePolicy();
            }

        });

    }

});

window.addEventListener("keydown", function(e) {

    if (e.key === "Escape") {
        window.closePolicy();
    }

});

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

console.log('PlayBox Kashmir™ - v2.0 loaded');
