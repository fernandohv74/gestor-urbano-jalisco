# Bitácora de Desarrollo
## Gestor Urbano Jalisco AMG · v36.0
1 de agosto de 2026

---

## 1. Resumen de la sesión

Bitácora que cubre cuatro sesiones de trabajo (25 jul – 1 ago 2026). Los ejes principales fueron:

1. **M11 Pro — mejoras post-deploy:** cálculo de ICUS y CUS MAX para GDL y Zapopan, botones de acción (Guardar / PDF) e histórico de corridas.
2. **DTUDE normativa — M05/M06/M07/M08:** tasas por derechos de urbanización para los 5 municipios AMG con fuentes verificadas (Ley de Ingresos 2025-2026).
3. **Geocoding — fix HTTP Referer:** la API de Google Maps bloqueaba búsquedas de domicilio en producción. Se implementó proxy server-side en Vercel.
4. **bbox calibración:** extensión de los bounding boxes de Tlajomulco sur y Tlaquepaque norte para evitar resultados fuera de rango.
5. **M02 — VUJ BD y botones:** datos VUJ_BD_LOCAL para TON/TLJ/TLQ, selector de municipio y fallback de nivel CS.
6. **M01 — tres bugs corregidos:** COS/CUS = `*` en Tonalá y Tlajomulco, mensajes GDL-exclusivos apareciendo en todos los municipios, y búsqueda por domicilio en blanco en GDL.

---

## 2. M11 Pro — mejoras post-deploy

### 2.1 ICUS y CUS MAX

**Problema:** M11 Pro mostraba ICUS = 0 y CUS MAX vacío para todos los municipios porque no había lógica de cálculo.

**Solución:**
- ICUS se calcula como `coeficiente_uso × superficie × tarifa_municipal`, con tabla de tarifas por municipio (GDL base $7.50/m², ZPN $8.20/m², TLQ $6.80/m², TLJ $6.50/m², TON $6.90/m²).
- CUS MAX se asigna desde tabla normativa: GDL varía según zona (default 4.0), ZPN 6.0, TLQ 4.0, TLJ 3.2, TON 3.2.
- Bug adicional corregido (`e4c339f`): los valores ICUS→GDL y CUS MAX→ZPN estaban invertidos.

**Commits:** `a6add45`, `e4c339f`, `b41248b`

### 2.2 Botones de acción e histórico

Se agregaron tres controles al panel Pro:

| Control | Función |
|---------|---------|
| 💾 Guardar | Persiste la corrida actual en `localStorage` (historial de 3 corridas) |
| 📄 PDF | Genera PDF de la corrida usando `window.print()` con estilos `@media print` |
| ~~📋 Exportar JSON~~ | Eliminado — redundante con Guardar |

El panel de histórico muestra las últimas 3 corridas con fecha, tipo de proyecto y TIR.

**Commits:** `a7b392e`, `5e6af58`, `5069031`

---

## 3. DTUDE — M05/M06/M07/M08 todos los municipios AMG

### 3.1 Problema

M05, M06, M07 y M08 solo tenían DTUDE para Guadalajara. Los demás municipios no mostraban datos de derechos de urbanización.

### 3.2 Valores finales por módulo

**M08 — DTUDE (Derechos de Traslado de Usos y Destinos del Suelo):**

| Municipio | Valor (2025/2026) | Fuente |
|-----------|------------------|--------|
| GDL | En código previo | PDU GDL |
| ZPN | $1,804 (= $1,495 trámite + $309 formato) | RETyS ZPN tramites/32 |
| TLQ | $1,526 | Ley de Ingresos TLQ 2025 |
| TLA | $2,100 | Ley de Ingresos TLJ 2026 |
| TON | $2,780 | Ley de Ingresos TON 2026 |

**Correcciones intermedias registradas:**
- `d78f9e7`: TLQ tenía valor con separador de miles erróneo → $1,526 (sin formato)
- `65b3608`: TLA ($2,100) y TON ($2,780) corregidos con Ley de Ingresos
- `347840d`: TLQ y TLA actualizados a valores 2026

**M05/M06 — DTUDE ZPN:** corregido de valor genérico a $1,804 (desglose real: $1,495 trámite + $309 formato impreso).

**M07 — Fuentes RETyS ZPN:** se agregaron los links directos `tramites/34` y `tramites/29` (DTUDE en el portal de Zapopan).

**Commits:** `449456b`, `27378b1`, `adb432b`, `cfcb937`, `d78f9e7`, `65b3608`, `347840d`

---

## 4. Geocoding — fix HTTP Referer

### 4.1 Síntoma

La búsqueda de domicilio fallaba silenciosamente en producción (`gestorurbanoamg.vercel.app`) pero funcionaba en local. El error real era HTTP 403 de la API de Google Maps.

### 4.2 Causa raíz

La API key de Google Maps tiene restricción de HTTP Referer (solo permite requests desde dominios autorizados). Cuando el `fetch` se hace desde JavaScript en el navegador, la cabecera `Referer` se envía automáticamente como el origen del sitio. Aunque el dominio estaba autorizado, la restricción `no-referrer-when-downgrade` causaba que en algunos contextos la cabecera llegara vacía o incorrecta al servidor de Google.

### 4.3 Solución

**Paso 1 — Fix cliente (f9aafdc):** cambiar `referrerPolicy: 'no-referrer'` + logging detallado para diagnosticar.

**Paso 2 — Proxy server-side (c53f6ff):** se creó (o verificó) la función `api/maps-proxy.js` en Vercel que actúa como intermediario. El cliente llama al proxy en `/api/maps-proxy`, el proxy añade la API key y reenvía a Google con el Referer correcto del servidor, evitando la restricción del lado del cliente.

Módulos afectados: **M01, M02, M03, M10** (todos los que tienen búsqueda por domicilio).

**Commits:** `a82ec27`, `f9aafdc`, `c53f6ff`

---

## 5. bbox calibración — Tlajomulco sur y Tlaquepaque norte

### 5.1 Problema

Direcciones en la zona sur de Tlajomulco de Zúñiga (fraccionamientos de nueva creación) y en la zona norte de Tlaquepaque (colindancia con GDL) eran rechazadas por el geocoder porque caían fuera de los bounding boxes configurados.

### 5.2 Ajustes

| Municipio | Parámetro | Antes | Después |
|-----------|-----------|-------|---------|
| Tonalá (bbox oeste) | lng min | -103.270 | -103.300 |
| Tlajomulco sur | lat min | anterior | expandido |
| Tlaquepaque norte | lat max | anterior | expandido |

Módulos afectados: **M01, M02, M03, M10**.

**Commit:** `a82ec27`, `d3c55c0`

---

## 6. M02 — VUJ_BD_LOCAL + botones municipio

### 6.1 Datos VUJ_BD_LOCAL TON/TLJ/TLQ

**Problema:** M02 no mostraba datos normativos para Tonalá (munId=101), Tlajomulco (munId=97) y algunas zonas de Tlaquepaque (munId=98 zona MR). El resultado era `uso_permitido = ''` y nivel CS sin calcular.

**Solución:** se agregaron entradas en `VUJ_BD_LOCAL` para:
- `[97]` TLJ: zonas MB/MD/MC/MR con valores REZ Jalisco
- `[98]` TLQ: zona MR con `uso_permitido` completado
- `[101]` TON: zonas MB/MD/MC/MR con valores REZ Jalisco
- ZAP_A_CS: entradas de zona CS expandidas para Zapopan

Bug adicional corregido (`eea48ae`): el array `[98]` no estaba cerrado correctamente antes de iniciar `[97]` → syntax error silencioso en el JSON.

### 6.2 Fallback nivelCSPer

**Problema:** cuando `uso_per` venía vacío del servidor VUJ, `nivelCSPer()` retornaba `undefined` y no se mostraba el nivel CS en el resultado.

**Fix:** se implementó fallback que deriva `nivelCSPer` directamente desde la clave de zona cuando `uso_per` es vacío.

### 6.3 Botones municipio — selector CSS

**Problema:** todos los módulos usaban el selector `.muni-btn` para el estado activo de los botones de municipio, pero el design system usa `.gu-muni-btn`. El botón seleccionado no mostraba estado visual activo al cargar la página.

**Fix (`5ccc7b6`, `2c5a1de`):**
- Cambiar selector `.muni-btn` → `.gu-muni-btn` en M02 y todos los módulos
- Aplicar clase `active` al botón correspondiente al municipio inicial en `DOMContentLoaded`

Módulos afectados: **todos (M01–M11)**.

**Commits:** `dcc4398`, `eea48ae`, `1a2373b`, `b87ca1f`, `5ccc7b6`, `2c5a1de`

---

## 7. M01 — tres bugs corregidos

### 7.1 COS/CUS = `*` para Tonalá y Tlajomulco zonas M

**Síntoma:** en zonas mixtas (MB/MD/MC/MR) de Tonalá y Tlajomulco, M01 mostraba COS = `*` y CUS = `*` en lugar de valores numéricos.

**Causa raíz:** `vujBDLocalNormas()` buscaba en `VUJ_BD_LOCAL[munId]` — los municipios con `munId=97` (TLJ) y `munId=101` (TON) no tenían entradas en ese objeto. La función retornaba `[]` → `cos=0` → se mostraba `*`.

**Fix (`bf4d6d2`):** se agregaron `VUJ_BD_LOCAL[97]` y `VUJ_BD_LOCAL[101]` con las 4 zonas mixtas (MB/MD/MC/MR) y valores REZ Jalisco:

| Zona | COS | CUS |
|------|-----|-----|
| MB · Mixto Barrial | 0.80 | 2.40 |
| MD · Mixto Distrital | 0.80 | 2.40 |
| MC · Mixto Central | 0.80 | 3.20 |
| MR · Mixto Regional | 0.80 | 3.20 |

Fuente: REZ Jalisco, Cuadros 45/46 (ya validados en M03).

### 7.2 Mensajes "RP dinámica" y atribución GDL apareciendo en todos los municipios

**Síntoma:** el bloque `⚠️ RP dinámica: Según el Reglamento de Gestión Integral de GDL…` y el texto `— Reglamento de Gestión del Desarrollo Urbano para el Municipio de Guadalajara (reforma Abril 2025)` aparecían en Tonalá, Tlajomulco y cualquier municipio.

**Causa raíz:** las tres expresiones template que generan esos mensajes no tenían condición de municipio — se renderizaban siempre.

**Fix (`e162170`):** tres condicionales `municipioActual==='guadalajara'? ... : ''` en:
1. Bloque RP dinámica completo en `renderizarResultado()`
2. Atribución en `c_otros` dentro de `renderizarResultado()`
3. Atribución en `c_otros` dentro de `selPoligono()` (tab de polígono)

### 7.3 Búsqueda por domicilio en GDL retorna página en blanco

**Síntoma:** al buscar una dirección en Guadalajara, el panel de resultados quedaba en blanco — sin error visible para el usuario.

**Causa raíz:** en `procesarCoordenadas()`, después del bloque que maneja el fallback VUJ (`gdlFallbackVUJ()`), había un `throw new Error('No se encontró zonificación…')` **incondicional** — se ejecutaba siempre después del bloque `if(window._wmsNetworkError)`, incluso cuando el fallback ya había llenado `zonas[]` con éxito.

```javascript
// ANTES (buggy):
if(!zonas.length){
  if(window._wmsNetworkError){
    const _fb = await gdlFallbackVUJ(lat, lng);
    zonas.push(_fb);              // fallback OK
    window._gdlUsandoFallback = true;
  }
  throw new Error('No se encontró…'); // ← siempre se ejecutaba, descartaba el fallback
}

// DESPUÉS (fix):
if(!zonas.length){
  if(window._wmsNetworkError){
    const _fb = await gdlFallbackVUJ(lat, lng);
    if(!_fb) throw new Error('GDL GeoServer no responde…');
    zonas.push(_fb);
    window._gdlUsandoFallback = true;
  } else {
    throw new Error('No se encontró zonificación. Verifica que la dirección esté en Guadalajara.');
  }
}
```

**Nota:** este bug existía desde antes de esta sesión (confirmado en `bak_10jul.html`). No fue introducido en ninguna sesión reciente.

**Fix (`d232c0c`):** mover el `throw` al `else` del `if(_wmsNetworkError)`.

**Commits:** `bf4d6d2`, `e162170`, `d232c0c`

---

## 8. GeoServer GDL — diagnóstico de estado

Durante la sesión del 31 jul / 1 ago se confirmó que el GeoServer de Guadalajara (`visorgeoserver.guadalajara.gob.mx`) está **caído externamente** — `curl` retorna exit 28 (timeout) y PowerShell también timeout.

El servidor VUJ (`api-visorurbano.jalisco.gob.mx`) fue verificado: puerto 443 TCP responde (`TcpTestSucceeded=True`), pero el endpoint `/geoserver/ows` también tiene alta latencia — GetCapabilities timeout en 60 s.

**Impacto en M01:**
- Las búsquedas por coordenadas en Guadalajara usan automáticamente el fallback `gdlFallbackVUJ()` (VUJ con `municipio_id=39`)
- Se muestra una nota `⚠️ Usando VUJ como respaldo (GeoServer GDL no disponible)` al usuario
- Cuando GeoServer GDL vuelva a funcionar, el flujo normal retoma sin cambios de código

---

## 9. Commits generados

| Hash | Fecha | Descripción |
|------|-------|-------------|
| `f0c4d13` | 25 jul | fix index: quitar stat card '23 Módulos planificados' |
| `a6add45` | 27 jul | feat M11 Pro: ICUS y CUS MAX para Zapopan |
| `e4c339f` | 27 jul | fix M11 Pro: ICUS→GDL, CUS MAX→ZPN — asignación correcta |
| `b41248b` | 28 jul | feat M11 Pro: ICUS calcula desde coeficiente × sup × tarifa municipal |
| `449456b` | 29 jul | fix M05/M06: DTUDE ZPN corregido a $1,804 |
| `27378b1` | 29 jul | fix M07: agregar fuentes RETyS ZPN tramites/34 y tramites/29 |
| `adb432b` | 29 jul | feat M08: DTUDE para ZPN/TLQ/TLA/TON — 5 municipios completos |
| `cfcb937` | 29 jul | feat GU_Deploy M08: DTUDE — sync con producción |
| `d78f9e7` | 29 jul | fix M08: DTUDE TLQ corregido a $1,526 |
| `65b3608` | 29 jul | fix M08: corregir DTUDE TLA ($2,100) y TON ($2,780) |
| `347840d` | 29 jul | fix M08: actualizar DTUDE TLQ y TLA a valores 2026 |
| `a7b392e` | 29 jul | feat M11: botones Guardar / PDF + histórico últimas 3 corridas |
| `5e6af58` | 29 jul | fix M11: botones de acción al fondo del panel Pro |
| `5069031` | 29 jul | fix M11: eliminar botón Exportar JSON |
| `a82ec27` | 30 jul | fix geocoding: expandir bbox oeste Tonalá |
| `f9aafdc` | 30 jul | fix geocoding: referrerPolicy no-referrer + logging |
| `c53f6ff` | 30 jul | fix GU_Deploy geocoding: proxy server-side (HTTP Referer) |
| `d3c55c0` | 30 jul | fix bbox: Tlajomulco sur y Tlaquepaque norte |
| `dcc4398` | 30 jul | fix M02: VUJ_BD_LOCAL TON/TLJ/TLQ, ZAP_A_CS, bbox Tonalá |
| `eea48ae` | 30 jul | fix M02 syntax: cerrar array VUJ_BD_LOCAL[98] |
| `1a2373b` | 30 jul | fix M02 VUJ: fallback nivelCSPer desde clave de zona |
| `b87ca1f` | 31 jul | fix M02 deploy: sincronizar producción con GU_Deploy |
| `5ccc7b6` | 31 jul | fix M02 botones: selector .gu-muni-btn + quitar active inicial |
| `2c5a1de` | 31 jul | fix botones municipio todos los módulos |
| `bf4d6d2` | 31 jul | fix M01 COS/CUS: VUJ_BD_LOCAL[97] TLJ y [101] TON |
| `e162170` | 31 jul | fix M01: RP dinámica y atribución GDL — solo para Guadalajara |
| `d232c0c` | 31 jul | fix M01 GDL: fallback VUJ descartado por throw incondicional |

**Total:** 27 commits · 7 días

---

## 10. Parámetros de la sesión

| Parámetro | Valor |
|-----------|-------|
| Versión | v36.0 |
| Fecha | 1 ago 2026 |
| Período cubierto | 25 jul – 31 jul 2026 |
| Sesión previa | v35.0 (25 jul 2026 — M11 Corrida Financiera + fix deploy) |
| Rama | master + sincronización a main (Vercel) |
| Archivos modificados en producción | M01, M02, M05, M06, M07, M08, M11, index.html |
| Python disponible | Python 3.14.5 ✓ |
| GeoServer GDL | CAÍDO externamente — VUJ fallback activo |

---

## 11. Estado de módulos al 1 ago 2026

**11 módulos activos (M01–M11)**

| Mód | Archivo | Estado | Notas |
|-----|---------|--------|-------|
| M01 | GestorUrbano_M01_3.html | ✅ Producción | VUJ_BD_LOCAL TON/TLJ, RP dinámica GDL-only, fallback fix |
| M02 | GestorUrbano_M02_4.html | ✅ Producción | VUJ_BD_LOCAL TON/TLJ/TLQ, botones muni, fallback nivelCS |
| M03 | GestorUrbano_M03_3.html | ✅ Producción | bbox calibrado |
| M04 | GestorUrbano_M04_3.html | ✅ Producción | Sin cambios recientes |
| M05 | GestorUrbano_M05_2.html | ✅ Producción | DTUDE ZPN corregido |
| M06 | GestorUrbano_M06_1.html | ✅ Producción | DTUDE ZPN corregido |
| M07 | GestorUrbano_M07_1.html | ✅ Producción | Fuentes RETyS ZPN agregadas |
| M08 | GestorUrbano_M08_1.html | ✅ Producción | DTUDE 5 municipios completos |
| M09 | GestorUrbano_M09_1.html | ✅ Producción | Sin cambios recientes |
| M10 | GestorUrbano_M10_1.html | ✅ Producción | bbox calibrado |
| M11 | GestorUrbano_M11_1.html | ✅ Producción | ICUS/CUS MAX, botones, histórico corridas |

---

## 12. Pendientes arrastrados

- Integrar `gu-freemium.js` en M04, M05, M06, M08, M10
- Reactivar `guVerificarLimite()` en M04 antes de salida de fase pruebas
- Custom domain `trazaurbana.mx` en Vercel
- M11 Pro: gráfico de flujo de caja (Chart.js o Canvas)
- M11 Pro: exportar corrida a XLSX
- Benchmarks de costo/m² por municipio AMG
- DTUDE M05/M06 para TLJ, TLQ, TON (solo ZPN fue completado en esta versión)
- GeoServer GDL: verificar cuando vuelva a funcionar — deshabilitar mensaje de fallback
- Catastro VUJ:predios para ZPN/TLJ/TLQ/TON: posible como WMS tile (decisión diferida)

---

*Bitácora generada: 1 ago 2026 · Fernando H.*
