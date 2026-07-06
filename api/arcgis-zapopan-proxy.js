// api/arcgis-zapopan-proxy.js
// Proxy serverless para la capa oficial de Utilizacion de Suelo de Zapopan.
//
// CORRECCION (2026-07-06): se descubrio, inspeccionando el trafico de red del
// mapa oficial (mapa.zapopan.gob.mx/mapa_urbano/), que el servicio real NO es
// ArcGIS REST (PPDU/PPDU_estrategias) como se asumio originalmente, sino un
// servicio GeoServer WFS:
//   https://mapa.zapopan.gob.mx:8000/geoserver/geomatica/ows
//   typeName = geomatica:zpn_e3_utilizacion_suelo
// Atributo de clave de zonificacion: cve_util (ej. "MR-APD"). CRS: EPSG:4326
// (mismo lat/lng que usa la app, sin reproyectar). El mapa oficial descarga
// la capa completa (~6000 poligonos) una sola vez y hace el point-in-polygon
// en el navegador (Leaflet); aqui hacemos lo mismo pero acotando con un BBOX
// pequeno alrededor del punto para no traer toda la capa en cada consulta.
//
// Se conserva el nombre del archivo/funcion ("arcgis-zapopan-proxy") y el
// formato de respuesta (results[].layerName / .attributes.CLAVE) por
// compatibilidad con el codigo cliente existente en M01/M02
// (consultarArcGISZapopan) — no requiere cambios en esos archivos.
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

  // Point-in-polygon (ray casting) sobre un anillo de coordenadas [[lng,lat],...]
  function puntoEnAnillo(x, y, anillo) {
    let dentro = false;
    for (let i = 0, j = anillo.length - 1; i < anillo.length