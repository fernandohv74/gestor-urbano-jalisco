# Bitácora v42.0 — Gestor Urbano Jalisco AMG
**Período:** 31-ago-2026
**Rama:** master + main (Vercel)
**Autor:** Fernando H. / Claude Sonnet 5

---

## Resumen ejecutivo

Sesión de corrección de bugs reportados por el usuario en M08 y M11. En M11 se corrigió el toggle de modo oscuro que era invisible. En M08 se implementó por completo el historial de cálculos (la función `guardarEnHistorial` existía referenciada en el HTML pero nunca fue implementada), se reubicó el bloque al inicio de la página, y se corrigieron dos problemas de layout en la sección de refrendo. Todos los cambios comprometidos y publicados en Vercel.

---

## Commits incluidos (5)

| Hash | Fecha | Descripción |
|------|-------|-------------|
| `c827441` | 31-ago | fix M11: toggle dark mode invisible — gu-theme-btn → gu-toggle estándar |
| `3666a95` | 31-ago | feat M08: implementar historial de cálculos (guardar/cargar/borrar en localStorage) |
| `e5a77ae` | 31-ago | fix M08: ref-art9-row sale del grid — texto del checkbox ya no queda comprimido en 160px |
| `9573982` | 31-ago | fix M08: historial de cálculos sube al inicio de la página (antes del formulario) |
| `7b830d1` | 31-ago | fix M08: checkbox art9 — span + flex-start, texto ya no se comprime |

---

## 1. M11 — Toggle modo oscuro invisible (c827441)

**Síntoma:** El toggle de modo oscuro aparecía en la barra de navegación pero era invisible — el botón existía en el DOM pero sin ningún estilo visible.

**Causa raíz:** M11 usaba `class="gu-theme-btn"` con SVGs de sol/luna, una implementación antigua que nunca tuvo CSS asociado en el design system ni en el `<style>` propio de M11.

**Fix:** Reemplazado el botón completo por el patrón estándar del design system:

```html
<!-- Antes -->
<button class="gu-theme-btn" onclick="guToggleTheme()" aria-label="Cambiar tema" title="Cambiar tema">
  <svg class="icon-sun" ...>...</svg>
  <svg class="icon-moon" ...>...</svg>
</button>

<!-- Después -->
<button class="gu-toggle" onclick="guToggleTheme()" aria-label="Cambiar tema">
  <div class="gu-toggle-track"><div class="gu-toggle-thumb"></div></div>
  <span id="gu-toggle-label">Modo oscuro</span>
</button>
```

`.gu-toggle` tiene `margin-left:auto` en el nav, lo que lo empuja al extremo derecho como en el resto de los módulos.

---

## 2. M08 — Historial de cálculos implementado (3666a95)

**Síntoma:** El botón "💾 Guardar" llamaba a `guardarEnHistorial()` y no hacía nada — la función no existía en ningún lugar del archivo. La sección `#hist-section` tenía HTML y CSS completos pero cero JavaScript.

**Causa raíz:** El historial fue diseñado (UI + CSS) pero el código JS nunca fue escrito.

**Implementación completa (77 líneas insertadas antes del cierre `</script>`):**

```
HIST_KEY = 'GU_m08_historial'  (localStorage, máx. 5 entradas)
```

| Función | Responsabilidad |
|---------|----------------|
| `guardarEnHistorial()` | Valida que haya resultado calculado y nombre escrito. Captura título, subtítulo, total y `innerHTML` completo del panel de resultados. Guarda en localStorage (LIFO, máx. 5). |
| `renderHistorial()` | Lee localStorage y renderiza tarjetas en `#hist-lista`. Muestra/oculta `#hist-section` según haya o no entradas. |
| `cargarDesdeHistorial(idx)` | Restaura el `innerHTML` del resultado guardado en el panel y hace scroll hacia él. |
| `borrarDeHistorial(idx)` | Elimina entrada por índice, actualiza localStorage y re-renderiza. |
| `_escH(s)` | Escapa HTML para evitar XSS en nombres de proyecto. |

**Llamada clave:** `document.addEventListener('DOMContentLoaded', renderHistorial)` — sin esta línea el historial nunca aparecería al regresar al módulo, que era el bug reportado por el usuario.

**Datos guardados por entrada:**
- `nombre` — texto libre del usuario (máx. 60 chars)
- `titulo` — e.g. "Desglose de derechos — Guadalajara"
- `sub` — e.g. "Obra nueva · Habitacional unifamiliar · 120 m²"
- `total` — e.g. "$8,838" (leído de `.total-row td.right`)
- `fecha` — fecha local en formato "31 ago 2026"
- `html` — `innerHTML` completo del `result-panel` para restauración fiel

---

## 3. M08 — Historial reubicado al inicio (9573982)

**Solicitud del usuario:** El historial debería aparecer al inicio del módulo al regresar, no al fondo después del formulario.

**Cambio:** Movido `#hist-section` de su posición original (después del `result-card`) a justo antes del título "Calculadora de Derechos", como primer elemento visible dentro de `.m08-wrap`.

**Orden final de la página:**
1. Banners de deep link (M01, M05) — ocultos si no aplica
2. **Historial de cálculos** — visible solo si hay entradas en localStorage
3. "Calculadora de Derechos" + formulario completo
4. Resultado + botón "💾 Guardar" al final

---

## 4. M08 — Layout de checkbox refrendo corregido (e5a77ae + 7b830d1)

**Síntoma:** El texto del checkbox "👉 Da clic aquí si tu licencia tiene más de 5 años…" aparecía comprimido en una columna muy estrecha (~160px).

**Causa raíz (primera parte):** `#ref-art9-row` estaba dentro de `.refrendo-inp`, que es la primera columna del grid `.refrendo-grid { grid-template-columns: 160px 1fr }`. El texto no tenía espacio.

**Fix (e5a77ae):** Movido `#ref-art9-row` fuera del grid como hijo directo de `.refrendo-card`, para que tome el ancho completo de la tarjeta.

**Causa raíz (segunda parte):** Aun después del movimiento, el texto seguía comprimiéndose. El `<label>` usaba `display:flex;align-items:center` y el texto era un nodo de texto suelto — Chrome no asigna ancho correcto a nodos de texto sueltos en contenedores flex.

**Fix definitivo (7b830d1):**
```html
<!-- Antes -->
<label style="display:flex;align-items:center;gap:7px;...">
  <input type="checkbox" ...>
  👉 Texto largo suelto...
</label>

<!-- Después -->
<label style="display:flex;align-items:flex-start;gap:8px;...;line-height:1.5">
  <input type="checkbox" style="cursor:pointer;flex-shrink:0;margin-top:2px">
  <span>👉 Texto largo dentro de span...</span>
</label>
```

Cambios clave: texto en `<span>` (flex item real), `align-items:flex-start` (checkbox alineado arriba en texto multilinea), `flex-shrink:0` en el checkbox, separador visual `border-top` para delimitar la sección.

---

## 5. Pendientes conocidos

| Tarea | Estado |
|-------|--------|
| Freemium.js integración (M01–M03, M05–M09, M11) | 🔵 STBY |
| Dominio personalizado trazaurbana.mx | ⏳ Pendiente |
| UptimeRobot monitoring | ⏳ Pendiente |
| Formspree ID propio (reemplazar fernandohv74@gmail.com) | ⏳ Pendiente |
| Gasolineras/gaseras ZPN — códigos SCIAN | ⏳ Pendiente |
| Guard municipio M02/M03/M05 | ⏳ Pendiente |

---

*Próxima bitácora: v43.0*
*Generada: 31-ago-2026*
