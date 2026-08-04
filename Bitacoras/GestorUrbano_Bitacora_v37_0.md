# Bitácora de Desarrollo
## Gestor Urbano Jalisco AMG · v37.0
4 de agosto de 2026

---

## 1. Resumen de la sesión

Sesión de trabajo del 3–4 ago 2026. Eje principal: **M02 — mejoras de UX en el panel de verificación de giro** (continuación de sesión anterior que quedó a mitad de contexto). Cuatro fixes en cascada que resuelven la experiencia completa del panel de resultados:

1. **Highlight de botones de zona:** CS1-CS2, CS3, I1, I2 ahora muestran visualmente cuál está activo.
2. **Highlight del giro seleccionado** en la lista (fix previo completado en esta sesión).
3. **Panel de condicionante limpio:** se quitó el código `[N]` del encabezado; se corrigió el color del texto descriptivo que era invisible.
4. **Nombre del PDF de constancia:** ahora incluye el tipo de uso del giro (I2, CS2, etc.).

---

## 2. M02 — Highlight de botones de categoría de zona

### 2.1 Problema

Al hacer clic en CS1-CS2, CS3, I1 o I2 para mostrar los giros de esa categoría, el botón seleccionado no mostraba ningún cambio visual — no había retroalimentación de cuál estaba activo.

### 2.2 Causa raíz

Existían **dos declaraciones duplicadas** de `mostrarGirosPermitidos()` y `mostrarGirosCondicionados()` en el archivo. La segunda declaración (que override la primera por ser posterior en el JS) referenciaba IDs del DOM que no existen: `btnPermitidos` y `btnCondicionados` en lugar de los IDs reales `btnZonaPermitido` y `btnZonaCondicionado`. `getElementById()` retornaba `null` silenciosamente y no ocurría ningún cambio visual.

### 2.3 Solución

- Se eliminó el duplicado roto (tenía también el comentario `// Resaltar botón` con acento que causó el mismatch de patrón en el script Python).
- Se creó el helper `_activarBotonZona(idActivo)` que itera los 4 botones y aplica `opacity:1` al activo y `opacity:0.35` a los inactivos.
- Las 4 funciones `mostrarGiros*` ahora llaman al helper en lugar de manipular estilos individualmente.

```javascript
function _activarBotonZona(idActivo){
  ['btnZonaPermitido','btnZonaCondicionado','btnZonaIndPer','btnZonaIndCond'].forEach(function(id){
    var b=document.getElementById(id);
    if(b) b.style.opacity = id===idActivo ? '1' : '0.35';
  });
}
```

**Commit:** `54da438`

---

## 3. M02 — Highlight del giro seleccionado en la lista

### 3.1 Contexto

Fix previo (sesión anterior) que fue comprometido pero no pusheado por error de red (`Could not resolve host: github.com`). Se confirmó y consolidó en esta sesión.

### 3.2 Cambios aplicados

- `seleccionarGiroM02(codigo, nombre, el)` acepta ahora el elemento DOM (`el`) como tercer argumento.
- Al seleccionar, aplica `background:var(--brand-pale)`, `color:var(--brand)`, `borderLeft:3px solid var(--brand)`, `fontWeight:500`.
- `clearGiroM02()` limpia el highlight previo via `window._giroSelEl`.
- `filtrarGirosM02` re-aplica el highlight al giro seleccionado después de cada re-render de la lista.
- El panel de IA (`_renderLista`) recibe el mismo tratamiento.

**Commit:** `c1fe2da`

---

## 4. M02 — Panel de condicionante: número y color

### 4.1 Número `[N]` en el encabezado

**Problema:** el encabezado del panel de condicionante decía `"Permitido con condicionante [4]."` — el número es el código interno del Art. 7 frac. del Reglamento de Giros GDL, no aporta nada al usuario final. El texto descriptivo completo ya se mostraba en la sección de notas abajo.

**Fix:** se removió `[${g.cond}]` de los 4 caminos donde aparecía `razon`:
- CS permitido con condicionante (GDL)
- CS condicionado genérico (GDL)
- Industrial permitido con condicionante (GDL)
- Camino Zapopan MB/MD/MC/MR con condicionante

Resultado: `"Permitido con condicionante."` (sin número).

**Commit:** `cec7805`

### 4.2 Texto descriptivo invisible

**Problema:** el texto del condicionante (ej: `"⚠️ Si la superficie supera 100 m², este giro se reclasifica como Comercial Impacto Medio (CS3)..."`) era invisible en el panel. Solo se veían los emojis flotando, sin texto.

**Causa raíz:** el render de la sección `conds` usaba `color:var(--yellowD)` pero `--yellowD` nunca fue definida como CSS custom property en el archivo. El browser heredaba el color del padre, que sobre el fondo oscuro `#1A0F00` + `rgba(0,0,0,.3)` resultaba imperceptible.

**Fix:** reemplazar `color:var(--yellowD)` por `color:#FCD34D` (amber-300, legible sobre fondo oscuro) en los dos renders del panel (Zapopan y GDL). También se agregó `line-height:1.5` para mejor legibilidad. Se quitó el `⚠️` redundante que el render GDL añadía antes de `${c}` (ya está incluido en los textos de `cTextos`).

**Commit:** `3b3f197`

---

## 5. M02 — Tipo de uso en nombre del PDF de constancia

### 5.1 Problema

Al descargar la constancia de verificación de giro como PDF, el nombre del archivo era:
```
Giro — pedro buzeta 717 — Guadalajara
```

El tipo de uso del giro (CS1, CS2, CS3, I1, I2…) no estaba incluido, lo cual es información clave para el usuario.

### 5.2 Solución

En `generarPDFGiro()`, se busca el giro en `GU_SCIAN` por `r.codigo` para obtener su `uso_gdl`:

```javascript
const _g2 = (typeof GU_SCIAN!=='undefined') ? (GU_SCIAN.find(x=>x.codigo===r.codigo)||{}) : {};
const _usoGiro = _g2.uso_gdl || '';
const tituloArchivo = 'Giro' + (_usoGiro ? ' ' + _usoGiro : '') + (domicilio ? ' — ' + domicilio : '') + ' — ' + municipio;
```

Resultado: `"Giro I2 — pedro buzeta 717 — Guadalajara"`.

### 5.3 Sincronización GU_Deploy

Se detectó que el archivo deploy (`GU_Deploy/11 de junio v1/GestorUrbano_M02_4.html`) estaba ~32KB detrás del archivo de trabajo — le faltaba `generarPDFGiro()` completa y otras funciones. Se sincronizó copiando el archivo de trabajo al deploy.

**Commit:** `d169093`

---

## 6. Commits generados

| Hash | Descripción |
|------|-------------|
| `c1fe2da` | feat M02: highlight visual del giro seleccionado en ambos paneles |
| `54da438` | feat M02: highlight activo en botones de categoría de giro (CS1-CS2/CS3/I1/I2) |
| `cec7805` | fix M02: quitar número de condicionante del encabezado del panel |
| `3b3f197` | fix M02: texto de condicionante invisible por --yellowD sin definir |
| `d169093` | feat M02: agregar uso (I2/CS2/etc) al nombre del PDF de constancia |

**Total:** 5 commits · 1 sesión (3–4 ago 2026)

---

## 7. Parámetros de la sesión

| Parámetro | Valor |
|-----------|-------|
| Versión | v37.0 |
| Fecha | 4 ago 2026 |
| Período cubierto | 3–4 ago 2026 |
| Sesión previa | v36.0 (1 ago 2026) |
| Rama | master + sincronización a main (Vercel) |
| Archivos modificados | GestorUrbano_M02_4.html (trabajo + GU_Deploy) |
| Python disponible | Python 3.14.5 ✓ |
| GeoServer GDL | Estado desconocido — no verificado en esta sesión |

---

## 8. Estado de módulos al 4 ago 2026

| Mód | Estado | Notas |
|-----|--------|-------|
| M01 | ✅ Producción | Sin cambios en esta sesión |
| M02 | ✅ Producción | Botones zona, giro highlight, panel condicionante, PDF con uso |
| M03–M11 | ✅ Producción | Sin cambios en esta sesión |

---

## 9. Pendientes arrastrados

- Integrar `gu-freemium.js` en M04, M05, M06, M08, M10
- Custom domain `trazaurbana.mx` en Vercel
- GitLab mirror setup / OneDrive move
- DTUDE M05/M06 para TLJ, TLQ, TON
- GeoServer GDL: verificar cuando vuelva — deshabilitar mensaje de fallback
- M11 Pro: gráfico de flujo de caja, exportar XLSX
- Nota TON normativa en M06 (PDF no extraíble — pendiente)
- Formspree ID (Fernando debe crear cuenta y proveer ID)
- Actualizar RESPALDO DE MODULOS

---

*Bitácora generada: 4 ago 2026 · Fernando H.*
