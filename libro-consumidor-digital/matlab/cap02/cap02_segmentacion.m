%% cap02_segmentacion.m — Segmentación rígida vs. difusa del consumidor digital
% Título:       k-means vs. fuzzy c-means en la segmentación de consumidores
% Autor:        Dr. Aboud Barsekh-Onji
% Institución:  IPN — ESCA Unidad Santo Tomás
% Fecha:        2026-09-18
% Descripción:  Laboratorio del Cap. 2 (catálogo §9.2, fila 2) y script de la
%               Práctica 1 de la Unidad I. Compara la segmentación rígida
%               (k-means, pertenencia binaria a un solo segmento) contra la
%               segmentación difusa (fuzzy c-means, pertenencia parcial a
%               varios segmentos). Este MISMO script es el que se usa en el
%               libro y en la práctica: el estudiante solo modifica la
%               sección de parámetros (número de segmentos, sus centros
%               típicos y el tamaño de muestra), corre el script para cada
%               caso que le pidan, y compara los resultados entre corridas.
%               Datos SINTÉTICOS, rng(42) — no representan a ningún mercado
%               real (§5.8 del prompt de proyecto).
% Toolboxes requeridas: Statistics and Machine Learning Toolbox (kmeans,
%               silhouette), Fuzzy Logic Toolbox (fcm).
% Tiempo de ejecución esperado: < 15 s.

clc; clear; close all; rng(42);

%% ===================================================================
%  PARÁMETROS — ESTA ES LA ÚNICA SECCIÓN QUE EL ESTUDIANTE DEBE EDITAR
%  Cada FILA de "centrosTipicos" define un arquetipo de consumidor con tres
%  variables de comportamiento: [frecuencia mensual, ticket promedio (MXN),
%  engagement digital (0-100)]. Para simular MÁS o MENOS traslape entre
%  segmentos (el fenómeno central del capítulo), acerquen o alejen las filas
%  entre sí. Para simular MÁS o MENOS segmentos, agreguen o quiten filas
%  (con su dispersión correspondiente en "dispersionTipica"): todo lo demás
%  del script se ajusta solo al número de filas que dejen aquí.
centrosTipicos = [
    1.5,  350,  25    % arquetipo 1: "ocasional"
    4.0,  900,  78    % arquetipo 2: "leal"
    2.6,  600,  52 ]; % arquetipo 3: "intermedio" (traslape deliberado)

dispersionTipica = [
    0.6,  90,  10
    0.9, 150,  12
    0.8, 120,  14 ];

nClientesPorSegmento = 80;   % tamaño de muestra sintética por arquetipo
% ===================================================================

kSegmentos = size(centrosTipicos, 1);
nombresVariables = {'Frecuencia mensual', 'Ticket promedio', 'Engagement digital'};

%% Datos: comportamiento SINTÉTICO de consumidor digital (no editar)
datos = zeros(kSegmentos * nClientesPorSegmento, 3);
fila = 1;
for s = 1:kSegmentos
    bloque = repmat(centrosTipicos(s,:), nClientesPorSegmento, 1) + ...
             randn(nClientesPorSegmento, 3) .* repmat(dispersionTipica(s,:), nClientesPorSegmento, 1);
    datos(fila:fila+nClientesPorSegmento-1, :) = bloque;
    fila = fila + nClientesPorSegmento;
end
nClientes = size(datos, 1);

% Estandarización (z-score) — obligatoria antes de cualquier clustering por
% distancia, ya que las tres variables tienen escalas muy distintas.
datosEstandar = (datos - mean(datos)) ./ std(datos);

%% Procesamiento — segmentación RÍGIDA (k-means)
[etiquetaKmeans, centrosKmeans] = kmeans(datosEstandar, kSegmentos, ...
    'Replicates', 20, 'Distance', 'sqeuclidean');
siluetaKmeans = silhouette(datosEstandar, etiquetaKmeans);
fprintf('=== Resultados con %d arquetipos, %d clientes por segmento (n total=%d) ===\n', ...
    kSegmentos, nClientesPorSegmento, nClientes);
fprintf('k-means: silueta promedio = %.3f\n', mean(siluetaKmeans));

%% Procesamiento — segmentación DIFUSA (fuzzy c-means)
opcionesFCM = [2.0, 100, 1e-5, 0];  % exponente difuso m=2, iter máx, tolerancia, sin imprimir
[centrosFCM, matrizPertenencia] = fcm(datosEstandar, kSegmentos, opcionesFCM);

pertenenciaMaxima = max(matrizPertenencia, [], 1);
proporcionAmbiguos = mean(pertenenciaMaxima < 0.6);
fprintf('Fuzzy c-means: %.1f%% de los consumidores no tiene pertenencia dominante (<60%%) a ningún segmento\n', ...
    100*proporcionAmbiguos);

%% Visualización — Figura 1: dispersión k-means vs. fuzzy
figure('Color', 'w', 'Position', [100 100 800 400]);
colores = lines(kSegmentos);

subplot(1,2,1);
nombresSegmentoLeyenda = "Segmento " + (1:kSegmentos)';
gscatter(datosEstandar(:,1), datosEstandar(:,3), etiquetaKmeans, colores, 'o', 6);
hold on;
plot(centrosKmeans(:,1), centrosKmeans(:,3), 'kx', 'MarkerSize', 12, 'LineWidth', 2);
hold off;
grid on;
xlabel('Frecuencia mensual (estandarizada)');
ylabel('Engagement digital (estandarizado)');
title(sprintf('k-means (silueta prom. = %.2f)', mean(siluetaKmeans)));
legend([cellstr(nombresSegmentoLeyenda); {'centros'}], 'Location', 'southeast');

subplot(1,2,2);
tamano = 60 * (1 - pertenenciaMaxima) + 15;
scatter(datosEstandar(:,1), datosEstandar(:,3), tamano, pertenenciaMaxima, 'filled');
colormap(gca, 'parula');
cb = colorbar;
cb.Label.String = 'Pertenencia máxima (u_{max})';
grid on;
xlabel('Frecuencia mensual (estandarizada)');
ylabel('Engagement digital (estandarizado)');
title(sprintf('Fuzzy c-means (%.0f%% con pertenencia ambigua)', 100*proporcionAmbiguos));

sgtitle(sprintf('Segmentación rígida vs. difusa -- %d arquetipos, datos sintéticos', kSegmentos));

if ~exist('../../figuras/matlab', 'dir')
    mkdir('../../figuras/matlab');
end
exportgraphics(gcf, '../../figuras/matlab/cap02_segmentacion_comparacion.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap02_segmentacion_comparacion.png', 'Resolution', 300);

%% Visualización — Figura 2: perfiles de segmento en radar
% Se usan los centros de fuzzy c-means (en unidades originales, no
% estandarizadas) para que el perfil sea interpretable en negocio.
centrosOriginales = centrosFCM .* std(datos) + mean(datos);
centrosNormalizados = (centrosOriginales - min(datos)) ./ (max(datos) - min(datos));

nVar = size(centrosNormalizados, 2);
angulos = linspace(0, 2*pi, nVar+1);
nombresSegmento = "Perfil " + ('A':char('A'+kSegmentos-1))';

figure('Color', 'w', 'Position', [100 100 640 560]);
ax = polaraxes('Position', [0.12 0.12 0.68 0.68]);
ax.FontSize = 10;
hold(ax, 'on');
for s = 1:kSegmentos
    valores = [centrosNormalizados(s,:), centrosNormalizados(s,1)];
    polarplot(ax, angulos, valores, '-o', 'LineWidth', 2, ...
        'Color', colores(s,:), 'MarkerFaceColor', colores(s,:), ...
        'DisplayName', nombresSegmento(s));
end
hold(ax, 'off');
ax.ThetaTick = rad2deg(angulos(1:end-1));
ax.ThetaTickLabel = nombresVariables;
ax.RLim = [0 1];
title(ax, sprintf('Perfil de los %d segmentos (centros de fuzzy c-means, normalizados)', kSegmentos));
legend(ax, 'Location', 'southoutside', 'Orientation', 'horizontal');

exportgraphics(gcf, '../../figuras/matlab/cap02_perfiles_radar.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap02_perfiles_radar.png', 'Resolution', 300);

fprintf('Figuras exportadas a figuras/matlab/cap02_{segmentacion_comparacion,perfiles_radar}.{pdf,png}\n');
