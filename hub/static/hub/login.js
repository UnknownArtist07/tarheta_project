const passwordInput = document.getElementById('loginPassword');
const passwordToggle = document.getElementById('passwordToggle');
const cursorInputs = document.querySelectorAll('.login-input-shell input, .password-control input');

function positionCursor(input) {
  const cursor = input.parentElement.querySelector('.login-cursor');
  if (!cursor) return;
  const styles = window.getComputedStyle(input);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = styles.font;
  const visibleText = input.type === 'password' ? '\u2022'.repeat(input.value.length) : input.value;
  const textWidth = context.measureText(visibleText).width;
  cursor.style.left = `${Math.min(14 + textWidth - input.scrollLeft, input.clientWidth - 16)}px`;
}

cursorInputs.forEach(input => {
  ['input', 'focus', 'click', 'keyup'].forEach(eventName => input.addEventListener(eventName, () => positionCursor(input)));
  positionCursor(input);
});

if (passwordInput && passwordToggle) {
  passwordToggle.addEventListener('click', () => {
    const isVisible = passwordInput.type === 'text';
    passwordInput.type = isVisible ? 'password' : 'text';
    passwordToggle.textContent = isVisible ? 'Show' : 'Hide';
    passwordToggle.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
    passwordToggle.setAttribute('aria-pressed', String(!isVisible));
  });
}
