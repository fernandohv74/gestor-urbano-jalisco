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
// (consultarArcGISZapopan) -- no requiere cambios en esos archivos.
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
    for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
      const xi = anillo[i][0], yi = anillo[i][1];
      const xj = anillo[j][0], yj = anillo[j][1];
      const interseca = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (interseca) dentro = !dentro;
    }
    return dentro;
  }

  // Soporta Polygon (con huecos) y MultiPolygon
  function puntoEnGeometria(x, y, geometry) {
    if (!geometry) return false;
    if (geometry.type === 'Polygon') {
      if (!puntoEnAnillo(x, y, geometry.coordinates[0])) return false;
      for (let k = 1; k < geometry.coordinates.length; k++) {
        if (puntoEnAnillo(x, y, geometry.coordinates[k])) return false; // hueco
      }
      return true;
    }
    if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates.some(poly =>
        puntoEnGeometria(x, y, { type: 'Polygon', coordinates: poly })
      );
    }
    return false;
  }

  const delta = 0.0015; // ~150-170m -- suficiente para capturar el poligono del punto
  const bbox = `${lngNum - delta},${latNum - delta},${lngNum + delta},${latNum + delta}`;
  const url = `https://mapa.zapopan.gob.mx:8000/geoserver/geomatica/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geomatica:zpn_e3_utilizacion_suelo&outputFormat=application/json&BBOX=${bbox}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (!response.ok) {
      console.log('[arcgis-zapopan-proxy] WFS respondio status:', response.status);
      return res.status(200).json({ results: [] });
    }
    const data = await response.json();
    const features = data.features || [];
    const match = features.find(f => puntoEnGeometria(lngNum, latNum, f.geometry));

    // Log temporal de diagnostico -- revisar en Vercel > Logs.
    console.log('[arcgis-zapopan-proxy] WFS features en bbox:', features.length,
      'match cve_util:', match ? match.properties?.cve_util : null);

    if (!match) {
      return res.status(200).json({ results: [] });
    }

    return res.status(200).json({
      results: [{
        layerName: 'Utilizacion de Suelo',
        attributes: {
          CLAVE: match.properties?.cve_util || null,
          DISTRITO: match.properties?.distrito || null,
          USO: match.properties?.util_suelo || null,
        }
      }]
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar WFS Zapopan: ' + error.message });
  }
}
