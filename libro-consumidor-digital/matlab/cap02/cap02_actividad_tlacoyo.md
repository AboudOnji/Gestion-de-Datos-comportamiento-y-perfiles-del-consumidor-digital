**Instituto Politécnico Nacional - Dr. Aboud Barsekh Onji**
ESCA Unidad Santo Tomás · Laboratorio: Gestión de datos, comportamiento y perfiles del consumidor digital

# Actividad adicional del Capítulo 2 — El caso Tlacoyo Express

**Segmentación rígida contra difusa con datos de clientes**

| | |
|---|---|
| **Modalidad** | Individual |
| **Material** | `cap02_segmentacion_datos_propios.html` (se abre en cualquier navegador, sin internet y sin MATLAB) y `cap02_actividad_tlacoyo_datos.xlsx` |
| **Se relaciona con** | Capítulo 2: segmentación rígida (k-means), segmentación difusa (fuzzy c-means), silueta y pertenencia ambigua |

> **Empresa y datos ficticios.** Tlacoyo Express no existe. Los 240 clientes del archivo fueron
> simulados para esta actividad y no representan a ningún negocio real.

---

## 1. Contexto

**Tlacoyo Express** es una app de comida a domicilio que opera en cinco alcaldías de la Ciudad de
México. Tiene dos años en el mercado y su base de clientes creció rápido. Hasta ahora manda **la
misma promoción a todos los clientes**: un cupón de 15 % los martes. El director comercial sospecha
que eso desperdicia presupuesto y le pide al equipo de mercadotecnia **dividir a los clientes en
segmentos** para diseñar una campaña distinta para cada uno.

El área de datos exportó una muestra de **240 clientes activos** con tres variables, calculadas
como promedio de los últimos tres meses:

| Columna del Excel | Qué mide | Unidad |
|---|---|---|
| `ID_cliente` | Identificador anónimo del cliente (T0001, T0002…) | — |
| `Pedidos_al_mes` | Cuántos pedidos hace el cliente al mes | pedidos por mes |
| `Gasto_por_pedido_MXN` | Cuánto gasta en promedio en cada pedido | pesos (MXN) |
| `Notificaciones_abiertas_pct` | De cada 100 notificaciones *push* que recibe, cuántas abre | % (0 a 100) |

### Lo que dicen las entrevistas

Antes de ver los datos, el equipo de mercadotecnia entrevistó a repartidores, a restaurantes
aliados y a algunos clientes. De esas conversaciones salieron **tres perfiles de cliente**:

1. **«El oficinista entre semana».** Pide de lunes a viernes a la hora de la comida, casi siempre
   desde la oficina. Hace **unos ocho pedidos al mes**: una comida corrida o un antojo para una
   persona, de **unos $150**. Abre **más o menos la mitad** de las notificaciones; muchas le llegan
   cuando está en juntas.
2. **«La familia de fin de semana».** Pide **tres o cuatro veces al mes**, casi siempre sábado o
   domingo, para toda la familia. Sus pedidos son grandes: **más de $400**. **Casi no abre** las
   notificaciones (una de cada tres, o menos): ya sabe qué quiere pedir.
3. **«El cazador de promociones».** Pide **unas cinco o seis veces al mes**, pero casi solo cuando hay
   descuento. Gasta **alrededor de $200** por pedido y **abre casi todas** las notificaciones (tres de
   cada cuatro, o más), porque está atento a los cupones.

### La hipótesis del director

El director comercial está convencido de que existe un **cuarto perfil**: el **«premium
nocturno»**, que pide de noche unas **seis veces al mes**, gasta **unos $800** por pedido (cenas
para reuniones) y abre **más de la mitad** de las notificaciones. Quiere lanzar para él una
campaña de restaurantes de lujo. Su equipo no está tan seguro.

**La pregunta de negocio:** ¿cuántos segmentos tiene realmente la base de clientes, qué tan
claros son y qué hacemos con los clientes que no encajan en ninguno?

---

## 2. Antes de empezar

1. Abre `cap02_segmentacion_datos_propios.html` con doble clic. Si lo abres desde el correo o
   desde Drive, primero **descárgalo**.
2. En el panel izquierdo, en **«1. Datos de sus clientes»**, sube
   `cap02_actividad_tlacoyo_datos.xlsx`.
3. Revisa que la app reporte **240 clientes y 3 variables numéricas**, y que en **«2. Variables»**
   estén marcadas las tres. En la sección «Datos cargados» (abajo) comprueba que no se descartó
   ninguna fila.
4. Si es la primera vez que usas la app, lee el recuadro **«Conceptos clave en un minuto»**.

---

## 3. Las tres corridas

En cada corrida vas a cambiar **solo los arquetipos** (panel izquierdo, «3. Arquetipos»). Al
terminar cada una, escribe el nombre del caso en el recuadro de **«Comparar corridas»** y pulsa
**«Guardar corrida como caso»**.

### Caso A — Arquetipos automáticos

Pulsa **«Proponer desde mis datos»**. La app crea tres arquetipos llamados *Bajo*, *Medio* y
*Alto*, calculados solo con los números, sin saber nada del negocio. **No los cambies.** Recorre
los pasos 1 a 5 de la app y guarda la corrida como **«A automáticos»**.

### Caso B — Arquetipos de las entrevistas

Traduce los **tres perfiles de las entrevistas** (sección 1) a números: escribe en cada tarjeta
el valor típico de pedidos al mes, gasto por pedido y % de notificaciones abiertas. Cambia los
nombres *Bajo / Medio / Alto* por *Oficinista*, *Familia* y *Cazador de promociones*. Guarda la
corrida como **«B entrevistas»**.

> Las entrevistas no dan números exactos. Decide qué número representa mejor cada
> descripción y anota por qué. No hay una única respuesta correcta.

### Caso C — La hipótesis del director

Con los tres arquetipos del Caso B, pulsa **«+ Agregar arquetipo»**, llámalo *Premium nocturno*
y escribe los valores que describe el director. Lee con atención los **avisos** que aparecen
debajo de «Resultados». Guarda la corrida como **«C director»**.

---

## 4. Cuadro de resultados

Copia los valores del cuadro de «Comparar corridas» (o descárgalo con **«Descargar cuadro
(CSV/Excel)»**) y complétalo:

| | Caso A automáticos | Caso B entrevistas | Caso C director |
|---|---|---|---|
| Número de segmentos (k) | | | |
| Silueta del rígido (y su nivel) | | | |
| % de clientes ambiguos (difuso) | | | |
| % de clientes en que coinciden rígido y difuso | | | |
| Cambio medio de los arquetipos | | | |
| Arquetipo que más cambió (y su veredicto en el paso 5) | | | |
| Segmento con más clientes ambiguos (paso 4) | | | |

---

## 5. Preguntas de análisis

Responde por escrito, citando los números de tu cuadro y las gráficas de la app.

1. **Nombres que engañan.** En el Caso A, ¿qué clientes reales terminaron en el segmento *Bajo* y en
   el segmento *Alto*? (Usa la tabla «propuesto → real» del paso 5.) ¿Por qué los nombres *Bajo*,
   *Medio* y *Alto* no sirven para describir a estos clientes? Pista: compara pedidos al mes contra
   gasto por pedido.
2. **¿Por qué la silueta casi no cambia entre A y B?** Si los arquetipos de partida fueron tan
   distintos, ¿por qué el método rígido llega a una silueta casi igual? ¿Qué sí cambió entre A y B
   que es importante para el negocio? (Revisa el «cambio» y el «veredicto» de cada arquetipo.)
3. **Tus hipótesis contra los datos.** En el Caso B, ¿qué arquetipo de las entrevistas describía
   mejor a los clientes reales y cuál tuvo que corregirse más? ¿En qué variable estuvo la
   corrección?
4. **Lo que el rígido esconde.** En el Caso B, ¿qué segmento tiene más clientes ambiguos (paso 4)?
   Busca en «Ejemplos» un cliente ambiguo: ¿entre qué dos segmentos está repartido? Describe con
   palabras de negocio quién podría ser ese cliente. Por ejemplo, ¿un oficinista que también caza
   promociones?
5. **La hipótesis del director.** En el Caso C, ¿cuántos clientes quedaron en el segmento *Premium
   nocturno* según k-means? ¿Qué pasó con el % de ambiguos y con el arquetipo *Familia*? ¿Qué dice
   el aviso de la app sobre el gasto de $800? Con esos datos, ¿recomendarías la campaña de lujo?
6. **Decisión de segmentación.** Para la campaña real, ¿usarías la segmentación rígida, la difusa o
   ambas? Propón qué hacer con los clientes ambiguos: ¿mensaje propio, el mensaje de su segmento
   principal o una mezcla? Justifica con los números.

---

## 6. Entregables

1. **El cuadro de resultados** (sección 4), lleno o descargado de la app.
2. **El Excel de resultados del Caso B**, con el botón «Descargar resultados por cliente (Excel)» del
   paso 5.
3. **Un memorándum de una página para el director comercial** con:
   - cuántos segmentos recomiendas y cómo se llaman;
   - un párrafo por segmento: quién es, cuántos clientes tiene y qué campaña le harías;
   - qué hacer con los clientes ambiguos;
   - tu respuesta, con datos, a la hipótesis del *premium nocturno*.

### Criterios de evaluación

| Criterio | Peso |
|---|---|
| Cuadro de resultados completo y correcto | 20 % |
| Traducción razonada de las entrevistas a arquetipos (Caso B), con su justificación | 20 % |
| Respuestas de análisis sustentadas en números y gráficas de la app | 30 % |
| Memorándum: recomendación clara, accionable y basada en los datos | 30 % |

---

> **Ética y datos personales.** Esta actividad usa datos sintéticos. Con datos reales de
> clientes, el perfilamiento exige base legal y un propósito declarado que el consumidor pueda
> conocer (recuadros de ética de los capítulos 2 y 3). El archivo nunca debe incluir nombres,
> correos, teléfonos ni direcciones: solo un identificador anónimo. La app procesa los datos en
> tu computadora y no los envía a ningún lado.
