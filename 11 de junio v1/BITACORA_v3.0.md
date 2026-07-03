# BITÁCORA — Gestor Urbano Jalisco AMG
## Versión 3.0 | Sesión: 24 de junio de 2026

---

## MÓDULOS ACTIVOS (archivo vivo)

| Módulo | Archivo | Estado | Descripción |
|--------|---------|--------|-------------|
| M01 | GestorUrbano_M01_3.html | ✅ Activo | Consulta uso de suelo con mapa interactivo GDL/ZPN |
| M02 | GestorUrbano_M02_4.html | ✅ Activo | Viabilidad rápida de giro comercial |
| M03 | GestorUrbano_M03_3.html | ✅ Activo | Normas de construcción por zona |
| M04 | GestorUrbano_M04_3.html | ✅ Activo | Asistente IA (Claude) — Consultas normativas |
| M05 | GestorUrbano_M05_2.html | ✅ Activo | Requisitos de licencia de construcción |
| M06 | GestorUrbano_M06_1.html | ✅ Activo | Simulador de licencia de funcionamiento |
| M07 | GestorUrbano_M07_1.html | ✅ Activo | Directorio + Glosario + Fuentes |
| M08 | GestorUrbano_M08_1.html | ✅ Activo | Calculadora de costos de construcción |
| index | index.html | ✅ Activo | Portal principal con cards de módulos |

---

## CAMBIOS DE ESTA SESIÓN (24 jun 2026)

---

### 🐛 BUG FIX — M05: SyntaxError "Missing catch or finally"

**Archivo:** `GestorUrbano_M05_2.html`
**Problema:** La función `cargarDesdeHistorial` tenía un bloque `try` sin `catch` ni `finally` → SyntaxError en línea 1098. El módulo no cargaba.
**Fix:** Se añadió `cargarEntrada(h)` dentro del `try` y se cerró con `} catch(e) {}`.
**Validado:** `node --check` → SINTAXIS OK

---

### 🔗 MEJORA — M05 → M08: Deep link completo

**Archivo:** `GestorUrbano_M05_2.html` + `GestorUrbano_M08_1.html`
**Problema:** El botón "Calcular en M08" no transfería `supPredio` ni `niveles` a M08.
**Fix M05 — `irAM08()`:**
```javascript
const supPredio = parseFloat(document.getElementById('inp-sup-predio').value) || 0;
const niveles   = parseInt(document.getElementById('inp-niveles').value)       || 0;
const datos = { ts: Date.now(), mun: munActual, tipoObra, tipoUso, sup, frente, supPredio, niveles };
localStorage.setItem('GU_m05_a_m08', JSON.stringify(datos));
```
**Fix M08 — `leerDeepLink()`:** Se agregaron las líneas para leer y aplicar `supPredio` y `niveles` a sus respectivos inputs.

---

### 🔗 BUG FIX — index.html: Link M01 apuntaba a versión incorrecta

**Archivo:** `index.html`
**Problema:** `href="GestorUrbano_M01_2.html"` → 404 (el archivo activo es `_M01_3.html`).
**Fix:** `href="GestorUrbano_M01_3.html"`

---

### 🐛 BUG FIX — M01: Todos los botones de municipio activos simultáneamente

**Archivo:** `GestorUrbano_M01_3.html`
**Problema:** `selMunicipio()` limpiaba `.muni-btn` pero los botones usan clase `.gu-muni-btn`.
**Fix:** Selector corregido a `document.querySelectorAll('.gu-muni-btn')`.

---

### ⚠️ MEJORA — M01: Banner de alerta para zonas EV/Vialidad

**Archivo:** `GestorUrbano_M01_3.html`
**Contexto:** Cuando el geocodificador ubica el pin sobre una vialidad o área verde (clave EV, V-V, VIAL), el resultado confunde al usuario.
**Fix:** Se añade banner amarillo en `renderizar()` cuando la clave de zona comienza con 'EV', 'V-V' o contiene 'VIAL'. Mensaje: "El pin puede estar sobre una vialidad o área verde. Arrástralo al interior del predio."

---

### 🆕 NUEVO MÓDULO — M07: Directorio + Glosario + Fuentes

**Archivo:** `GestorUrbano_M07_1.html` (creado desde cero)
**Descripción:** Módulo de referencia informativa con tres pestañas.

#### Tab 1 — Directorio (26 organismos)
Organismos categorizados como Municipal / Estatal / Federal / Metropolitano:
- **Municipales GDL:** PC GDL, Bomberos GDL, Obras GDL, Ordenamiento Territorial GDL, Catastro GDL, Movilidad GDL, Medio Ambiente GDL
- **Municipales ZPN:** PC ZPN, Bomberos ZPN, Obras ZPN, Ordenamiento Territorial ZPN, Catastro ZPN, Movilidad ZPN, Medio Ambiente ZPN
- **Municipales otros:** PC Tlaquepaque, PC Tlajomulco, PC Tonalá
- **Estatales:** SIAPA, SEMADET, INAH Jalisco, Secretaría de Cultura Jalisco, COEPRIS/SSJ, SIOP, RPPyC Jalisco
- **Federal:** CFE
- **Metropolitano:** IMEPLAN

**Direcciones verificadas desde portales oficiales** (no asumidas):

| Organismo | Dirección | Fuente |
|-----------|-----------|--------|
| SIAPA | Av. Dr. R. Michel 2913, Col. Álamo Industrial | Confirmada por usuario |
| PC GDL + Bomberos GDL | Calzada del Campesino 1097, Col. Moderna | Búsqueda oficial |
| PC ZPN | Av. Doctor Luis Farah 460, Conjunto Laureles / CISZ Laureles 300 | Búsqueda oficial |
| PC Tlaquepaque | San Mateo Evangelista 4174 | Búsqueda oficial |
| PC Tlajomulco | Circuito Metropolitano Sur 440 | Búsqueda oficial |
| PC Tonalá | Paseo Loma Norte 8268, Loma Dorada, CP 45402 | Google Maps (usuario lo encontró) |
| Bomberos ZPN | Av. Doctor Luis Farah 460, Conjunto Laureles | Búsqueda oficial |
| SEMADET | Av. Circunvalación Agustín Yáñez 2343, Col. Moderna | Búsqueda oficial |
| INAH Jalisco | Liceo 168, Sector Hidalgo, Centro Histórico | Búsqueda oficial |
| Secretaría de Cultura | Centro Cultural Patio Los Ángeles, Cuitláhuac 305 | Confirmada por usuario |
| COEPRIS/SSJ | Av. 8 de Julio 1489 / Calzada Lázaro Cárdenas 3540 | Búsqueda oficial |
| CFE | Zona Centro: Av. 16 de Septiembre 449 / ZPN: Felipe Ruvalcaba 5550 | Búsqueda oficial |
| SIOP | Av. Prolongación Alcalde 1351, Edif. B, Col. Miraflores | Búsqueda oficial |
| RPPyC Jalisco | Av. Prolongación Alcalde 1855 | Búsqueda oficial |
| IMEPLAN | Av. Abedules 565, Col. Los Pinos, Zapopan | Búsqueda oficial |
| Obras GDL | Calle Hospital 50-Z, 1er nivel, Col. El Retiro | obraspublicas.guadalajara.gob.mx |
| Obras ZPN | Av. Parres Arias s/n, Calle 2 Esq. Periférico, Parque Industrial Belenes | zapopan.gob.mx |
| Ordenamiento Territorial GDL | Calle Hospital 50-Z, 2do nivel, Col. El Retiro | Confirmada por usuario |
| Ordenamiento Territorial ZPN | CISZ 3er nivel, Av. Prolongación Laureles 300, Col. El Tepeyac | portal.zapopan.gob.mx/ordenamiento |
| Catastro GDL | 5 de Febrero 249, Col. Las Conchas, CP 44460 | catastro.guadalajara.gob.mx |
| Catastro ZPN | CISZ 2do nivel, Av. Prolongación Laureles 300, Col. El Tepeyac | retys.zapopan.gob.mx |
| Movilidad GDL | Ghilardi s/n esq. Miraflores, Col. Mezquitan Country, CP 44260 | Aviso Privacidad GDL 2025 |
| Movilidad ZPN | Unidad Administrativa Basílica, Andador 20 de Noviembre s/n, Centro Histórico ZPN | portal.zapopan.gob.mx/movilidad |
| Medio Ambiente GDL | Av. Hidalgo 426, Centro Histórico, CP 44100 | Aviso Privacidad GDL feb 2025 |
| Medio Ambiente ZPN | Unidad Administrativa El Vergel, Av. De los Robles 1566, Col. Jardines del Vergel | portal.zapopan.gob.mx/medioambiente |

#### Tab 2 — Glosario (48 términos)
Categorías: Coeficientes · Trámites · Actores · Zonificación · Organismos

Nuevos términos agregados en esta sesión:
- Todos los organismos municipales (Movilidad, Medio Ambiente, Obras, Catastro, Ordenamiento, Padrón y Licencias, Protección Civil)
- Habitabilidad / Habitabilidad Parcial / Habitabilidad Total
- Factibilidades SIAPA y CFE
- Regla de los 56°
- **Punto Limpio** (nuevo en esta sesión)

#### Tab 3 — Fuentes (nuevo en esta sesión)
5 secciones colapsables con 35 fuentes totales:
1. Reglamentos y Leyes (8)
2. Leyes de Ingresos / Tarifas 2026 (3)
3. Planes de Desarrollo Urbano (6)
4. Portales Oficiales (13)
5. APIs y Servicios Técnicos (6)
6. Avisos de Privacidad — domicilios verificados (5)

Cada fuente indica el módulo donde se utiliza y enlaza al portal oficial.

---

## REGLA CRÍTICA ESTABLECIDA EN ESTA SESIÓN

> ⛔ **NUNCA asumir direcciones de organismos.** Toda dirección debe verificarse en el sitio oficial del organismo. Una dirección incorrecta daña la credibilidad de la aplicación. Si no se encuentra, se lista como pendiente para que el usuario la confirme.

---

## ESTRUCTURA DE ARCHIVOS ACTIVA

```
11 de junio v1/
├── index.html                  ← Portal principal (8 módulos)
├── gu-design-system.css        ← Variables CSS compartidas
├── GestorUrbano_M01_3.html     ← Uso de suelo + mapa
├── GestorUrbano_M02_4.html     ← Viabilidad giro comercial
├── GestorUrbano_M03_3.html     ← Normas de construcción
├── GestorUrbano_M04_3.html     ← Asistente IA (Claude API)
├── GestorUrbano_M05_2.html     ← Requisitos licencia construcción
├── GestorUrbano_M06_1.html     ← Simulador licencia funcionamiento
├── GestorUrbano_M07_1.html     ← Directorio + Glosario + Fuentes ← NUEVO
├── GestorUrbano_M08_1.html     ← Calculadora costos construcción
└── GestorUrbano_M15_3.html     ← (en revisión)
```

---

## PRÓXIMOS MÓDULOS PLANEADOS

| Módulo | Nombre tentativo | Descripción |
|--------|-----------------|-------------|
| M09 | Comparador de predios | Comparar dos predios por COS, CUS, usos permitidos, etc. |
| M18 | Estimador de plusvalía normativa | Calcular incremento de valor por cambio de uso o densidad |

---

## APIS ACTIVAS

| API | Uso | Módulo |
|-----|-----|--------|
| Google Maps Geocoding API | Geocodificación de domicilios | M01 |
| Google Maps JavaScript API | Mapa interactivo + marcadores | M01 |
| GeoServer WMS/WFS Jalisco | Capas de zonificación | M01 |
| ArcGIS Zapopan PPDU | Consulta zona por coordenada | M01 |
| Anthropic API (Claude) | Asistente normativo IA | M04 |

---

*Bitácora generada: 24 de junio de 2026*
