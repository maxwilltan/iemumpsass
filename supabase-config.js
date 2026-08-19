(() => {
  const SUPABASE_URL = 'https://yqxwiitsdxmypemwgows.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_K8L3IhB63xeahlLRr7Wyhw_o4rkxA8j';

  if (!window.supabase?.createClient) {
    throw new Error('Supabase client library did not load.');
  }

  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  function dataUrlToBlob(dataUrl) {
    const [header, body] = dataUrl.split(',');
    const mime = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
    const bytes = atob(body);
    const array = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) array[i] = bytes.charCodeAt(i);
    return new Blob([array], { type: mime });
  }

  function extensionForMime(mime) {
    if (mime.includes('png')) return 'png';
    if (mime.includes('webp')) return 'webp';
    return 'jpg';
  }

  async function uploadDataUrl(dataUrl, folder = 'uploads', prefix = 'image') {
    if (!dataUrl?.startsWith('data:')) return dataUrl || '';

    const blob = dataUrlToBlob(dataUrl);
    const ext = extensionForMime(blob.type);
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const path = `${folder}/${prefix}-${id}.${ext}`;

    const { error } = await client.storage
      .from('iem-media')
      .upload(path, blob, {
        contentType: blob.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data } = client.storage.from('iem-media').getPublicUrl(path);
    return data.publicUrl;
  }

  window.IEMSupabase = client;
  window.IEMCloud = {
    enabled: true,
    uploadDataUrl,
    projectUrl: SUPABASE_URL
  };
})();
