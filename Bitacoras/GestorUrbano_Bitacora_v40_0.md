# Gestor Urbano Jalisco AMG — Bitácora v40.0

**Período:** 18 ago – 28 ago 2026
**Rama:** master + sincronización a main (Vercel)
**Sesión previa:** v39.0 (15 ago 2026)

---

## Resumen ejecutivo

Sesión intensa de mejoras a M01 (Consulta de Predio) en dos ejes: (1) reorganización visual y UX del panel de resultados y simulador, y (2) correcciones de datos normativos para Zapopan. Se incorporaron también correcciones menores a M02 (giro comercial). Total: 13 commits en 10 días.

---

## 1. Commits cubiertos (orden cronológico)

| Hash | Fecha | Descripción |
|------|-------|-------------|
| `a4c989a` | 18 ago | fix M02: ranking de relevancia en detectarGiroIA |
| `a6b6c93` | 18 ago | fix M02: stem mínimo 5 chars — elimina falsos positivos "dent"→"dentro" |
| `b664cea` | 18 ago | feat M01 3D iCUS+56°: agregar slider 'distribuye tus m²' al sidebar |
| `d46a91b` | 19 ago | fix M01: mover bloque56 a después de cajones de estacionamiento |
| `21f6e7b` | 19 ago | fix M01: definir --teal en gu-design-system — corrige texto 'Con iCUS' en negro |
| `531d235` | 20 ago | refactor M01: mover simPanel del sidebar izquierdo al panel derecho |
| `de025a6` | 20 ago | feat M01: layout 2 col — resultados + simulador al mismo nivel bajo el mapa |
| `2b0f97b` | 20 ago | fix M01: legibilidad etiquetas simPanel y headers resultPanel |
| `d7012fe` | 20 ago | fix M01: legibilidad, tooltips y validación de municipio |
| `ce3ae25` | 20 ago | fix M01: hint Zapopan usos — 12px/600/text2, menciona coeficientes y definición |
| `c79776c` | 24 ago | feat M01: fraseSimple muestra iCUS e iCOS cuando aplican (Opción B) |
| `dcff57e` | 27 ago | fix M01: distrito Zapopan — ArcGIS WFS ya tenía el campo, faltaba extraerlo |
| `807f1c2` | 27 ago | fix M01: ZPN-9A agregado a lookup de distritos (8 polígonos ZCR/ZR Bosque Primavera) |

---

## 2. M02 — correcciones a detectarGiroIA (`a4c989a`, `a6b6c93`)

### 2.1 Ranking de relevancia (`a4c989a`)
La función `detectarGiroIA()` no priorizaba los resultados; todos los matches tenían el mismo peso. Se añadió un sistema de ranking por relevancia para que el giro más probablemente correcto aparezca primero.

### 2.2 Stem mínimo 5 caracteres (`a6b6c93`)
El stem (raíz de palabra) de longitud corta generaba falsos positivos. Ejemplo: "dent" (stem de "dentro") coincidía con "dental". Se estableció longitud mínima de 5 caracteres para considerar un stem válido.

---

## 3. M01 — slider 3D iCUS+56° (`b664cea`)

Se agregó un slider interactivo "distribuye tus m²" al sidebar del panel 3D. Permite al usuario distribuir visualmente el área construible (CUS + iCUS) entre niveles y ver el efecto en la maqueta 3D, incluyendo la restricción del criterio de 56° (Norma Urbana N°3 GDL).

---

## 4. M01 — reorganización visual (`d46a91b`, `21f6e7b`, `531d235`, `de025a6`)

### 4.1 Reordenamiento bloque56 (`d46a91b`)
El bloque del criterio 56° aparecía antes de la sección de cajones de estacionamiento, interrumpiendo el flujo lógico. Se movió a después de cajones para que la secuencia sea: coeficientes → restricciones → cajones → criterio 56°.

### 4.2 Variable CSS --teal indefinida (`21f6e7b`)
El texto "Con iCUS" en el resultPanel aparecía en negro porque `--teal` no estaba definido en `gu-design-system.css`. Se agregó:
```css
--teal: #0D9488;
--teal-light: #14B8A6;
```

### 4.3 simPanel movido al panel derecho (`531d235`)
El Simulador de potencial constructivo vivía en el sidebar izquierdo (columna de búsqueda), lo que lo hacía poco visible y lo encimaba con el mapa. Se trasladó al panel derecho, debajo del mapa.

### 4.4 Layout 2 columnas bajo el mapa (`de025a6`)
Se envolvió el `resultPanel` y el `simPanel` en un contenedor `#bottomSplit`:
```html
<div id="bottomSplit" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start">
```
Resultado: resultados normativos y simulador quedan al mismo nivel visual, simétricos, aprovechando el ancho completo.

---

## 5. M01 — legibilidad, tooltips y validación (`2b0f97b`, `d7012fe`)

### 5.1 simPanel: etiquetas y encabezado (`2b0f97b`)
- Encabezado "Simulador de potencial constructivo": 16px / 700 (antes imperceptible)
- Label superficie terreno: 13px, legible
- Contenedor entrepiso: `display:inline-flex`, input acotado a 72px (antes demasiado ancho)
- Label entrepiso: "Escribe la altura del entrepiso" (antes genérico)
- Botones 3D: "Ver en 3D — CUS" / "Ver en 3D — iCUS 56°" (antes solo "3D — CUS")
- Bloque56 título: 14px / body: 12px (antes casi ilegibles)

### 5.2 Headers de resultPanel (`2b0f97b`)
`.gu-rcard-hdr` (secciones Ubicación, Plan Parcial, Coeficientes, Restricciones, Alertas): `font-size: 12px / font-weight: 600` — antes 9px, prácticamente invisible.

### 5.3 Cajones — label descriptivo (`d7012fe`)
El input de cajones de estacionamiento no indicaba para qué era. Cambio:
- Antes: `m²/vivienda:`
- Después: `m² por vivienda (necesario para calcular cajones):`

### 5.4 "Estado normativo" → "Restricción patrimonial" (`d7012fe`)
La etiqueta "Estado normativo" era ambigua. Se renombró a "Restricción patrimonial" que describe exactamente lo que muestra: si el predio tiene o no restricción por parte del INAH/SECULTA. `.gu-sem-label` subió de 9px a 11px/600.

### 5.5 IDE — tooltip interactivo (`d7012fe`)
El campo "Índice de Edificación (IDE)" en la ficha de coeficientes no tenía `onclick`, a diferencia de COS, CUS, iCOS, iCUS, altura y retranqueo. Se agregó:
- `onclick="mostrarInfo('ide','${zona.ide||""}',event)"`
- `<span class="gu-coef-tag">ⓘ</span>`
- Nuevo caso `ide` en la función `mostrarInfo()` con ejemplo dinámico: `predio 500m² con IDE X → máximo N viviendas`

### 5.6 Validación de municipio en búsqueda (`d7012fe`)
`municipioActual` se inicializaba como `'guadalajara'`, lo que permitía buscar una dirección sin seleccionar municipio. Cambios:
- `let municipioActual = '';` (vacío al cargar)
- Nota inicial: "Selecciona un municipio para empezar"
- Guard en `buscar()`: si no hay municipio, muestra error "⚠️ Selecciona primero el municipio" y aborta

---

## 6. M01 Zapopan — UX de usos (`ce3ae25`)

### 6.1 Hint "Haz clic en un uso"
En el path Zapopan + BD local (`tieneBDUsos=true`), el texto de ayuda bajo los chips de uso era:
```
👈 Haz clic en un uso para ver su definición
```
en 10px / `--text3` (casi invisible). Se cambió a:
```
👈 Haz clic en un uso para ver coeficientes y definición
```
en **12px / font-weight:600 / `--text2`**. El texto ahora menciona "coeficientes" porque al hacer clic en un chip Zapopan ya se llenaba `coefsUsoPanel` con los coeficientes específicos del uso (COS, CUS, restricciones), pero el usuario no lo sabía.

---

## 7. M01 — "En términos simples": párrafo iCUS/iCOS (`c79776c`)

### 7.1 Problema
El bloque "🏗️ En términos simples" solo mencionaba COS y CUS (huella y construcción cubierta), ignorando iCOS e iCUS aunque la zona los tuviera.

### 7.2 Solución (Opción B — párrafo secundario condicional)
Se agregaron dos líneas condicionales después del texto principal:
```javascript
${icus>0?`<br>🔵 Además, la zona permite <strong>${fmt(sup*icus)} m²</strong> de construcción
  indirecta (iCUS ${icus}) — sótanos, estacionamientos o cuartos de servicio
  que no se contabilizan como área habitable.`:''}
${icos>0?`<br>🔵 Más <strong>${fmt(sup*icos)} m²</strong> de construcción abierta
  (iCOS ${icos}) — terrazas cubiertas o áreas techadas sin cerramiento.`:''}
```
Aparecen solo si `icus > 0` o `icos > 0`, respectivamente. No cambia el texto principal cuando no aplican.

---

## 8. M01 Zapopan — Distrito en resultPanel (`dcff57e`, `807f1c2`)

### 8.1 Problema detectado
El campo "Distrito" siempre mostraba "D—" para Zapopan. El proxy `/api/arcgis-zapopan-proxy` **ya devolvía** el campo `DISTRITO` en su respuesta (línea 96 del proxy: `DISTRITO: match.properties?.distrito || null`), pero `consultarArcGISZapopan()` solo extraía `CLAVE` y descartaba el resto.

### 8.2 Flujo corregido — 3 cambios encadenados (`dcff57e`)

**Cambio 1 — `consultarArcGISZapopan()`:**
Antes devolvía solo un string (la clave). Ahora devuelve un objeto:
```javascript
return { clave: claveNorm, distrito: distrRaw || null };
// distrRaw = raw WFS "ZPN-4" → normalizado "4" con replace(/^ZPN-?0*/i,'').replace(/^0+/,'')
```

**Cambio 2 — `consultarVisorJalisco()`:**
Extrae `claveArcGIS` y el número de distrito del objeto ArcGIS. Construye `_dis = {dis1:'4', dis2:'ZPN-04 "La Tuzanía"'}` usando un lookup inline. Pasa `_dis` a `construirResultadoBDLocal()`.

**Cambio 3 — `construirResultadoBDLocal()`:**
Antes: `dis1: '—', dis2: ''` (hardcodeado).
Ahora: `dis1: (dis&&dis.dis1)||'—', dis2: (dis&&dis.dis2)||''` (usa el parámetro).

### 8.3 Formato real del WFS Zapopan
Verificado consultando el GeoServer directamente con BBOX amplio (5,895 polígonos):

| Valor en WFS | Normaliza a | Lookup | Resultado |
|---|---|---|---|
| ZPN-1 … ZPN-12 | 1 … 12 | Nombre completo | ✅ correcto |
| ZPN-9A | 9A | — | Fallback `ZPN-9A` (ver §8.4) |
| null | — | — | `D—` como antes |

### 8.4 ZPN-9A — lookup agregado (`807f1c2`)
El WFS incluye 8 polígonos con `distrito = 'ZPN-9A'`, todos de tipo ZCR/ZR (Zona Conservación-Recuperación / Zona Recuperación), ubicados en el suroeste de Zapopan colindando con Bosque de la Primavera. No tienen nombre propio en ningún PDU oficial. Se agregó a ambos lookups (`_zpnN` y `ZPN_NOMBRES`) con el nombre del PPDU del que dependen:
```
'9A': 'ZPN-09A "Base Aérea - El Bajío"'
```

### 8.5 Verificación completa de los 12 distritos
Se confirmó que todos los valores posibles del WFS normalizan correctamente:

| Distrito | Nombre en M01 |
|----------|---------------|
| ZPN-1 | ZPN-01 "Zapopan Centro" |
| ZPN-2 | ZPN-02 "Arroyo Hondo" |
| ZPN-3 | ZPN-03 "Los Robles" |
| ZPN-4 | ZPN-04 "La Tuzanía" |
| ZPN-5 | ZPN-05 "Vallarta-Patria" |
| ZPN-6 | ZPN-06 "Atemajac" |
| ZPN-7 | ZPN-07 "El Collí" |
| ZPN-8 | ZPN-08 "Santa Ana Tepetitlán" |
| ZPN-9 | ZPN-09 "Base Aérea - El Bajío" |
| ZPN-9A | ZPN-09A "Base Aérea - El Bajío" |
| ZPN-10 | ZPN-10 "Cópala" |
| ZPN-11 | ZPN-11 "Tesistán" |
| ZPN-12 | ZPN-12 "El Nixticuil" |

---

## 9. M04 — verificación aviso legal por municipio (sin commits)

Se verificó que M04 ya tiene el aviso legal dinámico por municipio desde versiones anteriores. El objeto `NORMATIVA` contiene `fuentes` y `autoridad` específicos para los 5 municipios:

| Municipio | Reglamento principal |
|-----------|---------------------|
| GDL | Reglamento Gestión Integral GDL (dic. 2023) + Reg. Zonificación Urbana GDL |
| ZPN | Reglamento de Construcción Zapopan (reforma GMZ 120 / 09-may-2024) + Norma Técnica Accesibilidad |
| TLQ | Reg. Construcciones Tlaquepaque (Art. 105) + REZ 2003 supletorio |
| TLA | REZ 2003 supletorio (Art. 11 Ordenamiento Tlajomulco) |
| TON | Reg. Construcción Tonalá (Norma Técnica 100) + REZ 2003 supletorio |

La función `actualizarDisclaimer()` ya usa `NORMATIVA[munVal].fuentes` y `NORMATIVA[munVal].autoridad` dinámicamente. Sin cambios necesarios.

---

## 10. Estado de módulos al 28 ago 2026 (post v40)

| Mód | Estado | Notas |
|-----|--------|-------|
| M01 | ✅ Producción | Layout 2 col, slider 3D, legibilidad completa, Zapopan distrito OK |
| M02 | ✅ Producción | detectarGiroIA con ranking + stem mínimo 5 chars |
| M03 | ✅ Producción | Sin cambios v40 |
| M04 | ✅ Producción | Sin cambios v40; aviso legal dinámico verificado |
| M05 | ✅ Producción | Sin cambios v40 |
| M06 | ✅ Producción | Sin cambios v40 |
| M07 | ✅ Producción | Sin cambios v40 |
| M08 | ✅ Producción | Sin cambios v40 |
| M09 | ✅ Producción | Sin cambios v40 |
| M10 | ✅ Producción | Sin cambios v40 |
| M11 | ✅ Producción | Sin cambios v40 |

---

## 11. Pendientes arrastrados

- **`gu-freemium.js`**: Integrar en M04, M05, M06, M08 y M10 — pendiente desde 08-jul
- **Custom domain `trazaurbana.mx`**: Configurar en Vercel (acción de Fernando)
- **M04 `guVerificarLimite()`**: Desactivado intencionalmente (decisión 17-jul-2026)
- **Gasolineras/gaseras ZPN**: Agregar códigos 468411-468413/468419 a `GU_SCIAN_ZAP`
- **Distancias GDL**: Verificar reglas equivalentes en Reglamento de Giros GDL
- **GitLab mirror / OneDrive move**
- **Formspree ID**: Fernando debe crear cuenta y proveer ID
- **UptimeRobot**: Registrar 3 URLs para monitoreo externo (acción de Fernando)
  - `https://visorgeoserver.guadalajara.gob.mx/geoserver/vu2/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities`
  - `https://gestorurbanoamg.vercel.app/api/arcgis-zapopan-proxy?lat=20.7213&lng=-103.3923`
  - `https://api-visorurbano.jalisco.gob.mx/geoserver/ows?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetCapabilities`
- **Validación de municipio en M02, M03, M05**: Aplicar mismo guard que M01 (municipio requerido antes de buscar) — pendiente

---

## 12. Parámetros de la sesión

| Parámetro | Valor |
|-----------|-------|
| Versión | v40.0 |
| Fecha | 28 ago 2026 |
| Período cubierto | 18 ago – 28 ago 2026 |
| Sesión previa | v39.0 (15 ago 2026) |
| Rama | master + sincronización a main (Vercel) |
| Archivos modificados | GestorUrbano_M01_3.html · GestorUrbano_M02_4.html · gu-design-system.css |
| Commits cubiertos | 13 (a4c989a → 807f1c2) |
| Python disponible | Python 3.14.5 ✓ |

---

*Bitácora generada: 28 ago 2026 · Fernando H.*
