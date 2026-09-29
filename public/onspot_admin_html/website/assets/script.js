// FAQ accordion: only one item open at a time
document.querySelectorAll('.faq-item').forEach(item => {
  item.addEventListener('toggle', () => {
    if (item.open) {
      document.querySelectorAll('.faq-item').forEach(other => {
        if (other !== item) other.open = false;
      });
    }
  });
});

// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
navToggle?.addEventListener('click', () => {
  document.body.classList.toggle('nav-open');
});
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => document.body.classList.remove('nav-open'));
});
