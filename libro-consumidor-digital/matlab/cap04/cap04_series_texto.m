%% cap04_series_texto.m — Tendencia/estacionalidad e frecuencia de términos
% Título:       Serie de interés de búsqueda y escucha social (texto)
% Autor:        Dr. Aboud Barsekh-Onji
% Institución:  IPN — ESCA Unidad Santo Tomás
% Fecha:        2026-09-18
% Descripción:  Laboratorio del Cap. 4 (catálogo §9.2, fila 4). Dos bloques:
%               (1) descomposición de una serie SINTÉTICA de interés de
%               búsqueda en tendencia y estacionalidad, como la que
%               exportaría una herramienta de tendencias de búsqueda;
%               (2) frecuencia de términos en un corpus SINTÉTICO de
%               comentarios de escucha social, con nube de palabras.
%               Datos sintéticos, rng(42) — no representan a ninguna marca,
%               canal o campaña real (§5.8 del prompt de proyecto). Este
%               MISMO script es el que se usa en el libro y en la Práctica 2
%               de la Unidad I: el estudiante solo modifica la sección de
%               parámetros, corre el script para cada caso que le pidan, y
%               compara los resultados entre corridas.
% Toolboxes requeridas: Text Analytics Toolbox (tokenizedDocument,
%               bagOfWords, wordcloud).
% Tiempo de ejecución esperado: < 10 s.

clc; clear; close all; rng(42);

%% ===================================================================
%  PARÁMETROS — ESTA ES LA ÚNICA SECCIÓN QUE EL ESTUDIANTE DEBE EDITAR
%  ===================================================================
nSemanas = 104;                    % duración de la serie a simular (semanas)
fechaInicio = datetime(2024,9,16); % fecha del primer dato
crecimientoSemanal = 0.35;         % puntos de índice que crece la tendencia cada semana
amplitudEstacional = 12;           % qué tan marcado es el pico anual (puntos de índice)
desviacionRuido = 4;               % ruido aleatorio semana a semana (puntos de índice)
% ===================================================================

%% Datos — Bloque 1: serie SINTÉTICA de interés de búsqueda (no editar)
semana = (1:nSemanas)';
fechas = fechaInicio + calweeks(0:nSemanas-1)';

tendencia = 30 + crecimientoSemanal*semana;                                   % crecimiento sostenido
estacionalidad = amplitudEstacional*sin(2*pi*semana/52 - pi/2) + 6;           % pico anual (p. ej., Buen Fin/fin de año)
ruido = normrnd(0, desviacionRuido, nSemanas, 1);
interesBusqueda = max(tendencia + estacionalidad + ruido, 0);   % el índice no puede ser negativo

%% Procesamiento — Bloque 1: descomposición tendencia + estacionalidad
% Tendencia: media móvil centrada de 52 semanas (aproxima el componente de
% largo plazo, suaviza el ciclo anual).
tendenciaEstimada = movmean(interesBusqueda, [26 25]);
componenteEstacional = interesBusqueda - tendenciaEstimada;

fprintf('=== Resultados con crecimiento=%.2f/semana, amplitud estacional=%.0f, ruido=%.0f ===\n', ...
    crecimientoSemanal, amplitudEstacional, desviacionRuido);
fprintf('Interés de búsqueda: mínimo=%.1f, máximo=%.1f, promedio=%.1f\n', ...
    min(interesBusqueda), max(interesBusqueda), mean(interesBusqueda));
fprintf('Amplitud estimada del componente estacional: %.1f puntos\n', ...
    max(componenteEstacional) - min(componenteEstacional));

%% Resultados y visualización — Figura 1: tendencia y estacionalidad
figure('Color', 'w', 'Position', [100 100 780 420]);

subplot(2,1,1);
plot(fechas, interesBusqueda, 'Color', [0.72 0.72 0.72], 'LineWidth', 1); hold on;
plot(fechas, tendenciaEstimada, 'Color', [0.42 0.12 0.23], 'LineWidth', 2.2);
hold off;
grid on;
ylabel('Índice de interés');
title('Serie observada y tendencia (media móvil de 52 semanas)');
legend('Serie observada', 'Tendencia', 'Location', 'northwest');

subplot(2,1,2);
plot(fechas, componenteEstacional, 'Color', [0.16 0.49 0.51], 'LineWidth', 1.5);
yline(0, 'k:');
grid on;
xlabel('Fecha');
ylabel('Componente estacional');
title('Componente estacional (serie menos tendencia)');

sgtitle('Interés de búsqueda de un canal digital -- datos sintéticos');

if ~exist('../../figuras/matlab', 'dir')
    mkdir('../../figuras/matlab');
end
exportgraphics(gcf, '../../figuras/matlab/cap04_tendencia_estacionalidad.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap04_tendencia_estacionalidad.png', 'Resolution', 300);

%% Datos — Bloque 2: corpus SINTÉTICO de comentarios de escucha social
% Comentarios construidos a mano (no de una plataforma real) para ilustrar
% el flujo de frecuencia de términos. Rotulado como sintético en el texto,
% el script y la figura, conforme al §5.8 del prompt de proyecto.
comentarios = [
    "el envio llego muy rapido y el empaque excelente"
    "buen precio pero el soporte al cliente tardo mucho en responder"
    "la app se traba al pagar, tuve que reiniciar dos veces"
    "excelente calidad del producto, superó mis expectativas"
    "el envio se retraso una semana sin aviso previo"
    "precio justo, entrega rapida, todo bien"
    "el soporte al cliente resolvio mi duda en minutos, muy bien"
    "la app es lenta pero el producto llego a tiempo"
    "mal empaque, llego dañado el producto"
    "buen servicio, precio competitivo, volveria a comprar"
    "la entrega fue rapida pero el producto no coincide con la foto"
    "excelente soporte al cliente, resolvieron todo por chat"
    "el precio subio mucho respecto al mes pasado"
    "app facil de usar, pago sin problemas, envio rapido"
    "calidad regular, esperaba mas por el precio pagado"
    "el empaque llego roto pero el producto estaba bien"
    "muy buena atencion del soporte al cliente por telefono"
    "envio rapido y calidad excelente, totalmente recomendado"
    "la app fallo durante el pago y perdi el descuento"
    "precio alto pero la calidad lo justifica"
];

%% Procesamiento — Bloque 2: tokenización y frecuencia de términos
% tokenizedDocument solo tiene reglas específicas de idioma para 'en', 'de',
% 'ja', 'ko' en esta versión del toolbox; para español se usa la
% tokenización genérica y una lista propia de palabras vacías (stopwords)
% en español, ya que removeStopWords() por defecto usa la lista en inglés.
documentos = tokenizedDocument(erasePunctuation(comentarios));
palabrasVacias = ["el","la","los","las","un","una","unos","unas","y","o", ...
    "de","del","al","a","en","que","se","con","por","para","mi","muy", ...
    "lo","su","fue","es","fui","tuve","fallo","esta","estaba","pero","no"];
documentos = removeWords(documentos, palabrasVacias);
bolsaPalabras = bagOfWords(documentos);

% bolsaPalabras.Counts es una matriz [documentos x vocabulario]; se suma
% por columna para obtener la frecuencia total de cada término en el corpus.
conteoTotal = full(sum(bolsaPalabras.Counts, 1));
[frecuencias, orden] = sort(conteoTotal, 'descend');
palabras = bolsaPalabras.Vocabulary(orden);

nTop = 10;
fprintf('\nTop %d términos en el corpus sintético de escucha social:\n', nTop);
for i = 1:nTop
    fprintf('  %-15s %d\n', palabras(i), frecuencias(i));
end

%% Resultados y visualización — Figura 2: nube de palabras
figure('Color', 'w', 'Position', [100 100 620 420]);
wordcloud(bolsaPalabras);
title('Frecuencia de términos en comentarios de escucha social (sintético)');

exportgraphics(gcf, '../../figuras/matlab/cap04_nube_palabras.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap04_nube_palabras.png', 'Resolution', 300);

fprintf('\nFiguras exportadas a figuras/matlab/cap04_{tendencia_estacionalidad,nube_palabras}.{pdf,png}\n');
