function syncUsername() {
  const nameInput = document.getElementById('regName');
  const usernameInput = document.getElementById('regUser');
  const name = nameInput.value.trim();

  if (!usernameInput.dataset.touched) {
    usernameInput.value = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    syncUrl();
  }
}

function syncUrl() {
  const usernameInput = document.getElementById('regUser');
  usernameInput.dataset.touched = '1';
  document.getElementById('urlPreview').textContent = usernameInput.value.trim() || 'username';
}

const registerForm = document.getElementById('regForm');
const registerPassword = document.getElementById('regPassword');
const passwordRule = document.getElementById('passwordRule');

if (registerForm && registerPassword && passwordRule) {
  registerPassword.addEventListener('input', () => {
    passwordRule.classList.toggle('valid', registerPassword.validity.valid);
  });

  registerForm.addEventListener('submit', event => {
    const fieldsAreFilled = [...registerForm.querySelectorAll('input[required]')].every(field => field.value.trim());
    if (!fieldsAreFilled) {
      event.preventDefault();
      registerForm.reportValidity();
      return;
    }

    if (!registerPassword.validity.valid) {
      event.preventDefault();
      registerPassword.setCustomValidity('Use at least 12 characters with one capital letter, one number, and one special character.');
      registerForm.reportValidity();
      registerPassword.addEventListener('input', () => registerPassword.setCustomValidity(''), { once: true });
    }
  });
}

