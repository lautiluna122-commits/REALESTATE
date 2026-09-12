const SUPABASE_FUNCTION_URL = 'https://tldhihhyiphqarijpgcm.supabase.co/functions/v1/realestate-api';

export default async function handler(req, res) {
  const incoming = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const apiPath = incoming.pathname.replace(/^\/api/, '');
  const target = `${SUPABASE_FUNCTION_URL}${apiPath}${incoming.search}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (key.toLowerCase() === 'host' || value == null) continue;
    headers.set(key, Array.isArray(value) ? value.join(',') : value);
  }
  try {
    const response = await fetch(target, {
      method: req.method,
      headers,
      body: ['GET','HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });
    const text = await response.text();
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.send(text);
  } catch (error) {
    res.status(502).json({ message: 'API upstream unavailable', detail: error.message });
  }
}
