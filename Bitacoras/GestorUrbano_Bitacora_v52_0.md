# Bitácora v52.0 — Gestor Urbano Jalisco AMG (TrazaUrbana)

**Período:** 24-sep-2026 (continuación tras v51.0) — 25-sep-2026
**Rama:** master + sincronización a main (Vercel)
**Sesión previa:** v51.0 (24-sep-2026 — login/registro, cerrar sesión, medidores de consumo)

---

## Resumen ejecutivo

Tres bloques de trabajo que quedaron sin bitácora propia porque v51.0 se generó a media sesión del 24-sep. El primero cierra el backlog histórico de 5 bugs que llevaba meses repetido sin tocarse en bitácoras anteriores. El segundo resuelve una cadena de bugs reales de cobro encontrados por Fernando probando en vivo el cambio de plan con Stripe — desde doble suscripción hasta cobros que no se ejecutaban — y termina con una política de negocio explícita (downgrade sin devolución, upgrade con cobro inmediato, ambos con confirmación previa) y una tabla de historial nueva. El tercero cierra la decisión de alcance del catálogo de M06 frente al catálogo mucho más amplio de M02, usando el mismo mecanismo de respaldo por código SCIAN que ya existía para alcohol, extendido a COFEPRIS/RPBI y, por sector, a SEMARNAT industrial.

---

## Commits incluidos

| Commit | Descripción |
|---|---|
| `a81d0d0` | fix M02: pistas deportivas buscables en GDL + gas/gasolinera en ZAP |
| `ad58128` | fix M02/M03/M05: guard de municipio (#5 del backlog) |
| `02805a2` | fix M06: corrige exención incorrecta de derechos por alcohol en GDL |
| `2660b87` | fix M06: corrige exención de baja_abarrotes/baja_deposito en GDL |
| `9c6182b` | fix: planes.html ya no te saca solo si entras a cambiar de plan |
| `80d0f7d` | feat: cambiar de plan modifica la suscripción existente, no crea una segunda |
| `d35221f` | fix: cambiar de plan ahora cobra la diferencia de inmediato |
| `cfe1ec9` | feat: downgrade de plan no da crédito, y avisa antes de confirmar |
| `5a3aa6d` | feat: agrega aviso de confirmación también antes de un upgrade de plan |
| `ddb8313` | feat: muestra el plan actual en el menú principal |
| `7a13870` | feat: registra historial de cambios de plan en plan_historial |
| `a4522d9` | feat: guarda el email en plan_historial, no solo el user_id |
| `c90dd9c` | feat: agrega respaldo por código SCIAN para alcohol/COFEPRIS/RPBI en M06 |
| `b039fd5` | feat: agrega respaldo por sector SCIAN para SEMARNAT en giros industriales |

---

## Bloque A — Cierre del backlog histórico SCIAN (`a81d0d0`, `ad58128`, `02805a2`, `2660b87`)

Estos 5 items venían repetidos sin cambios en las bitácoras desde v38/v40. Se resolvieron 4 de los 5 (el quinto, alcance del catálogo M06, es el Bloque C de esta misma bitácora).

**1. Pistas deportivas no aparecían en la búsqueda de GDL.** El giro (SCIAN 713944) ya existía bien clasificado (E2) en `GestorUrbano_M02_4.html`, pero el nombre buscable decía "Centros de acondicionamiento físico del sector público" — nadie lo encontraba buscando "pista deportiva". Se agregó `ns:` con el nombre real.

**2. Gasolineras/gas no se encontraban en Zapopan.** Solo existía 1 de los 4 códigos SCIAN de gas/gasolinera, y el único presente estaba etiquetado "Carbón y leña" — por esto la regla de 150m de distancia a escuelas/templos (Art. 73 Reglamento de Giros ZPN) nunca se disparaba en Zapopan. Se agregaron las 3 entradas faltantes (CS4, misma clasificación que ya usa GDL) más una entrada nueva de gasolinera, sin tocar la entrada existente de carbón/leña.

**3. Guard de municipio ausente en M02/M03/M05.** Ninguno de los 3 módulos obligaba a elegir municipio antes de buscar: la variable interna arrancaba con un valor por defecto válido (`'guadalajara'`/`'GDL'`) sin que ningún botón apareciera marcado en pantalla — si el usuario escribía una dirección sin mencionar el municipio y sin dar clic en ningún botón, el sistema calculaba en silencio como si fuera Guadalajara, con riesgo de resultado normativo incorrecto sin aviso. Fix en los 3 módulos: la variable ahora arranca vacía y cada función que dispara una búsqueda revisa primero que haya municipio seleccionado (M01 ya tenía este guard, sirvió de referencia).

**4. Exención incorrecta de derechos por alcohol en GDL.** `TARIFAS_ALCOHOL.GDL` marcaba 8 giros como exentos (`tarifa:0`) citando el Art. 6 Fracc. j de la Ley de Ingresos GDL 2026 ("Coordinación Fiscal"). Esa fracción sí exime por coordinación fiscal, pero tiene una excepción explícita: el Art. 10-A de la Ley de Coordinación Fiscal (federal), Fracción I inciso f), excluye textualmente de la exención a "licencias... para el funcionamiento de establecimientos... cuyos giros sean la enajenación de bebidas alcohólicas... con el público en general" — exactamente los giros marcados en 0. Verificado contra el texto oficial de ambas leyes. Se corrigieron las 8 categorías con montos reales del Art. 44/45 de la Ley de Ingresos GDL 2026: `rest_alta` $55,557 (Art.44-VIII, confirmado además con el Reglamento de Giros Art. 62/71/73: la figura legal es "Bar anexo a Restaurante"), `rest_baja` $7,849 (Art.45-III), `fonda_baja` $7,849 (misma fracción), `alta_deposito` $25,830 (Art.45-II-b), `cerveceria` $38,446 (Art.45-V), `mini_alcohol` $8,500 (Art.45-I-b, menor confianza — el reglamento distingue minisúper de baja y alta graduación y el nombre del giro no especifica cuál), `baja_abarrotes` $6,556 (Art.45-I-a) y `baja_deposito` $14,500 (Art.45-I-c).

---

## Bloque B — Sistema de cambio de plan con Stripe (`9c6182b` … `a4522d9`)

Cadena de bugs de cobro real encontrados por Fernando probando en vivo el flujo de cambiar de plan ya con una suscripción activa — ninguno visible solo revisando el código.

**1. `planes.html` expulsaba a quien entraba a propósito a cambiar de plan.** El redirect automático (de v51.0) se disparaba con cualquier plan activo, sin importar el motivo de la visita. Fix: el redirect ahora solo aplica cuando se viene justo de pagar (`?success=true`); entrando por cuenta propia se queda mostrando la página con el plan actual y la opción de cambiarse.

**2. Cambiar de plan creaba una segunda suscripción en paralelo.** `create-checkout-session.js` siempre creaba una suscripción nueva sin revisar si ya existía una activa, y el webhook nunca cancelaba la anterior — riesgo de doble cobro silencioso e imposible de corregir después (se perdía la referencia a la suscripción vieja). Nuevo endpoint `api/cambiar-plan.js`: si el usuario ya tiene `stripe_subscription_id`, modifica esa misma suscripción vía `subscriptions.update` en vez de crear una nueva.

**3. El cobro de la diferencia no se ejecutaba.** `proration_behavior: 'create_prorations'` solo acumula el ajuste para la siguiente factura del ciclo normal, no cobra nada en el momento — Fernando lo probó en vivo (Estándar → Empresarial) y se quedó con el plan más caro sin pagar la diferencia hasta el siguiente corte. Cambiado a `'always_invoice'`, que genera y cobra la factura de inmediato.

**4. Política de downgrade sin devolución, con aviso previo.** Decisión explícita de Fernando: bajar de plan aplica de inmediato pero no genera ningún crédito ni devolución de lo ya pagado. `cambiar-plan.js` agrega `ORDEN_PLANES` para distinguir upgrade de downgrade — downgrade usa `proration_behavior: 'none'` (sin prorrateo). `planes.html` muestra un `confirm()` explícito antes de ejecutar un downgrade, explicando que no hay devolución; cancelar no llama a ningún endpoint.

**5. Upgrade sin ningún aviso, pese a cobrar de inmediato.** Fernando probó un upgrade real (Básico → Estándar) y el cargo pasó sin ninguna confirmación previa — técnicamente correcto (la tarjeta ya estaba registrada) pero se sintió automático e inesperado. Se agregó el mismo tipo de `confirm()` que el downgrade, mostrando el monto aproximado de la diferencia antes de ejecutar.

**6. Plan actual visible en el menú.** `index.html` ahora muestra "Tu plan: *nombre*" debajo del hero, a petición de Fernando, en vez de que solo se pudiera inferir por la cantidad de consultas disponibles.

**7. Historial de cambios de plan.** `profiles.plan` solo guarda el estado actual — no había forma de saber si un cliente subió o bajó de plan, ni cuándo, ni desde cuál. Nueva tabla `plan_historial` (creada por Fernando vía SQL Editor, con `GRANT` a `service_role` desde el inicio). Se registra un renglón en la alta inicial (`stripe-webhook.js`, `checkout.session.completed`) y en cada cambio posterior (`cambiar-plan.js`), incluyendo el email del usuario para poder leer la tabla sin cruzar con `profiles`. El insert nunca bloquea la respuesta al usuario si falla.

---

## Bloque C — Alcance del catálogo M06 (`c90dd9c`, `b039fd5`)

Quinto y último item del backlog histórico: M06 tiene un catálogo único de 531 giros compartido entre los 5 municipios, frente a los 1,393 giros (1,381 únicos) del catálogo de M02, separado por municipio. En vez de espejar el catálogo completo, se auditaron las categorías especiales de M06 (alcohol, PC, COFEPRIS, RPBI, SEMARNAT — todas indexadas por coincidencia exacta de nombre) contra el catálogo real de M02, y se extendió el mecanismo de respaldo por código SCIAN que ya existía para alcohol y PC (el deep link M02→M06 manda el código intacto, pero el nombre en el formato propio de M02, que nunca coincide con las claves en mayúsculas de M06).

**Alcohol (`SCIAN_A_TIPOALC`):** 5 giros de venta/distribución agregados (licorerías, mayoreo de vinos y cerveza). Se excluyeron a propósito 8 códigos de producción industrial de alcohol (sector 312xxx: elaboración de cerveza, vinos, destilados) — una planta no tramita licencia municipal de bar, tramita giro industrial y permisos a otro nivel (SEMARNAT/COFEPRIS/IEPS); meterlos en la tarifa de alcohol habría cobrado algo sin base normativa.

**COFEPRIS/RPBI (`SCIAN_A_COFEPRIS`, `SCIAN_A_RPBI`, nuevos):** 33 giros de alimentos (menudeo, mayoreo, preparación) y salud humana confirmados contra el catálogo real de M02, 9 de ellos (los de práctica clínica: consultorios, hospitales, ambulancias) también en RPBI. Se excluyó el código de medicamentos veterinarios mayoreo (434112) por duda razonable de jurisdicción — cae bajo SENASICA/SADER, no COFEPRIS.

**SEMARNAT industrial (`esSectorManufacturaSCIAN()`, nueva función):** M02 tiene 348 giros de uso industrial contra los ~10 nombres genéricos que reconoce M06 — casi ninguno hacía match exacto. En vez de listarlos uno por uno, cualquier código con prefijo de sector 31, 32 o 33 (Industrias manufactureras, clasificación SCIAN/INEGI) activa `semarnat` automáticamente si nada más específico ya lo cubrió.

Deliberadamente **no** se extendió este mismo respaldo por sector a `pcNivel`: se verificó que en ZPN/TLA/TON/TLQ ese campo dispara un cobro real de Peritaje PC calculado por superficie (a diferencia de GDL, donde es solo informativo — "a solicitud de parte, sin costo automático"), y el deep link de M02 no manda el nivel de intensidad industrial del giro (I1..I5, dato que solo vive en M02). Sin poder distinguir una tortillería de una fábrica pesada, aplicar el mismo respaldo a PC habría cobrado peritaje de más a manufactura ligera o artesanal. Decisión confirmada explícitamente por Fernando antes de implementar: solo SEMARNAT (bandera informativa, sin costo) por ahora.

El caso dudoso "Casetas telefónicas GDL (excluido)" de la auditoría SCIAN original, cuyo significado exacto nunca se confirmó, se descartó a petición explícita de Fernando — no se persigue más.

---

## Pendientes conocidos

| Tarea | Estado |
|---|---|
| Verificar cuenta de negocio en Stripe (RFC + datos bancarios) | ⏳ Bloqueador real para aceptar pagos reales — acción directa de Fernando |
| Decidir cuándo/si quitar el candado de contraseña compartida (`login.html`) para abrir el sitio al público | ⏳ Decisión por etapas, aún no actionada |
| Agregar Supabase a la tabla de terceros en `privacidad.html` | ⏳ Diferido hasta que procese datos reales de clientes pagando |
| Comprar y conectar dominio trazaurbana.mx | ⏳ Pendiente |
| Guion de video demo — ¿M10 o M04? | ❓ Pregunta abierta |

*Resuelto desde v51.0 y ya fuera de esta lista: pistas deportivas, gasolineras/gaseras ZPN, guard de municipio, rest_alta/rest_baja alcohol GDL, expansión de catálogo M06, UptimeRobot. Descartado a petición de Fernando: casetas telefónicas GDL.*

---

*Próxima bitácora: v53.0*
*Generada: 25-sep-2026*
