# Bitácora v46.0 — Gestor Urbano Jalisco AMG (TrazaUrbana)

**Período:** 11-sep-2026 – 21-sep-2026
**Rama:** master + main (Vercel)
**Autor:** Fernando H. / Claude Sonnet 5

---

## Resumen ejecutivo

Sesión con dos partes claramente distintas. La primera, corta (11-sep), cerró los últimos ajustes finos que quedaron pendientes de la investigación de giros restringidos de la bitácora anterior: dos códigos mal clasificados en el catálogo de Zapopan (bodega genérica y oficina administrativa, ambos invisibles al buscador por estar en el nivel de impacto equivocado) y un tercero ("Clases de manualidades") que nunca podía aparecer como permitido en ninguna zona por un nivel de categoría (E3) que la lógica de cálculo de M02 no sabe procesar. De paso, se investigó a fondo un caso real de zonificación en Zapopan (Av. Naciones Unidas 6780) cruzando la app contra el GeoServer oficial del municipio en vivo, confirmando que la zona correcta es Mixto Distrital (MD) — y se aprovechó para corregir el modelo de IA de M10, que seguía apuntando a una versión de Claude ya superada.

La segunda parte, mucho más grande (21-sep), fue construir de cero toda la infraestructura de cobro de TrazaUrbana — el primer paso real hacia monetizar la plataforma. Se partió de la estrategia de precios que ya existía desde julio (perfiles de usuario, planes, MercadoPago como recomendación inicial) y se rediseñó junto con Fernando en tiempo real: un modelo de 4 planes basado en cupos separados de "consultas normales" y "análisis con IA" (no un solo pool de créditos), con precios que bajan de costo por unidad entre más caro el plan, IVA ya incluido en el precio visible al cliente, y nombres ajustados varias veces hasta llegar a Básico / Estándar / Profesional / Empresarial. Se decidió Stripe sobre MercadoPago al confirmar que sí opera nativo en México (incluyendo OXXO) y tiene mejor manejo de suscripciones recurrentes.

De ahí se pasó a ejecutar: cuenta de Stripe creada, los 4 productos y precios configurados, una función serverless (`api/create-checkout-session.js`) y una página de planes (`planes.html`) construidas y verificadas en vivo — el checkout completo funciona de principio a fin, confirmado con una compra de prueba real. Se ajustaron los métodos de pago disponibles (OXXO activado, métodos de países irrelevantes desactivados) y se identificó una brecha de arquitectura importante: hoy el login de la plataforma (clave compartida) no tiene ninguna conexión con quién pagó o qué plan tiene — quedó documentado como el siguiente proyecto grande. Para cerrar el día, se resolvieron dos pendientes de higiene que llevaban tiempo abiertos: el botón de "Comentarios" (roto desde siempre por un ID de Formspree que nunca se reemplazó) y la publicación de Términos de Servicio + Aviso de Privacidad reales, con los datos fiscales de Fernando.

---

## Commits incluidos (7)

| Hash | Fecha/Hora | Descripción |
|---|---|---|
| `367f15a` | 11-sep 17:00 | fix M02: corrige catálogo Zapopan — bodega sin riesgo (CS2) y nombre buscable de oficina administrativa |
| `1a7cc99` | 11-sep 17:22 | fix M02: reclasifica "Clases de manualidades" en Zapopan de E3 a CS1 |
| `154da9a` | 21-sep 10:26 | fix M10: actualiza modelo de claude-sonnet-4-6 a claude-sonnet-5 |
| `e1d50fb` | 21-sep 19:36 | feat: agrega página de planes y checkout de Stripe (4 planes con IVA incluido) |
| `e8a46ec` | 21-sep 19:50 | feat: agrega toggle de modo claro/oscuro en planes.html |
| `485da65` | 21-sep 20:37 | fix: reemplaza placeholder GU_FORMSPREE_ID por ID real en los 12 módulos |
| `db1efe9` | 21-sep 20:50 | feat: agrega Términos de Servicio y Aviso de Privacidad |

---

## 1. M02 — Últimos ajustes del catálogo de Zapopan

**Commits:** `367f15a`, `1a7cc99`

Al revisar qué tan bien buscaba la app dos giros muy comunes, aparecieron dos bugs de datos, mismo patrón de contaminación visto varias veces antes en el catálogo:

- **Bodega:** la única entrada existente ("Bodega exclusiva para anexo", código SCIAN 431110) en realidad corresponde a "Comercio al por mayor de abarrotes" — un código mal puesto, clasificado en el nivel más alto (CS5), por lo que nunca aparecía como permitido salvo en las zonas más intensas. Se reemplazó por el código correcto de bodega genérica (493111, "Almacenes generales de depósito"), ya usado correctamente en el catálogo de GDL, en nivel CS2 — acorde a lo que el propio reglamento de Zapopan permite desde zona Barrial.
- **Oficina administrativa:** el giro correcto (561110, "Servicios de administración de negocios") ya existía en el catálogo con el nivel correcto, pero su nombre no contenía la palabra "oficina" en ningún lado — el buscador nunca lo encontraba. Se renombró a "Oficina administrativa · Administración de negocios" sin tocar su clasificación.

Un tercer caso, encontrado por Fernando directamente probando la app: **"Clases de manualidades"** nunca aparecía como permitido en ninguna zona de ningún municipio. La causa no era un dato mal puesto sino un hueco real en la lógica: la función que calcula permisos (`calcularGirosZona()`) solo sabe procesar giros de familia `CS` o `I` — este giro estaba en categoría `E3` (Equipamiento), una familia que esa función nunca contempla. Se reclasificó a `CS1`, respaldado en el PDU ZPN-5 (pág. 144), que lista "Clases de Manualidades" de forma explícita en el nivel Vecinal. Quedan dos giros más con el mismo problema estructural sin corregir todavía (ver pendientes): Pistas de actividades deportivas (E2) y Casetas telefónicas (RIS).

## 2. Verificación de zonificación real — Av. Naciones Unidas 6780, Zapopan

Fernando pidió verificar si una oficina administrativa con bodega anexa era viable en un domicilio real. La app mostraba resultados distintos según la fuente (MD vía API en vivo, MB vía respaldo local) — se resolvió la duda consultando directamente el GeoServer oficial de Zapopan (`mapa.zapopan.gob.mx:8000/geoserver`, capa `zpn_e3_utilizacion_suelo`, la misma que usa el mapa oficial del municipio) con las coordenadas exactas del predio. Resultado confirmado: zona **MD (Mixto Distrital)**, Distrito ZPN-5 "Vallarta-Patria". Se cruzó además contra el documento técnico real del distrito (PDU ZPN-5, cuadro de usos y destinos CS-D), confirmando que tanto "Oficinas Administrativas" como "Bodega (que no implique riesgo)" están explícitamente permitidos en ese nivel.

## 3. M10 — Actualización de modelo de IA

**Commit:** `154da9a`

M10 (Pre-Dictamen IA) seguía usando `claude-sonnet-4-6`, hardcodeado, mientras M04 ya usaba `claude-sonnet-5` desde antes. Se igualó a `claude-sonnet-5` para mantener consistencia entre los dos módulos que usan IA.

## 4. Estrategia de cobro — diseño del modelo de precios

Se retomó el trabajo de planeación de julio (`Plan Escabilidad/`: análisis de costos de API, modelo de cobro, hosting) y se rediseñó junto con Fernando, en varias iteraciones:

- **Se descartó el modelo de "créditos" pooleados** (un solo número gastable en cualquier cosa) en favor de **dos cupos separados por plan** — consultas normales y análisis con IA, cada uno con su propio límite — más simple de entender y evita que alguien use todo su cupo en lo barato y sienta que "no usó" la IA.
- **Los 4 planes finales:**

| Plan | Precio (IVA incluido) | Consultas/mes | Análisis IA/mes | Usuarios |
|---|---|---|---|---|
| Básico | $80 MXN | 8 | 4 | 1 |
| Estándar | $199 MXN | 30 | 8 | 1 |
| Profesional | $499 MXN | 80 | 20 | 1 |
| Empresarial | $999 MXN | Ilimitadas | 100 (20/persona) | Hasta 5 |

- **IVA:** se decidió que el precio mostrado ya lo incluye (no se suma aparte en el checkout) — mantiene los precios psicológicos ($199, $499) sin romperlos con centavos.
- **Nombres:** "Estudiante" se descartó por sonar excluyente → "Básico"; el "Básico" original pasó a "Normal" → "Estándar"; "Despacho" se descartó por ser muy específico a un solo tipo de cliente → "Empresarial".
- **Plataforma de cobro:** se comparó Stripe contra MercadoPago (la recomendación original de julio). Se confirmó que Stripe sí opera nativo en México desde 2018, con soporte de OXXO y SPEI, comisión más baja (2.9%+$3 vs ~3.5%+IVA), y manejo maduro de suscripciones recurrentes — se decidió Stripe.
- **Política de reembolsos:** garantía de 7 días en la primera suscripción; sin reembolsos después de eso ni en renovaciones (recomendación dada para balancear confianza del cliente nuevo contra carga administrativa de un operador solo).

Se entregó a Fernando un Excel (`Plan Escabilidad/TrazaUrbana_Planes_Creditos_sep2026.xlsx`) con el modelo completo: fórmulas en vivo, costo real por plan, margen, y desglose de qué módulos cuentan como consulta vs. análisis IA.

## 5. Implementación de Stripe

Cuenta de Stripe creada en modo de prueba, guiada paso a paso:

- **4 productos y precios** creados en el catálogo de Stripe, uno por plan, recurrentes mensuales, confirmados vía Price ID real (`price_1UIINQ...`, etc.).
- **`api/create-checkout-session.js`** — función serverless nueva, sin dependencias npm (mismo patrón que `claude-proxy.js`: llama a la API REST de Stripe directo con `fetch`), crea una sesión de Checkout para el plan solicitado.
- **`planes.html`** — página nueva con los 4 planes, botón de suscripción por plan, mensaje de éxito/cancelación, y toggle de modo claro/oscuro (`e8a46ec`) igual al resto de la app. Enlazada desde el menú principal.
- **`STRIPE_SECRET_KEY`** agregada como variable de entorno en Vercel (Production) — nunca compartida en el chat.
- **Métodos de pago revisados y corregidos:** se encontraron métodos de otros países activados sin razón (Bancontact/Bélgica, EPS/Austria, MB WAY/Portugal) y OXXO — el más relevante para México — desactivado. Se corrigió: OXXO activado, los tres irrelevantes desactivados. PayPal no está disponible como switch simple en Stripe; se decidió no perseguirlo por ahora.

## 6. Verificación en vivo del checkout

Fernando probó el flujo completo en producción: clic en "Suscribirme" → página de pago real de Stripe con nombre y precio del plan correctos → confirmado funcionando de punta a punta. Se identificó una brecha real de arquitectura durante la prueba: el login actual (clave compartida, fase de pruebas) no está conectado a las suscripciones de Stripe — cualquiera con la clave entra, pague o no. Documentado como el siguiente proyecto grande: cuentas de usuario individuales + base de datos (se recomendó Supabase) + webhook de Stripe + migrar el conteo de créditos de `localStorage` a servidor.

## 7. Formspree — reparación del formulario de comentarios

El botón "💬 Comentarios", presente en los 11 módulos + index desde hace tiempo, apuntaba a un ID de Formspree placeholder (`GU_FORMSPREE_ID`) que nunca se reemplazó — cualquier intento real de mandar feedback fallaba en silencio (con mensaje de error visible, no falso "enviado"). Se creó la cuenta real de Formspree y se reemplazó el ID en los 12 archivos (`mppwdlaj`). Verificado dos veces: una prueba técnica directa al endpoint (200 OK) y una prueba real de Fernando desde producción — ambas llegaron correctamente a su correo.

## 8. Documentos legales

**Commit:** `db1efe9`

Se publicaron `terminos.html` y `privacidad.html`, con datos reales (Fernando Hernández Valdez, RFC HEVF740827DU4, TrazaUrbana como nombre comercial), reflejando exactamente lo construido esta sesión: los 4 planes y precios reales, la política de reembolso de 7 días recién decidida, y los tres terceros que de verdad procesan datos (Stripe, Formspree, Vercel) — incluyendo la sección de derechos ARCO que exige la LFPDPPP. Enlazados desde el pie de página de Inicio y Planes.

---

## Pendientes conocidos

| Tarea | Estado |
|---|---|
| **Sistema de cuentas de usuario + Supabase + webhook de Stripe** | 🔵 Proyecto grande, siguiente prioridad — sin esto el cobro no controla el acceso real |
| Activar switch "Políticas legales" en Stripe (ya existen las URLs reales) | ⏳ Pendiente, es solo pegar los links |
| "Datos de la empresa" en Stripe (correo de soporte visible en checkout) | ⏳ Bloqueado detrás de activar cuenta completa de Stripe — de baja prioridad |
| Pistas de actividades deportivas (E2) y Casetas telefónicas (RIS) — mismo bug que manualidades | ⏳ Pendiente, Fernando no lo pidió aún |
| Comprar y conectar dominio trazaurbana.mx | ⏳ Pendiente |
| Configurar UptimeRobot | ⏳ Pendiente |
| Ampliar catálogo propio de M06 más allá de sinónimos puntuales | ⏳ Pendiente |
| Deep link M02→M06 para Tlaquepaque/Tlajomulco/Tonalá no auto-calcula | ⏳ Pendiente |
| Clasificación rest_alta/rest_baja alcohol GDL | ⏳ Esperando licencia real de Fernando |
| Guion de video demo — ¿M10 o M04? | ❓ Pregunta abierta |
| Gasolineras/gaseras ZPN — códigos SCIAN | ⏳ Pendiente |
| Guard municipio M02/M03/M05 | ⏳ Pendiente |

---

*Próxima bitácora: v47.0*
*Generada: 21-sep-2026*
