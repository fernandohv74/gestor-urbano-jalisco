# Bitácora — Gestor Urbano Jalisco AMG
**Versión activa:** v3.2  
**Archivos afectados:** `GestorUrbano_M01_3.html`  
**Fecha:** 02 jul 2026

---

## MÓDULOS ACTIVOS — Estado real al 02 jul 2026

| Módulo | Archivo | Estado | Descripción |
|--------|---------|--------|-------------|
| index | index.html | ✅ Activo | Portal principal |
| M01 | GestorUrbano_M01_3.html | ✅ Activo · ZPN en calibración | Uso de suelo + mapa GDL/ZPN/TLQ/TLA/TON |
| M02 | GestorUrbano_M02_4.html | ✅ Activo | Viabilidad rápida de giro comercial |
| M03 | GestorUrbano_M03_3.html | ✅ Activo (GDL+ZPN) | Potencial constructivo por predio |
| M04 | GestorUrbano_M04_3.html | ✅ Activo | Asistente IA normativo (Claude API) |
| M05 | GestorUrbano_M05_2.html | ✅ Activo (GDL+ZPN) | Requisitos licencia de construcción |
| M06 | GestorUrbano_M06_1.html | ✅ Activo | Simulador licencia de funcionamiento |
| M07 | GestorUrbano_M07_1.html | ✅ Activo | Directorio + Glosario + Fuentes |
| M08 | GestorUrbano_M08_1.html | ✅ Activo | Calculadora costos de construcción |
| M09 | GestorUrbano_M09_1.html | ✅ Activo | Monitor Normativo (alertas vencimiento) |
| M10 | GestorUrbano_M10_1.html | ✅ Activo | Pre-dictamen de Uso de Suelo |

**Nota:** M15 (versión antigua del monitor normativo) está en la carpeta `06 de junio v1/` — ya fue reemplazado por M09_1 con el mismo contenido en la carpeta activa `11 de junio v1/`.

---

## Sesión 02 jul 2026 — M01 controles exclusivos GDL

### Objetivo
Ocultar automáticamente el botón "3D — iCUS 56°" y el bloque de criterio 56° cuando el municipio activo NO es Guadalajara. El cambio debe ser inmediato, tanto al cambiar municipio manualmente como al cargar desde historial.

---

### Nueva función `_syncBotonesGDL()`

Añadida antes de `limpiarMedicion56`:

```javascript
function _syncBotonesGDL(){
  var esGDL = municipioActual === 'guadalajara';
  var btn3D = document.getElementById('btn3DIcus');
  var grd   = document.getElementById('grid3DBtns');
  var btn56 = document.getElementById('btnMedir56');
  if(btn3D) btn3D.style.display           = esGDL ? '' : 'none';
  if(grd)   grd.style.gridTemplateColumns = esGDL ? '1fr 1fr' : '1fr';
  if(btn56) btn56.style.display           = esGDL ? '' : 'none';
  if(!esGDL){
    var res56 = document.getElementById('medir56Result');
    var blq56 = document.getElementById('bloque56');
    if(res56){ res56.style.display='none'; res56.textContent=''; }
    if(blq56) blq56.style.display = 'none';
  }
}
```

**IDs HTML añadidos:**
- `id="btn3DIcus"` en el botón "3D — iCUS 56°"
- `id="grid3DBtns"` en el `<div>` contenedor de los dos botones 3D
- El botón "Medir 56°" ya tenía `id="btnMedir56"`

---

### Integración en dos puntos de entrada

**1. `selMunicipio()` — cambio manual:**
```javascript
municipioActual = id;
zonasVUJ = [];
limpiarMedicion56();
_syncBotonesGDL();   // ← añadido
document.querySelectorAll('.gu-muni-btn').forEach(b=>b.classList.remove('active'));
```

**2. Handler de historial (~línea 941):**
```javascript
municipioActual = munHistorial;
limpiarMedicion56();
_syncBotonesGDL();   // ← añadido
document.querySelectorAll('.muni-btn').forEach(x=>x.classList.remove('active'));
```

---

### Fix: criterio 56° aparecía en volumétrico 3D de Zapopan

**Causa:** `_anchoCalle56` retenía el valor medido en GDL al cambiar municipio.  
**Solución en `actualizar3D()`:**

```javascript
// Criterio 56° — solo GDL (Norma Urbana N°3 PDUCP GDL)
const ancho56 = esGDL ? (_anchoCalle56 || 0) : 0;
const h56     = ancho56 > 0 ? Math.round((ancho56 + rf) * Math.tan(56*Math.PI/180) * 100)/100 : 0;
const excede56 = h56 > 0 && alturaTotal > h56;
```

---

### Simplificación de `actualizar56()`

Se eliminó la lógica duplicada de show/hide dentro de `actualizar56()`. Ahora solo llama a `_syncBotonesGDL()` y hace early return para municipios no-GDL:

```javascript
if(!datosZona){ el.style.display = 'none'; return; }
_syncBotonesGDL();
if(municipioActual !== 'guadalajara'){ return; }
if(_anchoCalle56 <= 0){
  // ... resto del bloque
```

---

### Respaldo guardado

`GestorUrbano_M01_3_bak_02jul.html` — copia previa a todos los cambios de esta sesión.

---

## Nota sobre sesiones anteriores perdidas en compactación de contexto

El historial de conversaciones previas confirmó los siguientes módulos como **ya completados** en sesiones anteriores (no son pendientes):

| Módulo | Estado confirmado |
|--------|-------------------|
| M03 | ✅ Completo — normas de construcción GDL+ZPN activo, TLA/TLQ/TON pendiente de datos PDU |
| M05 | ✅ Completo — deep link M05→M08 implementado (sesión 24 jun) |
| M06 | ✅ Completo — simulador licencia funcionamiento con catálogo GDL+ZPN |
| M07 | ✅ Completo — directorio (26 organismos), glosario (48 términos), fuentes (35) |
| M08 | ✅ Completo — calculadora costos + historial + refrendo |
| M09 | ✅ Completo — Monitor Normativo (antes designado M15) |
| M10 | ✅ Completo — Pre-dictamen PDF |

M18 (Estimador de plusvalía normativa) — mencionado en BITACORA_v3.0 como módulo planeado, **no existe como archivo en la carpeta activa**. Pendiente de implementar.

---

## APIS ACTIVAS

| API | Uso | Módulo |
|-----|-----|--------|
| Google Maps Geocoding API | Geocodificación de domicilios | M01 |
| Google Maps JavaScript API | Mapa interactivo + marcadores | M01 |
| GeoServer WMS/WFS Jalisco | Capas de zonificación | M01 |
| ArcGIS Zapopan PPDU | Consulta zona por coordenada | M01 |
| Anthropic API (Claude Sonnet) | Asistente normativo IA | M04 |

---

## Pendientes conocidos al 02 jul 2026

| Módulo | Pendiente |
|--------|-----------|
| M01 | Calibración ZPN — en curso |
| M03 | TLA, TLQ, TON deshabilitados — pendiente datos PDU |
| M18 | Estimador de plusvalía normativa — por implementar |

---

*Bitácora generada: 02 jul 2026 · Fernando H.*
