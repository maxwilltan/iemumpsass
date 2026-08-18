const form = document.getElementById('eventForm');
const formTitle = document.getElementById('formTitle');
const eventId = document.getElementById('eventId');
const eventTitle = document.getElementById('eventTitle');
const eventType = document.getElementById('eventType');
const eventBadge = document.getElementById('eventBadge');
const eventDate = document.getElementById('eventDate');
const eventTime = document.getElementById('eventTime');
const eventLocation = document.getElementById('eventLocation');
const eventDescription = document.getElementById('eventDescription');
const eventLink = document.getElementById('eventLink');
const eventPoster = document.getElementById('eventPoster');
const eventPublished = document.getElementById('eventPublished');
const posterPreview = document.getElementById('posterPreview');
const removePoster = document.getElementById('removePoster');
const saveEventButton = document.getElementById('saveEvent');
const clearFormButton = document.getElementById('clearForm');
const cancelEditButton = document.getElementById('cancelEdit');
const descriptionCount = document.getElementById('descriptionCount');
const formMessage = document.getElementById('formMessage');
const adminEventList = document.getElementById('adminEventList');
const toast = document.getElementById('toast');
const filterButtons = document.querySelectorAll('.filter-chip');

let events = [];
let activeFilter = 'all';
let currentPoster = '';
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function formatDate(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function timeToInput(displayTime) {
  if (!displayTime) return '';
  if (/^\d{2}:\d{2}$/.test(displayTime)) return displayTime;
  const match = displayTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '';
  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${minute}`;
}

function timeToDisplay(inputTime) {
  if (!inputTime) return '';
  const [hourString, minute] = inputTime.split(':');
  let hour = Number(hourString);
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
}

function setPosterPreview(source) {
  currentPoster = source || '';
  if (currentPoster) {
    posterPreview.style.backgroundImage = `linear-gradient(160deg, rgba(3,14,31,.06), rgba(3,14,31,.20)), url("${String(currentPoster).replace(/"/g, '%22')}")`;
    posterPreview.classList.add('has-image');
    removePoster.classList.remove('hidden');
  } else {
    posterPreview.style.backgroundImage = '';
    posterPreview.classList.remove('has-image');
    removePoster.classList.add('hidden');
  }
}

function resizeImage(file, maxWidth = 1400, maxHeight = 1800, quality = 0.86) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read this image.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('This image format could not be processed.'));
      image.onload = () => {
        const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handlePosterSelection() {
  const file = eventPoster.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file.');
    eventPoster.value = '';
    return;
  }
  formMessage.textContent = 'Optimising poster image...';
  try {
    const dataUrl = await resizeImage(file);
    setPosterPreview(dataUrl);
    formMessage.textContent = `Poster ready: ${file.name}`;
  } catch (error) {
    formMessage.textContent = error.message;
  }
}

function updateStats() {
  const upcoming = events.filter(event => IEMEventStore.eventBucket(event) === 'upcoming').length;
  const past = events.filter(event => IEMEventStore.eventBucket(event) === 'past').length;
  const published = events.filter(event => event.published !== false).length;
  document.getElementById('totalEvents').textContent = events.length;
  document.getElementById('upcomingEvents').textContent = upcoming;
  document.getElementById('pastEvents').textContent = past;
  document.getElementById('publishedEvents').textContent = published;
}

function getVisibleEvents() {
  const filtered = events.filter(event => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'draft') return event.published === false;
    return IEMEventStore.eventBucket(event) === activeFilter;
  });
  return [...filtered].sort((a, b) => b.date.localeCompare(a.date));
}

function createAdminEventItem(event) {
  const bucket = IEMEventStore.eventBucket(event);
  const item = document.createElement('article');
  item.className = 'admin-event-item';

  const thumb = document.createElement('div');
  thumb.className = 'admin-event-thumb';
  if (event.poster) thumb.style.backgroundImage = `url("${String(event.poster).replace(/"/g, '%22')}")`;

  const info = document.createElement('div');
  info.className = 'admin-event-info';

  const topline = document.createElement('div');
  topline.className = 'admin-event-topline';
  const bucketBadge = document.createElement('span');
  bucketBadge.className = `list-status ${bucket}`;
  bucketBadge.textContent = bucket === 'past' ? 'Past' : 'Upcoming';
  topline.appendChild(bucketBadge);
  if (event.published === false) {
    const draftBadge = document.createElement('span');
    draftBadge.className = 'list-status draft';
    draftBadge.textContent = 'Draft';
    topline.appendChild(draftBadge);
  }

  const title = document.createElement('h3');
  title.textContent = event.title;

  const meta = document.createElement('div');
  meta.className = 'admin-event-meta';
  const date = document.createElement('span');
  date.textContent = `📅 ${formatDate(event.date)}`;
  meta.appendChild(date);
  if (event.location) {
    const location = document.createElement('span');
    location.textContent = `📍 ${event.location}`;
    meta.appendChild(location);
  }
  if (event.type) {
    const type = document.createElement('span');
    type.textContent = event.type;
    meta.appendChild(type);
  }

  info.append(topline, title, meta);

  const actions = document.createElement('div');
  actions.className = 'admin-event-actions';
  const edit = document.createElement('button');
  edit.className = 'small-action edit';
  edit.type = 'button';
  edit.dataset.action = 'edit';
  edit.dataset.id = event.id;
  edit.textContent = 'Edit';
  const del = document.createElement('button');
  del.className = 'small-action delete';
  del.type = 'button';
  del.dataset.action = 'delete';
  del.dataset.id = event.id;
  del.textContent = 'Delete';
  actions.append(edit, del);

  item.append(thumb, info, actions);
  return item;
}

function renderEventList() {
  const visible = getVisibleEvents();
  adminEventList.innerHTML = '';
  if (!visible.length) {
    adminEventList.innerHTML = '<div class="list-empty">No events in this category yet.</div>';
    return;
  }
  visible.forEach(event => adminEventList.appendChild(createAdminEventItem(event)));
}

async function refreshEvents() {
  events = await IEMEventStore.getAllEvents();
  updateStats();
  renderEventList();
}

function resetForm() {
  form.reset();
  eventId.value = '';
  eventBadge.value = 'Registration Open';
  eventPublished.checked = true;
  formTitle.textContent = 'Add New Event';
  saveEventButton.textContent = 'Publish Event';
  cancelEditButton.classList.add('hidden');
  descriptionCount.textContent = '0';
  formMessage.textContent = '';
  eventPoster.value = '';
  setPosterPreview('');
}

function beginEdit(event) {
  eventId.value = event.id;
  eventTitle.value = event.title || '';
  eventType.value = event.type || '';
  eventBadge.value = event.badge || 'Upcoming';
  eventDate.value = event.date || '';
  eventTime.value = timeToInput(event.time || '');
  eventLocation.value = event.location || '';
  eventDescription.value = event.description || '';
  eventLink.value = event.link || '';
  eventPublished.checked = event.published !== false;
  descriptionCount.textContent = String((event.description || '').length);
  setPosterPreview(event.poster || '');
  formTitle.textContent = 'Edit Event';
  saveEventButton.textContent = event.published === false ? 'Save Event' : 'Update Event';
  cancelEditButton.classList.remove('hidden');
  document.getElementById('editorCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function makeId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function saveForm(event) {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const editingId = eventId.value;
  const existing = editingId ? events.find(item => item.id === editingId) : null;
  const now = new Date().toISOString();
  const record = {
    id: editingId || makeId(),
    title: eventTitle.value.trim(),
    type: eventType.value.trim() || 'IEM UMPSA Event',
    badge: eventBadge.value,
    date: eventDate.value,
    time: timeToDisplay(eventTime.value),
    location: eventLocation.value.trim(),
    description: eventDescription.value.trim(),
    link: eventLink.value.trim(),
    poster: currentPoster,
    published: eventPublished.checked,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  saveEventButton.disabled = true;
  saveEventButton.textContent = 'Saving...';
  try {
    await IEMEventStore.saveEvent(record);
    await refreshEvents();
    resetForm();
    showToast(record.published ? 'Event published to the website.' : 'Event saved as a draft.');
  } catch (error) {
    console.error(error);
    formMessage.textContent = 'Could not save the event. Please try again.';
  } finally {
    saveEventButton.disabled = false;
    if (!eventId.value) saveEventButton.textContent = 'Publish Event';
  }
}

async function handleListAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const id = button.dataset.id;
  const record = events.find(item => item.id === id);
  if (!record) return;

  if (button.dataset.action === 'edit') {
    beginEdit(record);
    return;
  }

  if (button.dataset.action === 'delete') {
    const confirmed = window.confirm(`Delete “${record.title}”? This removes it from the public website too.`);
    if (!confirmed) return;
    await IEMEventStore.deleteEvent(id);
    if (eventId.value === id) resetForm();
    await refreshEvents();
    showToast('Event deleted.');
  }
}

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach(item => item.classList.toggle('active', item === button));
    renderEventList();
  });
});

eventDescription.addEventListener('input', () => {
  descriptionCount.textContent = String(eventDescription.value.length);
});
eventPoster.addEventListener('change', handlePosterSelection);
removePoster.addEventListener('click', () => {
  eventPoster.value = '';
  setPosterPreview('');
  formMessage.textContent = 'Poster removed from this event.';
});
clearFormButton.addEventListener('click', resetForm);
cancelEditButton.addEventListener('click', resetForm);
adminEventList.addEventListener('click', handleListAction);
form.addEventListener('submit', saveForm);

refreshEvents().catch(error => {
  console.error(error);
  adminEventList.innerHTML = '<div class="list-empty">Could not open browser storage. Try serving the site through Vercel or a local web server.</div>';
});
