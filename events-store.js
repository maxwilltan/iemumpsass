(function () {
  function fromRow(row) {
    return {
      id: row.id,
      title: row.title,
      type: row.type || '',
      date: row.date,
      time: row.time || '',
      location: row.location || '',
      badge: row.badge || '',
      description: row.description || '',
      link: row.link || '',
      poster: row.poster || '',
      published: row.published !== false,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  function toRow(event) {
    return {
      id: event.id,
      title: event.title,
      type: event.type || '',
      date: event.date,
      time: event.time || '',
      location: event.location || '',
      badge: event.badge || '',
      description: event.description || '',
      link: event.link || '',
      poster: event.poster || '',
      published: event.published !== false,
      created_at: event.createdAt || new Date().toISOString(),
      updated_at: event.updatedAt || new Date().toISOString()
    };
  }

  async function ensureSeedData() {}

  async function getAllEvents() {
    const { data, error } = await IEMSupabase.from('events').select('*').order('date', { ascending: true });
    if (error) throw error;
    return (data || []).map(fromRow);
  }

  async function getEvent(id) {
    const { data, error } = await IEMSupabase.from('events').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? fromRow(data) : null;
  }

  async function saveEvent(event) {
    const record = { ...event };
    if (record.poster?.startsWith('data:')) {
      record.poster = await IEMCloud.uploadDataUrl(record.poster, 'events', record.id || 'event');
    }
    record.updatedAt = new Date().toISOString();
    if (!record.createdAt) record.createdAt = record.updatedAt;

    const { data, error } = await IEMSupabase.from('events').upsert(toRow(record)).select().single();
    if (error) throw error;
    return fromRow(data);
  }

  async function deleteEvent(id) {
    const { error } = await IEMSupabase.from('events').delete().eq('id', id);
    if (error) throw error;
  }

  function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function eventBucket(event, today = localDateString()) {
    return event.date < today ? 'past' : 'upcoming';
  }

  function sortEvents(events, bucket) {
    return [...events].sort((a, b) => bucket === 'past' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  }

  function makeId() {
    return crypto.randomUUID ? `event-${crypto.randomUUID()}` : `event-${Date.now()}`;
  }

  window.IEMEventStore = { ensureSeedData, getAllEvents, getEvent, saveEvent, deleteEvent, eventBucket, sortEvents, localDateString, makeId };
})();
