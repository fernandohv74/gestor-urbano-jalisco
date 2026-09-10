# Bitácora v45.0 — Gestor Urbano Jalisco AMG
**Período:** 07-sep-2026 – 09-sep-2026
**Rama:** master + main (Vercel)
**Autor:** Fernando H. / Claude Sonnet 5

---

## Resumen ejecutivo

Sesión larga centrada en dos frentes que terminaron entrelazados. El primero: una foto de un aviso oficial de "USOS DE SUELO" de Guadalajara destapó que M06 cobraba el dictamen equivocado (el caro, de trazos, en vez del barato, de uso y destinos específicos) y que Protección Civil GDL se cobraba como si fuera automática cuando en realidad es a solicitud de parte. El segundo, mucho más grande: investigar y ubicar los "giros restringidos" (bar, cantina, discoteca, etc. — negocios que necesitan zonificación de mayor intensidad y autorización del Consejo de Giros Restringidos) para los 5 municipios del AMG, uno por uno y con la misma rigurosidad normativa en cada caso — cada municipio resultó tener su propia regla: GDL un solo nivel (CS3), Tlaquepaque y Tonalá con un segundo nivel más alto solo para centro nocturno/cabaret, y Tlajomulco con el caso más distinto de los cinco (Bar y Cantina exigen el nivel más alto ahí, a diferencia de los otros cuatro).

Verificar esa misma lógica en distintas partes del código sacó a la luz un patrón repetido: la misma regla de "giro restringido" vivía copiada y pegada en tres lugares de M02 (la lista de búsqueda manual, la búsqueda con IA, y el overlay de "Verificar compatibilidad") y dos de M06 (el checklist y el cálculo de costos) — cada copia se corrigió por separado en su momento, y cada vez que se tocaba una sin tocar las demás, las otras se quedaban con el bug. Se corrigieron las cinco por separado, verificando cada una contra la real (llamando las funciones tal cual, no una reimplementación de prueba), y donde tenía sentido se consolidó en una sola tabla compartida para que no vuelva a pasar.

En paralelo, Fernando compartió el Formato Múltiple real de licencias de Guadalajara (un PDF escaneado de 2 páginas) y se cruzaron sus 26 requisitos numerados contra lo que M06 realmente pedía — apareció que a M06 le faltaban 3 requisitos reales (carta poder cuando un tercero hace el trámite, contrato de arrendamiento cuando el local es rentado, carta de anuencia cuando está en una plaza) y que sobraban 2 (Protección Civil y aviso de Salud pedidos parejo a cualquier giro, sin importar el riesgo real). Se cerró también una cadena de bugs de UX en el buscador de giros de M06: un atajo que se saltaba la consulta a la IA con palabras genéricas, texto escrito a mano que nunca se registraba si no se usaba el autocomplete, y un catálogo propio de M06 sin sinónimos para términos tan comunes como "contaduría" o "abogado".

---

## Commits incluidos (24)

| Hash | Fecha/Hora | Descripción |
|------|------|-------------|
| `7f29114` | 07-sep 17:19 | fix M06: quita costo de Constancia de Protección Civil GDL del total |
| `55af3a4` | 07-sep 18:09 | fix M06: agrega búsqueda por código SCIAN + corrige dato contaminado |
| `dc19a51` | 08-sep 15:46 | fix M06: corrige Dictamen de Uso y Destinos Específicos (no DTUDE/Trazo) |
| `ff01326` | 08-sep 16:23 | feat M02: giros restringidos GDL requieren CS3+ y Consejo de Giros Restringidos |
| `1dd8e3a` | 08-sep 19:13 | feat M02: giros restringidos Tlaquepaque requieren CS-D(3)/CS-C(4) según Cuadro 3 |
| `ae80d1a` | 08-sep 19:16 | feat M02: giros restringidos Tonalá según Cuadro 3 estatal + generaliza tabla por municipio |
| `d61421b` | 08-sep 19:19 | feat M02: giros restringidos Tlajomulco (Cuadro 8/9) + corrige aviso cruzado entre municipios |
| `7c7a20f` | 08-sep 19:20 | fix M08: corrige costo DTUDE GDL de $2,016 a $2,045 |
| `57822d7` | 08-sep 20:20 | feat M02: agrega Bar/Cantina/Discoteca/Boliche al catálogo de Zapopan y sus giros restringidos |
| `8e9a56e` | 08-sep 20:34 | fix M02: quita 2 giros mal etiquetados del catálogo de Zapopan (GU_SCIAN_ZAP) |
| `3d6e05a` | 08-sep 20:42 | fix M02: la pestaña "Describir con IA" no mostraba el aviso de giro restringido |
| `0ff9b88` | 08-sep 20:57 | fix M02: verificarGiro() ignoraba los giros restringidos — mostraba "PERMITIDO" |
| `82a751e` | 08-sep 21:11 | feat M06: aviso de giro restringido para bar/discoteca/cabaret/cervecería |
| `6a55b5d` | 08-sep 21:32 | fix M06: el aviso de giro restringido (y clasificación de alcohol) no llegaba vía deep link desde M02 |
| `047026d` | 09-sep 10:20 | fix M06: usa el nombre oficial exacto del dictamen por municipio (GDL/ZPN) |
| `8226fbd` | 09-sep 10:34 | fix M06: checklist de PC/salud-estética traía datos de más para giros de oficina |
| `a41c79e` | 09-sep 10:43 | fix M06: el PDF/impresión traía el selector de municipios y formularios de captura |
| `9ad6c20` | 09-sep 10:53 | fix M02: el buscador con IA se saltaba la IA con palabras genéricas ("oficina de contadores") |
| `bafa189` | 09-sep 11:02 | feat M06: el Dictamen de Uso y Destinos Específicos ya no se cobra parejo a todos los giros |
| `5855b82` | 09-sep 11:21 | feat M06: agrega carta poder (tercero), propio/rentado y plaza comercial al checklist |
| `6000e54` | 09-sep 14:02 | fix M06: el contrato de arrendamiento (GDL) sale como punto propio, no oculto en la nota del predial |
| `982e85e` | 09-sep 15:23 | fix M06: escribir el giro a mano (sin usar el autocomplete) no se registraba |
| `82da97c` | 09-sep 15:54 | fix M06: Protección Civil y aviso SSJ en Zapopan se pedían parejo para cualquier giro |
| `bded03c` | 09-sep 15:59 | feat M06: agrega sinónimos para que "contaduría", "abogado" y "despacho" se encuentren en el buscador |

---

## 1. M06 — Protección Civil GDL y el dictamen correcto de uso de suelo (7f29114, 55af3a4, dc19a51)

**Punto de partida:** Fernando compartió una foto del aviso oficial "INFORMACIÓN IMPORTANTE — USOS DE SUELO" de Guadalajara y señaló dos cosas de su propia experiencia real tramitando: (1) la Constancia de Protección Civil que M06 cobraba automático en realidad es **a solicitud de parte** (Art. 17 Fracc. XVII, Ley Ingresos GDL 2026) — no un cobro obligatorio del trámite de licencia; (2) M06 citaba el **DTUDE** (Dictamen de Trazos, Usos y Destinos Específicos, $2,016–$2,045, pensado para construcción) cuando en realidad para un giro comercial aplica el **Dictamen de Uso y Destinos Específicos** ($1,222, sin el "Trazos"), más barato.

**Fix:**
- Se quita la Constancia de PC del total de GDL — queda solo como comentario explicativo en el código, ya no como línea de costo.
- Se corrige el nombre y monto del dictamen en M06 (5 menciones de "DTUDE/Trazos" renombradas a "Dictamen de Uso y Destinos Específicos", $1,222) y se propaga el monto correcto ($2,045, confirmado en la misma foto) a M05, que ya distinguía los dos dictámenes correctamente pero con el monto viejo de la Ley de Ingresos.
- De paso, se agregó búsqueda por código SCIAN en el buscador de M06 y se corrigió un dato contaminado: el código 722511 (Restaurantes) aparecía mezclado dentro de la lista de giros de "ANIMALES" en `SCIAN_ENT`.

---

## 2. M02 — Giros restringidos: investigación municipio por municipio (ff01326, 1dd8e3a, ae80d1a, d61421b, 57822d7)

**La pregunta de Fernando:** en CS1/CS2 los giros restringidos (bar, etc.) están prohibidos; en CS3 condicionado, ¿tampoco se pueden poner? Pidió ubicar exactamente cuáles son esos giros y bajo qué regla.

Se investigó cada municipio por separado, con la misma exigencia de fuente normativa directa (nunca inferencia), y confirmó **cinco reglas distintas**:

| Municipio | Fuente | Regla |
|---|---|---|
| **GDL** | Reglamento de Giros, Art. 74 | Un solo nivel: CS3+ para todo el grupo (bar, cantina, discoteca, centro nocturno, boliche, salón de fiestas) |
| **Tlaquepaque** | Reglamento de Zonificación Urbana propio, Cuadro 3 | Nivel 3 (Distrital) para bar/cantina/boliche; **nivel 4 (Central) solo para centro nocturno/cabaret** — confirmado directo en el Art. 4.4.7 |
| **Tonalá** | Sin reglamento de zonificación propio — remite al **Reglamento Estatal de Zonificación** (confirmado: su Reglamento de Comercio, Art. 26, remite a "las Normas Urbanísticas aplicables") | Mismo patrón que Tlaquepaque: nivel 3 general, nivel 4 para centro nocturno — pero a diferencia de Tlaquepaque, el Cuadro 3 estatal sí incluye explícitamente "Salón de eventos" a nivel 3 |
| **Tlajomulco** | Reglamento de Zonificación propio, Cuadros 8 y 9 | El más distinto de los cinco: Discoteca/Restaurante-bar/Boliche/Centro botanero a nivel 3 (Cuadro 8), pero **Bar y Cantina suben a nivel 4** (Cuadro 9, literal "Centros de Entretenimiento restringidos") — el único municipio donde Bar/Cantina no se quedan en el nivel general |
| **Zapopan** | Catálogo de giros oficial (532 opciones, portal Ventanilla Digital) + Art. 27 propio, que remite al Cuadro 3 estatal | Mismo patrón de dos niveles; el catálogo interno de la app (`GU_SCIAN_ZAP`) no tenía ningún giro de bar/cantina/discoteca — se agregaron con código SCIAN verificado externamente |

**Complicación técnica recurrente:** varios de los 5 códigos SCIAN usados (heredados del catálogo de GDL) agrupan dos giros de nivel distinto bajo un mismo código — el más notorio, `722411` ("Discoteca · Centro nocturno · Club"), mezcla un giro de nivel 3 (Discoteca) con uno de nivel 4 (Centro nocturno). Decisión de Fernando: clasificar siempre al nivel más alto de los dos, por seguridad legal — un giro nunca debe aparecer como permitido antes de tiempo.

**Zapopan — hallazgo aparte:** al agregar sus giros de alcohol se encontraron 2 códigos del catálogo de GDL ya ocupados en el catálogo propio de Zapopan con negocios sin relación (`462112` = Minisúper, no Bar; `713991` = Billar, no Salón de fiestas) — confirmado contra SCIAN real externo. Se evitó el choque usando solo los 3 códigos que sí estaban libres.

---

## 3. M02 — Tres bugs de consistencia, mismo patrón (8e9a56e, 3d6e05a, 0ff9b88)

Al verificar la investigación anterior se encontraron 3 bugs reales, todos por la misma causa de fondo: la misma pieza de lógica vivía copiada en más de un lugar del código, y se corrigió una copia sin corregir las demás.

- **`8e9a56e`** — Catálogo de Zapopan con 2 giros mal etiquetados (mismo tipo de contaminación de datos que el 722511/ANIMALES de M06, pero en `GU_SCIAN_ZAP`): `722511` con nombre "Animales" pero descripción de restaurante, y `462112` con nombre "Accesorios automotrices" pero descripción de supermercado. Se corrigieron sin perder cobertura real (ya existían entradas correctas por separado para ambos conceptos).
- **`3d6e05a`** — La pestaña "Describir con IA" de M02 tiene su propia copia de la función que arma cada resultado de búsqueda, separada de la de "Buscar manual". El aviso "⚠️ Giro restringido" solo se había agregado a la copia de búsqueda manual.
- **`0ff9b88`** — Más serio: el overlay de "Verificar compatibilidad" (un tercer lugar, independiente de los dos anteriores) no solo no mostraba el aviso — el **veredicto mismo estaba mal**: decía "✅ USO PERMITIDO" para un bar en una zona que no debería permitirlo automático, porque esa rama del código recalculaba el nivel de zona desde cero sin saber nada del Art. 74. Se corrigió para que consulte la misma clasificación ya calculada, en vez de reinventarla.

---

## 4. DTUDE en Zapopan — mismo trámite para giro y construcción (7c7a20f, 047026d)

Fernando preguntó si Zapopan también tenía un dictamen más barato para giro comercial, como GDL. Se investigó directo en la fuente oficial (`retys.zapopan.gob.mx`, trámite ZAP-DOTERR-006, actualizado 26-ene-2026): la ficha dice textual que ese mismo "Dictamen de Trazo, Usos y Destinos Específicos" aplica tanto para licencia de construcción como **"para tramitar tu licencia de giro"** — Zapopan no separa el trámite en dos como GDL. Confirmado que el monto ya correcto en M06/M08 ($1,804) era el mismo para ambos casos — no había error, solo un label genérico ("DTUDE o equivalente") que ya se pudo cambiar por el nombre oficial exacto por municipio.

---

## 5. M06 — Revisión completa contra la solicitud oficial real (8226fbd, a41c79e, bafa189, 5855b82, 6000e54, 82da97c)

Dos hilos de trabajo grandes, disparados por observaciones directas de Fernando sobre resultados reales de M06.

**Datos de más:** un giro de "Despacho fiscal" mostraba un aviso de salones de belleza/spa — causa: la búsqueda de "SPA" era por substring sin límite de palabra, y "DE**SPA**CHO" la contiene (mismo patrón de bug ya visto en M02 con "aBARrotes"/"bar"). También pedía Constancia de Protección Civil sin excepción para cualquier giro en GDL, sin revisar su nivel de riesgo real — se corrigió para que respete la categoría `pc:'minimo'` que ya existía en el código para oficinas. El **Dictamen de Uso y Destinos Específicos** tampoco aplica parejo — Fernando explicó que normalmente el uso de suelo se revisa directo en la ventanilla al tramitar la licencia, y el dictamen formal solo se pide para giros restringidos; se condicionó el cobro a esa misma bandera. Zapopan tenía el mismo problema de Protección Civil, más uno adicional: el aviso de Salud Jalisco se pedía parejo también, corregido para que dependa de si el giro realmente maneja alimentos/salud.

**Datos de menos:** Fernando compartió el Formato Múltiple real de Padrón y Licencias GDL (PDF escaneado de 2 páginas — no 57 como reportó la herramienta, leído con PyMuPDF) y se cruzaron sus 26 requisitos numerados contra el checklist de M06. Faltaban 3 reales: carta poder con 2 testigos cuando un tercero hace el trámite (requisitos 10-11 de la ficha), contrato de arrendamiento + identificación del propietario cuando el local es rentado (ya se mencionaba, pero como texto fijo dentro de otro punto — Fernando pidió que fuera su propio punto separado, y así quedó), y carta de anuencia del administrador cuando el local está en una plaza (requisito 12). Se agregaron las 3 casillas correspondientes a los formularios de GDL, Zapopan y el genérico de Tlaquepaque/Tlajomulco/Tonalá — en Zapopan se aprovechó un selector de plaza que ya existía en el formulario pero nunca alimentaba ningún requisito.

**El PDF también salía sucio:** el botón de imprimir/descargar traía el selector completo de municipios y los formularios de captura, incluso los de municipios distintos al consultado. Causa: la regla de impresión ocultaba una clase CSS (`.muni-bar`) que ya no existía en el HTML — quedó huérfana de una versión anterior del markup. Se corrigió ocultando la clase `.card` completa (cubre las 7 tarjetas de captura de los 3 formularios a la vez, en vez de una lista de nombres sueltos que se desactualiza cada vez que cambia el HTML).

---

## 6. M06 — Buscador de giros: cuatro bugs de UX (9ad6c20, 982e85e, bded03c)

- **`9ad6c20`** (en realidad en M02, pero mismo motor de búsqueda que usa M06): el buscador con IA tiene un atajo — si la búsqueda directa ya encuentra 4+ resultados, nunca consulta a la IA. "Oficina de contadores" nunca llegaba a la IA porque "oficina" sola ya junta 8 resultados sin relación (mueblerías, arrendadoras...), y ninguno hacía match con "contadores". Se agregó un filtro: con 2+ palabras clave, el atajo ahora exige que los 4+ resultados coincidan con **todas** las palabras, no solo alguna.
- **`982e85e`**: escribir el giro a mano sin darle clic a una sugerencia del autocomplete nunca se registraba — el cálculo lee un campo oculto que solo se llena al seleccionar del menú desplegable. Se agregó respaldo: si el campo oculto está vacío, usa lo que el usuario escribió directamente. De paso, escribir un código SCIAN de 3 a 6 dígitos a mano ahora también activa el respaldo de clasificación por código (agregado hace 2 días para el enlace desde M02).
- **`bded03c`**: el catálogo propio de M06 (separado del de M02) sí tenía los giros correctos para "contaduría" y "abogado" — `OFICINA DE PROFESIONALES`, `OTROS SERVICIOS RELACIONADOS CON LA CONTABILIDAD`, `BUFETES JURÍDICOS`, todos ya marcados correctamente como riesgo mínimo — pero sin ningún sinónimo que conectara esos nombres con cómo la gente realmente escribe su giro. Se agregaron los sinónimos faltantes en vez de duplicar giros que ya existían.

---

## 7. Pendientes conocidos

| Tarea | Estado |
|-------|--------|
| Ampliar catálogo propio de M06 (`SCIAN_ENT`/`SCIAN_DATA`) más allá de los sinónimos puntuales agregados — sigue siendo más chico que el de M02 | ⏳ Pendiente, alcance por definir |
| Deep link M02→M06 para Tlaquepaque/Tlajomulco/Tonalá no auto-calcula (solo prellena el texto, a diferencia de GDL/Zapopan) | ⏳ Pendiente |
| Clasificación `rest_alta`/`rest_baja` de alcohol en GDL (¿exento o no, Art. 6 inciso j vs Art. 10-A Ley Coordinación Fiscal?) | ⏳ Esperando que salga la licencia real de Fernando para revisar contra un caso real |
| Guion de video demo — ¿M10 (Pre-dictamen IA) o M04 (Revisor de Planos)? | ❓ Pregunta abierta desde el inicio de esta sesión, sin responder |
| Freemium.js integración (M01–M03, M05–M09, M11) | 🔵 STBY |
| Dominio personalizado trazaurbana.mx | ⏳ Pendiente |
| UptimeRobot monitoring | ⏳ Pendiente |
| Formspree ID propio | ⏳ Pendiente |
| Gasolineras/gaseras ZPN — códigos SCIAN | ⏳ Pendiente |
| Guard municipio M02/M03/M05 | ⏳ Pendiente |

---

*Próxima bitácora: v46.0*
*Generada: 09-sep-2026*
