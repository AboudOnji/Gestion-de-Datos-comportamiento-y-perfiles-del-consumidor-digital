**Instituto Politécnico Nacional - Dr. Aboud Barsekh Onji**

# Notas para el profesor — Actividad adicional del Cap. 2: Tlacoyo Express

**No entregar a los estudiantes.** Contiene los perfiles con los que se simularon los datos, los
valores de referencia y las respuestas esperadas.

Archivos de la actividad (todos en `matlab/cap02/`):

| Archivo | Uso |
|---|---|
| `cap02_actividad_tlacoyo.md` | Hoja del estudiante: contexto, corridas, preguntas, entregables |
| `cap02_actividad_tlacoyo_datos.xlsx` | Datos: 240 clientes, una hoja «Datos», 3 variables |
| `cap02_segmentacion_datos_propios.html` | La app (la misma de la actividad de datos propios) |

El Excel se regenera, idéntico, con:

```bash
conda run -n research python matlab/utils/apps/datos/crear_excel_actividad_cap02.py
```

---

## 1. Cómo se construyeron los datos

Tienen la misma dinámica que el ejemplo del capítulo: **3 variables, 3 perfiles ocultos y traslape
deliberado**. Los perfiles se calibraron para reproducir el nivel de traslape del ejemplo del libro,
cuya silueta es 0.58 con 15 % de clientes ambiguos.

| Perfil oculto | Clientes | Pedidos al mes | Gasto por pedido (MXN) | Notificaciones abiertas (%) |
|---|---|---|---|---|
| Oficinista entre semana | 100 | 8.0 ± 2.3 | 165 ± 45 | 50 ± 14 |
| Familia de fin de semana | 70 | 3.5 ± 1.3 | 430 ± 120 | 32 ± 13 |
| Cazador de promociones | 70 | 5.5 ± 1.8 | 215 ± 60 | 75 ± 12 |

(media ± desviación estándar; generador `numpy` con semilla 42; valores acotados: pedidos ≥ 0.5,
gasto ≥ $60, notificaciones entre 0 y 100; filas mezcladas.)

**Diferencia clave con el ejemplo del libro:** aquí los perfiles **no** siguen un orden
«bajo/medio/alto». La familia pide poco pero gasta mucho, y el oficinista pide mucho pero gasta poco.
Por eso la propuesta automática de la app (percentiles) asigna nombres que no describen a nadie, y
el estudiante tiene que construir sus arquetipos desde el contexto.

**No hay perfil «premium nocturno»** en los datos: la hipótesis del director es falsa a propósito.

---

## 2. Valores de referencia

Calculados con la app y **verificados en MATLAB R2026a**: `kmeans(...,'Start',C)` + `silhouette`, y
`fcm` con m = 2. Coinciden la silueta 0.576, los tamaños de segmento, el 17.9 % de ambiguos y los
centros reales.

**Rango de las variables:** pedidos 0.5–12.9 (media 5.89) · gasto $69–$636 (media $250) ·
notificaciones 6–97 % (media 51.6 %).

### Caso A — Arquetipos automáticos (percentiles 17, 50 y 83)

| Arquetipo | Propuesto (pedidos, gasto, notif.) | Real en los datos | Cambio | Veredicto | Clientes |
|---|---|---|---|---|---|
| Bajo | 3.2 · $148 · 33.5 % | 3.7 · $422 · 35.1 % → **es la familia** | 2.18 | cambió mucho | 67 |
| Medio | 5.9 · $205 · 52 % | 8.1 · $167 · 47.8 % → **es el oficinista** | 0.93 | cambió mucho | 95 |
| Alto | 8.4 · $395 · 72 % | 5.2 · $212 · 70.5 % → **es el cazador** | 1.89 | cambió mucho | 78 |

Silueta **0.576** (razonable) · ambiguos **17.9 %** (43 clientes) · coincidencia rígido/difuso
**99.2 %** · cambio medio **1.67**.

### Caso B — Arquetipos de las entrevistas

Los valores que dé cada estudiante variarán. Con una traducción típica de las entrevistas
(Oficinista 8 · $150 · 45 %; Familia 3 · $450 · 25 %; Cazador 5 · $200 · 80 %):

| Arquetipo | Real en los datos | Cambio | Veredicto | Clientes | Ambiguos |
|---|---|---|---|---|---|
| Oficinista | 8.1 · $167 · 47.9 % | 0.21 | casi igual | 95 | 20 (21 %) |
| Familia | 3.7 · $422 · 35.1 % | 0.64 | cambió algo (sobre todo en notificaciones) | 67 | 8 (12 %) |
| Cazador | 5.2 · $212 · 70.5 % | 0.52 | cambió algo (abren menos de lo que se creía) | 78 | 15 (19 %) |

Silueta **0.576** · ambiguos **17.9 %** · coincidencia **99.2 %** · cambio medio **0.46**.

Con otra traducción razonable (9 · $160 · 50; 4 · $400 · 30; 6 · $220 · 75) se obtiene silueta
0.577, cambios de 0.35 a 0.39 y segmentos de 91, 70 y 79 clientes. Cualquier traducción sensata
de las entrevistas debe dar **cambios menores que 0.75 en los tres arquetipos**.

### Caso C — Con el «premium nocturno» (6 · $800 · 60 %)

- **k-means:** el segmento *Premium nocturno* queda **vacío (0 clientes)**. Los otros tres conservan
  sus 95, 67 y 78 clientes, así que la silueta sigue en 0.576.
- **La app avisa** que el arquetipo está «muy lejos de sus datos» en gasto. $800 está a más de 3
  desviaciones estándar del promedio; el gasto máximo en los datos es $636.
- **Fuzzy c-means,** obligado a formar 4 segmentos:
  - los ambiguos suben de **17.9 % a 37.1 %** (89 clientes) y la coincidencia baja a **78.3 %**;
  - el arquetipo *Premium* termina absorbiendo a las familias, porque son el grupo real más
    cercano a «gasto alto» (centro real 3.6 · $441 · 34.9 %);
  - el arquetipo *Familia* se desplaza **2.61** hacia los oficinistas (centro real 6.0 · $190 · 46.1 %).
- **Cambio medio: 1.68.**

---

## 3. Respuestas esperadas

1. **Nombres que engañan.** *Bajo* termina siendo la **familia**, que pide poco pero gasta mucho
   (≈ $422). *Alto* termina siendo el **cazador**, que gasta poco (≈ $212) y pide menos que *Medio*.
   La propuesta automática supone que las tres variables suben juntas, y aquí pedidos y gasto van en
   sentido contrario. Por eso los tres arquetipos «cambiaron mucho» (1.67 en promedio).
2. **Silueta casi igual en A y B.** Ambos puntos de partida llevan a k-means al mismo resultado (los
   mismos 3 grupos reales), porque los grupos existen en los datos y el algoritmo los encuentra. Lo
   que cambia es **la interpretación**: en B los segmentos ya tienen nombres de negocio correctos y
   el cambio medio baja de 1.67 a ≈ 0.46. La silueta mide qué tan separados están los grupos, no si
   los nombres o las hipótesis eran buenos.
3. **Hipótesis contra datos.** El oficinista estaba muy bien descrito (cambio ≈ 0.2). La familia
   abre más notificaciones de lo que se creía (35 % contra 25 %) y el cazador un poco menos (70 %
   contra 80 %). Con otras traducciones el detalle varía; lo que se evalúa es que identifique la
   variable corregida.
4. **Lo que el rígido esconde.** El **oficinista** concentra más ambiguos (≈ 20 de 95, 21 %). En
   «Ejemplos» aparecen clientes repartidos entre Oficinista y Cazador: oficinistas que también
   reaccionan a las promociones. Una campaña «solo para oficinistas» los trataría como típicos.
5. **Hipótesis del director.** Ningún cliente cae en *Premium* (0 en k-means), el gasto de $800 no
   existe en los datos (máximo $636) y forzar 4 segmentos duplica los ambiguos (17.9 % → 37.1 %) y
   deforma el arquetipo *Familia*. **No se recomienda** la campaña de lujo con estos datos. Si
   acaso, se sugiere investigar con otra fuente, por ejemplo pedidos por hora del día.
6. **Decisión.** Respuesta abierta. Lo razonable es usar el **rígido para asignar la campaña
   principal** de cada cliente y el **difuso para identificar a los ambiguos** (≈ 18 %) y darles
   un trato mixto o probar con ellos dos mensajes (prueba A/B, Cap. 3).

### Errores frecuentes

- **Escribir porcentajes como fracción** (0.45 en lugar de 45). La app no marca error ni aviso,
  porque 0.45 cae dentro del rango que se considera posible (media 51.6 ± 3 × 18.9). Lo que se ve es
  que ese arquetipo «cambió mucho» en el paso 5. Si un estudiante reporta cambios grandes en el Caso B,
  revisar primero las unidades.
- **No renombrar los arquetipos del Caso B.** El cuadro de «Comparar corridas» mostrará
  Bajo/Medio/Alto también en el Caso B.
- **Confundir «silueta alta» con «hipótesis correcta».** Es justo lo que discute la pregunta 2.
- **Guardar el Caso C sin leer los avisos.** Los avisos son la evidencia principal contra el
  *premium nocturno*.
