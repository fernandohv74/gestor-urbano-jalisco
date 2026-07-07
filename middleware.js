// middleware.js
// Control de acceso simple (clave unica compartida) para Gestor Urbano
// Jalisco AMG mientras la plataforma esta en fase de pruebas.
//
// Protege TODA la plataforma (los 23 modulos, index.html, dashboard.html,
// etc.) excepto login.html y los endpoints de autenticacion (api/auth-*).
// No usa base de datos ni sesiones con estado: el token de sesion es
// SHA-256(password:secreto), recalculado y comparado en cada peticion
// usando Web Crypto (disponible en el Edge Runtime de Vercel).
//
// IMPORTANTE -- diseño "fail-open": si las variables de entorno
// GU_ACCESS_PASSWORD o GU_SESSION_SECRET no estan configuradas en Vercel,
// el middleware deja pasar todo sin bloquear nada (para no dejar a
// Fernando fuera de su propia app por un despliegue incompleto). El
// candado solo se activa de verdad una vez configuradas ambas variables
// en Vercel > Settings > Environment Variables.
export const config = {
  matcher: ['/((?!api/|login\\.html|favicon\\.ico).*)'],
};

function leerCookie(req, nombre) {
  const header = req.headers.get('cookie') || '';
  const match = header.match(new RegExp('(?:^|;\\s*)' + nombre + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

async function tokenEsperado(password, secreto) {
  const enc = new TextEncoder().encode(password + ':' + secreto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export default async function middleware(req) {
  const passwordCorrecta = process.env.GU_ACCESS_PASSWORD;
  const secreto = process.env.GU_SESSION_SECRET;

  // Fail-open: candado no configurado todavia -> no bloquear a nadie.
  if (!passwordCorrecta || !secreto) {
    return;
  }

  const cookieVal = leerCookie(req, 'gu_auth');
  const esperado = await tokenEsperado(passwordCorrecta, secreto);

  if (cookieVal && cookieVal === esperado) {
    return; // sesion valida, dejar pasar
  }

  const url = new URL(req.url);
  const loginUrl = new URL('/login.html', req.url);
  loginUrl.searchParams.set('redirect', url.pathname + url.search);
  return Response.redirect(loginUrl.toString(), 307);
}
