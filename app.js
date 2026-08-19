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


// Dynamic committee CMS
const managementTeamMount = document.getElementById('managementTeamMount');
const departmentGrid = document.getElementById('departmentGrid');
let committeeMembers = [];

function committeeInitials(name) {
  if (!name) return '';
  const ignored = new Set(['BIN', 'BINTI', 'A/P', 'A/L', 'ANAK', 'MOHD']);
  const words = name.trim().split(/\s+/).filter(word => /^[A-Za-z]/.test(word));
  const candidates = words.filter(word => !ignored.has(word.toUpperCase()));
  const source = candidates.length ? candidates : words;

  if (!source.length) return '';
  if (source.length === 1) return source[0].slice(0, 2).toUpperCase();

  return `${source[0][0]}${source[1][0]}`.toUpperCase();
}

function createCommitteeAvatar(member, classNames = '') {
  const avatar = document.createElement('div');
  avatar.className = `committee-avatar ${classNames}`.trim();

  if (member?.photo) {
    const image = document.createElement('img');
    image.src = member.photo;
    image.alt = member.name ? `${member.name} profile photo` : 'Committee profile photo';
    image.className = 'committee-profile-photo';
    avatar.appendChild(image);
  } else {
    avatar.textContent = committeeInitials(member?.name || '');
  }

  return avatar;
}

function createLeadershipCard(member, options = {}) {
  if (!member || !member.name || member.published === false) return null;

  const article = document.createElement('article');
  article.className = `leadership-card${options.chair ? ' leadership-chair' : ''}${options.executive ? ' executive-card' : ''}`;

  const avatarClasses = `${options.chair ? 'chair-avatar' : ''} ${options.executive ? 'small-avatar' : ''}`.trim();
  article.appendChild(createCommitteeAvatar(member, avatarClasses));

  const copy = document.createElement('div');
  copy.className = 'leadership-copy';

  const role = document.createElement('p');
  role.className = 'committee-role';
  role.textContent = member.position;

  const name = document.createElement('h3');
  name.textContent = member.name;

  copy.append(role, name);

  if (options.subtitle) {
    const subtitle = document.createElement('span');
    subtitle.textContent = options.subtitle;
    copy.appendChild(subtitle);
  }

  article.appendChild(copy);
  return article;
}

function renderManagementTeam() {
  if (!managementTeamMount) return;

  managementTeamMount.innerHTML = '';

  const members = committeeMembers.filter(member => member.group === 'management');
  const byPosition = position => members.find(member => member.position === position);

  const chairWrap = document.createElement('div');
  chairWrap.className = 'leadership-chair-wrap';

  const chairCard = createLeadershipCard(byPosition('Chairperson'), {
    chair: true,
    subtitle: 'Executive Leadership'
  });

  if (chairCard) chairWrap.appendChild(chairCard);
  managementTeamMount.appendChild(chairWrap);

  const viceRow = document.createElement('div');
  viceRow.className = 'vice-row';

  const internal = createLeadershipCard(byPosition('Vice Chairperson · Internal'), {
    subtitle: 'Internal Affairs'
  });

  const external = createLeadershipCard(byPosition('Vice Chairperson · External'), {
    subtitle: 'External Affairs'
  });

  if (internal) viceRow.appendChild(internal);
  if (external) viceRow.appendChild(external);

  if (viceRow.childElementCount) {
    managementTeamMount.appendChild(viceRow);
  }

  const executiveRow = document.createElement('div');
  executiveRow.className = 'executive-row';

  ['Treasurer', 'Vice Treasurer', 'Secretary', 'Vice Secretary'].forEach(position => {
    const card = createLeadershipCard(byPosition(position), { executive: true });
    if (card) executiveRow.appendChild(card);
  });

  if (executiveRow.childElementCount) {
    managementTeamMount.appendChild(executiveRow);
  }

  if (!managementTeamMount.querySelector('.leadership-card')) {
    managementTeamMount.innerHTML =
      '<div class="committee-loading">Management team information will appear here.</div>';
  }
}

function createMiniAvatar(member) {
  const avatar = document.createElement('span');
  avatar.className = 'mini-avatar';

  if (member.photo) {
    const image = document.createElement('img');
    image.src = member.photo;
    image.alt = `${member.name} profile photo`;
    image.className = 'committee-profile-photo';
    avatar.appendChild(image);
  } else {
    avatar.textContent = committeeInitials(member.name);
  }

  return avatar;
}

function createDepartmentPerson(member, lead = false) {
  const person = document.createElement('div');
  person.className = `department-person${lead ? ' lead-person' : ''}`;
  person.appendChild(createMiniAvatar(member));

  if (lead) {
    const copy = document.createElement('div');

    const role = document.createElement('small');
    role.textContent = member.position;

    const name = document.createElement('strong');
    name.textContent = member.name;

    copy.append(role, name);
    person.appendChild(copy);
  } else {
    person.classList.add('member-person');

    const name = document.createElement('strong');
    name.textContent = member.name;

    person.appendChild(name);
  }

  return person;
}

function renderDepartments() {
  if (!departmentGrid || !window.IEMCommitteeStore) return;

  departmentGrid.innerHTML = '';

  IEMCommitteeStore.departments.forEach(department => {
    const departmentMembers = committeeMembers
      .filter(member =>
        member.group === 'department' &&
        member.department === department.id &&
        member.published !== false &&
        member.name
      )
      .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));

    const card = document.createElement('article');
    card.className = 'department-card glass light-glass';

    if (!departmentMembers.length) {
      card.classList.add('department-card-empty');
    }

    const header = document.createElement('div');
    header.className = 'department-header';

    const icon = document.createElement('div');
    icon.className = 'department-icon';
    icon.textContent = department.icon;

    const heading = document.createElement('div');

    const label = document.createElement('span');
    label.textContent = 'Department';

    const title = document.createElement('h3');
    title.textContent = department.name;

    heading.append(label, title);
    header.append(icon, heading);
    card.appendChild(header);

    if (!departmentMembers.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-department-space';
      empty.setAttribute('aria-label', 'Reserved positions');
      card.appendChild(empty);
      departmentGrid.appendChild(card);
      return;
    }

    const leads = departmentMembers.filter(member =>
      member.position === 'HOD' || member.position === 'Asst HOD'
    );

    const regularMembers = departmentMembers.filter(member =>
      member.position !== 'HOD' && member.position !== 'Asst HOD'
    );

    if (leads.length) {
      const leadGrid = document.createElement('div');
      leadGrid.className = 'department-leads';

      leads.forEach(member => {
        leadGrid.appendChild(createDepartmentPerson(member, true));
      });

      card.appendChild(leadGrid);
    }

    const divider = document.createElement('div');
    divider.className = 'member-divider';

    const dividerText = document.createElement('span');
    dividerText.textContent = 'Members';

    divider.appendChild(dividerText);
    card.appendChild(divider);

    const list = document.createElement('div');
    list.className = `member-list${regularMembers.length ? '' : ' reserved-space'}`;

    regularMembers.forEach(member => {
      list.appendChild(createDepartmentPerson(member, false));
    });

    card.appendChild(list);
    departmentGrid.appendChild(card);
  });
}

async function initCommittee() {
  if (!managementTeamMount && !departmentGrid) return;

  try {
    if (!window.IEMCommitteeStore) {
      throw new Error('Committee data store is unavailable.');
    }

    committeeMembers =
      IEMCommitteeStore.sortMembers(
        await IEMCommitteeStore.getAllMembers()
      );

    renderManagementTeam();
    renderDepartments();
  } catch (error) {
    console.error('Could not load committee:', error);

    if (managementTeamMount) {
      managementTeamMount.innerHTML =
        '<div class="committee-loading">Committee information could not be loaded. Please refresh the page.</div>';
    }

    if (departmentGrid) {
      departmentGrid.innerHTML =
        '<div class="committee-loading">Department information could not be loaded. Please refresh the page.</div>';
    }
  }
}

initCommittee();

// ------------------------------------------------------------
// Live Admin → Public Committee preview bridge
// ------------------------------------------------------------
function applyIncomingCommitteeData(members) {
  if (!Array.isArray(members)) return;

  committeeMembers = IEMCommitteeStore.sortMembers(
    members.map(member => ({ ...member }))
  );

  renderManagementTeam();
  renderDepartments();

  // Also persist when the current environment allows shared storage.
  try {
    localStorage.setItem(
      'iemUmpsaCommitteeDataV1',
      JSON.stringify(committeeMembers)
    );
  } catch (error) {
    // The visual live preview still works even when storage is restricted.
  }
}

window.addEventListener('message', event => {
  const payload = event.data;

  if (
    payload &&
    payload.type === 'IEM_COMMITTEE_PREVIEW' &&
    Array.isArray(payload.members)
  ) {
    applyIncomingCommitteeData(payload.members);
  }
});

window.addEventListener('storage', event => {
  if (
    event.key === 'iemUmpsaCommitteeDataV1' &&
    event.newValue
  ) {
    try {
      applyIncomingCommitteeData(
        JSON.parse(event.newValue)
      );
    } catch (error) {
      console.error('Could not apply committee storage update:', error);
    }
  }
});

try {
  const committeeChannel =
    new BroadcastChannel('iem-umpsa-content');

  committeeChannel.addEventListener('message', event => {
    const payload = event.data;

    if (
      payload &&
      payload.type === 'IEM_COMMITTEE_PREVIEW' &&
      Array.isArray(payload.members)
    ) {
      applyIncomingCommitteeData(payload.members);
    }
  });
} catch (error) {
  // BroadcastChannel is optional; postMessage remains the preview fallback.
}

// ------------------------------------------------------------
// Fallback sync: some browsers (especially over file:// or when
// the "storage" event / BroadcastChannel silently fail between
// tabs) never deliver the live push above. This safety net
// re-reads localStorage on focus/visibility change and on a
// short interval, so the homepage self-heals even if the
// instant push never arrived.
// ------------------------------------------------------------
let lastCommitteeSnapshot = null;

function syncCommitteeFromStorage() {
  if (!window.IEMCommitteeStore) return;

  try {
    const raw = localStorage.getItem('iemUmpsaCommitteeDataV1');
    if (!raw) return;

    if (raw === lastCommitteeSnapshot) return;
    lastCommitteeSnapshot = raw;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    applyIncomingCommitteeData(parsed);
  } catch (error) {
    // Ignore malformed/unavailable storage; live push and the
    // next successful poll will recover on their own.
  }
}

// Prime the snapshot so the very first poll doesn't re-render
// unnecessarily right after initCommittee() already loaded data.
try {
  lastCommitteeSnapshot = localStorage.getItem('iemUmpsaCommitteeDataV1');
} catch (error) {
  // Storage unavailable; polling below will just no-op safely.
}

window.addEventListener('focus', syncCommitteeFromStorage);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) syncCommitteeFromStorage();
});

setInterval(syncCommitteeFromStorage, 2000);



// ------------------------------------------------------------
// Gallery
// ------------------------------------------------------------
const galleryGrid = document.getElementById('galleryGrid');

const galleryStripPrev = document.getElementById('galleryStripPrev');
const galleryStripNext = document.getElementById('galleryStripNext');

// How many cards are cloned onto each end of the strip to fake an
// infinite loop. Set once real albums are rendered (see renderGallery).
let galleryCloneSize = 0;
let galleryRealCount = 0;

// Keep one stable logical album index instead of repeatedly deriving the
// current album from a halfway-through animation.
let galleryLogicalIndex = 0;
let galleryIsAnimating = false;
const galleryScrollQueue = [];

function galleryCardStep() {
  if (!galleryGrid) return 0;

  const firstCard = galleryGrid.querySelector('.gallery-album');
  if (!firstCard) return 0;

  const styles = getComputedStyle(galleryGrid);
  const gap = parseFloat(styles.columnGap || styles.gap) || 0;

  return firstCard.getBoundingClientRect().width + gap;
}

function galleryVisibleCards() {
  if (window.innerWidth <= 620) return 1;
  if (window.innerWidth <= 920) return 2;
  return 3;
}

function galleryMaxIndex() {
  return Math.max(0, galleryRealCount - galleryVisibleCards());
}

function normalizeGalleryIndex(index) {
  if (!galleryRealCount) return 0;

  return (
    (index % galleryRealCount) + galleryRealCount
  ) % galleryRealCount;
}

function rawGalleryIndexFromScroll() {
  const step = galleryCardStep();

  if (!step || !galleryGrid) {
    return galleryLogicalIndex;
  }

  return (
    Math.round(galleryGrid.scrollLeft / step) -
    galleryCloneSize
  );
}

function currentGalleryIndex() {
  return galleryLogicalIndex;
}

function updateGalleryStripArrows() {
  if (!galleryGrid) return;

  // Infinite loop is only useful when there are more albums than can
  // already fit in the viewport.
  const disable = galleryMaxIndex() <= 0;

  if (galleryStripPrev) {
    galleryStripPrev.disabled = disable;
  }

  if (galleryStripNext) {
    galleryStripNext.disabled = disable;
  }
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateGalleryScroll(targetLeft, duration = 650, onComplete) {
  if (!galleryGrid) return;

  galleryGrid.classList.add('is-animating');

  const startLeft = galleryGrid.scrollLeft;
  const distance = targetLeft - startLeft;
  const startTime = performance.now();

  function frame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeOutCubic(progress);

    galleryGrid.scrollLeft =
      startLeft + distance * eased;

    if (progress < 1) {
      galleryGrid._scrollAnimationFrame =
        requestAnimationFrame(frame);
      return;
    }

    galleryGrid.scrollLeft = targetLeft;
    galleryGrid._scrollAnimationFrame = null;
    galleryGrid.classList.remove('is-animating');

    if (onComplete) {
      onComplete();
    }
  }

  galleryGrid._scrollAnimationFrame =
    requestAnimationFrame(frame);
}

function processGalleryScrollQueue() {
  if (
    !galleryGrid ||
    galleryIsAnimating ||
    !galleryScrollQueue.length
  ) {
    return;
  }

  const step = galleryCardStep();

  if (!step || galleryMaxIndex() <= 0) {
    galleryScrollQueue.length = 0;
    return;
  }

  const direction = galleryScrollQueue.shift();

  galleryIsAnimating = true;

  // Move exactly one album from the last settled logical position.
  // The temporary index may be -1 or galleryRealCount while travelling
  // through the clone buffer.
  const travelIndex =
    galleryLogicalIndex + direction;

  const targetLeft =
    (travelIndex + galleryCloneSize) * step;

  animateGalleryScroll(
    targetLeft,
    650,
    () => {
      // THIS is the important fix:
      // wrap by the number of REAL albums, not by galleryMaxIndex().
      //
      // Example:
      // 5 real albums + 3 visible cards
      // galleryMaxIndex() = 2, but the loop period is still 5.
      const settledIndex =
        normalizeGalleryIndex(travelIndex);

      galleryLogicalIndex = settledIndex;

      // When the animation landed on a clone, silently relocate to its
      // pixel-identical real counterpart. Because the counterpart shows
      // the exact same sequence of cards, this reposition is invisible.
      if (settledIndex !== travelIndex) {
        galleryGrid.scrollLeft =
          (settledIndex + galleryCloneSize) * step;
      }

      galleryIsAnimating = false;
      updateGalleryStripArrows();

      // If the user clicked several times quickly, continue one card at
      // a time instead of cancelling an animation midway and losing the
      // carousel index.
      if (galleryScrollQueue.length) {
        requestAnimationFrame(
          processGalleryScrollQueue
        );
      }
    }
  );
}

function scrollGalleryStrip(direction) {
  if (!galleryGrid || galleryMaxIndex() <= 0) {
    return;
  }

  galleryScrollQueue.push(direction);
  processGalleryScrollQueue();
}

function normalizeGalleryAfterManualScroll() {
  if (
    !galleryGrid ||
    galleryIsAnimating ||
    galleryScrollQueue.length ||
    !galleryRealCount
  ) {
    return;
  }

  const step = galleryCardStep();
  if (!step) return;

  const rawIndex = rawGalleryIndexFromScroll();
  const normalizedIndex =
    normalizeGalleryIndex(rawIndex);

  galleryLogicalIndex = normalizedIndex;

  // If a trackpad/touch gesture stopped in a clone zone, jump to the
  // identical real position after scrolling has stopped.
  if (rawIndex !== normalizedIndex) {
    galleryGrid.scrollLeft =
      (normalizedIndex + galleryCloneSize) * step;
  }

  updateGalleryStripArrows();
}

galleryStripPrev?.addEventListener(
  'click',
  () => scrollGalleryStrip(-1)
);

galleryStripNext?.addEventListener(
  'click',
  () => scrollGalleryStrip(1)
);


// ------------------------------------------------------------
// Gallery auto-scroll
// ------------------------------------------------------------
let galleryAutoScrollTimer = null;
let galleryAutoScrollPaused = false;

function startGalleryAutoScroll() {
  stopGalleryAutoScroll();

  galleryAutoScrollTimer = window.setInterval(() => {
    if (
      galleryAutoScrollPaused ||
      document.hidden ||
      galleryIsAnimating ||
      galleryMaxIndex() <= 0
    ) {
      return;
    }

    scrollGalleryStrip(1);
  }, 3000);
}

function stopGalleryAutoScroll() {
  if (galleryAutoScrollTimer) {
    window.clearInterval(galleryAutoScrollTimer);
    galleryAutoScrollTimer = null;
  }
}

function pauseGalleryAutoScroll() {
  galleryAutoScrollPaused = true;
}

function resumeGalleryAutoScroll() {
  galleryAutoScrollPaused = false;
}

galleryGrid?.addEventListener('mouseenter', pauseGalleryAutoScroll);
galleryGrid?.addEventListener('mouseleave', resumeGalleryAutoScroll);
galleryGrid?.addEventListener('focusin', pauseGalleryAutoScroll);
galleryGrid?.addEventListener('focusout', resumeGalleryAutoScroll);

galleryStripPrev?.addEventListener('mouseenter', pauseGalleryAutoScroll);
galleryStripPrev?.addEventListener('mouseleave', resumeGalleryAutoScroll);
galleryStripNext?.addEventListener('mouseenter', pauseGalleryAutoScroll);
galleryStripNext?.addEventListener('mouseleave', resumeGalleryAutoScroll);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    resumeGalleryAutoScroll();
  }
});

startGalleryAutoScroll();

galleryGrid?.addEventListener('scroll', () => {
  window.clearTimeout(
    galleryGrid._manualScrollTimer
  );

  if (!galleryIsAnimating) {
    galleryGrid._manualScrollTimer =
      window.setTimeout(
        normalizeGalleryAfterManualScroll,
        140
      );
  }
});

window.addEventListener('resize', () => {
  if (!galleryGrid) return;

  galleryScrollQueue.length = 0;
  galleryIsAnimating = false;

  if (galleryGrid._scrollAnimationFrame) {
    cancelAnimationFrame(
      galleryGrid._scrollAnimationFrame
    );
    galleryGrid._scrollAnimationFrame = null;
  }

  galleryGrid.classList.remove('is-animating');

  const step = galleryCardStep();

  galleryLogicalIndex =
    normalizeGalleryIndex(
      galleryLogicalIndex
    );

  galleryGrid.scrollLeft =
    (galleryLogicalIndex + galleryCloneSize) *
    step;

  updateGalleryStripArrows();
});

const galleryModal = document.getElementById('galleryModal');
const galleryModalDate = document.getElementById('galleryModalDate');
const galleryModalTitle = document.getElementById('galleryModalTitle');
const galleryModalDescription = document.getElementById('galleryModalDescription');
const galleryModalCount = document.getElementById('galleryModalCount');
const galleryModalGrid = document.getElementById('galleryModalGrid');

const photoLightbox = document.getElementById('photoLightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCount = document.getElementById('lightboxCount');
const photoPrevious = document.getElementById('photoPrevious');
const photoNext = document.getElementById('photoNext');

let galleryAlbums = [];
let activeGalleryPhotos = [];
let activeGalleryPhotoIndex = 0;
let lastGallerySnapshot = null;

function galleryDate(dateString) {
  if (!dateString) return 'IEM UMPSA';
  return new Date(`${dateString}T12:00:00`).toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function createGalleryAlbumCard(album) {
  const article = document.createElement('article');
  article.className = 'gallery-album';
  article.tabIndex = 0;
  article.dataset.galleryAlbum = album.id;
  article.setAttribute('role', 'button');
  article.setAttribute('aria-label', `Open ${album.title} gallery album`);

  const photos = Array.isArray(album.photos) ? album.photos : [];

  const collage = document.createElement('div');
  collage.className = 'gallery-album-collage';

  for (let index = 0; index < 3; index += 1) {
    const photo = document.createElement('div');
    photo.className = 'gallery-album-photo';

    if (photos[index]) {
      photo.style.backgroundImage =
        `url("${String(photos[index]).replace(/"/g, '%22')}")`;
    } else {
      photo.classList.add('placeholder');
    }

    if (index === 2 && photos.length > 3) {
      const more = document.createElement('span');
      more.className = 'gallery-photo-more';
      more.textContent = `+${photos.length - 3}`;
      photo.appendChild(more);
    }

    collage.appendChild(photo);
  }

  const body = document.createElement('div');
  body.className = 'gallery-album-body';

  const topline = document.createElement('div');
  topline.className = 'gallery-album-topline';

  const date = document.createElement('span');
  date.className = 'gallery-album-date';
  date.textContent = galleryDate(album.date);

  const count = document.createElement('span');
  count.className = 'gallery-album-count';
  count.textContent = `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`;

  topline.append(date, count);

  const title = document.createElement('h3');
  title.textContent = album.title || 'IEM UMPSA Album';

  const description = document.createElement('p');
  description.textContent =
    album.description || 'Photo highlights from IEM UMPSA Student Section.';

  const open = document.createElement('span');
  open.className = 'gallery-album-open';
  open.innerHTML = 'View album <span>→</span>';

  body.append(topline, title, description, open);
  article.append(collage, body);

  return article;
}

function renderGallery() {
  if (!galleryGrid || !window.IEMGalleryStore) return;

  const visible = IEMGalleryStore.sortAlbums(
    galleryAlbums.filter(album =>
      album.published !== false &&
      Array.isArray(album.photos) &&
      album.photos.length
    )
  );

  galleryGrid.innerHTML = '';
  galleryRealCount = visible.length;
  galleryCloneSize = 0;
  galleryLogicalIndex = 0;
  galleryScrollQueue.length = 0;
  galleryIsAnimating = false;

  if (!visible.length) {
    galleryGrid.innerHTML = `
      <div class="gallery-empty glass light-glass">
        <span class="gallery-empty-icon">▧</span>
        <strong>No gallery albums published yet.</strong>
        <p>Albums created from the Admin Portal will appear here automatically.</p>
      </div>
    `;
    requestAnimationFrame(updateGalleryStripArrows);
    return;
  }

  // Clone a small buffer of cards onto each end so the strip can keep
  // sliding in one direction indefinitely. The clone is visually
  // identical to the real card, so once an animation lands on one,
  // we silently re-point scrollLeft at the matching real card and the
  // motion never appears to reverse (see scrollGalleryStrip).
  const cloneSize = Math.min(3, visible.length);
  galleryCloneSize = cloneSize;

  visible.slice(-cloneSize).forEach(album => {
    const clone = createGalleryAlbumCard(album);
    clone.classList.add('gallery-album-clone');
    clone.setAttribute('aria-hidden', 'true');
    clone.tabIndex = -1;
    galleryGrid.appendChild(clone);
  });

  visible.forEach(album => {
    galleryGrid.appendChild(createGalleryAlbumCard(album));
  });

  visible.slice(0, cloneSize).forEach(album => {
    const clone = createGalleryAlbumCard(album);
    clone.classList.add('gallery-album-clone');
    clone.setAttribute('aria-hidden', 'true');
    clone.tabIndex = -1;
    galleryGrid.appendChild(clone);
  });

  // Position the strip so it opens on the first real card, with the
  // leading clone buffer sitting invisibly scrolled off to the left.
  const step = galleryCardStep();
  galleryLogicalIndex = 0;
  galleryGrid.scrollLeft = cloneSize * step;

  requestAnimationFrame(updateGalleryStripArrows);
}

function openGalleryAlbum(album) {
  if (!galleryModal || !album) return;

  activeGalleryPhotos = Array.isArray(album.photos) ? [...album.photos] : [];

  galleryModalDate.textContent = galleryDate(album.date);
  galleryModalTitle.textContent = album.title || 'Gallery Album';
  galleryModalDescription.textContent = album.description || '';
  galleryModalCount.textContent =
    `${activeGalleryPhotos.length} ${activeGalleryPhotos.length === 1 ? 'photo' : 'photos'} · scroll sideways`;

  galleryModalGrid.innerHTML = '';

  activeGalleryPhotos.forEach((source, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gallery-modal-photo';
    button.dataset.galleryPhotoIndex = String(index);

    const image = document.createElement('img');
    image.src = source;
    image.alt = `${album.title || 'Gallery'} photo ${index + 1}`;
    image.loading = 'lazy';

    button.appendChild(image);
    galleryModalGrid.appendChild(button);
  });

  galleryModal.classList.add('open');
  galleryModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeGalleryAlbum() {
  if (!galleryModal) return;
  galleryModal.classList.remove('open');
  galleryModal.setAttribute('aria-hidden', 'true');

  if (!photoLightbox?.classList.contains('open')) {
    document.body.classList.remove('modal-open');
  }
}

function showLightboxPhoto(index) {
  if (!activeGalleryPhotos.length || !photoLightbox) return;

  activeGalleryPhotoIndex =
    (index + activeGalleryPhotos.length) % activeGalleryPhotos.length;

  lightboxImage.src = activeGalleryPhotos[activeGalleryPhotoIndex];
  lightboxCount.textContent =
    `${activeGalleryPhotoIndex + 1} / ${activeGalleryPhotos.length}`;

  photoPrevious.style.display =
    activeGalleryPhotos.length > 1 ? 'grid' : 'none';
  photoNext.style.display =
    activeGalleryPhotos.length > 1 ? 'grid' : 'none';

  photoLightbox.classList.add('open');
  photoLightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeLightbox() {
  if (!photoLightbox) return;
  photoLightbox.classList.remove('open');
  photoLightbox.setAttribute('aria-hidden', 'true');

  if (!galleryModal?.classList.contains('open')) {
    document.body.classList.remove('modal-open');
  }
}

galleryGrid?.addEventListener('click', event => {
  const card = event.target.closest('[data-gallery-album]');
  if (!card) return;

  const album = galleryAlbums.find(item => item.id === card.dataset.galleryAlbum);
  if (album) openGalleryAlbum(album);
});

galleryGrid?.addEventListener('keydown', event => {
  if (!['Enter', ' '].includes(event.key)) return;
  const card = event.target.closest('[data-gallery-album]');
  if (!card) return;
  event.preventDefault();

  const album = galleryAlbums.find(item => item.id === card.dataset.galleryAlbum);
  if (album) openGalleryAlbum(album);
});

document.querySelectorAll('[data-gallery-close]').forEach(button => {
  button.addEventListener('click', closeGalleryAlbum);
});

galleryModalGrid?.addEventListener('click', event => {
  const button = event.target.closest('[data-gallery-photo-index]');
  if (!button) return;
  showLightboxPhoto(Number(button.dataset.galleryPhotoIndex));
});

document.querySelector('[data-lightbox-close]')?.addEventListener(
  'click',
  closeLightbox
);

photoLightbox?.addEventListener('click', event => {
  if (event.target === photoLightbox) closeLightbox();
});

photoPrevious?.addEventListener('click', () => {
  showLightboxPhoto(activeGalleryPhotoIndex - 1);
});

photoNext?.addEventListener('click', () => {
  showLightboxPhoto(activeGalleryPhotoIndex + 1);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (photoLightbox?.classList.contains('open')) {
      closeLightbox();
    } else if (galleryModal?.classList.contains('open')) {
      closeGalleryAlbum();
    }
  }

  if (photoLightbox?.classList.contains('open')) {
    if (event.key === 'ArrowLeft') showLightboxPhoto(activeGalleryPhotoIndex - 1);
    if (event.key === 'ArrowRight') showLightboxPhoto(activeGalleryPhotoIndex + 1);
  }
});

function applyIncomingGalleryData(albums) {
  if (!Array.isArray(albums)) return;

  galleryAlbums = IEMGalleryStore.sortAlbums(
    albums.map(album => ({
      ...album,
      photos: Array.isArray(album.photos) ? [...album.photos] : []
    }))
  );

  renderGallery();
}

async function initGallery() {
  if (!galleryGrid || !window.IEMGalleryStore) return;

  try {
    galleryAlbums = IEMGalleryStore.sortAlbums(
      await IEMGalleryStore.getAllAlbums()
    );
    renderGallery();

    try {
      lastGallerySnapshot =
        localStorage.getItem(IEMGalleryStore.storageKey);
    } catch (error) {
      // Storage polling can safely no-op.
    }
  } catch (error) {
    console.error('Could not load gallery:', error);
  }
}

function syncGalleryFromStorage() {
  if (!window.IEMGalleryStore) return;

  try {
    const raw = localStorage.getItem(IEMGalleryStore.storageKey);
    if (!raw || raw === lastGallerySnapshot) return;

    lastGallerySnapshot = raw;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    applyIncomingGalleryData(parsed);
  } catch (error) {
    // The next successful poll will recover automatically.
  }
}

window.addEventListener('storage', event => {
  if (
    window.IEMGalleryStore &&
    event.key === IEMGalleryStore.storageKey &&
    event.newValue
  ) {
    try {
      lastGallerySnapshot = event.newValue;
      applyIncomingGalleryData(JSON.parse(event.newValue));
    } catch (error) {
      console.error('Could not apply gallery update:', error);
    }
  }
});

try {
  const galleryChannel = new BroadcastChannel('iem-umpsa-gallery');

  galleryChannel.addEventListener('message', event => {
    if (
      event.data?.type === 'IEM_GALLERY_UPDATE' &&
      Array.isArray(event.data.albums)
    ) {
      applyIncomingGalleryData(event.data.albums);
    }
  });
} catch (error) {
  // Polling remains as fallback.
}

window.addEventListener('focus', syncGalleryFromStorage);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) syncGalleryFromStorage();
});

setInterval(syncGalleryFromStorage, 2000);

initGallery();
