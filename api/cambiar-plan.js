// api/cambiar-plan.js
// Cambia el plan de una suscripcion de Stripe YA ACTIVA (upgrade/downgrade),
// en vez de crear una segunda suscripcion en paralelo.
// Politica de cobro (decision explicita de Fernando, no negociable sin
// confirmar de nuevo): en un upgrade se cobra la diferencia de inmediato;
// en un downgrade NO se da ningun credito ni devolucion -- el precio nuevo
// (mas barato) aplica hasta el siguiente cobro normal, sin ajuste. El
// frontend debe avisar esto explicitamente antes de confirmar un downgrade.
const PRICE_IDS = {
  basico: 'price_1UIINQ5PXi9prylM0QF9Xcw4',
  estandar: 'price_1UIIP45PXi9prylMOGXRZegH',
  profesional: 'price_1UIIQ55PXi9prylMSwIDorZH',
  empresarial: 'price_1UIIS25PXi9prylMfHSW5dTE'
};
const ORDEN_PLANES = { basico: 1, estandar: 2, profesional: 3, empresarial: 4 };
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
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
    if (!secretKey || !supabaseUrl || !supabaseSecret) {
      return res.status(500).json({ error: 'Servidor no configurado' });
    }

    const body = req.body || {};
    const userId = body.userId;
    const nuevoPlan = body.plan;
    const nuevoPriceId = PRICE_IDS[nuevoPlan];
    if (!userId || !UUID_RE.test(userId)) {
      return res.status(400).json({ error: 'Debes iniciar sesion' });
    }
    if (!nuevoPriceId) {
      return res.status(400).json({ error: 'Plan invalido' });
    }

    const supaHeaders = {
      apikey: supabaseSecret,
      Authorization: `Bearer ${supabaseSecret}`,
      'Content-Type': 'application/json'
    };

    // 1) Leer la suscripcion activa del usuario
    const perfilResp = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=plan,stripe_subscription_id`,
      { headers: supaHeaders }
    );
    if (!perfilResp.ok) {
      return res.status(500).json({ error: 'No se pudo leer tu perfil' });
    }
    const filas = await perfilResp.json();
    const perfil = filas[0];
    const subscriptionId = perfil && perfil.stripe_subscription_id;
    if (!subscriptionId) {
      return res.status(400).json({
        error: 'No tienes una suscripcion activa para cambiar. Usa el boton normal de suscribirte.',
        sinSuscripcion: true
      });
    }
    if (perfil.plan === nuevoPlan) {
      return res.status(400).json({ error: 'Ya tienes ese plan activo.' });
    }

    const stripeHeaders = {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    // 2) Obtener el subscription_item actual (Stripe lo requiere para saber que reemplazar)
    const subResp = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      headers: { Authorization: `Bearer ${secretKey}` }
    });
    const sub = await subResp.json();
    if (!subResp.ok) {
      console.error('[cambiar-plan] Error leyendo suscripcion:', sub);
      return res.status(subResp.status).json({ error: sub.error?.message || 'No se pudo leer tu suscripcion en Stripe' });
    }
    const itemId = sub.items && sub.items.data && sub.items.data[0] && sub.items.data[0].id;
    if (!itemId) {
      return res.status(500).json({ error: 'Tu suscripcion en Stripe no tiene un item valido' });
    }

    // 3) Cambiar el price de ese item.
    // Upgrade (plan nuevo mas caro): 'always_invoice' -- genera y cobra de
    // inmediato la factura de la diferencia, no la deja pendiente.
    // Downgrade (plan nuevo mas barato): 'none' -- sin prorrateo alguno, no
    // se genera ningun credito por lo que sobra del plan actual. El precio
    // nuevo (mas bajo) empieza a aplicar hasta el siguiente cobro normal.
    const esDowngrade = ORDEN_PLANES[nuevoPlan] < ORDEN_PLANES[perfil.plan];
    const params = new URLSearchParams();
    params.append('items[0][id]', itemId);
    params.append('items[0][price]', nuevoPriceId);
    params.append('proration_behavior', esDowngrade ? 'none' : 'always_invoice');
    params.append('metadata[plan]', nuevoPlan);

    const updResp = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'POST',
      headers: stripeHeaders,
      body: params.toString()
    });
    const updData = await updResp.json();
    if (!updResp.ok) {
      console.error('[cambiar-plan] Error actualizando suscripcion:', updData);
      return res.status(updResp.status).json({ error: updData.error?.message || 'No se pudo cambiar tu plan en Stripe' });
    }

    // 4) Reflejar el cambio de inmediato en Supabase (el webhook customer.subscription.updated
    // tambien lo hara, pero no hay que esperarlo para que el usuario vea el cambio).
    const patchResp = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { ...supaHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({ plan: nuevoPlan })
    });
    if (!patchResp.ok) {
      const detalle = await patchResp.text();
      console.error('[cambiar-plan] Stripe se actualizo pero Supabase fallo:', detalle);
      // No es fatal para el usuario -- el webhook lo corrige en breve -- pero se registra.
    }

    return res.status(200).json({ ok: true, plan: nuevoPlan });
  } catch (error) {
    console.error('[cambiar-plan] Error interno:', error);
    return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
}
