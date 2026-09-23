// api/verificar-consulta.js
// Verifica y reserva 1 unidad de cuota de "consulta normal" para el usuario dado.
// Mismo patron que api/verificar-cuota.js (analisis IA), pero contra
// profiles.consultas_usadas. Se llama UNA sola vez por consulta real
// (busqueda de predio, calculo, etc.) -- nunca en acciones gratis derivadas
// de una consulta ya hecha (cambiar de giro, refrendo, modo Express, etc.).
const LIMITES_CONSULTAS = { basico: 8, estandar: 30, profesional: 80, empresarial: Infinity };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !secretKey) {
      return res.status(500).json({ error: 'Supabase no configurado en el servidor' });
    }
    const body = req.body || {};
    const userId = body.userId;
    if (!userId || !UUID_RE.test(userId)) {
      return res.status(400).json({ error: 'Debes iniciar sesion para usar este modulo' });
    }

    const headers = {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    };

    const getResp = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=plan,consultas_usadas`,
      { headers }
    );
    if (!getResp.ok) {
      const detalle = await getResp.text();
      console.error('[verificar-consulta] Error leyendo perfil:', getResp.status, detalle);
      return res.status(500).json({ error: 'No se pudo leer tu perfil' });
    }
    const filas = await getResp.json();
    const perfil = filas[0];
    const limite = perfil && LIMITES_CONSULTAS[perfil.plan];
    if (!perfil || !limite) {
      return res.status(403).json({
        error: 'Necesitas un plan activo para usar este modulo.',
        sinPlan: true
      });
    }

    const usados = perfil.consultas_usadas || 0;
    if (usados >= limite) {
      return res.status(403).json({
        error: `Ya usaste tus ${limite} consultas de este mes (plan ${perfil.plan}). Se reinician con tu proxima renovacion.`,
        limiteAlcanzado: true,
        usados,
        limite
      });
    }

    const patchResp = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
      {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ consultas_usadas: usados + 1 })
      }
    );
    if (!patchResp.ok) {
      const detalle = await patchResp.text();
      console.error('[verificar-consulta] Error actualizando perfil:', patchResp.status, detalle);
      return res.status(500).json({ error: 'No se pudo reservar tu cuota de consulta' });
    }

    return res.status(200).json({
      permitido: true,
      usados: usados + 1,
      limite: Number.isFinite(limite) ? limite : 'ilimitado'
    });
  } catch (error) {
    console.error('[verificar-consulta] Error interno:', error);
    return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
}
