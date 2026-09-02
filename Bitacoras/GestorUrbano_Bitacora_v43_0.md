# Bitácora v43.0 — Gestor Urbano Jalisco AMG
**Período:** 01-sep-2026
**Rama:** master + main (Vercel)
**Autor:** Fernando H. / Claude Sonnet 5

---

## Resumen ejecutivo

Auditoría completa de los 11 módulos activos en busca de bugs equivalentes al que tenía M08 (botón "Guardar" referenciando una función de historial nunca implementada), y verificación de que el panel de consultas/análisis guardados sea visible al inicio de cada módulo. Se encontraron y corrigieron 2 bugs reales (M06, M05) y se reposicionaron 2 paneles que funcionaban bien pero no eran visibles al entrar al módulo (M11, M10). De paso, se detectó y corrigió un bug de datos en M10: al reabrir un análisis guardado, la app podía mostrar parámetros normativos (COS/CUS) de un predio distinto al guardado.

---

## Commits incluidos (4)

| Hash | Fecha | Descripción |
|------|-------|-------------|
| `36df684` | 01-sep | fix M06: implementar histGuardar() — historial no funcionaba (mismo bug que M08); reubicado al inicio |
| `49f3458` | 01-sep | fix M05: historial no se renderizaba al cargar la página; limpiarHistorial() y eliminarEntradaHistorial() llamaban funciones inexistentes; reubicado al inicio |
| `a716b5b` | 01-sep | fix M11: panel de corridas guardadas reubicado al inicio del Modo Pro |
| `ff3b739` | 01-sep | fix M10: panel de análisis guardados reubicado al inicio; m10ReabrirHistEntry ahora restaura datos del predio guardado |

---

## 1. Metodología de la auditoría

Para cada uno de los 11 módulos se verificó:
1. ¿Existe un botón que llama a una función de guardado de consulta/historial?
2. ¿Esa función está realmente definida en el archivo? (el bug de M08 era justo esto: función referenciada en `onclick` pero nunca escrita)
3. ¿Hay una llamada de renderizado dentro de `DOMContentLoaded`/`window.onload` para que lo guardado aparezca al volver al módulo?
4. ¿El panel de historial está posicionado al inicio de la página (visible sin scroll ni acciones previas)?
5. Verificación cruzada de nombres de función entre el HTML (`onclick="..."`) y las definiciones JS, para detectar *mismatches* silenciosos (un botón que llama a un nombre ligeramente distinto al de la función real).

---

## 2. M06 — Licencia de Funcionamiento (36df684)

**Bug encontrado:** idéntico al de M08. El botón "💾 Guardar" llamaba a `histGuardar()`, que no existía en ningún lugar del archivo. La sección de historial se mostraba permanentemente con el mensaje "Sin consultas guardadas aún." porque nunca se guardaba nada.

**Dato interesante:** la infraestructura ya estaba lista — cada cálculo (GDL, ZPN o municipios generales) arma automáticamente un objeto `_lastConsulta` con municipio, giro, trámite y superficie, y el CSS de las tarjetas de historial (`.hist-card`, `.hist-card-nom`, `.hist-card-del`, etc.) ya estaba completo. Solo faltaba el JavaScript.

**Implementado:**
- `histGuardar()` — snapshot del `innerHTML` del panel de resultado + nombre capturado del input.
- `histRender()` — pinta las tarjetas guardadas (máx. 5) o el mensaje de vacío.
- `histCargar(idx)` / `histBorrar(idx)` — restaurar o eliminar una entrada.
- Llamada `histRender();` al final del script (el `<script>` principal vive al cierre del body, así que el DOM ya existe).

**Reposición:** el bloque `hist-section` se movió de después del selector de municipio a ser el primer elemento dentro de `.wrap`, antes del título "Licencia de Funcionamiento".

---

## 3. M05 — Requisitos de Licencia (49f3458)

**Bugs encontrados (3):**

1. El guardado automático (`guardarEnHistorial()`, se ejecuta solo tras cada cálculo) sí funcionaba, pero **el historial nunca se pintaba al cargar la página** — no existía ningún `DOMContentLoaded`/`window.onload` en todo el archivo. Mismo síntoma que tenía M08: al volver al módulo, lo guardado no aparecía.
2. El botón "Borrar todo" llamaba a `limpiarHistorial()` — no existía.
3. El botón "×" de cada tarjeta llamaba a `eliminarEntradaHistorial(i)` — no existía; la función real se llama `eliminarHistorial(idx)`, con un nombre distinto.

**Fix:**
- `document.addEventListener('DOMContentLoaded', renderHistorial);` agregado.
- Nueva función `limpiarHistorial()` (`localStorage.removeItem(HIST_KEY)` + re-render).
- El botón "×" ahora llama a `eliminarHistorial(i)`, el nombre real de la función existente.

**Reposición:** `hist-panel` se movió de después del título "Requisitos de Licencia" a antes de él (justo después del banner de deep-link desde M04).

---

## 4. M11 — Corrida Financiera, Modo Pro (a716b5b)

**Diagnóstico:** sin bugs — guardar, cargar, borrar y el render al cargar la página ya funcionaban correctamente (`renderHistorico()` se llama dentro del IIFE `init()` al final del script).

**Único problema:** el panel "Ingresos históricos — últimas 3 corridas" estaba ubicado *después* de los resultados del cálculo (KPIs, flujo de caja, disclaimer) — solo visible tras hacer scroll o después de correr un nuevo análisis.

**Fix:** el panel se movió al inicio de `#panel-pro`, antes del Bloque 1 (Proyecto y terreno). Renombrado a "Corridas guardadas" para que el texto tenga sentido estando visible desde el inicio, sin depender de haber calculado algo primero.

---

## 5. M10 — Pre-Dictamen IA (ff3b739)

**Diagnóstico:** la implementación de historial de M10 es la más robusta de las 11 (maneja el caso `document.readyState`, guarda automáticamente tras cada análisis, permite nombrar y borrar entradas). Sin bugs de función-no-definida.

**Problema de posición:** el panel "Análisis guardados" vivía dentro de `#seccionPlanoM10`, una sección que solo se muestra *después* de buscar y encontrar un predio — es decir, no era visible al entrar al módulo, contrario a lo pedido.

**Bug de datos encontrado al investigar la reposición:** `m10ReabrirHistEntry(idx)` restauraba la zona guardada en una variable (`window._m10ZonaGuardada`) que **ningún otro código del archivo llegaba a leer**. La función que realmente pinta los parámetros COS/iCOS/CUS/iCUS (`m10RenderizarVeredicto`) lee la variable global `datosZona`, que refleja la **búsqueda más reciente de la sesión actual** — no necesariamente el predio del análisis que se está reabriendo.

**Riesgo concreto:** si un usuario reabría un análisis guardado de un predio sin haber buscado ese mismo predio en la sesión activa, los parámetros normativos mostrados podían corresponder a otro predio, o aparecer en cero si no se había hecho ninguna búsqueda. Dado que el proyecto tiene como regla explícita nunca mostrar datos normativos inventados o incorrectos, se trató como corrección prioritaria, no solo estética.

**Fix aplicado en `m10ReabrirHistEntry()`:**
```js
if(entry.zona_guardada) datosZona = entry.zona_guardada;
if(entry.municipio)     municipioActual = entry.municipio;
if(entry.domicilio)     window._ultimaDireccion = entry.domicilio;
const sec = document.getElementById('seccionPlanoM10');
if(sec) sec.style.display = 'block';
```
Ahora la reapertura de un análisis restaura la zona, el municipio y la dirección exactos que se guardaron con esa entrada, y además fuerza la visibilidad de la sección del veredicto (necesario porque ahora se puede llegar a "Análisis guardados" sin haber hecho una búsqueda previa en la sesión).

**Reposición:** el panel se movió al inicio de `.gu-panel-right` (la columna derecha del layout de dos paneles), visible desde que se entra al módulo.

---

## 6. Módulos verificados sin cambios

| Módulo | Patrón de historial | Estado |
|--------|---------------------|--------|
| M01 — Uso de suelo | Automático, en sidebar de búsqueda | ✅ Correcto |
| M02 — Giro comercial | Automático, en sidebar de búsqueda | ✅ Correcto |
| M03 — Potencial constructivo | Automático, en sidebar de búsqueda | ✅ Correcto |
| M04 — Revisión de planos | Banner de sesión anterior + panel colapsable | ✅ La mejor implementación de las 11 |
| M08 — Calculadora de Derechos | Manual, corregido en sesión anterior (v42.0) | ✅ Correcto |
| M09 — Monitor Normativo / plazos | Automático, dentro de su propia tarjeta | ✅ Correcto |
| M07 — Directorio y Glosario | N/A — módulo de referencia sin cálculos | — No aplica |

---

## 7. Pendientes conocidos

| Tarea | Estado |
|-------|--------|
| Freemium.js integración (M01–M03, M05–M09, M11) | 🔵 STBY |
| Dominio personalizado trazaurbana.mx | ⏳ Pendiente |
| UptimeRobot monitoring | ⏳ Pendiente |
| Formspree ID propio (reemplazar fernandohv74@gmail.com) | ⏳ Pendiente |
| Gasolineras/gaseras ZPN — códigos SCIAN | ⏳ Pendiente |
| Guard municipio M02/M03/M05 | ⏳ Pendiente |

---

*Próxima bitácora: v44.0*
*Generada: 01-sep-2026*
