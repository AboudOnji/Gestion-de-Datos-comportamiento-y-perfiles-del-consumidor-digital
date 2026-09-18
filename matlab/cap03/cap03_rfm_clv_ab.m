%% cap03_rfm_clv_ab.m — RFM, CLV simple y prueba A/B para decidir
% Título:       Calidad de datos, segmentación RFM, CLV y prueba A/B
% Autor:        Dr. Aboud Barsekh-Onji
% Institución:  IPN — ESCA Unidad Santo Tomás
% Fecha:        2026-09-18
% Descripción:  Laboratorio del Cap. 3 (catálogo §9.2, fila 3). Tres bloques:
%               (1) limpieza de datos SINTÉTICOS con valores faltantes y
%               atípicos; (2) segmentación RFM (Recencia, Frecuencia,
%               Monto) y cálculo de CLV (valor de vida del cliente) simple;
%               (3) prueba A/B con test de dos proporciones para decidir
%               entre dos versiones de una página de checkout. Datos
%               SINTÉTICOS, rng(42) — no representan a ningún negocio real
%               (§5.8 del prompt de proyecto).
% Toolboxes requeridas: Statistics and Machine Learning Toolbox (tabulate,
%               prctile ya está en base; se usa normcdf).
% Tiempo de ejecución esperado: < 10 s.

clc; clear; close all; rng(42);

%% Parámetros
nClientes = 300;
hoy = datetime(2026,9,18);

%% Datos: transacciones SINTÉTICAS con valores faltantes y atípicos deliberados
recenciaDias  = round(exprnd(60, nClientes, 1));            % días desde última compra
frecuencia    = poissrnd(4, nClientes, 1) + 1;               % compras en el periodo
montoPromedio = normrnd(450, 150, nClientes, 1);             % ticket promedio (MXN)

% Ensuciar los datos a propósito: 5% de montos faltantes (NaN) y 2% de
% atípicos extremos, para que el bloque de limpieza tenga algo que hacer.
idxFaltante = randperm(nClientes, round(0.05*nClientes));
montoPromedio(idxFaltante) = NaN;
idxAtipico = randperm(nClientes, round(0.02*nClientes));
montoPromedio(idxAtipico) = montoPromedio(idxAtipico) * 8;  % gasto "atípico" implausible

%% Procesamiento — Bloque 1: limpieza y calidad de datos
fprintf('--- Bloque 1: calidad de datos ---\n');
fprintf('Valores faltantes en monto promedio: %d de %d (%.1f%%)\n', ...
    sum(isnan(montoPromedio)), nClientes, 100*mean(isnan(montoPromedio)));

% Imputación simple por mediana (regla documentada, no silenciosa)
medianaMonto = median(montoPromedio, 'omitnan');
montoLimpio = montoPromedio;
montoLimpio(isnan(montoLimpio)) = medianaMonto;

% Detección de atípicos por regla de 1.5×RIC (rango intercuartílico)
q1 = prctile(montoLimpio, 25);
q3 = prctile(montoLimpio, 75);
ric = q3 - q1;
limiteSuperior = q3 + 1.5*ric;
esAtipico = montoLimpio > limiteSuperior;
fprintf('Atípicos detectados (regla 1.5xRIC, límite=%.0f): %d de %d (%.1f%%)\n', ...
    limiteSuperior, sum(esAtipico), nClientes, 100*mean(esAtipico));

% Se "cap" el atípico al límite superior en vez de eliminarlo (conserva el
% cliente en el análisis, evita perder información de frecuencia/recencia).
montoLimpio(esAtipico) = limiteSuperior;

%% Procesamiento — Bloque 2: segmentación RFM y CLV simple
fprintf('\n--- Bloque 2: RFM y CLV ---\n');

% Puntaje 1-5 por quintil para cada dimensión (5 = mejor para el negocio).
% Recencia: menos días es mejor -> quintiles invertidos.
puntajeR = 6 - discretize(recenciaDias, prctile(recenciaDias, 0:20:100), 'IncludedEdge', 'right');
puntajeF = discretize(frecuencia, prctile(frecuencia, 0:20:100), 'IncludedEdge', 'right');
puntajeM = discretize(montoLimpio, prctile(montoLimpio, 0:20:100), 'IncludedEdge', 'right');
puntajeR(isnan(puntajeR)) = 3; puntajeF(isnan(puntajeF)) = 3; puntajeM(isnan(puntajeM)) = 3;

rfmTotal = puntajeR + puntajeF + puntajeM;  % rango 3-15

segmento = strings(nClientes,1);
segmento(rfmTotal >= 12) = "Campeón";
segmento(rfmTotal >= 9 & rfmTotal < 12) = "Leal";
segmento(rfmTotal >= 6 & rfmTotal < 9)  = "En riesgo";
segmento(rfmTotal < 6) = "Perdido";

tablaSegmentos = tabulate(segmento);
disp('Distribución de segmentos RFM:');
disp(tablaSegmentos);

% CLV simple: valor promedio de transacción x frecuencia anualizada x
% horizonte de vida esperado (supuesto didáctico de 3 años).
horizonteAnios = 3;
clv = montoLimpio .* frecuencia .* horizonteAnios;
fprintf('CLV simple promedio por segmento (horizonte %d años, supuesto didáctico):\n', horizonteAnios);
for s = ["Campeón", "Leal", "En riesgo", "Perdido"]
    fprintf('  %-10s: $%.0f\n', s, mean(clv(segmento == s)));
end

%% Resultados y visualización — Figura 1: segmentos RFM y CLV
figure('Color', 'w', 'Position', [100 100 800 380]);

subplot(1,2,1);
ordenSegmentos = ["Campeón", "Leal", "En riesgo", "Perdido"];
conteos = arrayfun(@(s) sum(segmento == s), ordenSegmentos);
bar(categorical(ordenSegmentos, ordenSegmentos), conteos, 'FaceColor', [0.42 0.12 0.23]);
grid on;
ylabel('Número de clientes');
title('Distribución de segmentos RFM');

subplot(1,2,2);
clvPromedio = arrayfun(@(s) mean(clv(segmento == s)), ordenSegmentos);
bar(categorical(ordenSegmentos, ordenSegmentos), clvPromedio, 'FaceColor', [0.16 0.49 0.51]);
grid on;
ylabel('CLV simple promedio (MXN)');
title('CLV por segmento (horizonte de 3 años)');

sgtitle('Segmentación RFM y CLV -- datos sintéticos');

if ~exist('../../figuras/matlab', 'dir')
    mkdir('../../figuras/matlab');
end
exportgraphics(gcf, '../../figuras/matlab/cap03_rfm_clv.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap03_rfm_clv.png', 'Resolution', 300);

%% Procesamiento — Bloque 3: prueba A/B (dos proporciones) para decidir
fprintf('\n--- Bloque 3: prueba A/B ---\n');

% Escenario didáctico: dos versiones de checkout, conversión SINTÉTICA.
nA = 1200; conversionesA = 132;   % versión A (control): 11.0%
nB = 1180; conversionesB = 159;   % versión B (variante): 13.5%

pA = conversionesA / nA;
pB = conversionesB / nB;
pConjunta = (conversionesA + conversionesB) / (nA + nB);
errorEstandar = sqrt(pConjunta * (1-pConjunta) * (1/nA + 1/nB));
z = (pB - pA) / errorEstandar;
valorP = 2 * (1 - normcdf(abs(z)));  % prueba de dos colas

alfa = 0.05;
fprintf('Conversión A = %.2f%% (n=%d), Conversión B = %.2f%% (n=%d)\n', ...
    100*pA, nA, 100*pB, nB);
fprintf('Estadístico z = %.3f, valor p = %.4f (alfa = %.2f)\n', z, valorP, alfa);
if valorP < alfa
    fprintf('Decisión: se rechaza H0 -- la diferencia es estadísticamente significativa.\n');
else
    fprintf('Decisión: no se rechaza H0 -- la diferencia observada podría deberse al azar.\n');
end

%% Resultados y visualización — Figura 2: prueba A/B
% Intervalo de confianza 95% de cada proporción (aproximación normal).
icA = 1.96 * sqrt(pA*(1-pA)/nA);
icB = 1.96 * sqrt(pB*(1-pB)/nB);

figure('Color', 'w', 'Position', [100 100 480 420]);
bar(categorical({'A (control)', 'B (variante)'}), [pA, pB]*100, 0.5, ...
    'FaceColor', 'flat', 'CData', [0.42 0.12 0.23; 0.72 0.59 0.35]);
hold on;
errorbar([1 2], [pA pB]*100, [icA icB]*100, 'k.', 'LineWidth', 1.5, 'CapSize', 12);
hold off;
grid on;
ylabel('Tasa de conversión (%)');
title(sprintf('Prueba A/B de checkout (z=%.2f, p=%.4f)', z, valorP));

exportgraphics(gcf, '../../figuras/matlab/cap03_prueba_ab.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap03_prueba_ab.png', 'Resolution', 300);

fprintf('\nFiguras exportadas a figuras/matlab/cap03_{rfm_clv,prueba_ab}.{pdf,png}\n');
