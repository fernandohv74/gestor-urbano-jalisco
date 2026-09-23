# Bitácora v49.0 — Gestor Urbano Jalisco AMG (TrazaUrbana)

**Período:** 23-sep-2026
**Rama:** master + main (Vercel)
**Autor:** Fernando H. / Claude Sonnet 5

---

## Resumen ejecutivo

Cierre del pendiente grande que dejó la v48.0: los dos módulos que sí tienen costo real de API de Anthropic — M04 (Revisor de Planos IA) y M10 (PreDictamen IA) — ahora tienen control de cuota real, conectado a Supabase, en vez de depender de `localStorage`. La investigación previa reveló que en ambos módulos el control estaba roto por completo: en M04 desactivado a propósito desde julio (a petición de Fernando en su momento), y en M10 el script de límites ni siquiera se cargaba, así que nunca funcionó, con o sin login.

Se agregó `api/verificar-cuota.js`, un endpoint nuevo que verifica el plan del usuario y reserva 1 unidad de análisis antes de llamar a la IA — una sola vez por análisis, sin importar cuántas llamadas internas haga M04 por sus lotes de láminas. M04.html y M10.html recibieron el mismo candado de sesión+plan que ya tenía `index.html`.

La prueba fue completamente real: con la cuenta de Fernando (plan básico, límite 4 análisis/mes), se hicieron 4 análisis verdaderos en M04, confirmando en Supabase que `analisis_usados` subió de 0 a 4, y el quinto intento se bloqueó correctamente con el mensaje de límite alcanzado, sin llegar a llamar a la IA (sin gasto de más).

De paso, Fernando notó dos cosas de uso en M04 mientras probaba: el panel de "Análisis anteriores" vivía hasta abajo de toda la página, después de un formulario largo de configuración — se movió arriba, junto al botón de analizar. Y el texto/ícono de ese panel se perdía visualmente contra el resto de la página — se renombró a "Cargar análisis anteriores" y se le dio más tamaño y color de marca para que destaque.

---

## Commits incluidos

| Commit | Descripción |
|---|---|
| `fb5f1d6` | feat: migra M04 y M10 a cuotas reales de análisis IA en Supabase |
| `92b58f0` | fix: mueve el panel de Análisis anteriores arriba en M04 |
| `f9e50a6` | fix: hace más visible el panel de historial en M04 |

---

## 1. Diagnóstico previo — el control de cuota estaba roto en los dos módulos

Antes de tocar código, se investigó a fondo cómo M04 y M10 llamaban hoy a la IA, para saber exactamente dónde contar "1 análisis" sin duplicar ni faltar:

- **M04**: el chequeo de límite (`guVerificarLimite`/`guRegistrarUso`) estaba comentado en el código desde el 03-jul-2026, con una nota explícita: "a petición de Fernando". Hoy no había ningún control.
- **M10**: el archivo `gu-freemium.js` (donde viven esas funciones) **nunca se cargaba** en ese módulo — a diferencia de M04. El chequeo, aunque presente en el código, siempre evaluaba a "sin límite" porque las funciones ni existían ahí.
- Ambos módulos llaman a la IA de forma distinta: M04 puede hacer hasta 5 llamadas internas por un solo análisis (lotes de máx. 3 láminas, por el límite de tamaño de Vercel); M10 hace solo 1 llamada por análisis. Esto era clave para decidir dónde poner el control de cuota sin cobrar de más ni de menos.

## 2. Nuevo endpoint — `api/verificar-cuota.js`

Verifica el plan del usuario (`profiles.plan`) y su consumo (`profiles.analisis_usados`) en Supabase, usando la llave de servicio. Límites por plan: Básico 4, Estándar 8, Profesional 20, Empresarial 100 análisis/mes. Si hay margen, reserva 1 unidad de inmediato (antes de intentar el análisis) y responde permitido; si no, responde bloqueado con el mensaje correspondiente.

Se llama **una sola vez al inicio de cada análisis** — no en cada llamada interna de M04 — para que un análisis con varios lotes cueste exactamente 1 unidad de cuota, ni más ni menos. `api/claude-proxy.js` (el que sí habla con Anthropic) no se tocó: sigue sin saber nada de usuarios ni cuotas.

**Decisión confirmada con Fernando:** la cuota se reserva antes de intentar el análisis, no después de que termine con éxito. Si un análisis falla a medias por un error de red, la unidad ya se gastó — igual que el sistema viejo, y sin el riesgo de que dos clics casi simultáneos se cuelen antes de registrar el primero.

## 3. Candado de sesión en M04 y M10

Mismo patrón que se usa en `index.html`: sin sesión de Supabase, manda a `login-nuevo.html`; sin plan activo, manda a `planes.html?sinplan=true`. Esto era necesario porque, para poder cobrarle cuota al usuario correcto, el módulo necesita saber quién es — y de paso cierra el mismo hueco que se cerró en `index.html` la sesión pasada (entrar sin haber pagado), ahora también a nivel de cada módulo individual, no solo desde el menú principal.

## 4. Verificación real en producción

Con la cuenta de Fernando (plan básico ya activo desde la prueba de pago anterior):
- Se confirmó que el candado deja pasar directo cuando ya hay sesión y plan activo (comportamiento correcto, no un descuido del candado).
- Se hicieron 4 análisis reales en M04. En Supabase, `profiles.analisis_usados` subió correctamente de 0 a 4.
- El quinto intento se bloqueó con: *"Ya usaste tus 4 análisis con IA de este mes (plan básico). Se reinician con tu próxima renovación."* — sin llamar a la IA.

## 5. Ajustes de usabilidad en M04, detectados durante la prueba

- El panel **"Análisis anteriores"** vivía después de todo el formulario de "Configuración del análisis" (municipio, parámetros del predio, cuadro de áreas, etc.) — había que bajar mucho para verlo. Se movió justo debajo del botón "Analizar", junto a la zona de subir planos.
- El texto y el ícono de ese panel se perdían visualmente (gris, pequeño) comparado con el resto de la página. Se cambió el texto a **"Cargar análisis anteriores"**, se agrandó el ícono, y el título ahora usa el color de marca en vez del gris estándar.

---

## Pendientes conocidos

| Tarea | Estado |
|---|---|
| Migrar el resto de módulos (`consultas_usadas`: M01, M02, M03, M05-M09, M11) a Supabase | 🔵 Siguiente paso grande — hoy solo M04/M10 (los de costo real de IA) están migrados |
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

*Próxima bitácora: v50.0*
*Generada: 23-sep-2026*
