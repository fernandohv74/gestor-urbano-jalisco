// Serverless proxy para Google Maps Geocoding API
// Llamadas server-side: no hay HTTP Referer → evita restricciones por dominio
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAc6-2m7WvZf-u8AK7Co74PdJqp0ceer0o';
  const { address, latlng } = req.query;
  if (!address && !latlng) {
    return res.status(400).json({ error: 'Se requiere address o latlng' });
  }
  try {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query)) {
      if (k !== 'key') params.set(k, v);
    }
    params.set('key', apiKey);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
