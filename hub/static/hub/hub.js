function setPane(which) {
  document.getElementById('pane-card').classList.toggle('active', which === 'card');
  document.getElementById('pane-cards').classList.toggle('active', which === 'cards');
  document.getElementById('btnPaneCard').classList.toggle('active', which === 'card');
  document.getElementById('btnPaneCards').classList.toggle('active', which === 'cards');
}

function flipCard() {
  document.getElementById('ccCard').classList.toggle('flipped');
}

const extraSocialPlatforms = {
  discord: 'Discord', github: 'GitHub', behance: 'Behance', threads: 'Threads', whatsapp: 'WhatsApp', telegram: 'Telegram',
};

function addFormField(form, labelText, name, value, type = 'text') {
  if (form.querySelector(`[name="${name}"]`)) return form.querySelector(`[name="${name}"]`);
  const label = document.createElement('label');
  label.textContent = labelText;
  const input = document.createElement('input');
  input.type = type;
  input.name = name;
  input.value = value || '';
  label.appendChild(input);
  form.querySelector('.form-grid')?.appendChild(label);
  return input;
}

function enhanceCallingCardEditor() {
  const data = document.getElementById('hubCustomizationData');
  const modal = document.getElementById('cardModal');
  if (!data || !modal) return;
  const callingForm = modal.querySelector('[data-editor-section="calling-card"] form');
  const socialsForm = modal.querySelector('[data-editor-section="socials"] form');
  const aboutForm = modal.querySelector('[data-editor-section="about"] form');
  addFormField(callingForm, 'Nickname / display handle', 'display_handle', data.dataset.displayHandle);
  addFormField(callingForm, 'Tagline / subtitle', 'card_tagline', data.dataset.cardTagline);
  addFormField(aboutForm, 'Location', 'location', data.dataset.location);
  addFormField(aboutForm, 'Pronouns', 'pronouns', data.dataset.pronouns);
  if (aboutForm && !aboutForm.querySelector('.visible-card-fields')) {
    const selected = data.dataset.visibleFields ? data.dataset.visibleFields.split(',') : [];
    const fieldLabels = { phone: 'Phone', socials: 'Socials', school: 'Education', email: 'Email', location: 'Location', pronouns: 'Pronouns' };
    const wrapper = document.createElement('fieldset');
    wrapper.className = 'visible-card-fields wide';
    const legend = document.createElement('legend');
    legend.textContent = 'Show on public card';
    wrapper.appendChild(legend);
    Object.entries(fieldLabels).forEach(([field, labelText]) => {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox'; checkbox.name = 'card_visible_fields'; checkbox.value = field;
      checkbox.checked = !selected.length || selected.includes(field);
      label.append(checkbox, ` ${labelText}`);
      wrapper.appendChild(label);
    });
    aboutForm.querySelector('.form-grid')?.appendChild(wrapper);
  }
  const socialRows = document.getElementById('socialRows');
  if (socialsForm && socialRows) {
    const renumberSocialRows = () => socialRows.querySelectorAll('.social-row').forEach((row, index) => {
      row.querySelector('.social-visible')?.setAttribute('name', `social_visible_${index}`);
      row.querySelector('.social-visibility-default')?.setAttribute('name', `social_visible_${index}`);
    });
    socialRows.querySelectorAll('.social-row').forEach((row, index) => {
      row.draggable = true;
      row.classList.add('social-sortable');
      const select = row.querySelector('select');
      Object.entries(extraSocialPlatforms).forEach(([value, label]) => {
        if (!select.querySelector(`option[value="${value}"]`)) select.add(new Option(label, value));
      });
      if (!row.querySelector('.social-visible')) {
        const hidden = document.createElement('input'); hidden.type = 'hidden'; hidden.name = `social_visible_${index}`; hidden.value = 'off'; hidden.className = 'social-visibility-default';
        const visible = document.createElement('input'); visible.type = 'checkbox'; visible.name = `social_visible_${index}`; visible.value = 'on'; visible.className = 'social-visible';
        const label = document.createElement('label'); label.className = 'social-visibility'; label.append(visible, ' Show');
        row.append(hidden, label);
        const socialData = (() => { try { return JSON.parse(data.dataset.socials || '[]'); } catch (error) { return []; } })()[index];
        visible.checked = !socialData || socialData.visible !== false;
      }
    });
    let draggedRow;
    socialRows.addEventListener('dragstart', event => { draggedRow = event.target.closest('.social-sortable'); });
    socialRows.addEventListener('dragover', event => {
      event.preventDefault();
      const target = event.target.closest('.social-sortable');
      if (target && target !== draggedRow) socialRows.insertBefore(draggedRow, target);
      renumberSocialRows();
    });
    renumberSocialRows();
  }
  const card = document.getElementById('ccCard');
  const frontDetails = card?.querySelector('.cc-name')?.parentElement;
  if (frontDetails && !frontDetails.querySelector('.cc-handle')) {
    if (data.dataset.displayHandle) { const handle = document.createElement('div'); handle.className = 'cc-handle'; handle.textContent = data.dataset.displayHandle; frontDetails.prepend(handle); }
    if (data.dataset.cardTagline) { const tagline = document.createElement('div'); tagline.className = 'cc-tagline'; tagline.textContent = data.dataset.cardTagline; frontDetails.appendChild(tagline); }
  }
}

function enhancePublicCallingCard() {
  const data = document.getElementById('publicCustomizationData');
  const card = document.getElementById('ccCard');
  if (!data || !card) return;
  const frontDetails = card.querySelector('.cc-name')?.parentElement;
  if (frontDetails && !frontDetails.querySelector('.cc-handle')) {
    if (data.dataset.displayHandle) { const handle = document.createElement('div'); handle.className = 'cc-handle'; handle.textContent = data.dataset.displayHandle; frontDetails.prepend(handle); }
    if (data.dataset.cardTagline) { const tagline = document.createElement('div'); tagline.className = 'cc-tagline'; tagline.textContent = data.dataset.cardTagline; frontDetails.appendChild(tagline); }
  }
  const selected = data.dataset.visibleFields ? data.dataset.visibleFields.split(',') : [];
  const visible = field => !selected.length || selected.includes(field);
  const labels = { MOBILE: 'phone', SOCIALS: 'socials', SCHOOL: 'school', EMAIL: 'email' };
  card.querySelectorAll('.cc-row').forEach(row => { const key = row.querySelector('.k')?.textContent.trim(); if (labels[key] && !visible(labels[key])) row.hidden = true; });
  const details = card.querySelector('.cc-list');
  [['LOCATION', data.dataset.location, 'location'], ['PRONOUNS', data.dataset.pronouns, 'pronouns']].forEach(([label, value, field]) => {
    if (!value || !visible(field) || !details) return;
    const row = document.createElement('div'); row.className = 'cc-row'; row.innerHTML = `<span class="k">${label}</span><span></span>`; row.lastElementChild.textContent = value; details.appendChild(row);
  });
}

function enhanceThemeEditor() {
  const modal = document.getElementById('functionCardsModal');
  const themeForm = document.getElementById('functionThemeForm');
  if (!modal || !themeForm || themeForm.querySelector('[value="rust"]')) return;
  const options = themeForm.querySelector('.theme-options');
  if (options) {
    const label = document.createElement('label'); label.className = 'theme-option';
    label.innerHTML = '<input type="radio" name="card_theme" value="rust"><span class="theme-swatch rust-swatch"></span><span>Rust</span>';
    options.appendChild(label);
  }
  const grid = document.createElement('div'); grid.className = 'form-grid card-theme-extra';
  const inherit = document.createElement('label'); inherit.className = 'wide';
  inherit.innerHTML = '<span><input type="checkbox" name="inherit_theme" checked> Inherit hub theme</span>';
  const icon = document.createElement('label'); icon.className = 'wide';
  icon.innerHTML = '<span>Card icon or emoji<input name="icon" maxlength="8" placeholder="e.g. ★"></span>';
  grid.append(inherit, icon); themeForm.appendChild(grid);
  const preview = document.createElement('div'); preview.className = 'theme-preview'; preview.textContent = 'Live card preview'; themeForm.appendChild(preview);
  themeForm.addEventListener('change', event => {
    if (event.target.name === 'card_theme') {
      document.getElementById('ccCard')?.classList.remove('paper', 'night', 'moss', 'rust');
      document.getElementById('ccCard')?.classList.add(event.target.value);
      preview.className = `theme-preview ${event.target.value}`;
    }
  });
}

function enhanceFunctionOverview(modal) {
  const list = modal.querySelector('#functionCardList');
  if (!list || list.querySelector('.function-card-search')) return;
  const search = document.createElement('input');
  search.className = 'function-card-search'; search.type = 'search'; search.placeholder = 'Search cards';
  list.before(search);
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    list.querySelectorAll('.function-card-choice').forEach(choice => { choice.hidden = query && !choice.textContent.toLowerCase().includes(query); });
  });
  const actions = document.createElement('div'); actions.className = 'function-card-actions';
  const duplicate = document.createElement('button'); duplicate.type = 'button'; duplicate.className = 'btn btn-ghost'; duplicate.textContent = 'Duplicate selected card'; duplicate.disabled = true;
  const reorderForm = document.createElement('form'); reorderForm.method = 'post'; reorderForm.action = '/cards/reorder/';
  const csrf = modal.querySelector('input[name="csrfmiddlewaretoken"]'); if (csrf) reorderForm.appendChild(csrf.cloneNode(true));
  const saveOrder = document.createElement('button'); saveOrder.type = 'submit'; saveOrder.className = 'btn btn-ghost'; saveOrder.textContent = 'Save card order';
  reorderForm.appendChild(saveOrder); actions.append(duplicate, reorderForm); list.after(actions);
  let selected;
  list.querySelectorAll('.function-card-choice').forEach(choice => {
    choice.draggable = true;
    choice.addEventListener('click', () => { selected = choice; duplicate.disabled = false; });
  });
  duplicate.addEventListener('click', () => {
    if (!selected) return;
    const form = document.createElement('form'); form.method = 'post'; form.action = `/cards/${selected.dataset.cardId}/duplicate/`;
    if (csrf) form.appendChild(csrf.cloneNode(true)); document.body.appendChild(form); form.submit();
  });
  reorderForm.addEventListener('submit', () => {
    reorderForm.querySelectorAll('input[name="card_order"]').forEach(input => input.remove());
    list.querySelectorAll('.function-card-choice').forEach(choice => { const input = document.createElement('input'); input.type = 'hidden'; input.name = 'card_order'; input.value = choice.dataset.cardId; reorderForm.appendChild(input); });
  });
  let dragged;
  list.addEventListener('dragstart', event => { dragged = event.target.closest('.function-card-choice'); });
  list.addEventListener('dragover', event => { event.preventDefault(); const target = event.target.closest('.function-card-choice'); if (target && target !== dragged) list.insertBefore(dragged, target); });
}

function bindCards() {

  document.querySelectorAll('.social-icon').forEach(icon => icon.addEventListener('click', event => event.stopPropagation()));
  const customizationData = document.getElementById('hubCustomizationData');
  const accountTheme = document.getElementById('ccCard')?.className.split(' ').find(theme => ['paper', 'night', 'moss', 'rust'].includes(theme)) || 'paper';
  document.querySelectorAll('.card:not(.ghost)').forEach(card => {
    const customization = customizationData?.querySelector(`span[data-card-id="${card.dataset.cardId}"]`);
    if (customization) {
      if (customization.dataset.icon) card.querySelector('.card-mark').textContent = customization.dataset.icon;
      if (customization.dataset.inheritTheme === 'true') {
        card.classList.remove('paper', 'night', 'moss', 'rust');
        card.classList.add(accountTheme);
      }
    }
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
  enhanceFunctionOverview(modal);
  enhanceThemeEditor();
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
    const customization = document.querySelector(`#hubCustomizationData span[data-card-id="${choice.dataset.cardId}"]`);
    const themeForm = document.getElementById('functionThemeForm');
    if (customization && themeForm) {
      themeForm.querySelectorAll('[name="card_theme"]').forEach(input => { input.checked = input.value === customization.dataset.cardTheme; });
      const inherit = themeForm.querySelector('[name="inherit_theme"]');
      const icon = themeForm.querySelector('[name="icon"]');
      if (inherit) inherit.checked = customization.dataset.inheritTheme === 'true';
      if (icon) icon.value = customization.dataset.icon || '';
    }
    if (customization?.dataset.icon) card.querySelector('.card-mark').textContent = customization.dataset.icon;
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
    enhanceCallingCardEditor();
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
enhanceCallingCardEditor();
enhancePublicCallingCard();
bindFunctionEditor();
