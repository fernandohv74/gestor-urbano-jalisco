# Memory

## Me
Fernando H. — desarrollador y product owner de Gestor Urbano Jalisco AMG (proyecto individual, sin equipo identificado aún).

## People
Ninguno identificado aún — proyecto de un solo desarrollador. Se agregará si aparecen colaboradores, contactos de dependencias, etc.

## Terms
| Term | Meaning |
|------|---------|
| AMG | Área Metropolitana de Guadalajara |
| PDU | Plan de Desarrollo Urbano |
| PPDU | Plan Parcial de Desarrollo Urbano |
| COS / CUS | Coeficiente de Ocupación del Suelo / Coeficiente de Utilización del Suelo |
| WMS / WFS | Web Map Service / Web Feature Service (capas GeoServer) |
| GDL / ZPN / TLQ / TLA / TON | Guadalajara / Zapopan / Tlaquepaque / Tlajomulco de Zúñiga / Tonalá |
| VUJ | Visor Urbano Jalisco (fallback de zonificación cuando falla GeoServer GDL) |

## Projects
| Name | What |
|------|------|
| **Gestor Urbano Jalisco AMG** | Plataforma de **11 módulos** (los 23 originales fueron desechados) para consulta de uso de suelo, licencias y trámites en los 5 municipios del AMG. HTML standalone sin frameworks. M01–M11 activos. Ver `memory/projects/gestor-urbano-jalisco-amg.md` para detalle de módulos y fases. |

## Preferences
- Responder siempre en español, directo y técnico — sin relleno.
- No hacer ningún cambio de código sin autorización explícita de Fernando.
- Archivos HTML >300KB: usar scripts Python atómicos, nunca el tool Edit directo.
- `node --check` NO disponible en este equipo (Node.js no está en PATH) — omitir este paso.
- Nunca inventar datos normativos ni direcciones de organismos.
- Bitácoras se guardan en `Bitacoras/` con consecutivo (`GestorUrbano_Bitacora_vXX_0.md` + `.docx`) — próxima: v43.0 (v42.0 creada 31-ago-2026). La rama `BITACORA_v3.x.md` quedó obsoleta y fue movida a `_OBSOLETO/`.
- Push automático sin pedir confirmación — autorización permanente de Fernando.
- Leer `Instrucciones · CLAUDE.md` (raíz del proyecto) y la bitácora más reciente al inicio de cada sesión de trabajo en el proyecto.

## Deploy Vercel — REGLA PERMANENTE (aprendida a golpes 10-ago-2026)

El archivo que Vercel sirve es `C:\Users\F3RH\Documents\CLAUDE\Pruebas\11 de junio v1\ARCHIVO.html`.
El git root real está en `C:\Users\F3RH\Documents\CLAUDE\Pruebas\` (un nivel ARRIBA de esta carpeta).

**Para que un cambio aparezca en gestorurbanoamg.vercel.app:**
1. Editar `Pruebas\11 de junio v1\ARCHIVO.html` (o generar ahí con script Python)
2. Desde `Pruebas\` (git root): `git add "11 de junio v1/ARCHIVO.html"` → commit → push
3. Push siempre a DOS ramas: `git push` (master) y `git push origin master:main` (dispara Vercel)

**NUNCA** commitear solo la copia en `03 de Junio de 2026\11 de junio v1\` — esa NO llega a Vercel.
**NUNCA** pushear desde `repo-temp\` — ese repo anidado rompe la estructura en GitHub.
Ver detalle completo en `memory/project_workflow_push.md`.
