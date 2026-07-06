// api/claude-proxy.js
// Proxy serverless para Claude API — Gestor Urbano Jalisco AMG
// La API key vive en variables de entorno de Vercel, nunca en el frontend
export default async function handler(req, res) {
  try {
    // Solo permitir POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    // Verificar que existe la API key en el servidor
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('[claude-proxy] apiKey presente:', !!apiKey, 'longitud:', apiKey ? apiKey.length : 0);
    if (!apiKey) {
      return res.status(500).json({
        error: 'API key no configurada en servidor',
        debug: {
          apiKeyPresente: false,
          vercelEnv: process.env.VERCEL_ENV || null
        }
      });
    }
    const body = req.body;
    // Validar que el body tiene los campos requeridos
    if (!body || !body.messages || !body.model) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: messages, model',
        debug: { bodyTipo: typeof body, bodyKeys: body ? Object.keys(body) : null }
      });
    }
    // Llamar a la API de Anthropic
    const modeloFinal = body.model || 'claude-sonnet-4-6';
    // Los modelos Opus (razonamiento extendido) ya no aceptan un temperature personalizado
    const esOpus = modeloFinal.includes('opus');
    // Prompt caching: el bloque normativo que manda M04 en body.system es
    // estatico por municipio — no cambia entre lotes de un mismo analisis
    // ni entre analisis del mismo municipio dentro de la ventana de cache
    // de Anthropic (5 min por defecto). Marcarlo como 'ephemeral' hace que
    // esas llamadas repetidas paguen ~10% del precio normal por esos
    // tokens de entrada en vez del 100%. No requiere header beta — el
    // parametro cache_control ya es parte estable de la API de Mensajes.
    let systemPayload;
    if (Array.isArray(body.system)) {
      // Ya viene particionado en bloques — se respeta tal cual
      systemPayload = body.system;
    } else if (typeof body.system === 'string' && body.system.length > 0) {
      systemPayload = [
        { type: 'text', text: body.system, cache_control: { type: 'ephemeral' } }
      ];
    } else {
      systemPayload = undefined;
    }
    const payloadAnthropic = {
      model:      modeloFinal,
      max_tokens: body.max_tokens || 4000,
      messages:   body.messages
    };
    if (systemPayload) {
      payloadAnthropic.system = systemPayload;
    }
    if (!esOpus) {
      payloadAnthropic.temperature = body.temperature ?? 0;
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payloadAnthropic)
    });
    const data = await response.json();
    // Log temporal para verificar el prompt caching — revisar en Vercel > Logs.
    // cache_read_input_tokens > 0 confirma que esta llamada reutilizo el
    // bloque normativo cacheado de una llamada anterior (mismo municipio,
    // dentro de la ventana de ~5 min). cache_creation_input_tokens > 0
    // confirma que esta llamada acaba de escribir el bloque al cache.
    if (data.usage) {
      console.log('[claude-proxy] usage:', JSON.stringify(data.usage));
    }
    // Manejar errores de la API de Anthropic
    if (!response.ok) {
      console.error('Error Anthropic:', data);
      return res.status(response.status).json({
        error: data.error?.message || 'Error en la API de Anthropic'
      });
    }
    // Headers CORS — permite llamadas desde el dominio de la app
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error proxy Claude:', error);
    return res.status(500).json({
      error: 'Error interno del servidor: ' + error.message,
      debug: { nombre: error.name || null }
    });
  }
}
