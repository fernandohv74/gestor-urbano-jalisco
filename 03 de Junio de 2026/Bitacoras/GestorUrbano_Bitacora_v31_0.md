# Bitácora de Desarrollo
## Gestor Urbano Jalisco AMG · v31.0
13 de julio de 2026

---

## 1. Resumen de la sesión

Sesión en dos frentes:

**M07 — Directorio, Glosario y Fuentes**: corrección tipográfica, expansión de definiciones, incorporación de 8 URLs faltantes en fuentes y 6 nuevos términos al glosario (total: 74 términos).

**M04 — Asistente IA**: implementación de trazabilidad de fuentes por lámina — el modelo ahora indica qué lámina aportó cada dato normativo y clasifica todas las láminas recibidas en la respuesta.

---

## 2. M07 — Cambios realizados (commits 1e87bc6 + e8a964b)

### 2.1 Corrección tipográfica

- `'Consejo Municipal para Giros de Control Especial — Tomalá'` → `'— Tonalá'` en el glosario.

### 2.2 Expansión de definición — Perímetro A / Perímetro B

Definición anterior era genérica. Nueva definición explica:
- **Perímetro A**: zona consolidada con infraestructura completa. Más restrictiva para giros de impacto (horarios reducidos, mayores distancias a usos sensibles). Se equipara al **Centro Tradicional o casco urbano** para licencias de funcionamiento.
- **Perímetro B**: zona de expansión o periférica. Restricciones condicionadas a la disponibilidad de servicios y ordenamiento vial. Menor densidad de giros incompatibles.

### 2.3 Nuevo término — "Giro restringido"

Definición general incorporada al glosario (categoría `giros`):
- Actividad comercial, industrial o de servicios que por su naturaleza requiere autorización especial del Consejo Municipal además de la licencia de funcionamiento ordinaria.
- Incluye giros de alta concurrencia, venta de alcohol, entretenimiento nocturno y actividades con impacto en vialidad o ruido.

### 2.4 URLs incorporadas en 8 fuentes

| Fuente | URL agregada |
|--------|-------------|
| Ley de Desarrollo Urbano Jalisco | `info.jalisco.gob.mx` (portal oficial) |
| LGAHOTDU | `diputados.gob.mx` (Cámara de Diputados) |
| Reglamento de Giros TLQ | `transparencia.info.jalisco.gob.mx` |
| Reglamento de Giros TLA | `tlajomulco.gob.mx/reglamentos` |
| Reglamento de Giros TON | `transparencia.info.jalisco.gob.mx` |
| PMDU TLQ | `transparencia.info.jalisco.gob.mx` |
| PMDU TLA | `tlajomulco.gob.mx` |
| PMDU TON | `transparencia.info.jalisco.gob.mx` |

### 2.5 Seis nuevos términos al glosario

| Término | Categoría |
|---------|-----------|
| IMEPLAN | organismos |
| Área libre / Área verde | coeficientes |
| Densidad habitacional | coeficientes |
| Polígono de actuación | tramites |
| Área de cesión municipal | tramites |
| TDD — Transferencia de Derechos de Desarrollo Urbano | coeficientes |

**Nota sobre TDD**: el usuario propuso las siglas "TDUS" y "TPD". Se verificó el Reglamento de Gestión Integral del Municipio de Guadalajara (RGIM), Capítulo VIII, Arts. 97-103 — la denominación oficial es **TDD (Transferencia de Derechos de Desarrollo Urbano)**. Ninguna de las variantes propuestas aparece en el texto normativo.

---

## 3. M04 — Trazabilidad de fuentes por lámina (commit 42bb549)

### 3.1 Motivación

Cuando el usuario sube 10 o más láminas, el dictamen consolidado no indicaba qué lámina aportó cada dato normativo. La mejora implementada agrega trazabilidad sin fragmentar el análisis en dictámenes parciales.

### 3.2 Cambios en `buildPrompt()`

**Schema JSON — campo nuevo en cada elemento:**
```json
"lamina_fuente": "número y nombre de la lámina de donde se extrajo este dato, p.ej. 'L-02 Planta Baja', o null"
```

**Schema JSON — array nuevo en el root de la respuesta:**
```json
"laminas_clasificadas": [
  { "numero": 1, "nombre": "nombre_archivo.jpg", "tipo": "portada|planta_baja|planta_alta|fachada|corte|instalaciones|estructural|detalle|otro", "relevante": true }
]
```

**Reglas críticas añadidas:**
- `lamina_fuente`: citar la lámina principal de donde se extrajo el dato normativo; null si no verificable.
- `laminas_clasificadas`: listar TODAS las láminas con tipo y relevancia (true = aportó datos normativos; false = portada/sello/sin cotas).

### 3.3 Cambios en `renderResultado()`

**En el body de cada elemento** (entre `medidas_observadas` y `recomendacion`):
```javascript
${el.lamina_fuente ? `<div style="font-size:10px;color:var(--text3);margin-top:4px;">📁 Fuente: ${el.lamina_fuente}</div>` : ''}
```

**Sección "Láminas analizadas"** — bloque visual inserido después de la lista de elementos y antes del dictamen:
- **CON DATOS NORMATIVOS**: muestra ícono por tipo + código `L-XX` + nombre de archivo + etiqueta de tipo.
- **SIN DATOS NORMATIVOS**: mismas columnas con opacidad reducida (portadas, sellos, hojas sin cotas).

Tipos de lámina con ícono: `portada 📄`, `planta_baja 🏠`, `planta_alta 🏢`, `fachada 🖼️`, `corte ✂️`, `instalaciones 🔌`, `estructural 🏗️`, `detalle 🔍`, `otro 📋`.

La sección aparece **solo si** `r.laminas_clasificadas` existe y tiene elementos (compatible hacia atrás con análisis anteriores sin el campo).

---

## 4. Commits generados

| Commit | Contenido |
|--------|-----------|
| `1e87bc6` | fix M07: corrige tipografía Tomalá→Tonalá, amplía Perímetros A/B, agrega Giro Restringido, URLs 8 fuentes |
| `e8a964b` | feat M07: agrega 6 términos al glosario (IMEPLAN, Área libre, Densidad habitacional, Polígono actuación, Área cesión, TDD) |
| `42bb549` | feat M04: trazabilidad de fuentes por lámina |

---

## 5. Parámetros de la sesión

| Parámetro | Valor |
|-----------|-------|
| Versión | v31.0 |
| Fecha | 13 jul 2026 |
| Sesión previa | v30.0 (IDE correcciones ZPN) |
| Archivos modificados | `11 de junio v1/GestorUrbano_M07_1.html`, `11 de junio v1/GestorUrbano_M04_3.html` |
| Commits generados | 1e87bc6, e8a964b, 42bb549 |
| Módulos NO tocados | M01–M03, M05–M09, login.html, index.html, api/ |

---

## 6. Estado de módulos al 13 jul 2026

| Mód | Estado | Notas |
|-----|--------|-------|
| index | Activo | Sin cambios |
| login | Activo | Sin cambios |
| M01 | Activo (calibrando ZPN) | IDE 16 correcciones desde PDU. Pendiente: TLQ/TLA/TON |
| M04 | Activo | Trazabilidad de fuentes por lámina implementada (v31.0) |
| M07 | Activo | 74 términos glosario, 54 fuentes con URLs completas |
| M02/M03/M05–M09 | Activos | Sin cambios |
| M10 | Sin acceso | Existe pero no en index |
| M18 | No implementado | — |

---

## 7. Pendientes arrastrados

- Integración ZPN para TLQ/TLA/TON en M01.
- Reactivar límite gu-freemium.js en M04 antes de salida de fase pruebas.
- Integrar gu-freemium.js en M05, M06, M08 y M10.
- Decidir si eliminar rama main del repo remoto.
- Hosting público y dominio propio.

---

*Bitácora generada: 13 jul 2026 · Fernando H.*
