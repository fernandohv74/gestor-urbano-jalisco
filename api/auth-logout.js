// api/auth-logout.js
// Borra la cookie de sesion del candado de acceso simple.
export default async function handler(req, res) {
  res.setHeader('Set-Cookie', 'gu_auth=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax');
  return res.status(200).json({ ok: true });
}
