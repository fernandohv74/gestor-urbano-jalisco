# Bitácora v47.0 — Gestor Urbano Jalisco AMG (TrazaUrbana)

**Período:** 21-sep-2026 (continuación, misma noche)
**Rama:** master + main (Vercel) — sin commits de código en este tramo
**Autor:** Fernando H. / Claude Sonnet 5

---

## Resumen ejecutivo

Continuación directa de la v46.0, ya con el checkout de Stripe funcionando en producción. Esta parte fue 100% configuración de cuentas externas — no se tocó código ni se generaron commits, por eso no hay tabla de commits esta vez.

Se intentó cerrar el último pendiente cosmético de Stripe (activar "Políticas legales" con las URLs reales de Términos/Privacidad) y se topó con que esa sección — junto con "Información de contacto", ya bloqueada antes — vive dentro de "Datos de la empresa", una pantalla que Stripe no deja tocar hasta completar la verificación completa del negocio (RFC + cuenta bancaria). Esto abrió una conversación de secuencia con Fernando: ¿verificar el negocio ahora o después? Se concluyó que verificar Stripe (Fernando ya tiene RFC listo) no desbloquea nada que se vaya a usar de inmediato — lo urgente de verdad es que el sistema de cuentas exista, para no cobrarle a alguien real por un plan que la app todavía no sabe diferenciar. Se acordó: sistema de cuentas primero, verificación de Stripe justo antes de abrir la app a clientes reales.

Con esa decisión tomada, se arrancó la primera pieza del sistema de cuentas: se creó la cuenta y el proyecto de **Supabase** (base de datos + autenticación) para TrazaUrbana, con buenas prácticas de seguridad desde el inicio (Row Level Security automática activada, tablas no expuestas por default), y se conectaron sus tres credenciales a Vercel como variables de entorno de producción, verificado con un redeploy exitoso. Fernando preguntó directamente qué tan visible era todo esto en la app — se le explicó con claridad que es trabajo de infraestructura pura, sin ningún cambio visible todavía: el login sigue igual, los módulos siguen igual, hasta que se construya el resto (tablas, login nuevo, webhook, migrar los límites de créditos) mañana.

---

## Commits incluidos

Ninguno — todo el trabajo de este tramo fue configuración de cuentas externas (Stripe, Supabase, Vercel), sin cambios de código.

---

## 1. Stripe — intento de cerrar "Políticas legales", mismo muro que antes

Se intentó activar el switch de "Políticas legales" con las URLs reales de `terminos.html`/`privacidad.html` (ya publicadas en v46.0). Al buscar dónde cargar esas URLs ("Datos públicos"), se llegó a la pantalla "Empresa → Datos de la empresa", que exige "Activar productos" (verificación completa de negocio) antes de dejar editar cualquier dato — el mismo bloqueo ya visto antes con "Información de contacto". Se recomendó apagar el switch de "Políticas legales" mientras tanto, para no dejar un link roto o vacío visible a un cliente real.

## 2. Decisión de secuencia — cuentas primero, verificar Stripe después

Fernando preguntó directamente qué tanto sentido tenía seguir esperando para verificar el negocio en Stripe, dado que ya tiene el RFC listo. Se aclaró la diferencia entre dos cosas separadas:
- **Verificar la cuenta de Stripe** (RFC + banco): no tiene urgencia real — no desbloquea nada que se vaya a usar antes de que el sistema de cuentas exista.
- **Aceptar pagos reales de clientes reales**: esto sí debe esperar, porque ahora mismo pagar no le da a nadie ningún acceso diferenciado — todos entran igual con la clave compartida.

Se acordó el orden correcto: construir el sistema de cuentas primero (puede probarse completo en modo de prueba de Stripe, sin necesitar la cuenta verificada), y dejar la verificación de Stripe para justo antes de lanzar la app a clientes reales.

## 3. Supabase — cuenta y proyecto creados

Cuenta creada con GitHub (misma identidad que el repositorio del proyecto). Organización **TrazaUrbana**, proyecto **TrazaUrbana** (ref `bhryrrdygghhospfqgtj`), plan Free, región **West US (North California)** — la más cercana a México entre las disponibles (se corrigió en el momento una suposición equivocada: Sudamérica/São Paulo está en realidad mucho más lejos de Guadalajara que California).

Configuración de seguridad elegida deliberadamente al crear el proyecto:
- **Enable Data API**: activado (necesario para que la app hable con la base de datos)
- **Automatically expose new tables**: desactivado (siguiendo la propia recomendación de Supabase — controlar acceso manualmente, no exponer todo por default)
- **Enable automatic RLS**: activado (cada tabla nueva nace con Row Level Security — cada usuario solo puede ver sus propios datos)

## 4. Credenciales conectadas a Vercel

Se agregaron las 3 variables de entorno de Supabase a Vercel (Production), una por una, mismo patrón que `STRIPE_SECRET_KEY`:
- `SUPABASE_URL` (Config) — `https://bhryrrdygghhospfqgtj.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` (Config) — llave pública, safe de compartir
- `SUPABASE_SECRET_KEY` (Secret) — nunca compartida en el chat, guardada aparte por Fernando

Cada una disparó un redeploy exitoso, confirmando que quedaron activas en producción.

## 5. Aclaración — nada de esto es visible todavía en la app

Fernando preguntó explícitamente qué de todo esto se podía ver funcionando. Se le explicó con claridad: es trabajo de infraestructura pura — no hay ningún código todavía que use Supabase para nada. El login, los módulos, todo sigue exactamente igual que antes. Es la base para lo que se construye a continuación (tablas, login real, webhook, límites de créditos que de verdad detengan a alguien), no una funcionalidad en sí misma.

---

## Pendientes conocidos

| Tarea | Estado |
|---|---|
| **Diseñar tablas de Supabase** (usuario → plan, consultas/análisis usados por mes) | 🔵 Siguiente paso inmediato |
| **Configurar login con link mágico** (o contraseña, a confirmar con Fernando) en Supabase Auth | 🔵 Siguiente paso inmediato |
| **`api/stripe-webhook.js`** — conecta eventos de Stripe con la tabla de Supabase | 🔵 Pendiente, parte del sistema de cuentas |
| **Pantalla de login nueva** (reemplaza la clave compartida) | 🔵 Pendiente, parte del sistema de cuentas |
| **Migrar M04, M10 y el resto de módulos** de `localStorage` a consultar créditos reales en Supabase | 🔵 Pendiente, parte del sistema de cuentas |
| Agregar Supabase a `privacidad.html` (tabla de terceros) | ⏳ Solo hasta que Supabase procese datos reales — no antes |
| Verificar cuenta de Stripe (RFC + banco) | ⏳ Deliberadamente pospuesto hasta justo antes de lanzar a clientes reales |
| Activar switch "Políticas legales" en Stripe | ⏳ Bloqueado detrás de la verificación de negocio — desactivado por ahora |
| "Datos de la empresa" / "Información de contacto" en Stripe | ⏳ Mismo bloqueo, mismo momento de resolverlo |
| Pistas deportivas (E2) y Casetas telefónicas (RIS) — mismo bug que manualidades | ⏳ Pendiente, no solicitado aún |
| Comprar y conectar dominio trazaurbana.mx | ⏳ Pendiente |
| Configurar UptimeRobot | ⏳ Pendiente |
| Ampliar catálogo propio de M06 más allá de sinónimos puntuales | ⏳ Pendiente |
| Deep link M02→M06 para Tlaquepaque/Tlajomulco/Tonalá no auto-calcula | ⏳ Pendiente |
| Clasificación rest_alta/rest_baja alcohol GDL | ⏳ Esperando licencia real de Fernando |
| Guion de video demo — ¿M10 o M04? | ❓ Pregunta abierta |
| Gasolineras/gaseras ZPN — códigos SCIAN | ⏳ Pendiente |
| Guard municipio M02/M03/M05 | ⏳ Pendiente |

---

*Próxima bitácora: v48.0*
*Generada: 21-sep-2026*
