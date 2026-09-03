function setPane(which) {
  document.getElementById('pane-card').classList.toggle('active', which === 'card');
  document.getElementById('pane-cards').classList.toggle('active', which === 'cards');
  document.getElementById('btnPaneCard').classList.toggle('active', which === 'card');
  document.getElementById('btnPaneCards').classList.toggle('active', which === 'cards');
}

function flipCard() {
  document.getElementById('ccCard').classList.toggle('flipped');
}

function bindCards() {

  document.querySelectorAll('.social-icon').forEach(icon => icon.addEventListener('click', event => event.stopPropagation()));
  document.querySelectorAll('.card:not(.ghost)').forEach(card => {
    const deleteForm = card.querySelector('.card-delete');
    if (deleteForm) {
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'card-edit';
      editButton.textContent = 'Edit';
      editButton.addEventListener('click', event => {
        event.stopPropagation();
        const modal = document.getElementById('editCardModal');
        const form = document.getElementById('editCardForm');
        form.action = deleteForm.action.replace('/delete/', '/edit/');
        document.getElementById('editCardName').value = card.querySelector('.card-title').textContent.trim();
        document.getElementById('editCardSubtitle').value = card.querySelector('.card-sub').textContent.trim();
        document.getElementById('editCardDestination').value = card.dataset.href;
        document.getElementById('editCardKind').value = card.classList.contains('media') ? 'media' : card.classList.contains('image') ? 'image' : 'link';
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        document.getElementById('editCardName').focus();
      });
      card.appendChild(editButton);
    }
    card.onmousemove = event => {
      const bounds = card.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const rotateX = ((y / bounds.height) - 0.5) * -6;
      const rotateY = ((x / bounds.width) - 0.5) * 6;
      card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };
    card.onmouseleave = () => {
      card.style.transform = 'perspective(600px) rotateX(0) rotateY(0)';
    };
    card.onclick = event => {
      if (event.target.closest('.card-delete')) return;
      if (card.dataset.href) window.open(card.dataset.href, '_blank', 'noopener,noreferrer');
      else showToast(card.dataset.msg);
    };
  });

  const addCard = document.getElementById('addCard');
  if (addCard) addCard.addEventListener('click', () => {
    const modal = document.getElementById('newCardModal');
    if (modal) { modal.hidden = false; document.body.style.overflow = 'hidden'; modal.querySelector('input')?.focus(); }
  });
  document.querySelectorAll('.card-image-field').forEach(field => {
    const form = field.closest('form');
    const kind = form.querySelector('[name="kind"]');
    const updateVisibility = () => { field.hidden = kind.value !== 'image'; };
    kind.addEventListener('change', updateVisibility);
    updateVisibility();
  });
}

function copyLink(event) {
  event.stopPropagation();
  const link = `${window.location.origin}/hub/`;
  navigator.clipboard.writeText(link).then(() => showToast('Hub link copied!')).catch(() => showToast(link));
}

function bindModals() {
  const modals = document.querySelectorAll('.modal-backdrop');
  const closeModal = modal => { modal.hidden = true; document.body.style.overflow = ''; };
  document.querySelectorAll('[data-open-modal]').forEach(button => button.addEventListener('click', () => {
    const modal = document.getElementById(button.dataset.openModal);
    if (modal) { modal.hidden = false; document.body.style.overflow = 'hidden'; modal.querySelector('input, textarea, select')?.focus(); }
  }));
  modals.forEach(modal => {
    modal.querySelector('[data-close-modal]').addEventListener('click', () => closeModal(modal));
    modal.addEventListener('click', event => { if (event.target === modal) closeModal(modal); });
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') modals.forEach(modal => { if (!modal.hidden) closeModal(modal); }); });
}

const avatarInput = document.getElementById('avatarInput');
const imagePreview = document.getElementById('imagePreview');
if (avatarInput && imagePreview) {
  avatarInput.addEventListener('change', () => {
    const file = avatarInput.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => { imagePreview.innerHTML = `<img src="${reader.result}" alt="Selected profile image">`; });
    reader.readAsDataURL(file);
  });
}

const socialRows = document.getElementById('socialRows');
const addSocial = document.getElementById('addSocial');
if (socialRows && addSocial) {
  addSocial.addEventListener('click', () => {
    const row = socialRows.querySelector('.social-row').cloneNode(true);
    row.querySelector('input').value = '';
    socialRows.appendChild(row);
  });
  socialRows.addEventListener('click', event => {
    if (!event.target.classList.contains('social-remove')) return;
    const rows = socialRows.querySelectorAll('.social-row');
    if (rows.length > 1) event.target.closest('.social-row').remove();
    else event.target.closest('.social-row').querySelector('input').value = '';
  });
}

let toastTimer;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1900);
}

bindModals();
