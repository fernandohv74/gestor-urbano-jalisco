# Bitácora v48.0 — Gestor Urbano Jalisco AMG (TrazaUrbana)

**Período:** 22-sep-2026
**Rama:** master + main (Vercel)
**Autor:** Fernando H. / Claude Sonnet 5

---

## Resumen ejecutivo

Cierre de la verificación pendiente de la v47.0 (la fila en `profiles` se creó automáticamente para la primera cuenta real, confirmando que el trigger de Supabase funciona), y construcción completa del webhook de Stripe: la pieza que faltaba para que un pago real (o de prueba) se refleje como un plan activo en la base de datos.

En el camino, Fernando notó un hueco real: con el checkout ya funcionando pero sin nada que lo verificara, cualquiera con la clave compartida de `login.html` podía entrar al menú principal y usar los 11 módulos sin haber pagado nada — el sistema de cobro no bloqueaba nada todavía. Se decidió cerrar esto en la misma sesión en vez de dejarlo pendiente: se agregó un candado real en `index.html` que exige sesión de Supabase y un plan activo antes de mostrar el menú.

La prueba end-to-end (pago de prueba con tarjeta `4242...`) reveló un bug real: la tabla `profiles`, creada con SQL directo, nunca recibió los permisos de tabla (`GRANT`) para los roles `service_role` y `authenticated` — distinto de las políticas de seguridad por fila (RLS) que sí estaban bien. Esto hacía que el webhook fallara con error 500 en silencio. Se diagnosticó revisando primero el registro de entregas de Stripe y después los logs de Vercel, se corrigió con dos líneas de SQL, y se reenvió el evento fallido sin necesidad de pagar de nuevo. Con el permiso corregido, el flujo completo quedó verificado de punta a punta: sin plan bloquea, pagas, el webhook actualiza el perfil, con plan activo entras.

---

## Commits incluidos

| Commit | Descripción |
|---|---|
| `981d719` | feat: agrega webhook de Stripe para sincronizar plan del usuario en Supabase |
| `7318a27` | feat: agrega candado de plan activo a index.html |

---

## 1. Verificación cerrada — trigger de `profiles` funciona

Se confirmó lo que quedó pendiente de la v47.0: la cuenta real de Fernando (`fernandohv74@gmail.com`) generó automáticamente su fila en `profiles` al autenticarse por primera vez, con `plan: ninguno` y contadores en 0 — el trigger `handle_new_user()` quedó probado con datos reales.

## 2. Webhook de Stripe → Supabase

Se construyó `api/stripe-webhook.js` (sin dependencias externas, mismo patrón que el resto de `api/`):
- Verifica la firma de Stripe (HMAC-SHA256) usando el módulo `crypto` nativo de Node — sin librería `stripe` de por medio.
- Escucha 4 eventos: `checkout.session.completed` (pago inicial — asigna el plan y liga el `customer`/`subscription` de Stripe al usuario), `invoice.payment_succeeded` (renovaciones — reinicia contadores de consumo), `customer.subscription.updated` (cambios de plan) y `customer.subscription.deleted` (cancelación — regresa el plan a "ninguno").
- Escribe en `profiles` vía la API REST de Supabase, usando la llave de servicio (`SUPABASE_SECRET_KEY`, ya en Vercel desde la v47.0).

Para que el webhook supiera **a quién** actualizar, hizo falta cerrar un hueco que no existía hasta hoy: el checkout no llevaba ningún identificador de usuario. Se modificó:
- **`create-checkout-session.js`**: ahora exige `userId`/`email` y los manda a Stripe como `client_reference_id` y `metadata.plan`.
- **`planes.html`**: antes de suscribir, verifica que haya sesión de Supabase; si no la hay, redirige a `login-nuevo.html?next=planes.html`.
- **`login-nuevo.html`**: ahora respeta el parámetro `?next=` (incluido en el viaje del link mágico por correo) para regresar a la página de origen tras iniciar sesión, en vez de mandar siempre a `index.html`.

**Configuración en Stripe** (modo prueba): se creó el destino de eventos "creative-glow" apuntando a `https://gestorurbanoamg.vercel.app/api/stripe-webhook`, escuchando los 4 eventos listados arriba. El secreto de firma (`STRIPE_WEBHOOK_SECRET`) se guardó directo en Vercel como variable de entorno de producción (nunca se compartió en el chat).

## 3. Candado de plan activo en `index.html`

A petición explícita de Fernando ("hay que resolver siempre el problema de una vez", no dejarlo pendiente), se agregó verificación real antes de mostrar el menú de módulos:
- Sin sesión de Supabase → redirige a `login-nuevo.html?next=index.html`.
- Con sesión pero sin plan activo (`plan` distinto de básico/estándar/profesional/empresarial) → redirige a `planes.html?sinplan=true`, con mensaje visible.
- Con plan activo → entra normalmente.

Antes de esto, el único candado era la clave compartida de `login.html` — que no distingue quién pagó y quién no. Queda como una capa adicional, no como reemplazo: la clave compartida se mantiene mientras la plataforma sigue en fase de pruebas.

## 4. Bug encontrado y corregido — permisos de tabla en Supabase

La primera prueba de pago real reveló que el webhook fallaba con error 500 en todos los intentos de `checkout.session.completed` (`invoice.payment_succeeded` sí pasaba, porque en un pago inicial no hace nada). Se diagnosticó en dos pasos:
1. **Registro de entregas de Stripe** (Developers → Webhooks → Entregas de eventos): confirmó el error 500 pero solo mostraba el mensaje genérico de nuestro propio código.
2. **Logs de Vercel**: mostraron el error real — `permission denied for table profiles` (Postgres, código `42501`), con la sugerencia exacta de la propia base de datos: `GRANT SELECT, UPDATE ON public.profiles TO service_role;`

La causa: la tabla `profiles` se creó con SQL directo en el SQL Editor de Supabase, y Postgres nunca le dio permiso de tabla a los roles `service_role`/`authenticated` — esto es independiente de las políticas de seguridad por fila (RLS), que sí estaban correctas desde la v47.0. RLS decide qué filas puede ver cada quien; el `GRANT` decide si puede tocar la tabla en absoluto.

**Corrección aplicada:**
```sql
GRANT SELECT, UPDATE ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO authenticated;
```

Con el permiso corregido, se reenvió el mismo evento fallido desde el propio panel de Stripe (sin necesidad de pagar de nuevo) — quedó en 200 OK, y la fila de Fernando en `profiles` se actualizó correctamente: `plan: basico`, `stripe_customer_id` y `stripe_subscription_id` con valores reales.

## 5. Verificación end-to-end completa

Con las dos piezas corregidas, se confirmó el flujo completo con una prueba real: sin plan activo, `index.html` bloquea y manda a `planes.html`; al completar el pago de prueba, el webhook actualiza el perfil; con el plan ya activo, `index.html` deja entrar al menú con normalidad.

---

## Pendientes conocidos

| Tarea | Estado |
|---|---|
| **Migrar M04, M10 y el resto de módulos** de `localStorage` a checar cuotas reales (consultas/análisis restantes) en Supabase | 🔵 Siguiente paso grande — el candado de hoy solo revisa "¿tienes plan activo?", no cuánto te queda |
| Si se crean tablas nuevas en Supabase por SQL directo, recordar correr los `GRANT` correspondientes (mismo bug de hoy) | ⚠️ Ojo a futuro |
| Agregar Supabase a `privacidad.html` (tabla de terceros) | ⏳ Solo hasta que procese datos reales de clientes pagando |
| Verificar cuenta de Stripe (RFC + banco) | ⏳ Pospuesto hasta justo antes de lanzar |
| Activar switch "Políticas legales" en Stripe | ⏳ Bloqueado detrás de la verificación de negocio |
| Decidir si/cuándo reemplazar `login.html` (clave compartida) por `login-nuevo.html` (Supabase Auth) | ⏳ Requiere confirmación explícita aparte |
| Construir pantalla para crear contraseña después de entrar por link mágico | ⏳ Pendiente |
| Pistas deportivas (E2) y Casetas telefónicas (RIS) — mismo bug de catálogo que manualidades | ⏳ Pendiente, no solicitado aún |
| Comprar y conectar dominio trazaurbana.mx | ⏳ Pendiente |
| Configurar UptimeRobot | ⏳ Pendiente |
| Ampliar catálogo propio de M06 más allá de sinónimos puntuales | ⏳ Pendiente |
| Deep link M02→M06 para Tlaquepaque/Tlajomulco/Tonalá no auto-calcula | ⏳ Pendiente |
| Clasificación rest_alta/rest_baja alcohol GDL | ⏳ Esperando licencia real de Fernando |
| Guion de video demo — ¿M10 o M04? | ❓ Pregunta abierta |
| Gasolineras/gaseras ZPN — códigos SCIAN | ⏳ Pendiente |
| Guard municipio M02/M03/M05 | ⏳ Pendiente |

---

*Próxima bitácora: v49.0*
*Generada: 22-sep-2026*
