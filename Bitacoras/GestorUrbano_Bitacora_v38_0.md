# Bitácora de Desarrollo
## Gestor Urbano Jalisco AMG · v38.0
12 de agosto de 2026

---

## 1. Resumen de la sesión

Sesión de trabajo del 12 ago 2026 (continuación de sesión anterior que se compactó por contexto). Eje principal: **Art. 29 RGIM GDL en M02 y M07**, más investigación de reglamentos de Zapopan y su impacto en la app.

Trabajo realizado en dos bloques:

**Bloque A — sesión anterior (compactada):**
1. Fix de 3 bugs en la implementación del Art. 29 en M02.
2. Clarificación normativa de Art. 29 para zonas industriales y lógica zona-vs-giro.
3. Investigación de equivalente de Art. 29 en Zapopan (resultado: no existe).
4. Confirmación de que SCIAN para TLQ/TLJ/TON ya estaba resuelto.
5. Agregar Art. 29 al Glosario de M07 con definición completa de las 5 fracciones.

**Bloque B — sesión actual:**
1. Agregar reglamentos de Zapopan a sección Fuentes de M07.
2. Lectura completa del Reglamento de Giros ZPN (44 págs, 2016).
3. Implementar distancias mínimas entre giros similares en M02 para Zapopan.

---

## 2. M02 — Fix bugs Art. 29 (Bloque A)

### 2.1 Contexto

En sesión anterior se implementó el cálculo de superficie máxima por Art. 29 RGIM GDL en el overlay de verificación de giro. Al probar en la app se detectaron 3 bugs.

### 2.2 Bug 1 — CUS field visible en zona CS2

**Problema:** El campo `CUS de la zona` (necesario solo para CS3, donde el límite es 60% × CUS × lote) aparecía también en zona CS2.

**Causa raíz:** El `div` de la fila CUS no tenía `id` ni `display:none` inicial. La función `getMensajeM2` lo mostraba/ocultaba pero nunca se ocultaba por defecto.

**Fix:**
- `<div id="m02CUSRow" style="display:none;align-items:center;gap:8px">` — se agregó `id` y `display:none` al div del CUS.
- Dentro de `getMensajeM2`, después de leer `_cus`: `const _cr29 = document.getElementById('m02CUSRow'); if(_cr29) _cr29.style.display = base==='CS3' ? 'flex' : 'none';`

### 2.3 Bug 2 — Sin recalculación dinámica al cambiar lote o CUS

**Problema:** Al cambiar el valor del lote o del CUS en los inputs, el overlay no se actualizaba; mostraba el resultado del valor anterior.

**Fix:**
- Input lote: agregado `oninput="_recalcM02()"`.
- Input CUS: agregado `oninput="_recalcM02()"` y `value="2.4"` (default estándar).
- Nueva función `_recalcM02()` que actualiza visibilidad del CUS row y re-llama `verificarGiro()` si el overlay está abierto.

```javascript
function _recalcM02(){
  const _zb = (_zonaActualM02||'').toUpperCase().replace(/-.*$/,'');
  const _cr = document.getElementById('m02CUSRow');
  if(_cr) _cr.style.display = _zb==='CS3' ? 'flex' : 'none';
  if(_giroSeleccionado && _zonaActualM02 && document.getElementById('m02Ov'))
    verificarGiro();
}
```

### 2.4 Bug 3 — CS3 no recalculaba al cambiar CUS

Resuelto por el mismo fix 2.3: `_recalcM02()` llama `verificarGiro()` que a su vez llama `getMensajeM2`, que re-lee el input CUS en ese momento.

### 2.5 Aclaración normativa adicional (no bug)

Fernando preguntó por qué no aparecía el CUS al seleccionar un giro CS3 en una zona CS2. Se explicó:
- El CUS row aparece cuando la **zona del predio** es CS3, no cuando el giro seleccionado es de tipo CS3.
- Fundamento: Art. 30 RGIM GDL → la zona del predio determina qué fracción del Art. 29 aplica a TODOS los giros que operen ahí, independientemente de la clasificación del giro.
- Ejemplo: predio en CS2 con giro condicionado CS3 → aplica Frac. II (superficie máxima = lote), no Frac. III.
- El código es correcto.

**Script usado:** `fix_art29_m02.py`
**Commit:** `72a3141`

---

## 3. M02 — Clarificación Art. 29 para zonas industriales

### 3.1 Pregunta

Fernando preguntó si Art. 29 aplica a giros industriales (I1-I5) de la misma forma que a CS.

### 3.2 Respuesta y base normativa

- Art. 29 Frac. II dice explícitamente **"Para zonas CS"**. Ídem Frac. III.
- Frac. I (CS1), Frac. IV (CS4) y Frac. V (CS5) también son exclusivas de zonas CS.
- Las zonas industriales (I1-I5) no tienen equivalente en el Art. 29.
- Para industriales en zona CS existe el **Art. 96 Numeral 3 Inciso b** del PPDU GDL: superficie máxima 250 m².
- El código ya maneja esto: `if(famGiro==='I')` retorna el mensaje de Art. 96; si no es industrial ni CS, retorna `null`.
- Conclusión: el código es correcto.

---

## 4. M07 — Art. 29 agregado al Glosario (Bloque A)

### 4.1 Contenido agregado

Nueva entrada en el array `GLOSARIO` de M07:
- `ico:'📐'`, `termino:'Art. 29 RGIM GDL'`
- `categoria:'zonificacion'`
- Definición completa de las 5 fracciones con ejemplos numéricos.
- Regla clave: la fracción aplicable la determina la zona del predio, no el giro.
- Ejemplo completo: Pedro Buzeta 717 (CS2, 180 m²) con giro condicionado CS3 → Frac. II → límite = 180 m².

**Definiciones por fracción:**

| Fracción | Zona | Límite de locales |
|----------|------|-------------------|
| Frac. I | CS1 — Impacto Mínimo | 75 m² (lote <100), 150 m² (lote 100–250), 200 m² (lote >250) |
| Frac. II | CS2 — Impacto Bajo | Hasta 100% de la superficie del lote |
| Frac. III | CS3 — Impacto Medio | Hasta 60% del potencial edificable (CUS × lote) |
| Frac. IV | CS4 — Impacto Alto | Sin límite de Art. 29; solo rige el CUS |
| Frac. V | CS5 — Impacto Máximo | Sin límite de Art. 29; solo rige el CUS |

**Commits:** `568c39e` (primera versión) · `eb9d84e` (mejoras CS1/CS4/CS5)

---

## 5. Investigación equivalente Art. 29 en Zapopan (Bloque A)

### 5.1 Reglamentos revisados

Se descargaron y leyeron 3 PDFs:
1. **Reglamento de Desarrollo Urbano y Ordenamiento del Territorio — Zapopan** (43 págs, 2012)
2. **Reglamento para el Ejercicio de Giros Comerciales y de Prestación de Servicios — Zapopan** (44 págs, 2016)
3. **Reglamento Estatal de Zonificación — Jalisco** (224 págs, 2003, vía portal Zapopan)

### 5.2 Conclusión

**Zapopan NO tiene equivalente al Art. 29 RGIM GDL.**

- Zapopan regula el tamaño máximo de construcción mediante **COS/CUS por zona** definidos en los PPDU (no por impacto del giro).
- Las zonas de Zapopan son MB/MD/MC/MR (no CS1-CS5).
- El código ya es correcto: todas las funciones de Art. 29 tienen guard `if(municipioActual !== 'zapopan')`.

### 5.3 Confirmación SCIAN TLQ/TLJ/TON

Confirmado que SCIAN para TLQ, TLJ, TON ya estaba resuelto desde sesiones anteriores:
- **VUJ (Visor Urbano Jalisco)** provee la zonificación de esos 3 municipios vía API.
- **GU_SCIAN_GDL** se usa como catálogo de compatibilidad giro↔zona (fallback válido: las claves CS1-CS5, H1-H5, I1-I5 son las mismas).
- Línea 5820 M02: `const base = mun === 'zapopan' ? GU_SCIAN_ZAP : GU_SCIAN_GDL;`
- Guardado en memoria de proyecto.

---

## 6. M07 — Fuentes: reglamentos ZPN + URL Estatal Zonificación (Bloque B)

### 6.1 Cambios en sección Fuentes

Se agregaron 2 nuevas entradas al grupo "📜 Reglamentos y Leyes":

| Tag | Reglamento | Módulos |
|-----|-----------|---------|
| Municipal ZPN | Reglamento para el Ejercicio de Giros Comerciales y de Prestación de Servicios del Municipio de Zapopan (últ. reforma 2016) | M02, M06 |
| Municipal ZPN | Reglamento de Desarrollo Urbano y Ordenamiento del Territorio del Municipio de Zapopan (2012) — sin equivalente al Art. 29 RGIM; zonificación por COS/CUS según PPDU | M01, M02, M03 |

Se actualizó el `href` del **Reglamento de Zonificación del Estado de Jalisco** de `info.jalisco.gob.mx` (genérico) al PDF directo:
`https://www.zapopan.gob.mx/wp-content/uploads/2021/07/Reglamento_Estatal_de_Zonificacion_29052003.pdf`

**Commit:** `111a70c`

---

## 7. Análisis completo Reglamento de Giros ZPN (Bloque B)

### 7.1 Hallazgos relevantes para la app

Se leyeron las 44 páginas completas. Hallazgos clasificados por relevancia:

#### Ya cubierto o irrelevante

| Tema | Situación |
|------|-----------|
| Zonas A/B/C/D del reglamento | **Supersedidas** por PPDU 2023 (ZPN-01 a ZPN-12). La app usa MB/MD/MC/MR que son las vigentes. No implementar. |
| "Control normal" vs "control especial" | M06 ya lo cubre implícitamente vía Ley de Ingresos ZPN 2026 (cuotas mensuales para alcohol y otros). |
| Horario control normal: 6:00–21:00 (Art. 12) | Relevante pero fuera del alcance de M02/M06 en su forma actual. |
| Refrendo anual (Art. 5) | Ya cubierto en M06 y M08. |
| Requisitos de higiene operativos | Demasiado granulares para el propósito del app. |

#### Implementado en esta sesión

- **Distancias mínimas entre giros similares** — ver sección 8.

#### Pendiente de investigar para GDL

- GDL tiene reglas similares de distancias en su Reglamento de Giros, pero no se verificaron en esta sesión. Cuando se implemente, agregar a `getMensajeDistancia()` con guard `municipioActual !== 'zapopan'` → pendiente.

### 7.2 Sobre el RDUOT Zapopan 2012

- La URL del PDF del RDUOT ZPN 2012 no está disponible online (todas las URLs intentadas devuelven 404).
- Las normas de edificación que contenía están **supersedidas** por el **PDUZ 2023 + 12 Planes Parciales** que ya están listados en M07 Fuentes.
- El RDUOT puede seguir vigente en aspectos procedimentales, pero no afecta lo que la app calcula.

---

## 8. M02 — Distancias mínimas entre giros similares — Zapopan (Bloque B)

### 8.1 Base normativa

Reglamento para el Ejercicio de Giros Comerciales y de Prestación de Servicios — Zapopan:

| Artículo | Giro | Restricción |
|----------|------|-------------|
| Art. 45 | Carnicerías, obradores | 300 m mín. entre establecimientos similares |
| Art. 136 | Servicios funerarios | 500 m mín. entre establecimientos similares |
| Art. 73 | Gasolineras y gaseras | 150 m mín. de escuelas, templos, cines, teatros, mercados, centros sociales (*no implementado — giros no en catálogo ZAP*) |

### 8.2 Implementación

**Nueva función `getMensajeDistancia(codigo)`** insertada antes de `getMensajeM2`:

```javascript
function getMensajeDistancia(codigo){
  if(municipioActual !== 'zapopan') return null;
  const D = {
    '461121':{dist:'300 m',desc:'entre establecimientos similares (carnicería / carne empacada)',ref:'Art. 45'},
    '461122':{dist:'300 m',desc:'entre establecimientos similares (expendio de carne de aves)',ref:'Art. 45'},
    '431121':{dist:'300 m',desc:'entre establecimientos similares (carnicería mayoreo / obrador)',ref:'Art. 45'},
    '812310':{dist:'500 m',desc:'entre establecimientos similares (servicios funerarios)',ref:'Art. 136'}
  };
  const r = D[codigo];
  if(!r) return null;
  return {
    icon:'📏',
    texto:'<strong>Distancia mínima: '+r.dist+'</strong> '+r.desc+'...'
      +'<div>'+r.ref+', Reglamento Giros ZPN. Verificar con Padrón y Licencias.</div>'
  };
}
```

La función **solo activa para Zapopan** (`municipioActual !== 'zapopan'` guard). Retorna `null` para todos los demás municipios.

### 8.3 Integración en el overlay

El bloque `📏` se insertó en **ambas ramas del overlay** de `verificarGiro()`:
- Rama Zapopan (línea ~6790): formato template literal de una sola línea.
- Rama GDL (línea ~6856): formato multi-línea.

En la práctica solo activa en Zapopan por el guard de la función.

### 8.4 Por qué no se implementaron gasolineras ZPN (Art. 73)

Los códigos SCIAN de gasolineras/gaseras (468411, 468412, 468413, 468419) están en `GU_SCIAN_GDL` pero **no en `GU_SCIAN_ZAP`**. Como para Zapopan se usa `GU_SCIAN_ZAP` (línea 5820), esos giros no aparecen en la lista de Zapopan y el overlay nunca se dispara para ellos. Se deja como pendiente agregar los códigos al catálogo ZAP si se quiere cubrir este caso.

**Script:** `add_dist_m02.py`
**Commit:** `fe1b329`

---

## 9. Commits generados

| Hash | Descripción |
|------|-------------|
| `72a3141` | fix M02: Art. 29 — CUS show/hide, recalculación dinámica, value default 2.4 |
| `568c39e` | feat M07: Art. 29 RGIM GDL al Glosario — 5 fracciones con ejemplo |
| `eb9d84e` | feat M07: mejorar descripciones CS1/CS4/CS5 en Art. 29 |
| `111a70c` | feat M07: reglamentos ZPN a Fuentes + URL Estatal Zonificación al PDF directo |
| `fe1b329` | feat M02: distancias mínimas entre giros similares — Zapopan (Arts. 45, 136) |

**Total:** 5 commits · sesión 12 ago 2026

---

## 10. Parámetros de la sesión

| Parámetro | Valor |
|-----------|-------|
| Versión | v38.0 |
| Fecha | 12 ago 2026 |
| Período cubierto | 12 ago 2026 (+ compactado de sesión misma fecha) |
| Sesión previa | v37.0 (3–4 ago 2026) |
| Rama | master + sincronización a main (Vercel) |
| Archivos modificados | GestorUrbano_M02_4.html · GestorUrbano_M07_1.html |
| Python disponible | Python 3.14.5 ✓ |
| M02 tamaño final | ~508 KB (>300 KB → scripts Python atómicos obligatorios) |

---

## 11. Estado de módulos al 12 ago 2026

| Mód | Estado | Notas |
|-----|--------|-------|
| M01 | ✅ Producción | Sin cambios |
| M02 | ✅ Producción | Art. 29 completo + distancias ZPN |
| M03 | ✅ Producción | Sin cambios |
| M04 | ✅ Producción | `guVerificarLimite()` comentado intencionalmente |
| M05 | ✅ Producción | Sin cambios |
| M06 | ✅ Producción | Sin cambios |
| M07 | ✅ Producción | Glosario Art. 29 + Fuentes ZPN actualizadas |
| M08 | ✅ Producción | Sin cambios |
| M09 | ✅ Producción | Sin cambios |
| M10 | ✅ Producción | Sin cambios |

---

## 12. Pendientes arrastrados

- **`gu-freemium.js`**: Integrar en M04, M05, M06, M08 y M10 — pendiente desde 08-jul
- **Custom domain `trazaurbana.mx`**: Configurar en Vercel (acción de Fernando)
- **M04 `guVerificarLimite()`**: Desactivado intencionalmente (decisión 17-jul-2026) — sin acción hasta que Fernando decida reactivar
- **Gasolineras/gaseras ZPN**: Agregar códigos 468411-468413/468419 a `GU_SCIAN_ZAP` para habilitar la regla de distancia 150m (Art. 73 Reg. Giros ZPN)
- **Distancias GDL**: Verificar reglas equivalentes en Reglamento de Giros GDL y agregar a `getMensajeDistancia()` con guard `municipioActual !== 'zapopan'`
- **GitLab mirror / OneDrive move** (pendiente de sesiones anteriores)
- **Formspree ID** — Fernando debe crear cuenta y proveer ID

---

*Bitácora generada: 12 ago 2026 · Fernando H.*
