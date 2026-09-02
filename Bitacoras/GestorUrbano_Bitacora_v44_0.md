# Bitácora v44.0 — Gestor Urbano Jalisco AMG
**Período:** 01-sep-2026
**Rama:** master + main (Vercel)
**Autor:** Fernando H. / Claude Sonnet 5

---

## Resumen ejecutivo

Sesión centrada en un problema reportado por el usuario en M10: el análisis IA de planos no lograba leer los coeficientes COS/CUS ni la superficie de terreno de la solapa del plano, aunque esos datos sí estaban impresos ahí. La investigación llevó a un hallazgo de fondo — la API de Claude limita cada imagen a 1568px/1568 tokens visuales en el nivel estándar, sin importar la resolución que se le mande — y a dos soluciones distintas según el tipo de problema: un recorte de alta resolución de la solapa en M10 (dato concentrado en una zona) y una subida de modelo a Sonnet 5 en M04 (dato repartido por todo el plano). En el camino se corrigió también un bug de UX en M10 (guard de municipio invisible) y un bug crítico compartido por ambos módulos: el proxy de Claude rechazaba el parámetro `temperature` en Sonnet 5.

---

## Commits incluidos (8)

| Hash | Hora | Descripción |
|------|------|-------------|
| `b804843` | 20:33 | fix M10: subir límite de resolución (1920→3200px) — primer intento, luego revertido |
| `34bd9ef` | 20:40 | fix M10: exigir seleccionar municipio antes de buscar domicilio, igual que M01 |
| `81f406e` | 20:48 | fix M10: mover statusBox debajo del botón — el aviso de error quedaba oculto sin scroll |
| `525f099` | 21:08 | fix M10: modelo → claude-sonnet-5 — segundo intento, luego revertido por costo |
| `9066cde` | 21:41 | fix M10: recorte de alta resolución de la solapa — solución final |
| `872f2f0` | 21:44 | docs: corregir autoría Claude Sonnet 4.6 → Sonnet 5 en bitácoras v41–v43 |
| `9a9e04b` | 22:03 | fix M04: modelo → Sonnet 5/Opus 5, GU_LADO_MAX 1920→2576 |
| `d06c203` | 22:15 | fix: proxy Claude rechazaba `temperature` en Sonnet 5, no solo Opus |

---

## 1. M10 — Guard de municipio antes de buscar domicilio (34bd9ef, 81f406e)

**Solicitud del usuario:** que M10 no permita buscar/analizar un domicilio sin haber elegido municipio primero, igual que ya funciona en M01.

**Diagnóstico:** M10 (clonado de M01) traía `municipioActual = 'guadalajara'` como valor por defecto, y `buscar()` no tenía el guard que M01 sí tiene — la búsqueda de dirección se ejecutaba silenciosamente contra Guadalajara aunque el usuario nunca hubiera elegido municipio.

**Fix (34bd9ef):**
- `municipioActual` pasa de `'guadalajara'` a `''` (igual que M01)
- Nota inicial del panel: "Selecciona un municipio para empezar" (antes decía "Guadalajara — API Visor Urbano activa")
- `buscar()` agrega: `if(!municipioActual){ setStatus('error','⚠️ Selecciona primero el municipio donde está el domicilio'); return; }`

**Bug secundario encontrado al probar (81f406e):** el guard sí disparaba el mensaje de error correctamente, pero `#statusBox` estaba posicionado al fondo del sidebar — después de dos bloques de texto de ayuda, el selector de ambigüedad de municipio/zona y el historial de búsquedas — por lo que el usuario nunca lo veía sin hacer scroll y reportó "no reacciona". Se movió `#statusBox` a justo debajo del botón "Consultar zonificación", visible de inmediato.

Verificado en servidor local (bypass del login de Vercel vía `.claude/launch.json`, configuración `GU-prod-dev`): sin municipio → error visible al instante; con municipio → búsqueda funciona normal.

---

## 2. M10 — Solapa/cajetín ilegible: causa raíz y solución (b804843 → 525f099 → 9066cde)

**Síntoma reportado:** subiendo un plano real (Mota Padilla #19, GDL) a M10, el dictamen decía "No se detectó cuadro de áreas en el plano" y "Superficie no identificada", pese a que la solapa sí trae esos datos.

### Intento 1 — subir resolución del lado del cliente (b804843, revertido)

Se subió `LADO` de 1920 a 3200px en `m10ComprimirImagen()`. **No sirvió de nada** — la API de Claude limita cada imagen a un tope fijo por nivel del modelo, sin importar la resolución que se rasterice localmente:

| Nivel | Modelos | Lado máx. | Tokens visuales máx. |
|---|---|---|---|
| Estándar | Todos excepto Claude 4.7+ | 1568px | 1568 |
| Alta resolución | Claude 4.7 y posteriores | 2576px | 4784 |

M10 usaba `claude-sonnet-4-6` (nivel estándar) — cualquier imagen enviada, sin importar su tamaño, se reduce a ~1358×905px antes de que el modelo la vea. En una lámina de 36×24", eso da ~43 DPI — la solapa (20% del ancho) queda en ~310px, insuficiente para leer la tabla de coeficientes.

### Intento 2 — subir de modelo a Sonnet 5 (525f099, revertido)

Subir a `claude-sonnet-5` entra al nivel de alta resolución (2576px/4784 tokens) para la lámina completa. Funcionaba, pero el usuario señaló la preocupación de costo/escala: **~3x tokens** por análisis, relevante cuando muchos usuarios lo usen a la vez.

### Solución final — recorte de la solapa como imagen adicional (9066cde)

Comparación de costo real (tokens visuales, fórmula `⌈w/28⌉×⌈h/28⌉`):

| Opción | Tokens | vs. hoy |
|---|---|---|
| Sonnet 4.6, 1 imagen completa (como estaba) | ~1,617 | 1x |
| Sonnet 5, 1 imagen completa | ~4,845 | 3x |
| **Sonnet 4.6 + recorte solo de la solapa** | ~3,201 | **2x** |

El usuario confirmó que la solapa siempre está en la franja derecha en los 5 municipios, lo que hizo viable un recorte de posición fija. Implementación:

- `m10RecortarSolapaDeCanvas()` recorta la franja `x:0.815–0.985, y:0.135–0.34` del **mismo canvas ya renderizado** a escala 2 (no se re-renderiza, no se sube de escala) — es una operación `drawImage` (bitmap), no un re-procesamiento vectorial.
- `m10SolapaCrops[]`, arreglo paralelo a `m10Archivos[]`, guarda el recorte (o `null`) de cada lámina.
- El recorte se manda a Claude como una imagen adicional, con su propia etiqueta de texto: *"Lámina N — acercamiento de la solapa/cuadro de áreas (usa esta imagen para leer con precisión COS, CUS y superficie de terreno)"*.
- Funciona tanto para PDFs (`m10RecortarSolapaDeCanvas`) como para imágenes sueltas JPG/PNG (`m10RecortarSolapaDeImagen`, recorta directo de la imagen original antes de comprimir).
- Revertidos `M10_MODEL` a `claude-sonnet-4-6` y `LADO` a `1920` — sin efecto sobre el costo, ya que ninguno de los dos aportaba nada una vez confirmado el tope de la API.

**Nota técnica del primer intento fallido de implementación:** el primer diseño intentaba recortar re-renderizando la página con `ctx.translate()` antes de llamar `page.render()` de pdf.js, asumiendo que el canvas más chico haría el render más rápido. **No fue así** — pdf.js procesa todo el contenido vectorial de la página sin importar el tamaño del canvas destino, solo descarta los píxeles fuera de él al final. Corregido reutilizando el canvas ya renderizado con `drawImage` (bitmap crop, prácticamente instantáneo).

**Verificación con Python/fitz** (reproduciendo el pipeline fuera de la app): a la resolución que efectivamente sale del canvas a escala 2 (~881×707px, ~145 DPI en la zona de la solapa), los valores de COS (0.78/0.80), CUS (1.94/2.40), superficie de terreno (1,052.00 m²) y el cuadro de cargas completo son perfectamente legibles.

---

## 3. M04 — Mismo problema de fondo, solución distinta (9a9e04b)

**Contexto:** el usuario pidió revisar si M04 (Revisor de Planos IA) tenía el mismo problema que M10. Confirmado: mismo pipeline (1920px, sin recorte, modelos Sonnet 4.6/Opus 4.8 — ambos en nivel estándar).

**Diferencia clave que descartó copiar el fix de M10 tal cual:** M04 no necesita leer una sola zona concentrada (como la solapa de M10) — necesita leer acotaciones finas **repartidas por todo el plano**: anchos de puerta, pasillos, escaleras, ventanas de iluminación, cajones de estacionamiento, patios, accesibilidad universal. Un recorte de una sola zona no resuelve eso.

**Fix aplicado:**
- Modelo: `claude-sonnet-4-6` / `claude-opus-4-8` → **`claude-sonnet-5`** / **`claude-opus-5`** (nivel de alta resolución, ~3x tokens, aceptado por el usuario: *"la IA no ha fallado directamente pero a veces no alcanza a leer todo"*).
- `GU_LADO_MAX`: 1920 → **2576** — para que el cliente sí mande suficientes píxeles y aproveche el nuevo tope (con 1920 se hubiera desperdiciado parte de la resolución ya pagada).

**Verificación con plano real** (torre de 14 niveles, proyecto "Kavi/Gardens Lafayette", 106 páginas reportadas por el visor pero 12 páginas reales según pdf.js/fitz — documento escaneado sin capa de texto): comparando la misma zona de un departamento a 1920px vs 2576px, las cotas de cuartos ("2.90", "3.16", "3.06"...) y etiquetas ("DEPTO 1203", "ELEVADOR VIVIENDA", "CLOSET") pasan de leerse con esfuerzo a leerse con claridad.

**Prueba en vivo del usuario tras el fix:** subió el mismo plano a M04. El análisis corrió (sin el error de `temperature`, ver sección 5) pero marcó "No verificable" en Escaleras y Pasillos y corredores por falta de cotas legibles. Verificación cruzada: la resolución sí mejoró (ahora se lee "ESCALERA DE EMERGENCIA" y la numeración de peldaños S/B), pero lo que hay en estas láminas es una numeración secuencial de peldaños para el cálculo de desnivel acumulado del edificio, **no** un acotamiento explícito de ancho/huella/contrahuella como pide la normativa. Ese dato normalmente vive en una lámina de "detalle de escalera" aparte — y el PDF compartido trae 12 de las 40 láminas originales del proyecto (cajetín dice "22 DE 40", "23 DE 40"...). Conclusión: el fix de resolución cumplió su parte; lo que falta para verificar Escaleras/Pasillos con certeza es tener las láminas de detalle constructivo, no más resolución de imagen.

---

## 4. Bug crítico compartido — proxy Claude rechazaba `temperature` en Sonnet 5 (d06c203)

**Síntoma:** al probar M04 con Sonnet 5 en producción, error real de la API: `` `temperature` is deprecated for this model ``.

**Causa:** `api/claude-proxy.js` solo excluía el parámetro `temperature` para modelos Opus (`esOpus = modeloFinal.includes('opus')`), asumiendo que era la única excepción. La API de Anthropic dejó de aceptar `temperature` personalizado también en Sonnet 5 — no es exclusivo de Opus.

**Fix:** cambio de lista de *excluidos* a lista de *permitidos* — en vez de ir agregando cada modelo nuevo que lo rechace, `temperature` solo se manda para el modelo confirmado que lo soporta (`claude-sonnet-4-6`); cualquier modelo no probado (incluyendo modelos futuros) cae por defecto en "no mandar temperature", que es el comportamiento seguro.

```js
const soportaTemperaturePersonalizado = modeloFinal === 'claude-sonnet-4-6';
...
if (soportaTemperaturePersonalizado) {
  payloadAnthropic.temperature = body.temperature ?? 0;
}
```

**Alcance:** afecta a cualquier módulo que use el proxy compartido con un modelo distinto a `sonnet-4-6` — en este momento, M04 (Sonnet 5 / Opus 5). M10 no se ve afectado, sigue en `sonnet-4-6`.

---

## 5. Corrección de autoría en bitácoras anteriores (872f2f0)

Las bitácoras v42.0 y v43.0 (`.md` y `.docx`) decían "Claude Sonnet 4.6" en el pie de autoría — copiado sin actualizar de la plantilla de v41.0. Corregido a "Claude Sonnet 5" (el modelo real de esta sesión). v41.0 no necesitó corrección: su `.docx` viene de un generador distinto, anterior a esta sesión, y nunca tuvo esa línea.

---

## 6. Pendientes conocidos

| Tarea | Estado |
|-------|--------|
| Freemium.js integración (M01–M03, M05–M09, M11) | 🔵 STBY |
| Dominio personalizado trazaurbana.mx | ⏳ Pendiente |
| UptimeRobot monitoring | ⏳ Pendiente |
| Formspree ID propio | ⏳ Pendiente |
| Gasolineras/gaseras ZPN — códigos SCIAN | ⏳ Pendiente |
| Guard municipio M02/M03/M05 | ⏳ Pendiente |
| M04 — confirmar Escaleras/Pasillos requiere láminas de detalle, no más resolución | ℹ️ Nota para el usuario |

---

*Próxima bitácora: v45.0*
*Generada: 01-sep-2026*
