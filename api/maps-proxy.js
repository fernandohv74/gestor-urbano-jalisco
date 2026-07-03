// api/maps-proxy.js
// Proxy serverless para Google Maps Geocoding API
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key no configurada' });
  }
  const { address, latlng } = req.query;
  if (!address && !latlng) {
    return res.status(400).json({ error: 'Se requiere address o latlng' });
  }
  try {
    const param = address
      ? `address=${encodeURIComponent(address)}`
      : `latlng=${latlng}`;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?${param}&key=${apiKey}&language=es&region=MX`;
    const response = await fetch(url);
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
