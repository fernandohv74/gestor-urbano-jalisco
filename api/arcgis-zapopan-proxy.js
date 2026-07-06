// api/arcgis-zapopan-proxy.js
// Proxy serverless para el servicio ArcGIS de Zapopan (PPDU/PPDU_estrategias).
// El servicio es publico (no requiere API key) — este proxy existe unicamente
// para evitar el bloqueo por CORS al llamar directo desde el navegador, ya
// que mapa.zapopan.gob.mx no manda headers Access-Control-Allow-Origin para
// dominios externos como gestorurbanoamg.vercel.app.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Se requieren los parametros lat y lng' });
  }
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return res.status(400).json({ error: 'lat y lng deben ser numeros validos' });
  }
  try {
    const params = new URLSearchParams({
      geometry: JSON.stringify({ x: lngNum, y: latNum }),
      geometryType: 'esriGeometryPoint',
      layers: 'all',
      tolerance: '2',
      mapExtent: `${lngNum - 0.001},${latNum - 0.001},${lngNum + 0.001},${latNum + 0.001}`,
      imageDisplay: '800,600,96',
      returnGeometry: 'false',
      f: 'json'
    });
    const url = `https://mapa.zapopan.gob.mx/arcgis/rest/services/PPDU/PPDU_estrategias/MapServer/identify?${params}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await response.json();
    // Log temporal de diagnostico — revisar en Vercel > Logs si la clave que
    // regresa este servicio coincide con lo que muestra mapa_urbano (puede
    // ser un servicio/capa distinto al que usa el mapa oficial interactivo).
    console.log('[arcgis-zapopan-proxy] status:', response.status, 'results:', JSON.stringify((data.results || []).map(r => ({ layerName: r.layerName, attrs: r.attributes }))));
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar ArcGIS Zapopan: ' + error.message });
  }
}
