// api/create-checkout-session.js
// Crea una sesion de Stripe Checkout para uno de los 4 planes de TrazaUrbana.
// La clave secreta vive en variables de entorno de Vercel, nunca en el frontend.
const PRICE_IDS = {
  basico: 'price_1UIINQ5PXi9prylM0QF9Xcw4',
  estandar: 'price_1UIIP45PXi9prylMOGXRZegH',
  profesional: 'price_1UIIQ55PXi9prylMSwIDorZH',
  empresarial: 'price_1UIIS25PXi9prylMfHSW5dTE'
};

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
    if (!secretKey) {
      return res.status(500).json({ error: 'Clave secreta de Stripe no configurada en el servidor' });
    }
    const body = req.body || {};
    const plan = body.plan;
    const userId = body.userId;
    const email = body.email;
    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return res.status(400).json({
        error: 'Plan invalido',
        debug: { planRecibido: plan, planesValidos: Object.keys(PRICE_IDS) }
      });
    }
    if (!userId) {
      return res.status(400).json({ error: 'Debes iniciar sesion antes de suscribirte' });
    }
    const origin = req.headers.origin || `https://${req.headers.host}`;

    // API de Stripe usa form-encoding, no JSON
    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', `${origin}/planes.html?success=true`);
    params.append('cancel_url', `${origin}/planes.html?canceled=true`);
    params.append('client_reference_id', userId);
    if (email) params.append('customer_email', email);
    params.append('metadata[plan]', plan);
    params.append('subscription_data[metadata][plan]', plan);

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('[create-checkout-session] Error Stripe:', data);
      return res.status(response.status).json({
        error: data.error?.message || 'Error al crear la sesion de pago'
      });
    }
    return res.status(200).json({ url: data.url });
  } catch (error) {
    console.error('[create-checkout-session] Error interno:', error);
    return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
}
