# Gestor Urbano Jalisco AMG — Bitácora v33.0

**Fecha:** 17 de julio de 2026  
**Autor:** Fernando H.  
**Rama:** master  
**Módulos afectados:** M01, M04, M09, M10

---

## Resumen ejecutivo

Sesión de dos partes (contexto compactado + continuación). Se completaron 10 tareas distribuidas en cuatro módulos. El trabajo principal fue la implementación de verificación automática real en M09 (reemplazando la simulación con `setTimeout + alert()`), más una serie de correcciones de UI/privacidad derivadas de la revisión de Fernando al ver el módulo en producción.

---

## Parte I — Tareas completadas (sesión compactada)

### A. M10 · Historial de búsquedas de dirección

**Problema:** No había forma de recuperar una búsqueda anterior sin volver a escribir todos los campos.

**Solución implementada:**
- Persistencia en `localStorage` bajo clave `gu_m10_busq_hist` (máximo 10 entradas)
- `m10GuardarBusqueda()` se llama en `buscar()` después de geocodificar exitosamente
- `m10RenderHistBusqueda()` renderiza la lista en `<div id="m10HistBusq">` dentro del tab de Dirección
- `m10RestaurarBusqueda(idx)` rellena los 3 campos (calle, colonia, CP), cambia el municipio si es diferente, y ejecuta `buscar()` automáticamente
- Deduplicación por combinación exacta `{calle + colonia + cp + municipio}`
- Botón "✕" por entrada para eliminar individualmente + "Limpiar todo"
- CSS `.m10-hist-*` inyectado en el `<style>` del módulo

---

### B. M10 · Unificar los dos inputs de superficie

**Problema:** Existían dos campos separados para la superficie del terreno: el original `#m10InputSuperficie` en el panel izquierdo y un segundo `#m10RecalcSup` que aparecía dentro del resultado del veredicto. Generaba confusión y no era posible editar el valor y recalcular fácilmente.

**Solución implementada:**
- Eliminado el bloque `recalcHintHTML` + `recalcHTML` del template del veredicto
- Eliminado `#m10RecalcSup` por completo
- Agregado botón `<button id="m10BtnRecalc">↻ Recalcular</button>` junto al input original `#m10InputSuperficie`, oculto por defecto
- El botón se **muestra** al finalizar `m10RenderizarVeredicto()` (cuando hay un veredicto activo)
- El botón se **oculta** en `m10ResetUpload()` (al limpiar)
- `m10RecalcularSuperficie()` actualizado para leer de `#m10InputSuperficie` (no del antiguo `#m10RecalcSup`)

---

### C. M01 · Botón de navegación → M10

**Cambio:** Agregado enlace en la barra de navegación de M01:
```
← M10 · Pre-Dictamen IA
```
Posicionado después del enlace a M02, antes de "Menú principal".

---

### D. M10 · Botón de navegación → M04

**Cambio:** Agregado enlace en la barra de navegación de M10:
```
← M04 · Revisor de Planos IA
```
Posicionado antes del enlace "Menú principal" `(index.html)`.

---

### E. M04 · Ocultar panel de API key en producción

**Problema:** El panel con la API key de Claude era visible para cualquier usuario en producción.

**Solución implementada:**
- Detección de entorno: `ES_LOCALHOST = (hostname === 'localhost' || hostname === '127.0.0.1')`
- En `DOMContentLoaded`: si `!ES_LOCALHOST`, el elemento `#apikey-panel` se oculta con `display:none`
- En producción (Vercel): el panel desaparece completamente
- En localhost: el panel sigue visible para Fernando durante desarrollo
- El proxy en `/api/claude-proxy.js` ya maneja la key desde variables de entorno — el campo era solo visual

---

## Parte II — Tareas completadas (sesión actual, 17 jul 2026)

### F. M09 · Verificación automática real con Claude

**Problema:** `verificarAhora()` simulaba la verificación con `setTimeout + alert()`. No consultaba ninguna fuente real.

**Arquitectura implementada:**

#### Función `verificarAhora()` — async
- Llama a `/api/claude-proxy` con el modelo `claude-sonnet-4-6`
- Envía como contexto el array `INHABILES_2026` completo serializado como JSON y la fecha actual
- Solicita a Claude:
  1. Verificar si falta algún día inhábil en el año en curso (LFT Art. 74 + Ley Serv. Púb. Jalisco Art. 38)
  2. Generar el calendario completo del año siguiente (federales + estatales + vacaciones TJAJAL)
  3. Confirmar UMA y salario mínimo del año siguiente si los conoce
  4. Sugerir alertas normativas nuevas relevantes para el AMG
- Respuesta esperada: JSON estructurado con campos `inhabiles_faltantes_{año}`, `inhabiles_{año+1}`, `uma_{año+1}`, `salario_{año+1}`, `alertas_nuevas`, `observaciones`, `resumen`

#### Capa de extras en localStorage (`gu_m09_extras`)
- `obtenerTodosInhabiles()` — fusiona `INHABILES_2026` + overrides de IA, deduplicados por fecha
- `obtenerTodasAlertas()` — fusiona `ALERTAS` + alertas nuevas sugeridas, deduplicadas por título
- `m09CargarExtras()` — restaura el estado previo al arrancar (sin necesidad de verificar de nuevo)
- `m09LimpiarExtras()` — limpia localStorage y revierte todas las vistas a datos base
- Botón "↩ Revertir" en el panel de resultados para deshacer la verificación

#### Funciones de render actualizadas
Todas las siguientes funciones usan ahora los helpers en lugar de los arrays hardcoded:
- `renderCalendario()` → `obtenerTodosInhabiles()`
- `renderAlertas()` → `obtenerTodasAlertas()`
- `renderProxFechas()` → `obtenerTodosInhabiles()`
- `esInhabil()` (calculadora de plazos) → `obtenerTodosInhabiles()`

#### `renderCalendario()` multi-año
- Agrupa por `año-mes` en lugar de solo por mes (0-11)
- Soporta entradas de 2026 y 2027 (y futuros años)
- Los meses del año nuevo muestran un badge "Auto" para identificarlos visualmente
- El título del calendario se actualiza dinámicamente: "Calendario de días inhábiles 2026 · 2027"

#### Panel de resultados inline (`m09VerifPanel`)
- `m09MostrarVerifPanel(estado, res, extras, errorMsg)` reemplaza el `alert()` nativo
- 3 estados: `'loading'` (spinner), `'ok'` (resumen + conteos), `'error'` (mensaje)
- Renderiza en `<div id="m09VerifPanel">` en el sidebar, justo debajo del botón "Verificar ahora"
- Al arrancar con extras guardados, muestra un resumen compacto del estado previo

#### Animación CSS
- `@keyframes spin` agregado para el ícono giratorio del botón durante la carga

---

### G. M09 · Eliminar alertas operativas internas

**Problema:** El array público `ALERTAS` contenía 3 alertas internas que exponen información operativa de la plataforma al usuario final.

**Alertas eliminadas:**

| Alerta | Razón de eliminación |
|--------|----------------------|
| "Tarifas ICUS 2027 — verificar en diciembre 2026" | Recordatorio interno de actualización, no información pública |
| "TLQ, TLA y TON — PDU pendiente de procesamiento" | Expone que la BD no está completa para esos municipios |
| "Google Maps API Key — configurar límite de presupuesto" | Expone infraestructura técnica y créditos de API |

**Alertas que permanecen (normativas públicas):**
- MUNDIAL 2026 — Obra pública pausada por FIFA (danger)
- MUNDIAL 2026 — Operativo "Última Milla" (danger)
- MUNDIAL 2026 — Veda temporal cierres viales GDL (danger)
- MUNDIAL 2026 — Vialidades afectadas zona Bajío Zapopan (warn)
- PDU ZPN-01 Zapopan 2023 — vigente (info)
- Planes Parciales GDL — D1 a D7 vigentes (info)

---

### H. M09 · Eliminar sección "Estado actual" del sidebar

**Problema:** La card "Estado actual" mostraba conteos de alertas críticas, avisos y días inhábiles próximos. Fernando señaló que no entendía su propósito y que era redundante con el contenido ya visible en las pestañas.

**Cambios:**
- Eliminado el elemento HTML `<div class="gu-rcard" id="resumenCard">`
- Eliminada la función `renderResumen()` completa (~30 líneas)
- Eliminadas las 4 llamadas a `renderResumen()` (en init, `verificarAhora()`, `m09LimpiarExtras()` y el evento de filtro)

**Sidebar resultante:** Próximas fechas críticas → Última verificación → Fuentes consultadas

---

### I. M09 · Actualizar sección "Fuentes consultadas"

**Problema:** La sección mostraba un bloque "Revisar manualmente c/año" con instrucciones para Fernando, siendo que la verificación automática ya cubre esas fuentes.

**Cambio:**
- Eliminado el bloque "Revisar manualmente c/año"
- Las fuentes movidas al bloque "Verificación automática":
  - LFT Art. 74 — días inhábiles federales
  - Ley Serv. Púb. Jalisco Art. 38 — estatales
  - TJAJAL — acuerdos de vacaciones
  - CONASAMI / INEGI — UMA y salario mínimo
  - Gaceta municipal GDL, ZPN, TLQ
  - Ley de Ingresos por municipio
  - PDU Zapopan — tablas de coeficientes

---

### J. M09 · Quitar la palabra "IA" de textos visibles

**Problema:** Fernando señaló que la palabra "IA" genera desconfianza en los usuarios finales.

**Decisión:** Reemplazar "IA" por "verificación automática" / "automático" / "verificando" según el contexto.

**Cambios aplicados:**

| Ubicación | Antes | Después |
|-----------|-------|---------|
| Fuentes consultadas (header) | "Con IA (al verificar):" | "Verificación automática:" |
| Panel de estado previo | "IA verificó el [fecha]..." | "Verificado el [fecha]..." |
| Badge meses año nuevo | "IA" | "Auto" |
| Botón durante carga | "Verificando con IA…" | "Verificando…" |
| Panel loading | "Consultando con IA…" | "Verificando…" |
| Panel resultado | "Verificación IA completada" | "Verificación completada" |

---

## Commits de la sesión

| Hash | Módulo | Descripción |
|------|--------|-------------|
| `fda7fcb` | M09 | feat: verificación automática real con Claude |
| `a908673` | M09 | fix: eliminar alertas operativas internas del array público |
| `0c77a17` | M09 | fix: Estado actual — número siempre visible en sidebar |
| `cf717f6` | M09 | fix: eliminar sección "Estado actual" del sidebar |
| `9c54c46` | M09 | fix: Fuentes consultadas — eliminar sección "Revisar manualmente" |
| `f13ad88` | M09 | fix: quitar palabra "IA" de textos visibles al usuario |

*(Commits de la sesión anterior compactada: M10 historial, M10 unificar superficie, M01 nav→M10, M10 nav→M04, M04 ocultar API key — ver bitácora v32.0)*

---

## Arquitectura y decisiones técnicas destacadas

### Capa de extras sin modificar el HTML
El patrón elegido para M09 es no-destructivo: los datos de la verificación automática se guardan en localStorage (`gu_m09_extras`) y se fusionan en tiempo de ejecución. Esto significa:
- El array `INHABILES_2026` hardcodeado permanece como fuente de verdad base
- Los días/alertas sugeridos por la verificación se superponen en memoria
- Un "↩ Revertir" limpia localStorage y restaura el estado original sin necesidad de redeploy

### Privacidad por defecto
Dos patrones de seguridad aplicados en esta sesión:
1. **M04**: API key oculta en producción via detección de hostname
2. **M09**: Alertas internas eliminadas del array público sin dejar rastro en el código

### Sin mencionar "IA" al usuario
Decisión de diseño: toda referencia a inteligencia artificial eliminada de la interfaz pública. El sistema se presenta como "verificación automática", que es más preciso y genera mayor confianza.

---

## Estado del proyecto al cierre de sesión

| Módulo | Estado | Notas |
|--------|--------|-------|
| M01 · Uso de suelo GDL | ✅ Estable | Botón → M10 agregado |
| M04 · Revisor de Planos | ✅ Estable | API key oculta en prod |
| M09 · Monitor Normativo | ✅ Estable | Verificación automática implementada |
| M10 · Pre-Dictamen | ✅ Estable | Historial + superficie unificada |
| M02, M03, M05–M08 | Sin cambios | No se tocaron en esta sesión |

---

## Pendientes identificados

- **GU_Deploy**: sincronizar M09, M10, M01, M04 actualizados con la carpeta de deploy
- **M09 verificación**: probar el flujo completo en producción (el botón "Verificar ahora" hace la llamada real a Claude)
- **Bitácora v34.0**: próxima sesión de trabajo

---

*Bitácora generada el 17 de julio de 2026*
