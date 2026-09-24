# Bitácora v50.0 — Gestor Urbano Jalisco AMG (TrazaUrbana)

**Período:** 23-sep-2026 (continuación)
**Rama:** master + main (Vercel)
**Autor:** Fernando H. / Claude Sonnet 5

---

## Resumen ejecutivo

Cierre completo del sistema de cuotas: los 8 módulos que quedaban sin control real (M01, M02, M03, M05, M06, M07, M08, M09, M11 — todos excepto M04/M10, ya migrados) ahora descuentan de `consultas_usadas` en Supabase, con el mismo candado de sesión+plan que el resto de la plataforma. Se investigó cada módulo a fondo antes de tocar código (3 agentes de exploración en paralelo) para decidir con precisión qué acción cuenta como "1 consulta" y cuál queda gratis dentro de cualquier plan — confirmado con Fernando en varias rondas de preguntas, incluyendo una decisión explícita de dejar el modo Express de M11 como muestra gratis (en vez de cobrarlo también) y de tratar `verificarAhora()` de M09 como consulta normal aunque internamente llame a Claude.

La prueba real en producción (Fernando haciendo consultas de verdad hasta tocar el límite del plan básico) encontró dos bugs reales que el código por sí solo no habría revelado: recargar un ítem del historial de "consultas recientes" en M01/M02/M03 volvía a cobrar una consulta nueva por algo ya pagado, y el deep-link automático de M02 hacia M06 se saltaba el candado de cuota por completo. Ambos se corrigieron el mismo día. Al pedir Fernando una verificación más amplia, se auditaron los 8 deep-links reales que existen entre módulos — solo ese de M02→M06 tenía el problema; los demás o piden clic manual, o (en el caso de M01→M03) no generan ningún costo nuevo por diseño.

---

## Commits incluidos

| Commit | Descripción |
|---|---|
| `e641bce` | feat: migra M01,M02,M03,M05,M06,M07,M08,M09,M11 a cuotas reales de Supabase |
| `8dcd91f` | fix: recargar una consulta desde el historial ya no cobra cuota extra |
| `b0bd249` | fix: el deep link M02→M06 ya respeta el límite de cuota |

---

## 1. Migración de 9 módulos a `api/verificar-consulta.js`

Mismo patrón exacto que el endpoint de análisis IA (`api/verificar-cuota.js`, ya construido), pero contra la columna `profiles.consultas_usadas`. Límites por plan: Básico 8, Estándar 30, Profesional 80, Empresarial ilimitado. Se llama una sola vez por consulta real, reservando la unidad antes de intentar la acción — mismo criterio ya validado con M04/M10.

Todos los módulos reciben el mismo candado de sesión+plan de `index.html`. Dentro de cada uno, solo la acción que realmente tiene costo o debe limitarse por diseño de producto descuenta cuota; el resto queda gratis para cualquiera con un plan activo:

| Módulo | Cuenta como consulta | Queda gratis |
|---|---|---|
| M01 | Buscar dirección/predio | — |
| M02 | Buscar predio/zona (Paso A) | Cambiar de giro sobre el mismo predio (Paso B) |
| M03 | Cada búsqueda de predio (comparar 2 = 2 consultas) | — |
| M05 | Generar checklist de expediente | Verificar perímetro histórico (utilidad auxiliar) |
| M06 | Calcular requisitos y derechos (los 3 municipios) | — |
| M07 | — (sin acción consultable, solo candado de entrada) | Todo el módulo |
| M08 | Calcular derechos | Calculadora rápida de refrendo |
| M09 | `verificarAhora()` — única llamada real a Claude en este módulo, tratada como consulta normal por decisión de Fernando | Calcular plazo, calcular derechos |
| M11 | Modo Pro (corrida financiera completa) | Modo Express (teaser) |

M01 y M02 (>300KB cada uno) se editaron con scripts Python atómicos, con respaldo previo; el resto vía edición directa.

## 2. Bug encontrado en pruebas reales — recargar del historial cobraba de más

Al hacer clic en un ítem de "consultas recientes" en M01, M02 o M03, la app volvía a ejecutar la búsqueda completa (el historial solo guarda un resumen, no el resultado completo), lo que ahora también disparaba el cobro de una consulta nueva por algo que el usuario ya había pagado antes. Corregido con un parámetro `saltarCuota` que la función de búsqueda recibe únicamente cuando se invoca desde la recarga del historial — el flujo normal (botón "Buscar") no cambia. M05, M06, M08 y M11 no tenían este problema: ya restauraban el resultado ya calculado o solo el formulario, sin recalcular por su cuenta.

## 3. Bug encontrado en pruebas reales — el deep link M02→M06 se saltaba el candado

M02 tiene un botón que manda al usuario a M06 con el giro y municipio ya detectados, y M06 auto-calculaba el resultado al llegar (para Guadalajara y Zapopan). Ese auto-cálculo llamaba directamente a la función de cálculo por `setTimeout`, sin pasar por el botón "Calcular" — que es donde vive el candado de cuota. Se corrigió simulando el clic real del botón (`btn.click()`) en vez de llamar la función directo, así se reutiliza el mismo candado sin duplicar lógica.

## 4. Auditoría completa de deep-links entre módulos

A petición de Fernando, se revisaron los 8 deep-links reales del sistema para confirmar que ningún otro tuviera el mismo problema:

- **M02→M06**: el único con el bug real (ya corregido).
- **M01→M02, M01→M08, M04→M05, M05→M08**: solo rellenan el formulario destino y muestran un aviso pidiendo clic manual — no auto-ejecutan nada.
- **M01→M03**: caso distinto — no genera ninguna llamada de red nueva, solo traspasa el resultado que M01 ya obtuvo (y ya cobró) directo a la lista de predios de M03. Correcto por diseño: no debe cobrarse dos veces por el mismo dato.
- **M04→M01 y M06→M02**: existen solo del lado que guarda el dato — ningún módulo los lee del otro lado, así que no tienen ningún efecto.

No se encontraron más huecos.

## 5. Verificación real en producción

Con la cuenta de plan básico (límite 8 consultas/mes): se hicieron consultas reales en M01 y M02 hasta tocar el límite, confirmando en Supabase que `consultas_usadas` subió correctamente y que el intento 9 se bloqueó con el mensaje esperado. Se confirmó además, ya en el límite, que recargar del historial sí mostraba el resultado sin el mensaje de bloqueo (prueba de que `saltarCuota` funciona), y que el deep-link M02→M06 ya respeta el candado.

---

## Pendientes conocidos

| Tarea | Estado |
|---|---|
| Agregar Supabase a `privacidad.html` (tabla de terceros) | ⏳ Solo hasta que procese datos reales de clientes pagando |
| Verificar cuenta de Stripe (RFC + banco) | ⏳ Pospuesto hasta justo antes de lanzar |
| Activar switch "Políticas legales" en Stripe | ⏳ Bloqueado detrás de la verificación de negocio |
| Decidir si/cuándo reemplazar `login.html` (clave compartida) por `login-nuevo.html` (Supabase Auth) | ⏳ Requiere confirmación explícita aparte |
| Construir pantalla para crear contraseña después de entrar por link mágico | ⏳ Pendiente |
| Pistas deportivas (E2) y Casetas telefónicas (RIS) — mismo bug de catálogo que manualidades | ⏳ Pendiente, no solicitado aún |
| Comprar y conectar dominio trazaurbana.mx | ⏳ Pendiente |
| Configurar UptimeRobot | ⏳ Pendiente |
| Ampliar catálogo propio de M06 más allá de sinónimos puntuales | ⏳ Pendiente |
| Clasificación rest_alta/rest_baja alcohol GDL | ⏳ Esperando licencia real de Fernando |
| Guion de video demo — ¿M10 o M04? | ❓ Pregunta abierta |
| Gasolineras/gaseras ZPN — códigos SCIAN | ⏳ Pendiente |
| Guard municipio M02/M03/M05 | ⏳ Pendiente |

---

*Próxima bitácora: v51.0*
*Generada: 23-sep-2026*
