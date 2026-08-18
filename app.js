const navbar = document.querySelector('.navbar');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const dropdown = document.querySelector('.dropdown');
const dropdownTrigger = document.querySelector('.dropdown-trigger');
const eventTabs = document.querySelectorAll('.event-tab');
const eventGrid = document.getElementById('eventGrid');
const eventCount = document.getElementById('eventCount');

let activeEventTab = 'upcoming';
let allEvents = [];

window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 40);
});

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
}

if (dropdownTrigger && dropdown) {
  dropdownTrigger.addEventListener('click', () => {
    if (window.innerWidth <= 760) dropdown.classList.toggle('open');
  });
}

function formatDateParts(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: date.toLocaleString('en-MY', { month: 'short' }).toUpperCase()
  };
}

function safeLink(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
  } catch {
    return '';
  }
}

function createEventCard(event) {
  const bucket = IEMEventStore.eventBucket(event);
  const { day, month } = formatDateParts(event.date);

  const article = document.createElement('article');
  article.className = 'event-card';
  article.dataset.category = bucket;

  const image = document.createElement('div');
  image.className = 'event-image';
  if (event.poster) {
    image.style.backgroundImage = `linear-gradient(160deg, rgba(3,14,31,.12), rgba(3,14,31,.44)), url("${String(event.poster).replace(/"/g, '%22')}")`;
  }

  const status = document.createElement('span');
  status.className = `status-pill${bucket === 'past' ? ' muted' : ''}`;
  status.textContent = bucket === 'past' ? 'Completed' : (event.badge || 'Upcoming');

  const date = document.createElement('div');
  date.className = 'event-date';
  const dayEl = document.createElement('strong');
  dayEl.textContent = day;
  const monthEl = document.createElement('span');
  monthEl.textContent = month;
  date.append(dayEl, monthEl);
  image.append(status, date);

  const body = document.createElement('div');
  body.className = 'event-card-body';

  const kicker = document.createElement('p');
  kicker.className = 'card-kicker';
  kicker.textContent = event.type || 'IEM UMPSA Event';

  const title = document.createElement('h3');
  title.textContent = event.title;

  const description = document.createElement('p');
  description.textContent = event.description || '';

  const meta = document.createElement('div');
  meta.className = 'event-meta';
  if (event.location) {
    const location = document.createElement('span');
    location.textContent = `📍 ${event.location}`;
    meta.appendChild(location);
  }
  const secondMeta = document.createElement('span');
  secondMeta.textContent = bucket === 'past' ? '✓ Completed' : (event.time ? `🕘 ${event.time}` : 'Upcoming');
  meta.appendChild(secondMeta);

  body.append(kicker, title, description, meta);

  const link = safeLink(event.link);
  if (link) {
    const anchor = document.createElement('a');
    anchor.href = link;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.className = 'text-link';
    anchor.innerHTML = `${bucket === 'past' ? 'View highlight' : 'View event'} <span>→</span>`;
    body.appendChild(anchor);
  }

  article.append(image, body);
  return article;
}

function renderEvents() {
  if (!eventGrid) return;

  const published = allEvents.filter(event => event.published !== false);
  const filtered = published.filter(event => IEMEventStore.eventBucket(event) === activeEventTab);
  const sorted = IEMEventStore.sortEvents(filtered, activeEventTab);

  eventGrid.innerHTML = '';
  sorted.forEach(event => eventGrid.appendChild(createEventCard(event)));

  if (!sorted.length) {
    const empty = document.createElement('div');
    empty.className = 'event-empty';
    empty.innerHTML = `<strong>No ${activeEventTab} events yet.</strong><span>New events published from the Admin Portal will appear here automatically.</span>`;
    eventGrid.appendChild(empty);
  }

  if (eventCount) eventCount.textContent = sorted.length;
}

function switchEventTab(tabName) {
  activeEventTab = tabName;
  eventTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
  renderEvents();
}

eventTabs.forEach(tab => {
  tab.addEventListener('click', () => switchEventTab(tab.dataset.tab));
});

document.querySelectorAll('[data-event-tab]').forEach(link => {
  link.addEventListener('click', () => {
    switchEventTab(link.dataset.eventTab);
    if (navLinks) navLinks.classList.remove('open');
    if (dropdown) dropdown.classList.remove('open');
  });
});

document.querySelectorAll('.nav-links > a').forEach(link => {
  link.addEventListener('click', () => navLinks?.classList.remove('open'));
});

async function initEvents() {
  try {
    allEvents = await IEMEventStore.getAllEvents();
    renderEvents();
  } catch (error) {
    console.error('Could not load events:', error);
    if (eventGrid) {
      eventGrid.innerHTML = '<div class="event-empty"><strong>Events could not be loaded.</strong><span>Please refresh the page or open the website through a local/server URL.</span></div>';
    }
  }
}

initEvents();
