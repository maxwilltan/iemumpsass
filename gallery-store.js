(function () {
  const STORAGE_KEY = 'iemUmpsaGalleryDataV1';

  function cloneAlbums(albums) {
    return albums.map(album => ({
      ...album,
      photos: Array.isArray(album.photos) ? [...album.photos] : []
    }));
  }

  function readAlbums() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeAlbums(albums) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(albums));
    } catch (error) {
      const storageError = new Error(
        'Browser storage is full. Try using fewer/smaller photos in this prototype. The final Supabase version will not have this small browser limit.'
      );
      storageError.cause = error;
      throw storageError;
    }
  }

  async function getAllAlbums() {
    return cloneAlbums(readAlbums());
  }

  async function saveAlbum(album) {
    const albums = readAlbums();
    const index = albums.findIndex(item => item.id === album.id);

    if (index >= 0) {
      albums[index] = { ...album, photos: [...(album.photos || [])] };
    } else {
      albums.push({ ...album, photos: [...(album.photos || [])] });
    }

    writeAlbums(albums);
    return { ...album, photos: [...(album.photos || [])] };
  }

  async function deleteAlbum(id) {
    const albums = readAlbums().filter(album => album.id !== id);
    writeAlbums(albums);
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

  window.IEMGalleryStore = {
    storageKey: STORAGE_KEY,
    getAllAlbums,
    saveAlbum,
    deleteAlbum,
    makeId,
    sortAlbums
  };
})();
