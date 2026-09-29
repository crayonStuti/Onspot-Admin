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

// Contact form validation
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Returns true when the given field's value is valid.
  function isValid(input) {
    const value = input.value.trim();
    if (input.hasAttribute('data-optional')) return true; // optional fields always pass
    if (input.type === 'email' || input.id === 'cf-email') return emailRe.test(value);
    return value.length > 0; // all other fields (text, select, message) are required
  }

  function setFieldState(input) {
    const field = input.closest('.field');
    if (isValid(input)) {
      field.classList.remove('invalid');
      return true;
    }
    field.classList.add('invalid');
    return false;
  }

  const inputs = contactForm.querySelectorAll('input, textarea, select');

  // Clear the error as soon as the field becomes valid while typing.
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      if (input.closest('.field').classList.contains('invalid')) {
        setFieldState(input);
      }
    });
    input.addEventListener('blur', () => setFieldState(input));
  });

  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    let allValid = true;
    inputs.forEach(input => {
      if (!setFieldState(input)) allValid = false;
    });

    if (allValid) {
      alert("Thanks! Your message has been sent — we'll be in touch soon.");
      contactForm.reset();
    } else {
      contactForm.querySelector('.field.invalid input, .field.invalid textarea')?.focus();
    }
  });
}
