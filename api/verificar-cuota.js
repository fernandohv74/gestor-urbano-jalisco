// api/verificar-cuota.js
// Verifica y reserva 1 unidad de cuota de "analisis con IA" para el usuario dado.
// Se llama UNA sola vez al inicio de un analisis (antes de llamar a claude-proxy),
// sin importar cuantas sub-llamadas internas (lotes) haga despues ese modulo.
const LIMITES_ANALISIS = { basico: 4, estandar: 8, profesional: 20, empresarial: 100 };
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
      return res.status(400).json({ error: 'Debes iniciar sesion para usar el analisis con IA' });
    }

    const headers = {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    };

    const getResp = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=plan,analisis_usados`,
      { headers }
    );
    if (!getResp.ok) {
      const detalle = await getResp.text();
      console.error('[verificar-cuota] Error leyendo perfil:', getResp.status, detalle);
      return res.status(500).json({ error: 'No se pudo leer tu perfil' });
    }
    const filas = await getResp.json();
    const perfil = filas[0];
    const limite = perfil && LIMITES_ANALISIS[perfil.plan];
    if (!perfil || !limite) {
      return res.status(403).json({
        error: 'Necesitas un plan activo para usar el analisis con IA.',
        sinPlan: true
      });
    }

    const usados = perfil.analisis_usados || 0;
    if (usados >= limite) {
      return res.status(403).json({
        error: `Ya usaste tus ${limite} analisis con IA de este mes (plan ${perfil.plan}). Se reinician con tu proxima renovacion.`,
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
        body: JSON.stringify({ analisis_usados: usados + 1 })
      }
    );
    if (!patchResp.ok) {
      const detalle = await patchResp.text();
      console.error('[verificar-cuota] Error actualizando perfil:', patchResp.status, detalle);
      return res.status(500).json({ error: 'No se pudo reservar tu cuota de analisis' });
    }

    return res.status(200).json({ permitido: true, usados: usados + 1, limite });
  } catch (error) {
    console.error('[verificar-cuota] Error interno:', error);
    return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
}
