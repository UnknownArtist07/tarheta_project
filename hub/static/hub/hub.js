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
      if (event.target.closest('.card-delete, .card-active, .card-edit')) return;
        if (card.classList.contains('schedule')) {
          const scheduleData = card.dataset.schedule || [...document.querySelectorAll('#publicScheduleData span')].find(item => item.dataset.title === card.dataset.msg)?.dataset.schedule;
          openSchedulePanel(card.dataset.msg, scheduleData);
        }
        else if (card.dataset.image) window.open(card.dataset.image, '_blank', 'noopener,noreferrer');
      else if (card.dataset.href) window.open(card.dataset.href, '_blank', 'noopener,noreferrer');
      else showToast(card.dataset.msg);
    };
  });
}

function openSchedulePanel(title, scheduleJson) {
    let modal = document.getElementById('publicScheduleModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'publicScheduleModal';
      modal.className = 'modal-backdrop';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'publicScheduleTitle');
      modal.innerHTML = '<div class="modal-panel"><button class="modal-close" type="button" aria-label="Close class schedule">×</button><div class="modal-kicker">CLASS SCHEDULE</div><h2 id="publicScheduleTitle">Class schedule</h2><p class="modal-intro">Keep track of the classes added to this card.</p><div class="schedule-list" id="publicScheduleList"></div></div>';
      document.body.appendChild(modal);
      modal.querySelector('.modal-close').addEventListener('click', () => { modal.hidden = true; document.body.style.overflow = ''; });
      modal.addEventListener('click', event => { if (event.target === modal) { modal.hidden = true; document.body.style.overflow = ''; } });
    }
    const heading = modal.querySelector('#publicScheduleTitle');
    const list = modal.querySelector('#publicScheduleList');
    let entries = [];
    try {
      const parsed = JSON.parse(scheduleJson || '[]');
      entries = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' ? [parsed] : [];
    } catch (error) { entries = []; }
    heading.textContent = title;
    list.innerHTML = '';
    if (!entries.length) {
      const empty = document.createElement('p');
      empty.className = 'form-help';
      empty.textContent = 'No classes have been added yet.';
      list.appendChild(empty);
    } else {
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const days = [...new Set(entries.map(entry => entry.day || 'Other'))].sort((left, right) => {
        const leftIndex = dayOrder.indexOf(left);
        const rightIndex = dayOrder.indexOf(right);
        return (leftIndex < 0 ? dayOrder.length : leftIndex) - (rightIndex < 0 ? dayOrder.length : rightIndex);
      });
      days.forEach(day => {
        const group = document.createElement('div');
        group.className = 'schedule-day-group';
        const dayHeading = document.createElement('h4');
        dayHeading.textContent = day;
        group.appendChild(dayHeading);
        entries.filter(entry => (entry.day || 'Other') === day).forEach(entry => {
          const row = document.createElement('div');
          row.className = 'schedule-entry';
          const details = document.createElement('div');
          const subject = document.createElement('strong');
          subject.textContent = entry.subject || 'Untitled subject';
          const time = document.createElement('span');
          time.textContent = `${entry.time || 'Time not set'}${entry.professor ? ` · ${entry.professor}` : ''}`;
          details.append(subject, time);
          if (entry.description) {
            const description = document.createElement('small');
            description.textContent = entry.description;
            details.appendChild(description);
          }
          row.appendChild(details);
          group.appendChild(row);
        });
        list.appendChild(group);
      });
    }
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

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

function bindFunctionEditor() {
  const modal = document.getElementById('functionCardsModal');
  const launch = document.getElementById('editFunctionCards');
  if (!modal || !launch) return;
  const sections = modal.querySelectorAll('[data-function-section]');
  const tabs = modal.querySelectorAll('[data-function-tab]');
  const kind = modal.querySelector('#functionKind');
  const csrfToken = modal.querySelector('#functionCardForm input[name="csrfmiddlewaretoken"]');
  modal.querySelectorAll('#functionThemeForm, #functionSecurityForm').forEach(form => {
    if (csrfToken && !form.querySelector('input[name="csrfmiddlewaretoken"]')) form.prepend(csrfToken.cloneNode(true));
  });
  const scheduleField = modal.querySelector('[data-function-field="schedule"]');
  const scheduleEntries = [];
  let editingScheduleIndex = null;
  if (scheduleField) {
    const scheduleJson = document.createElement('input');
    scheduleJson.type = 'hidden';
    scheduleJson.name = 'schedule_json';
    scheduleJson.id = 'scheduleJson';
    scheduleField.closest('form').appendChild(scheduleJson);
    const addSchedule = document.createElement('button');
    addSchedule.type = 'button';
    addSchedule.className = 'btn btn-ghost schedule-add';
    addSchedule.textContent = 'Add Schedule';
    const scheduleList = document.createElement('div');
    scheduleList.className = 'schedule-list';
    scheduleList.id = 'scheduleList';
    scheduleField.append(addSchedule, scheduleList);
    scheduleField.querySelectorAll('[name^="schedule_"]').forEach(input => input.removeAttribute('name'));
    const getScheduleEntry = () => ({
      day: modal.querySelector('#scheduleDay').value,
      subject: modal.querySelector('#scheduleSubject').value.trim(),
      time: modal.querySelector('#scheduleTime').value.trim(),
      professor: modal.querySelector('#scheduleProfessor').value.trim(),
      description: modal.querySelector('#scheduleDescription').value.trim(),
    });
    const clearScheduleInputs = () => ['scheduleSubject', 'scheduleTime', 'scheduleProfessor', 'scheduleDescription'].forEach(id => { modal.querySelector(`#${id}`).value = ''; });
    const renderSchedules = () => {
      scheduleJson.value = JSON.stringify(scheduleEntries);
      scheduleList.innerHTML = '';
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      days.filter(day => scheduleEntries.some(entry => entry.day === day)).forEach(day => {
        const group = document.createElement('div');
        group.className = 'schedule-day-group';
        group.innerHTML = `<h4>${day}</h4>`;
        scheduleEntries.forEach((entry, index) => {
          if (entry.day !== day) return;
          const row = document.createElement('div');
          row.className = 'schedule-entry';
          row.innerHTML = `<div><strong>${entry.subject || 'Untitled subject'}</strong><span>${entry.time || 'Time not set'}${entry.professor ? ` · ${entry.professor}` : ''}</span>${entry.description ? `<small>${entry.description}</small>` : ''}</div><div class="schedule-entry-actions"><button type="button" data-schedule-edit="${index}">Edit</button><button type="button" data-schedule-remove="${index}">Remove</button></div>`;
          group.appendChild(row);
        });
        scheduleList.appendChild(group);
      });
    };
    addSchedule.addEventListener('click', () => {
      const entry = getScheduleEntry();
      if (!entry.subject) return;
      if (editingScheduleIndex === null) scheduleEntries.push(entry);
      else { scheduleEntries[editingScheduleIndex] = entry; editingScheduleIndex = null; addSchedule.textContent = 'Add Schedule'; }
      clearScheduleInputs();
      renderSchedules();
    });
    scheduleList.addEventListener('click', event => {
      const editIndex = event.target.dataset.scheduleEdit;
      const removeIndex = event.target.dataset.scheduleRemove;
      if (editIndex !== undefined) {
        const entry = scheduleEntries[Number(editIndex)];
        modal.querySelector('#scheduleDay').value = entry.day;
        modal.querySelector('#scheduleSubject').value = entry.subject;
        modal.querySelector('#scheduleTime').value = entry.time;
        modal.querySelector('#scheduleProfessor').value = entry.professor;
        modal.querySelector('#scheduleDescription').value = entry.description;
        editingScheduleIndex = Number(editIndex);
        addSchedule.textContent = 'Update Schedule';
      } else if (removeIndex !== undefined) { scheduleEntries.splice(Number(removeIndex), 1); renderSchedules(); }
    });
    renderSchedules();
  }
  const updateFields = () => modal.querySelectorAll('[data-function-field]').forEach(field => {
    field.hidden = field.dataset.functionField !== kind.value && !(field.dataset.functionField === 'destination' && kind.value === 'link');
  });
  const selectCard = choice => {
    const card = document.querySelector(`.card[data-card-id="${choice.dataset.cardId}"]`);
    if (!card) return;
    modal.querySelector('#functionTitle').value = card.querySelector('.card-title')?.textContent.trim() || '';
    modal.querySelector('#functionSubtitle').value = card.querySelector('.card-sub')?.textContent.trim() || '';
    modal.querySelector('#functionDestination').value = card.dataset.href || '';
    modal.querySelector('#functionCardForm').action = `/cards/${choice.dataset.cardId}/update-function/`;
    modal.querySelector('#functionThemeForm').action = `/cards/${choice.dataset.cardId}/update-function/`;
    modal.querySelector('#functionSecurityForm').action = `/cards/${choice.dataset.cardId}/update-function/`;
    modal.querySelector('#deleteFunctionCardForm').action = `/cards/${choice.dataset.cardId}/delete-function/`;
    modal.querySelector('#deleteFunctionCard').disabled = false;
    modal.querySelectorAll('.function-card-choice').forEach(item => item.classList.toggle('selected', item === choice));
    kind.value = card.classList.contains('image') ? 'image' : card.classList.contains('media') ? 'video' : card.classList.contains('schedule') ? 'schedule' : 'link';
    const savedSchedule = document.querySelector(`#scheduleData span[data-card-id="${choice.dataset.cardId}"]`)?.dataset.schedule;
    scheduleEntries.splice(0, scheduleEntries.length);
    if (savedSchedule) {
      try {
        const parsedSchedule = JSON.parse(savedSchedule);
        if (Array.isArray(parsedSchedule)) scheduleEntries.push(...parsedSchedule);
        else if (parsedSchedule && typeof parsedSchedule === 'object') scheduleEntries.push(parsedSchedule);
      } catch (error) { scheduleEntries.length = 0; }
    }
    renderSchedules();
    updateFields();
  };
  launch.addEventListener('click', () => { modal.hidden = false; document.body.style.overflow = 'hidden'; });
  modal.querySelectorAll('.function-card-choice').forEach(choice => choice.addEventListener('click', () => selectCard(choice)));
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(item => item.classList.toggle('active', item === tab));
    sections.forEach(section => { const active = section.dataset.functionSection === tab.dataset.functionTab; section.hidden = !active; section.classList.toggle('active', active); });
  }));
  kind.addEventListener('change', updateFields);
  updateFields();
}

function copyPublicLink() {
  const link = `${window.location.origin}/u/${document.getElementById('hubUrl')?.textContent || ''}`;
  navigator.clipboard.writeText(link).then(() => showToast('Public hub link copied!')).catch(() => showToast(link));
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

function bindEditorTabs() {
  const editor = document.getElementById('cardModal');
  if (!editor) return;
  editor.addEventListener('click', event => {
    const tab = event.target.closest('[data-editor-tab]');
    if (!tab) return;
    const target = tab.dataset.editorTab;
    editor.querySelectorAll('[data-editor-tab]').forEach(item => item.classList.toggle('active', item === tab));
    editor.querySelectorAll('[data-editor-section]').forEach(section => {
      const active = section.dataset.editorSection === target;
      section.hidden = !active;
      section.classList.toggle('active', active);
    });
  });
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
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1900);
}

bindModals();
bindEditorTabs();
bindFunctionEditor();
