/* PlayBox Kashmir - Admin JS */
document.addEventListener('DOMContentLoaded', () => {
  // Auth check
  if (!sessionStorage.getItem('admin_auth')) {
    window.location.href = 'login.html';
    return;
  }
  
  // Set date
  const dateEl = document.getElementById('headerDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  
  // Navbar scroll
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 20));
  }
});

function toggleSidebar() {
  document.getElementById('adminSidebar').classList.toggle('open');
}

function showAddBookingModal() {
  document.getElementById('addBookingModal').style.display = 'flex';
}

function closeAddBookingModal() {
  document.getElementById('addBookingModal').style.display = 'none';
}

document.addEventListener('click', (e) => {
  const modal = document.getElementById('addBookingModal');
  if (modal && e.target === modal) closeAddBookingModal();
});