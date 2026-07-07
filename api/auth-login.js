// api/auth-login.js
// Verifica la clave de acceso compartida (control de acceso simple, Fase 1
// del plan de escalabilidad) y, si es correcta, pone la cookie de sesion
// que middleware.js revisa en cada peticion al resto de la plataforma.
//
// No hay base de datos ni usuarios individuales: es un candado compartido
// para la fase de pruebas. El token de sesion es SHA-256(password:secreto)
// -- estable y sin estado, para que middleware.js (Edge Runtime) lo pueda
// recalcular y comparar sin necesitar almacenamiento externo.
//
// Variables de entorno requeridas en Vercel:
//   GU_ACCESS_PASSWORD  -- la clave de acceso
//   GU_SESSION_SECRET   -- cadena aleatoria (pepper) para firmar el token
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const passwordCorrecta = process.env.GU_ACCESS_PASSWORD;
  const secreto = process.env.GU_SESSION_SECRET;

  if (!passwordCorrecta || !secreto) {
    return res.status(500).json({
      error: 'Login no configurado en el servidor (faltan GU_ACCESS_PASSWORD / GU_SESSION_SECRET en Vercel)'
    });
  }

  const { password } = req.body || {};
  if (!password || password !== passwordCorrecta) {
    return res.status(401).json({ error: 'Clave incorrecta' });
  }

  const { createHash } = await import('crypto');
  const token = createHash('sha256').update(password + ':' + secreto).digest('hex');

  const maxAge = 60 * 60 * 24 * 30; // 30 dias
  res.setHeader('Set-Cookie', `gu_auth=${token}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`);
  return res.status(200).json({ ok: true });
}
