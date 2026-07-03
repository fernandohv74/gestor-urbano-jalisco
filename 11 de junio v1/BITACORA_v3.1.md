# Bitácora — Gestor Urbano Jalisco AMG
**Versión activa:** v3.1  
**Archivos:** `GestorUrbano_M01_3.html` · `GestorUrbano_M03_3.html`  
**Última actualización:** 25 jun 2026

---

## Sesión 25 jun 2026 — M03 layout + límite predios

### Bug: `ideBlk` y `nivBlk` salían de la tarjeta (encimado visual)
- **Causa raíz:** `</div>` extra en el bloque de Vista Aérea (línea ~1891) cerraba el div `.pc` prematuramente. El bloque de IDE y la tabla nivel por nivel quedaban como hijos directos del `preds-grid`, creando columnas fantasma en pantallas anchas.
- **Fix:** Eliminado el `</div>` sobrante entre el cierre del flex container y el cierre del wrapper de Vista Aérea.
- **Archivo:** `GestorUrbano_M03_3.html` línea ~1891

### Decisión UX: límite de predios = 2
- Se subió primero a 4 (para resolver el falso "Máximo 3 predios"), luego se redujo a 2 por criterio de UX: la comparativa entre predios es una decisión binaria; 3+ tarjetas crean ruido visual y el grid se rompe en pantallas estándar.
- **Cambios aplicados en 3 lugares:**
  - Sidebar label: `(máx. 2)`
  - Instrucciones "¿Cómo usar?": `Hasta 2 predios simultáneos`
  - Validación JS: `if(predios.length>=2){...Máximo 2 predios...}`

---

## Sesión previa (jun 2026) — M01 y M03 múltiples bugs

### M03 — Vista aérea: RF no mostraba
- **Causa:** VUJ API para GDL devuelve `restriccion_frontal=null` en algunas zonas (H2). El valor quedaba en `rest_f1='Ver Plano de Alineamiento'` (no numérico) → `e.rest_f=0` → no se dibujaba banda RF.
- **Fix:** Se pasaron los strings crudos (`p.zona.rest_f1/l1/p1`) a `generarSVGPredi` y `generarLeyendaPredi`. Cuando el valor numérico es 0 pero existe texto, se muestra anotación gris en el SVG y texto en la leyenda.

### M03 — COS no proporcional en Vista Aérea
- **Causa:** `generarSVGPredi` no aplicaba el coeficiente COS al rectángulo azul — lo dibujaba ocupando toda el área disponible.
- **Fix:** Se agregó `cosFactor = Math.sqrt(cos)` para escalar el rectángulo de construcción de forma que su área sea proporcional al COS (raíz cuadrada para que ambas dimensiones escalen proporcionalmente).

### M03 — Input superficie: solo admitía 1 dígito
- **Causa:** `oninput` llamaba `renderTodo()` en cada keystroke, destruyendo y recreando el `<input>` element → el foco se perdía tras cada tecla.
- **Fix:** Eliminado `oninput`. Se mantiene solo `onchange` + handler de tecla Enter. Se agregó debounce de 350ms con restauración de foco en `cambiarSup()`.

### M03 — Default 300m² en input de superficie
- **Causa:** `actualizarSim(300)` en M01 línea ~3847 enviaba 300m² a localStorage al inicializar. M03 lo leía y precargaba ese valor.
- **Fix:** Cambiado a `actualizarSim(0)` en M01.

### M03 — Toggle CUS/CUS+iCUS no aparecía
- **Causa:** `sup=0` → `nivelIcus=[]` → `_hasIcus=false`. El toggle requiere superficie > 0 para calcular los niveles iCUS.
- **Relación:** Dependía del bug de 300m² anterior; corregido al mismo tiempo.

### M01 — Cajones comerciales: detectar CS y mostrar "No aplica"
- **Fix:** Se agregó función `_detectCs()` en `_renderCajones` que analiza la clave de zona (`_clave_bd`, `uso`, `ppp`) y los campos de usos permitidos/condicionados para determinar si aplica CS1/CS2/CS3.
  - H2 → CS1 condicionado, CS2/CS3 no aplica
  - CS1/CSV → solo CS1
  - CS2 → CS1 + CS2
  - CS3/CS4 → CS1 + CS2 + CS3
- **También:** Se replicó la misma lógica como `_csAplF` dentro de `descargarFicha()` (IIFE independiente) para que la ficha descargable también muestre "No aplica" correctamente.

### M01 — Ficha descargable: quitar logo "Gestor Urbano Jalisco"
- **Fix:** Se eliminó el `<div class="hdr-icon">` con emoji y el div `"Gestor Urbano Jalisco"`.
- Reemplazado por:
  - Título: `Ficha Informativa`
  - Subtítulo: `Consulta normativa de predio · AMG · Módulo 01`
  - `<title>` del documento: `Ficha Informativa — Consulta normativa de predio`

### M03 — `cargarDesdeM01`: fallback de superficie
- **Fix:** Si `datos.sup=0`, se intenta usar `zona.sup_real_predio` o `zona.sup_min / zona.superficie_minima` antes de dejar en 0. Evita que el predio importado de M01 llegue sin superficie cuando M01 tenía datos de lote.

---

## Pendientes conocidos

| Módulo | Pendiente |
|--------|-----------|
| M01 | Calibración ZPN (Zapopan) — en curso |
| M03 | Municipios TLA, TLQ, TON deshabilitados — pendiente datos PDU |
| M03 | Historial: click en historial agrega predio vía `agregarPredio()` — puede interactuar con `cargarDesdeM01` al cargar |

---

## Parámetros técnicos de referencia

| Variable | Valor |
|----------|-------|
| Tarifa ICUS GDL | $1,516/m² excedente (Art. 37 Ley de Ingresos GDL) |
| Tarifa ICUS ZPN | $1,541/m² + $14,830 ECPD fijo (Art. 93 Ley de Ingresos ZPN 2026) |
| `VUJ_MUNICIPIOS` | guadalajara=39, zapopan=120, tlaquepaque=98, tlajomulco=97, tonala=101 |
| `VUJ_BD_LOCAL` | Solo ZPN (120) y TLQ (98) — GDL (39) sin entrada local |
| localStorage key M01→M03 | `GU_m01_a_m03` (se elimina tras leer) |
| localStorage key historial M03 | `gu_m03_hist` |
| Límite predios M03 | 2 simultáneos |
