(function () {
  function fromRow(row) {
    return {
      id: row.id,
      title: row.title,
      date: row.date,
      description: row.description || '',
      photos: Array.isArray(row.photos) ? row.photos : [],
      published: row.published !== false,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  function toRow(album) {
    return {
      id: album.id,
      title: album.title,
      date: album.date,
      description: album.description || '',
      photos: Array.isArray(album.photos) ? album.photos : [],
      published: album.published !== false,
      created_at: album.createdAt || new Date().toISOString(),
      updated_at: album.updatedAt || new Date().toISOString()
    };
  }

  async function getAllAlbums() {
    const { data, error } = await IEMSupabase.from('gallery_albums').select('*').order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(fromRow);
  }

  async function saveAlbum(album) {
    const record = { ...album, photos: [...(album.photos || [])] };
    const uploaded = [];
    for (let index = 0; index < record.photos.length; index += 1) {
      const photo = record.photos[index];
      uploaded.push(photo?.startsWith('data:')
        ? await IEMCloud.uploadDataUrl(photo, 'gallery', `${record.id || 'album'}-${index + 1}`)
        : photo);
    }
    record.photos = uploaded;
    record.updatedAt = new Date().toISOString();
    if (!record.createdAt) record.createdAt = record.updatedAt;

    const { data, error } = await IEMSupabase.from('gallery_albums').upsert(toRow(record)).select().single();
    if (error) throw error;
    return fromRow(data);
  }

  async function deleteAlbum(id) {
    const { error } = await IEMSupabase.from('gallery_albums').delete().eq('id', id);
    if (error) throw error;
  }

  function makeId() {
    if (crypto.randomUUID) return `gallery-${crypto.randomUUID()}`;
    return `gallery-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function sortAlbums(albums) {
    return [...albums].sort((a, b) => {
      const dateCompare = String(b.date || '').localeCompare(String(a.date || ''));
      if (dateCompare !== 0) return dateCompare;
      return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });
  }

  window.IEMGalleryStore = { getAllAlbums, saveAlbum, deleteAlbum, makeId, sortAlbums, cloud: true };
})();
