%% cap02_segmentacion.m — Segmentación rígida vs. difusa del consumidor digital
% Título:       k-means vs. fuzzy c-means en la segmentación de consumidores
% Autor:        Dr. Aboud Barsekh-Onji
% Institución:  IPN — ESCA Unidad Santo Tomás
% Fecha:        2026-09-18
% Descripción:  Laboratorio del Cap. 2 (catálogo §9.2, fila 2). Compara la
%               segmentación rígida (k-means, pertenencia binaria a un solo
%               segmento) contra la segmentación difusa (fuzzy c-means,
%               pertenencia parcial a varios segmentos) sobre un conjunto de
%               datos SINTÉTICOS de comportamiento de consumidor digital.
%               Datos sintéticos, rng(42) — no representan a ningún mercado
%               real (§5.8 del prompt de proyecto).
% Toolboxes requeridas: Statistics and Machine Learning Toolbox (kmeans,
%               silhouette), Fuzzy Logic Toolbox (fcm).
% Tiempo de ejecución esperado: < 15 s.

clc; clear; close all; rng(42);

%% Parámetros
nClientes = 240;
kSegmentos = 3;

%% Datos: variables de comportamiento SINTÉTICAS de consumidor digital
% Tres arquetipos con centros distintos pero traslape deliberado entre
% "ocasional" y "leal" (para que la pertenencia difusa sea informativa).
% Variables: frecuencia de compra mensual, ticket promedio (MXN, escala
% relativa), engagement digital (índice 0-100).
nPorGrupo = nClientes / kSegmentos;

frecuencia = [ normrnd(1.5, 0.6, nPorGrupo, 1);   % "ocasional"
               normrnd(4.0, 0.9, nPorGrupo, 1);   % "leal"
               normrnd(2.6, 0.8, nPorGrupo, 1) ]; % "intermedio" (traslape)

ticket     = [ normrnd(350,  90, nPorGrupo, 1);
               normrnd(900, 150, nPorGrupo, 1);
               normrnd(600, 120, nPorGrupo, 1) ];

engagement = [ normrnd(25, 10, nPorGrupo, 1);
               normrnd(78, 12, nPorGrupo, 1);
               normrnd(52, 14, nPorGrupo, 1) ];

datos = [frecuencia, ticket, engagement];
nombresVariables = {'Frecuencia mensual', 'Ticket promedio', 'Engagement digital'};

% Estandarización (z-score) — obligatoria antes de cualquier clustering por
% distancia, ya que las tres variables tienen escalas muy distintas.
datosEstandar = (datos - mean(datos)) ./ std(datos);

%% Procesamiento — segmentación RÍGIDA (k-means)
[etiquetaKmeans, centrosKmeans] = kmeans(datosEstandar, kSegmentos, ...
    'Replicates', 20, 'Distance', 'sqeuclidean');
siluetaKmeans = silhouette(datosEstandar, etiquetaKmeans);
fprintf('k-means: silueta promedio = %.3f\n', mean(siluetaKmeans));

%% Procesamiento — segmentación DIFUSA (fuzzy c-means)
opcionesFCM = [2.0, 100, 1e-5, 0];  % exponente difuso m=2, iter máx, tolerancia, sin imprimir
[centrosFCM, matrizPertenencia] = fcm(datosEstandar, kSegmentos, opcionesFCM);
[~, etiquetaFCMdura] = max(matrizPertenencia, [], 1);  % "ganador" para comparar con k-means

% Consumidores con pertenencia ambigua (ningún segmento supera 0.6): son
% precisamente los que la segmentación rígida oculta al forzarlos a un
% único segmento.
pertenenciaMaxima = max(matrizPertenencia, [], 1);
proporcionAmbiguos = mean(pertenenciaMaxima < 0.6);
fprintf('Fuzzy c-means: %.1f%% de los consumidores no tiene pertenencia dominante (<60%%) a ningún segmento\n', ...
    100*proporcionAmbiguos);

%% Resultados y visualización — Figura 1: dispersión k-means vs. fuzzy
figure('Color', 'w', 'Position', [100 100 800 400]);

subplot(1,2,1);
gscatter(datosEstandar(:,1), datosEstandar(:,3), etiquetaKmeans, ...
    [0.42 0.12 0.23; 0.55 0.42 0.24; 0.16 0.49 0.51], 'o', 6);
hold on;
plot(centrosKmeans(:,1), centrosKmeans(:,3), 'kx', 'MarkerSize', 12, 'LineWidth', 2);
hold off;
grid on;
xlabel('Frecuencia mensual (estandarizada)');
ylabel('Engagement digital (estandarizado)');
title(sprintf('k-means (silueta prom. = %.2f)', mean(siluetaKmeans)));
legend('Segmento 1', 'Segmento 2', 'Segmento 3', 'centros', 'Location', 'southeast');

subplot(1,2,2);
% Tamaño del marcador proporcional a la incertidumbre de pertenencia:
% consumidores más "ambiguos" (pertenencia máxima más baja) se ven más grandes.
tamano = 60 * (1 - pertenenciaMaxima) + 15;
scatter(datosEstandar(:,1), datosEstandar(:,3), tamano, pertenenciaMaxima, 'filled');
colormap(gca, 'parula');
cb = colorbar;
cb.Label.String = 'Pertenencia máxima (u_{max})';
grid on;
xlabel('Frecuencia mensual (estandarizada)');
ylabel('Engagement digital (estandarizado)');
title(sprintf('Fuzzy c-means (%.0f%% con pertenencia ambigua)', 100*proporcionAmbiguos));

sgtitle('Segmentación rígida vs. difusa -- datos sintéticos de consumidor digital');

if ~exist('../../figuras/matlab', 'dir')
    mkdir('../../figuras/matlab');
end
exportgraphics(gcf, '../../figuras/matlab/cap02_segmentacion_comparacion.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap02_segmentacion_comparacion.png', 'Resolution', 300);

%% Resultados y visualización — Figura 2: perfiles de segmento en radar
% Se usan los centros de fuzzy c-means (en unidades originales, no
% estandarizadas) para que el perfil sea interpretable en negocio.
centrosOriginales = centrosFCM .* std(datos) + mean(datos);
% Normalizar cada variable a [0,1] respecto a su rango observado, para que
% las tres variables (con escalas distintas) se puedan graficar juntas.
centrosNormalizados = (centrosOriginales - min(datos)) ./ (max(datos) - min(datos));

nVar = size(centrosNormalizados, 2);
angulos = linspace(0, 2*pi, nVar+1);
coloresSegmento = [0.42 0.12 0.23; 0.55 0.42 0.24; 0.16 0.49 0.51];
nombresSegmento = {'Perfil A', 'Perfil B', 'Perfil C'};

figure('Color', 'w', 'Position', [100 100 640 560]);
ax = polaraxes('Position', [0.12 0.12 0.68 0.68]);
ax.FontSize = 10;
hold(ax, 'on');
for s = 1:kSegmentos
    valores = [centrosNormalizados(s,:), centrosNormalizados(s,1)];
    polarplot(ax, angulos, valores, '-o', 'LineWidth', 2, ...
        'Color', coloresSegmento(s,:), 'MarkerFaceColor', coloresSegmento(s,:), ...
        'DisplayName', nombresSegmento{s});
end
hold(ax, 'off');
ax.ThetaTick = rad2deg(angulos(1:end-1));
ax.ThetaTickLabel = nombresVariables;
ax.RLim = [0 1];
title(ax, 'Perfil de los tres segmentos (centros de fuzzy c-means, normalizados)');
legend(ax, 'Location', 'southoutside', 'Orientation', 'horizontal');

exportgraphics(gcf, '../../figuras/matlab/cap02_perfiles_radar.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap02_perfiles_radar.png', 'Resolution', 300);

fprintf('Figuras exportadas a figuras/matlab/cap02_{segmentacion_comparacion,perfiles_radar}.{pdf,png}\n');
