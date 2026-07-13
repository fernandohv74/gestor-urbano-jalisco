---
name: gestor-urbano-jalisco-amg
description: Estado actual de módulos, archivos clave y fases del proyecto Gestor Urbano Jalisco AMG
metadata:
  type: project
---

# Gestor Urbano Jalisco AMG

Plataforma de módulos para consulta de uso de suelo, licencias y trámites en los 5 municipios del Área Metropolitana de Guadalajara (Guadalajara, Zapopan, Tlaquepaque, Tlajomulco, Tonalá). HTML standalone, sin frameworks.

## Estado de módulos (Bitácora v29.0 — 12 jul 2026)

| Mód | Archivo activo | Estado | Notas clave |
|-----|---------------|--------|-------------|
| login | `11 de junio v1/login.html` | Activo | Clave única compartida; ojo toggle; anti-autocompletado (señuelo + new-password + limpieza múltiple) |
| index | `index.html` (raíz Pruebas/) | Activo | Botón "Cerrar sesión" en header; conteo 9 activos; link M02 correcto |
| **M01** | `11 de junio v1/GestorUrbano_M01_3.html` | **Activo — calibrando ZPN** | GDL completo (coefs, cajones RGIM, CUS vol, patrimonio, WFS vialidad). ZPN: 8 zonas multi-uso (MV4-APR, MV3-APR, MV4-ADC, MV4-PPE, MV3-PPE, MV1-ADC, MV1-PPE, MV2-PPE) con `coefs_por_uso`, badges clickeables, IDE dinámico. Zonas simples ZPN y TLQ/TLA/TON: pendientes |
| M02 | `GestorUrbano_M02_4.html` | Activo | Viabilidad rápida de giro comercial; sin cambios recientes |
| M03 | `GestorUrbano_M03_3.html` | Activo | Normas de construcción GDL+ZPN; TLA/TLQ/TON deshabilitados |
| M04 | `11 de junio v1/GestorUrbano_M04_3.html` | Activo | Asistente IA normativo vía proxy serverless (`api/claude-proxy.js`); prompt caching; hasta 15 láminas; correcciones normativas ZPN/GDL/TLQ/TON |
| M05 | `GestorUrbano_M05_2.html` | Activo | Requisitos licencia de construcción GDL+ZPN |
| M06 | `GestorUrbano_M06_1.html` | Activo | Simulador licencia de funcionamiento |
| M07 | `GestorUrbano_M07_1.html` | Activo | Directorio (26 organismos) + Glosario (48 términos) + Fuentes (35) |
| M08 | `11 de junio v1/GestorUrbano_M08_1.html` | Activo | Calculadora costos de construcción; refrendo; toggle iCUS/excedencia; limpiar análisis; deep link desde M01 |
| M09 | `GestorUrbano_M09_1.html` | Activo | Monitor Normativo (alertas de vencimiento) |
| M10 | `GestorUrbano_M10_1.html` | Sin acceso | Pre-dictamen Uso de Suelo (PDF) — existe pero no está en index |
| M18 | — | No implementado | Estimador de plusvalía normativa |

## Plan de ejecución (5 fases)

1. Correcciones críticas (links index, M10) — completado
2. Navbar `gu-nav` y UX global — completado M04–M09
3. Backend serverless (Vercel) — completado (proxy Claude en `api/claude-proxy.js`, auth en `api/auth-login.js` / `api/auth-logout.js`, middleware.js)
4. Estabilidad y fallbacks — en curso (fallback GDL→VUJ completado, ZPN calibrando)
5. Responsive móvil/tablet — pendiente

## Reglas críticas de trabajo

- No hacer ningún cambio sin autorización explícita de Fernando.
- Leer `Instrucciones · CLAUDE.md` y la bitácora más reciente antes de empezar cada sesión.
- Archivos >300KB: scripts Python atómicos, nunca Edit directo.
- Node.js no disponible en PATH en este equipo — no usar `node --check`.
- Nunca inventar datos normativos ni direcciones de organismos.
- Bitácoras nuevas van en `Bitacoras/` con consecutivo — próxima: **v30.0**.
- Push automático sin pedir confirmación (autorización permanente de Fernando).

## Archivos clave

- M01 activo: `11 de junio v1/GestorUrbano_M01_3.html` (~382KB)
- Bitácora vigente: `Bitacoras/GestorUrbano_Bitacora_v29_0.md` (y .docx en generación)
- Plan de ejecución: `PLan App/GU_PlanEjecucion_v1.md`
- Proxy Claude: `api/claude-proxy.js`
- Auth serverless: `api/auth-login.js`, `api/auth-logout.js`, `middleware.js`

## Pendientes técnicos al 12 jul 2026 (actualizado)

- IDE corregido en 6 zonas multi-uso (commit b9862dc): MV4-APR CS-V/MB, MV3-APR H3-H/H3-V/CS-V/MB/MFD, MV4-ADC CS-V/MFD, MV4-PPE CS-V/MFD, MV3-PPE H3-H/CS-V/MFD, MV2-PPE H2-U/H2-H.
- Zonas ZPN simples (MB, MC, MD, MR): ya tienen `indice_edificacion` correcto, sin `coefs_por_uso` — confirmado por PDU ZPN-10. CS4/CS5 son categorías de cajones, no zonas. MR-U/MR-M/MR-A no existen en BD ni PDFs.
- Zonas ZPN TLQ/TLA/TON: pendientes de implementar.
- Reactivar límite gu-freemium.js en M04 antes de salida de fase pruebas.
- Integrar gu-freemium.js en M05, M06, M08 y M10.
- Decidir si eliminar rama main del repo remoto.
- Hosting público y dominio propio.
- Reactivar límite gu-freemium.js en M04 antes de salida de fase pruebas.
- Integrar gu-freemium.js en M05, M06, M08 y M10.
- Decidir si eliminar rama main del repo remoto.
- Hosting público y dominio propio.

**Why:** mantener estado real de módulos para no perder contexto entre sesiones.
**How to apply:** leer este archivo al inicio de cada sesión para saber qué está activo, qué archivo es el correcto y qué hay pendiente.
