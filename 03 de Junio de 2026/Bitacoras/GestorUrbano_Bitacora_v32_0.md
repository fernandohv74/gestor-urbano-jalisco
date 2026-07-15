# Bitácora de Desarrollo
## Gestor Urbano Jalisco AMG · v32.0
14 de julio de 2026

---

## 1. Resumen de la sesión

Sesión enfocada íntegramente en **M02 — Verificador de Giro Comercial**. Se completó el enriquecimiento del catálogo `GU_SCIAN_GDL` con nombres coloquiales en español para las **997 entradas** (521 enriquecidas en total; el resto ya tenía coloquial o es CS5 prohibido urbano). Se corrigieron además cuatro defectos del buscador IA: falsos positivos de manufactura por stemming, umbral de activación de IA, frases de intención que bloqueaban la búsqueda y palabras genéricas que contaminaban los resultados.

---

## 2. M02 — Cambios realizados

### 2.1 Enriquecimiento GU_SCIAN_GDL — 521 entradas

El catálogo GDL (que usan los 4 municipios: GDL, TLQ, TLA, TON) tenía la mayoría de sus entradas con solo el nombre técnico SCIAN, sin campo `ns` (descripción) ni nombre coloquial buscable. Se añadió a cada entrada el campo coloquial (`n`) y la descripción SCIAN completa (`ns`), siguiendo la estructura ya existente en `GU_SCIAN_ZAP`.

**Lote 1 — 178 entradas (batch inicial):** sectores con mayor volumen de búsquedas (restaurantes, comercio menor, servicios personales, salud, educación prioritarios).

**Lote 2 — 27 entradas (72xx + 81xx + 813xx):**

| Sector | Ejemplos de coloquiales |
|--------|------------------------|
| 72xx (10) | Motel · Posada, Bar · Cantina · Pulquería, Discoteca · Centro nocturno, Nevería · Heladería · Juguería, Catering · Banquetes, Food truck · Cocina móvil, Cabaña · Villa |
| 81xx (10) | Taller de transmisiones, Alineación y balanceo, Car wash · Lavado de autos, Llantería · Vulcanizadora, Cerrajería, Bicicletas · Velería, Taller de motos |
| 813xx (7) | Cámara de comercio · Asociación gremial, Sindicato, Iglesia · Templo, ONG · Asociación civil · A.C. |

**Lote 3 — 316 entradas (todos los sectores restantes):**

| Sector | N | Ejemplos |
|--------|---|---------|
| 46xx Comercio menor | 45 | Zapatería, Bisutería, Lencería, Óptica, Refaccionaria, Yonke, Gasolinera, Gas LP, Bicicletas, Mascotas |
| 48xx Transporte | 32 | Mudanzas, Transporte escolar, Grúas, Agencia aduanal, Autotransporte de carga |
| 54xx Servicios prof. | 25 | Diseño gráfico, Interiores, Fotografía, Traducción, Desarrollo de software, Consultoría |
| 56xx Servicios apoyo | 18 | Fotocopias · Café internet, Jardinería, Limpieza, Organización de eventos, Agencia de viajes |
| 61xx Educación | 11 | Idiomas, Computación, Arte, Deportes, Profesor particular, Preparatoria |
| 62xx Salud | 11 | Médico especialista, Laboratorio clínico, Optometría, Guardería, Ambulancia |
| 71xx Entretenimiento | 15 | Boliche, Gimnasio, Balneario, Videojuegos · Maquinitas, Sitio histórico |
| 52xx Financieros | 25 | Banco, Casa de empeño, Montepío, Casa de cambio, Aseguradora, AFORE |
| 53xx Inmobiliarios | 22 | Salón de fiestas, Renta de autos, Renta de mesas y sillas, Franquicias |
| 43xx Comercio mayor | 68 | Mayoreos en todos los rubros: alimentos, textiles, materiales, maquinaria, reciclaje |
| 51xx Medios/Telecom | 34 | Cine, Radio, Televisión, Editorial, Estudio de grabación, Data center, Blog/Podcast |
| 49xx Mensajería | 8 | Paquetería local, Mensajería nacional, Almacén, Bodega refrigerada |
| 31xx Manufactura | 2 | Tortillería · Masa, Rastro · Matanza |

**Entrada omitida intencionalmente:** `541943` [CS5] Servicios veterinarios para ganadería — uso prohibido en zona urbana comercial.

---

### 2.2 Enriquecimiento GU_SCIAN_ZAP — Spa (commit previo)

Se agregó entrada `{c:'812110',n:'Spa · Baños de belleza',...}` al catálogo de Zapopan, que carecía de cualquier entrada con la palabra "spa". Los demás 4 municipios (GDL, TLQ, TLA, TON) ya contaban con `812110 Peluquería · Estética · Spa` desde el enriquecimiento GDL.

---

### 2.3 Stemming — sufijo `-ería`

Se incorporó regla específica en `_stem()` para el sufijo `-ería` del español:

```javascript
const _stem = function(w) {
  if (w.length >= 6 && w.endsWith('eria')) return w.slice(0, -4);
  return w.length >= 6 ? w.slice(0,-2) : w.length === 5 ? w.slice(0,-1) : w;
};
```

Resultado: `torteria` → `tort` → encuentra `722514 Taquería · Tortas`; `ferreteria` → `ferret` → encuentra `466111 Ferretería · Tlapalería`.

---

### 2.4 Falso positivo manufactura — 311830

Búsquedas de "tortería" activaban stem `tort` que también encontraba `311830 Elaboración de tortillas de maíz` (manufactura). Se agregó exclusión de códigos 1xx–3xx en las coincidencias por stemming:

```javascript
if (/^[123]/.test(c)) return false;  // excluir manufactura/primario
```

---

### 2.5 IA como enriquecedor (umbral < 4)

Antes: la IA solo se llamaba si no había ningún resultado directo (`fil.length === 0`).  
Ahora: la IA se llama si hay menos de 4 resultados directos (`fil.length < 4`), enriqueciendo con subtipos relacionados. Los resultados IA se mezclan y deduplicamos con los directos.

**Ejemplo:** "tortería" encontraba solo `722514 Taquería · Tortas` (1 resultado) y ahora la IA agrega `722513 Antojitos · Gorditas`, `722518 Para llevar · Lonchería`, etc.

---

### 2.6 Strip de frases de intención

Se agregó regex al inicio de `detectarGiroIA` que elimina prefijos del tipo "quiero poner un X" → "X" antes de buscar:

```javascript
const desc = raw.replace(
  /^(?:quiero|quiere|quisiera|...|pensamos)\s+(?:poner|abrir|...|dedicarme)\s+(?:un|una|...el negocio de)?\s*/i,
  ''
).trim() || raw;
```

**Caso resuelto:** "quiero poner un SPA" → buscaba "poner" y "spa" juntos, retornando `541211 Contaduría` y `561450 Despachos de solvencia`. Ahora busca solo "spa" → `812110 Peluquería · Estética · Spa`.

---

### 2.7 Prompt IA mejorado

El system prompt de Claude Haiku se actualizó para pedir 3 términos incluyendo subtipos relacionados, con ejemplos explícitos:

```
spa→spa,belleza,masaje; tortería→tortas,antojitos; veterinaria→mascotas,veterinaria
SOLO JSON: {"busqueda":"termino1","alt":"termino2","alt2":"termino3 o vacio"}
```

---

### 2.8 Stopwords en el filtro de palabras

Problema detectado: la búsqueda "venta de lonches en la calle" retornaba resultados irrelevantes (Casa de empeño, Inmobiliaria, Lotería) porque "venta" aparece en el `ns` de prácticamente todo el comercio minorista.

Se agregó lista de stopwords al filtrado de `palabras` en `detectarGiroIA`:

```javascript
const STOP = new Set(['venta','vende','vender','vendo','compra','comprar',
  'servicio','servicios','articulo','articulos','producto','productos',
  'otro','otros','otra','otras','menor','mayor','comercio','negocio',
  'los','las','con','sin','por','que','del','una','uno','sus','les']);
const palabras = norm(desc).split(/\s+/)
  .filter(function(p){ return p.length > 2 && !STOP.has(p); });
```

**Resultado:** `"venta de lonches en la calle"` → palabras efectivas: `["lonches","calle"]` → stem `lonch` encuentra `722518 Lonchería`; `calle` encuentra `722519 Puestos de comida callejeros` ✓.

---

### 2.9 "Lonche" en coloquial 722518

Se agregó la palabra "Lonche" al coloquial de `722518` para match directo sin depender del stemming:

- Antes: `Para llevar · Lonchería · Fonda express`
- Ahora: `Para llevar · Lonchería · Lonche · Fonda express`

---

## 3. Commits generados

| Commit | Contenido |
|--------|-----------|
| `172c122` | fix M02: lista IA muestra descripción secundaria (g.ns) |
| `c27e04d` | fix M02: stemming básico en filtro IA |
| `6639c60` | feat M02: GU_SCIAN_GDL 178 entradas enriquecidas (n+ns) |
| `b792223` | fix M02: stemming -ería para negocios en español |
| `fbdc6ce` | fix M02: IA enriquece subtipos y elimina falso positivo manufactura |
| `99d390f` | feat M02: coloquiales 72xx+81xx+813xx — 27 entradas |
| `1cb708c` | feat M02: coloquiales todos los sectores — 316 entradas |
| `06984c8` | fix M02: stopwords en búsqueda IA y lonche en 722518 |

---

## 4. Parámetros de la sesión

| Parámetro | Valor |
|-----------|-------|
| Versión | v32.0 |
| Fecha | 14 jul 2026 |
| Sesión previa | v31.0 (M07 glosario + M04 trazabilidad láminas, 13 jul 2026) |
| Archivos modificados | `11 de junio v1/GestorUrbano_M02_4.html` |
| Commits generados | 172c122, c27e04d, 6639c60, b792223, fbdc6ce, 99d390f, 1cb708c, 06984c8 |
| Módulos NO tocados | M01, M03–M09, login.html, index.html, api/ |

---

## 5. Estado de módulos al 14 jul 2026

| Mód | Estado | Notas |
|-----|--------|-------|
| index | Activo | Sin cambios |
| login | Activo | Sin cambios |
| M01 | Activo (calibrando ZPN) | IDE 16 correcciones desde PDU. Pendiente: TLQ/TLA/TON |
| M02 | Activo ✓ | Catálogo GDL prácticamente completo (521/522 entradas con coloquial). Stemming, stopwords, IA enriquecedora y strip de intención implementados |
| M04 | Activo | Trazabilidad de fuentes por lámina (v31.0) |
| M07 | Activo | 74 términos glosario, 54 fuentes con URLs (v31.0) |
| M03/M05–M09 | Activos | Sin cambios |
| M10 | Sin acceso | Existe pero no en index |
| M18 | No implementado | — |

---

## 6. Pendientes arrastrados

- Integración ZPN para TLQ/TLA/TON en M01.
- Reactivar límite gu-freemium.js en M04 antes de salida de fase pruebas.
- Integrar gu-freemium.js en M05, M06, M08 y M10.
- Decidir si eliminar rama main del repo remoto.
- Hosting público y dominio propio.

---

*Bitácora generada: 14 jul 2026 · Fernando H.*
