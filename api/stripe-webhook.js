// api/stripe-webhook.js
// Recibe eventos de Stripe (pago inicial, renovacion, cancelacion) y actualiza
// el plan del usuario en la tabla profiles de Supabase.
// La firma se verifica con STRIPE_WEBHOOK_SECRET (variable de entorno en Vercel).
import crypto from 'crypto';

export const config = { api: { bodyParser: false } };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function leerCuerpoCrudo(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verificarFirma(rawBody, header, secret) {
  if (!header) throw new Error('Falta el header Stripe-Signature');
  const partes = Object.fromEntries(
    header.split(',').map((p) => p.split('=').map((s) => s.trim()))
  );
  const timestamp = partes.t;
  const firmaRecibida = partes.v1;
  if (!timestamp || !firmaRecibida) throw new Error('Header Stripe-Signature mal formado');

  const toleranciaSeg = 5 * 60;
  const ahora = Math.floor(Date.now() / 1000);
  if (Math.abs(ahora - Number(timestamp)) > toleranciaSeg) {
    throw new Error('Timestamp del webhook fuera de tolerancia');
  }

  const payload = `${timestamp}.${rawBody.toString('utf8')}`;
  const firmaEsperada = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');

  const a = Buffer.from(firmaEsperada, 'utf8');
  const b = Buffer.from(firmaRecibida, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('Firma invalida');
  }
}

async function actualizarPerfil(campo, valor, cambios) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/profiles?${campo}=eq.${encodeURIComponent(valor)}`;
  const resp = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: process.env.SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(cambios)
  });
  if (!resp.ok) {
    const detalle = await resp.text();
    throw new Error(`Supabase PATCH fallo (${resp.status}): ${detalle}`);
  }
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[stripe-webhook] Falta STRIPE_WEBHOOK_SECRET en el servidor');
    return res.status(500).json({ error: 'Webhook no configurado' });
  }

  let rawBody;
  try {
    rawBody = await leerCuerpoCrudo(req);
    verificarFirma(rawBody, req.headers['stripe-signature'], secret);
  } catch (error) {
    console.error('[stripe-webhook] Firma invalida:', error.message);
    return res.status(400).json({ error: 'Firma invalida: ' + error.message });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch (error) {
    return res.status(400).json({ error: 'JSON invalido' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const plan = session.metadata && session.metadata.plan;
        if (userId && UUID_RE.test(userId) && plan) {
          await actualizarPerfil('id', userId, {
            plan,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            consultas_usadas: 0,
            analisis_usados: 0,
            periodo_actual: hoyISO()
          });
        } else {
          console.error('[stripe-webhook] checkout.session.completed sin userId/plan validos', { userId, plan });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.billing_reason === 'subscription_cycle' && invoice.customer) {
          await actualizarPerfil('stripe_customer_id', invoice.customer, {
            consultas_usadas: 0,
            analisis_usados: 0,
            periodo_actual: hoyISO()
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const plan = sub.metadata && sub.metadata.plan;
        if (plan && sub.customer) {
          await actualizarPerfil('stripe_customer_id', sub.customer, {
            plan,
            stripe_subscription_id: sub.id
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        if (sub.customer) {
          await actualizarPerfil('stripe_customer_id', sub.customer, {
            plan: 'ninguno',
            stripe_subscription_id: null
          });
        }
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error('[stripe-webhook] Error procesando evento', event.type, error.message);
    return res.status(500).json({ error: 'Error al procesar el evento' });
  }

  return res.status(200).json({ received: true });
}
