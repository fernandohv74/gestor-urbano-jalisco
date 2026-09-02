# Bitácora v41.0 — Gestor Urbano Jalisco AMG
**Período:** 29-ago-2026 – 31-ago-2026
**Rama:** master + main (Vercel)
**Autor:** Fernando H. / Claude Sonnet 5

---

## Resumen ejecutivo

Sesión de mejoras transversales a los 11 módulos activos. Sin nuevas funcionalidades de negocio — el foco fue calidad: ocultamiento de fuentes internas, orden alfabético en M07, 22 términos nuevos al glosario, normalización de títulos, nav links entre módulos, loading states en botones de cálculo y responsive en móvil vía design system. Todos los cambios comprometidos y publicados en Vercel.

---

## Commits incluidos (6)

| Hash | Fecha | Descripción |
|------|-------|-------------|
| `ff88c44` | 29-ago | feat M07: ocultar tab Fuentes del público; Fuente Maestra a Bitacoras/ |
| `fcf4735` | 29-ago | feat M07: ordenar Directorio (32) y Glosario (75) alfabéticamente |
| `315ba8f` | 29-ago | feat M07: glosario +22 términos (75 → 97), reordenado A-Z |
| `0787604` | 30-ago | fix: títulos, nav links e img alt en M04–M11 |
| `9f22f46` | 31-ago | feat #4: loading state en botones de cálculo M06, M08, M11 |
| `4b6a6b2` | 31-ago | feat #1: responsive 480px — grids a 1 columna en móvil (design system) |

---

## 1. M07 — Tab "Fuentes" ocultada (ff88c44)

**Motivo:** Las fuentes normativas (APIs GeoServer, PDUs, Reglamentos municipales) son información estratégica interna que no debe exponerse al público.

**Cambios en `GestorUrbano_M07_1.html`:**
- Eliminado botón `id="tab-fue"` de la barra de tabs
- Eliminado panel `#section-fue` con todo su contenido
- Eliminadas reglas CSS de print que referenciaban `section-fue`

**Archivos creados en `Bitacoras/`:**
- `GestorUrbano_FuenteMaestra.md` — listado completo de fuentes por grupo (Reglamentos y Leyes, PDUs, APIs GIS, Herramientas digitales, Fuentes de respaldo)
- `GestorUrbano_FuenteMaestra.pdf` — versión PDF con encabezado "CONFIDENCIAL", codificada por tipo con colores via reportlab

---

## 2. M07 — Directorio y Glosario ordenados A-Z (fcf4735)

- **Directorio:** 32 entradas ordenadas por campo `nombre` con normalización Unicode (á→a, etc.) para orden correcto en español
- **Glosario:** 75 términos ordenados por campo `termino` con la misma normalización
- Script Python atómico `sort_m07.py` — brace-depth counter para parsear objetos JS multi-línea

---

## 3. M07 — +22 términos al Glosario (315ba8f)

Glosario creció de 75 a 97 términos. Nuevos términos agregados tras auditoría de los 11 módulos:

> Retranqueo · Frente mínimo · Lote mínimo · Habitacional unifamiliar · Habitacional plurifamiliar · Vivienda bifamiliar · Equipamiento · Uso condicionado · Uso compatible · Certificado de Alineamiento y Número Oficial · Número oficial · DTUDE · Pre-dictamen · Licencia de edificación · Licencia de Ocupación Vial · Pago de Aprovechamiento de Infraestructura Básica · Dictamen de Impacto Vial (DIV) · EIA · Estudio Geohidrológico · Zona de Monumentos Históricos · PDU · Valor catastral

Todos insertados en orden alfabético correcto dentro del array `GLOSARIO`.

---

## 4. Auditoría de los 11 módulos — hallazgos y plan

Se ejecutó `review_modules.py` contra los 11 módulos activos. Hallazgos clasificados:

| # | Categoría | Módulos afectados | Prioridad |
|---|-----------|-------------------|-----------|
| #1 | Responsive (sin media queries) | M01, M02, M04, M10 | Alta |
| #2 | Títulos inconsistentes | M05–M10 | Media |
| #3 | Dark mode | M11 (falso positivo — ya tenía) | — |
| #4 | Loading states en fetch/cálculo | M06, M08, M11 | Media |
| #5 | Nav links entre módulos | M07, M08, M11 | Baja |
| #6 | Freemium integration | M01–M03, M05–M09, M11 | STBY |
| #7 | Alt en imágenes | M04 | Baja |
| #8 | TODOs en M09 | M09 (falso positivo — era "todos" en datos) | — |

---

## 5. Fix integral: títulos, nav links, alt images (0787604)

**#2 Títulos normalizados** — formato unificado `TrazaUrbana — [Nombre]`:

| Módulo | Antes | Después |
|--------|-------|---------|
| M05 | `M05 — Requisitos de Licencia de Construcción · TrazaUrbana` | `TrazaUrbana — Requisitos de Licencia de Construcción` |
| M06 | `M06 - Licencia de Funcionamiento - TrazaUrbana` | `TrazaUrbana — Licencia de Funcionamiento` |
| M07 | `M07 - Directorio y Glosario - TrazaUrbana` | `TrazaUrbana — Directorio y Glosario` |
| M08 | `M08 — Calculadora de Derechos · TrazaUrbana` | `TrazaUrbana — Calculadora de Derechos` |
| M09 | `TrazaUrbana — Monitor Normativo` | `TrazaUrbana — Calculadora de Derechos iCUS` |
| M10 | `TrazaUrbana · M10 Pre-Dictamen IA` | `TrazaUrbana — Pre-Dictamen IA` |

**#5 Nav links agregados:**
- M07: +M02 (Giro Comercial) +M05 (Requisitos de Licencia)
- M08: +M09 (Calculadora iCUS)
- M11: +M05 (Requisitos de Licencia) +M08 (Calculadora de Derechos)

**#7 Alt image:** M04 — único `<img>` sin `alt` corregido a `<img alt="">`

---

## 6. #4 Loading states en botones de cálculo (9f22f46)

Agregado patrón `DOMContentLoaded` + `setTimeout(20ms)` + `try/finally` en M06, M08 y M11. El wrapper:
1. Deshabilita el botón al click (`btn.disabled = true`)
2. Muestra "Calculando…" en el texto
3. Espera 20ms para garantizar repaint del navegador
4. Ejecuta la función de cálculo
5. Restaura botón en `finally` (incluso si hay early return por validación)

**M06:** IDs `btn-calc-gdl`, `btn-calc-zpn`, `btn-calc-mun` agregados a los 3 botones `.btn-calc`. Helper `_wrapCalc()` compartido para los 3.

**M08:** `#btn-calcular` ya existía. Wrapper directo.

**M11:** `#pro-calc-btn` ya existía. Actualiza el `<span>` interior (no el `textContent` del botón directamente).

---

## 7. #1 Responsive móvil — design system (4b6a6b2)

**Diagnóstico previo al cambio:**
- `.gu-layout` (panel 320px + 1fr) ya tenía `@media(max-width:900px){ grid-template-columns:1fr }` — layout principal ya era responsive
- `.gu-fgrid-3` ya tenía `@media(max-width:600px){ grid-template-columns:1fr 1fr }` — reducía a 2 col pero no a 1
- Sin regla para pantallas ≤480px

**Agregado en `gu-design-system.css`** (bloque nuevo al final de sección 17):

```css
@media(max-width:480px){
  .gu-fgrid-3  { grid-template-columns: 1fr }
  .gu-fgrid    { grid-template-columns: 1fr }
  .gu-rest-grid{ grid-template-columns: 1fr }
  .gu-sim-grid { grid-template-columns: 1fr }
}
```

**Efecto:** 1 archivo modificado, impacta todos los módulos que usan el design system externo. No afecta escritorio (>480px). M06 y M07 tienen CSS embebido propio — no reciben este cambio, lo cual es aceptable dado que no son módulos de consulta rápida en campo.

**Rationale de módulos:** M01 (consulta de predio en campo) y M02 (verificación de giro) son los más probables de usarse desde celular. M04 (planos) y M10 (pre-dictamen + upload) son flujos de escritorio.

---

## 8. Verificación final de los 11 módulos

Ejecutado `verify_all_modules.py` — resultado limpio:

| Módulo | Archivo | KB | Estado |
|--------|---------|-----|--------|
| M01 | GestorUrbano_M01_3.html | 393 | ✅ |
| M02 | GestorUrbano_M02_4.html | 499 | ✅ |
| M04 | GestorUrbano_M04_3.html | 199 | ✅ |
| M05 | GestorUrbano_M05_2.html | 108 | ✅ |
| M06 | GestorUrbano_M06_1.html | 239 | ✅ (CSS embebido — OK) |
| M07 | GestorUrbano_M07_1.html | 115 | ✅ (CSS embebido — OK) |
| M08 | GestorUrbano_M08_1.html | 85 | ✅ |
| M09 | GestorUrbano_M09_1.html | 74 | ✅ |
| M10 | GestorUrbano_M10_1.html | 436 | ✅ |
| M11 | GestorUrbano_M11_1.html | 69 | ✅ |
| login | login.html | 8 | ✅ |

Falsos positivos del scanner (no errores reales):
- `<script>` desbalanceados en M01/M02/M10/M11 → tags dentro de strings JS (generación dinámica de HTML para impresión, etc.)
- `<style>` desbalanceados en M02/M11 → misma causa
- "falta gu-design-system.css" en M06/M07 → CSS intencionalmente embebido

---

## 9. Pendientes conocidos

| Tarea | Estado |
|-------|--------|
| Freemium.js integración (M01–M03, M05–M09, M11) | 🔵 STBY |
| Dominio personalizado trazaurbana.mx | ⏳ Pendiente |
| UptimeRobot monitoring | ⏳ Pendiente |
| Formspree ID propio (reemplazar fernandohv74@gmail.com) | ⏳ Pendiente |
| Gasolineras/gaseras ZPN — códigos SCIAN | ⏳ Pendiente |
| Guard municipio M02/M03/M05 | ⏳ Pendiente |

---

*Próxima bitácora: v42.0*
*Generada: 31-ago-2026*
