# Bitácora de Desarrollo
## Gestor Urbano Jalisco AMG · v30.0
12–13 de julio de 2026

---

## 1. Resumen de la sesión

Sesión de calibración normativa de **M01 para Zapopan (ZPN)**: se leyeron los 12 PDFs de zonificación ZPN (ZPN-1 a ZPN-12) con pypdf para extraer los valores de **Índice de Edificación (IDE)** oficiales de cada zona. Se corrigieron 16 errores de IDE en 6 zonas multi-uso. Se confirmó que las zonas simples ZPN (MB, MC, MD, MR) ya tienen `indice_edificacion` correcto y no requieren `coefs_por_uso`. Ningún otro módulo fue modificado.

---

## 2. Extracción de IDE desde PDFs ZPN

Se procesaron los 12 PDFs de normas de zonificación de Zapopan (`6.ZPN-1_ZONIFICACION.pdf` a `6.ZPN-12_ZONIFICACION.pdf`) con scripts Python usando pypdf 6.14.2. Se localizaron las tablas de "Matriz de Control de la Urbanización y Edificación" para cada zona de interés y se extrajeron las filas de Índice de Edificación.

**Método de extracción**: búsqueda posicional por clave de zona `(MV4-APR)` y línea siguiente con `Índice de edificación`. Tabla completa leída de la página PDF cuando el patrón de encabezado era diferente (zonas sin paréntesis en el encabezado).

**Fuentes verificadas**:
- MV4-APR, MV4-ADC, MV4-PPE: todos los ZPN (12/12 PDFs) confirman mismos valores.
- MV3-APR: ZPN-12 pág 108 (única aparición).
- MV3-PPE: ZPN-10 pág 93.
- MV2-PPE, MV1-ADC, MV1-PPE: ZPN-10 págs 82, 71, 72.

---

## 3. Correcciones aplicadas — IDE por zona/uso

### 3.1 MV4-APR

| Uso | IDE anterior | IDE correcto | Notas |
|-----|-------------|-------------|-------|
| CS-V | `'—'` | `'90'` | Nota [6]: toma IDE de H4-U (90m²) |
| MB | `'—'` | `'50'` | Valor propio en la tabla |
| MFD | `'90'` | `'90'` | ✓ ya corregido en sesión previa |

### 3.2 MV3-APR

| Uso | IDE anterior | IDE correcto | Notas |
|-----|-------------|-------------|-------|
| H3-H | `'80'` | `'130'` | Error de implementación previa: 80 era el IDE de MB |
| H3-V | `'50'` | `'120'` | Error de implementación previa |
| CS-V | `'—'` | `'140'` | Nota [6]: toma IDE de H3-U (140m²) |
| MB | `'—'` | `'80'` | Valor propio en la tabla |
| MFD | `'—'` | `'140'` | Nota [6]: toma IDE de H3-U (140m²) |

**Nota**: El error de H3-H=80 y H3-V=50 provenía de confundir el IDE del uso MB (80m²) con H3-H en la tabla. El PDU ZPN-12 pág 108 lo aclara: H3-U=140, H3-H=130, H3-V=120.

### 3.3 MV4-ADC

| Uso | IDE anterior | IDE correcto | Notas |
|-----|-------------|-------------|-------|
| CS-V | `'—'` | `'90'` | Nota [6]: toma IDE de H4-U (90m²) |
| MFD | `'—'` | `'90'` | Nota [6]: toma IDE de H4-U (90m²) |

### 3.4 MV4-PPE

| Uso | IDE anterior | IDE correcto | Notas |
|-----|-------------|-------------|-------|
| CS-V | `'—'` | `'90'` | Nota [6]: toma IDE de H4-U (90m²) |
| MFD | `'—'` | `'90'` | Nota [6]: toma IDE de H4-U (90m²) |

### 3.5 MV3-PPE

| Uso | IDE anterior | IDE correcto | Notas |
|-----|-------------|-------------|-------|
| H3-H | `'80'` | `'130'` | Mismo error que MV3-APR |
| CS-V | `'—'` | `'140'` | Nota [6]: toma IDE de H3-U (140m²) |
| MFD | `'—'` | `'140'` | Nota [6]: toma IDE de H3-U (140m²) |

### 3.6 MV2-PPE

| Uso | IDE anterior | IDE correcto | Notas |
|-----|-------------|-------------|-------|
| H2-U | `'250'` | `'300'` | Error de implementación previa |
| H2-H | `'150'` | `'250'` | Error de implementación previa |

**Zonas sin cambios** (ya correctas): MV1-ADC (H1-U=600, H1-H=400), MV1-PPE (H1-U=600, H1-H=400).

---

## 4. Análisis de zonas simples ZPN (Punto 3)

Se investigó si las zonas simples ZPN requieren `coefs_por_uso` (tabla de coeficientes por uso).

**Conclusión: NO requieren `coefs_por_uso`.**

| Zona | IDE en BD | Fuente | Requiere coefs_por_uso |
|------|----------|--------|------------------------|
| MB | `80` | ZPN-10 pág 118 | No — zona simple |
| MC | `80` | ZPN-10 pág 118 | No — zona simple |
| MD | `80` | ZPN-10 pág 118 | No — zona simple |
| MR | CUS volumétrico | BD existente | No — zona simple |

**Observaciones**:
- MB, MC y MD comparten una **sola tabla** en los PDFs con IDE=80m², COS=0.80, CUS=2.40 base.
- La nota [6] aplica solo en zonas mixtas vecinales donde CS-V o MFD se integran a vivienda.
- CS4/CS5 son **categorías de cajones de estacionamiento** en el cálculo, no zonas de zonificación.
- MR-U, MR-M, MR-A: no existen en los PDFs ZPN ni en la BD del HTML.

---

## 5. Commits generados

| Commit | Contenido |
|--------|-----------|
| `b9862dc` | fix M01 ZPN: IDE corregido en 6 zonas multi-uso desde PDUs ZPN-1/10/12 |

---

## 6. Parámetros de la sesión

| Parámetro | Valor |
|-----------|-------|
| Versión | v30.0 |
| Fecha | 12–13 jul 2026 |
| Sesión previa | v29.0 (coefs_por_uso 8 zonas ZPN, badges, IDE dinámico, cajones RGIM) |
| Archivos modificados | `11 de junio v1/GestorUrbano_M01_3.html` |
| Commits generados | b9862dc |
| Módulos NO tocados | M02–M09, login.html, index.html, api/ |

---

## 7. Estado de módulos al 13 jul 2026

| Mód | Estado | Notas |
|-----|--------|-------|
| index | Activo | Sin cambios |
| login | Activo | Sin cambios |
| M01 | Activo (calibrando ZPN) | GDL completo. ZPN: 8 zonas multi-uso con coefs/uso + IDE correcto (16 fixes PDU). Zonas simples MB/MC/MD/MR ya correctas. Pendiente: TLQ/TLA/TON |
| M02–M09 | Activos | Sin cambios |
| M10 | Sin acceso | Existe pero no en index |
| M18 | No implementado | — |

---

## 8. Pendientes arrastrados

- Integración ZPN para TLQ/TLA/TON (futuras sesiones).
- Reactivar límite gu-freemium.js en M04 antes de salida de fase pruebas.
- Integrar gu-freemium.js en M05, M06, M08 y M10.
- Decidir si eliminar rama main del repo remoto.
- Hosting público y dominio propio.

---

*Bitácora generada: 13 jul 2026 · Fernando H.*
