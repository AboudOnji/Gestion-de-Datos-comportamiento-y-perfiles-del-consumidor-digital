%% cap06_alternativas.m — Evaluación de alternativas: reglas compensatorias y no compensatorias
% Título:       Tres reglas de decisión sobre las mismas alternativas
% Autor:        Prof. D.Sc. Barsekh-Onji Aboud
% Institución:  IPN — ESCA Unidad Santo Tomás
% Fecha:        2026-10-15
% Descripción:  Laboratorio del Cap. 5 (catálogo §9.2, fila 5). Un consumidor
%               compara seis alternativas FICTICIAS de un mismo producto
%               (audífonos inalámbricos de marcas inventadas) en cuatro
%               atributos. El script aplica tres reglas de decisión a los
%               MISMOS datos: (1) aditiva ponderada (compensatoria: lo bueno
%               de un atributo compensa lo malo de otro), (2) conjuntiva
%               (no compensatoria: cada atributo debe superar un mínimo) y
%               (3) lexicográfica (no compensatoria: manda el atributo más
%               importante, con tolerancia). Después barre el peso del precio
%               para ver en qué punto cambia la alternativa elegida.
%               Datos SINTÉTICOS y marcas ficticias: no representan ningún
%               producto, marca ni mercado real (§5.8 del prompt de
%               proyecto). Este MISMO script es el del libro y el de la
%               práctica «Recorrido del consumidor digital»: el estudiante
%               solo modifica la sección de parámetros, corre el script para
%               cada caso que le pidan y compara los resultados.
% Toolboxes requeridas: ninguna (MATLAB base).
% Tiempo de ejecución esperado: < 5 s.

clc; clear; close all; rng(42);

%% ===================================================================
%  PARÁMETROS — ESTA ES LA ÚNICA SECCIÓN QUE EL ESTUDIANTE DEBE EDITAR
%  ===================================================================
pesoPrecio = 0.40;          % importancia del precio (cualquier valor >= 0; se normalizan)
pesoCalidad = 0.30;         % importancia de la calidad percibida
pesoEntrega = 0.15;         % importancia de la rapidez de entrega
pesoResenas = 0.15;         % importancia de las reseñas
umbralMinimo = 3.5;         % regla conjuntiva: puntaje mínimo (0 a 10) en CADA atributo
atributoPrioritario = 2;    % regla lexicográfica: 1 precio, 2 calidad, 3 entrega, 4 reseñas
toleranciaLex = 0.5;        % regla lexicográfica: diferencia (en puntos) que se considera empate
% ===================================================================

%% Datos — alternativas ficticias (no editar)
alternativas = ["Alfa" "Beta" "Gama" "Delta" "Épsilon" "Zeta"];
atributos = ["Precio" "Calidad" "Entrega" "Reseñas"];
%               precio   calidad  entrega  reseñas
%               (MXN)    (1 a 10) (días)   (1 a 5 estrellas)
datosCrudos = [  899     6.0      2        4.1      % Alfa
                1499     8.5      5        4.6      % Beta
                1199     7.5      3        4.3      % Gama
                 699     4.5      7        3.6      % Delta
                1799     9.0      4        4.8      % Épsilon
                1049     7.0      2        3.9 ];   % Zeta
esCosto = [true false true false];   % precio y días de entrega: menos es mejor
nAlt = size(datosCrudos, 1);

%% Procesamiento — normalización a una escala común de 0 a 10
% Cada atributo tiene unidades distintas (pesos, días, estrellas); para poder
% compararlos se lleva cada columna a 0-10 con min-max. En los atributos de
% costo se invierte, de modo que 10 siempre sea «lo mejor».
minimos = min(datosCrudos, [], 1);
maximos = max(datosCrudos, [], 1);
puntajes = 10 * (datosCrudos - minimos) ./ (maximos - minimos);
puntajes(:, esCosto) = 10 - puntajes(:, esCosto);

pesosBrutos = [pesoPrecio pesoCalidad pesoEntrega pesoResenas];
pesos = pesosBrutos / sum(pesosBrutos);

%% Procesamiento — regla 1: aditiva ponderada (compensatoria)
utilidad = puntajes * pesos';
[utilidadOrdenada, ordenAditiva] = sort(utilidad, 'descend');
ganadorAditiva = ordenAditiva(1);

%% Procesamiento — regla 2: conjuntiva (no compensatoria)
aceptables = all(puntajes >= umbralMinimo, 2);
nAceptables = sum(aceptables);
if nAceptables == 0
    ganadorConj = 0;                         % ninguna alternativa pasa el filtro
else
    utilidadAcept = utilidad;
    utilidadAcept(~aceptables) = -Inf;       % solo compiten las que pasaron
    [~, ganadorConj] = max(utilidadAcept);   % entre las aceptables, la de mayor utilidad
end

%% Procesamiento — regla 3: lexicográfica con tolerancia (no compensatoria)
[~, ordenPesos] = sort(pesos, 'descend');
ordenAtributos = [atributoPrioritario, ordenPesos(ordenPesos ~= atributoPrioritario)];
candidatas = 1:nAlt;
for k = ordenAtributos
    mejor = max(puntajes(candidatas, k));
    candidatas = candidatas(puntajes(candidatas, k) >= mejor - toleranciaLex);
    if numel(candidatas) == 1, break; end
end
ganadorLex = candidatas(1);

%% Procesamiento — barrido del peso del precio (regla aditiva)
% Los demás pesos conservan sus proporciones; solo se mueve el del precio.
rejilla = 0:0.01:1;
resto = pesos(2:4) / sum(pesos(2:4));
ganadorBarrido = zeros(size(rejilla));
utilBarrido = zeros(numel(rejilla), nAlt);
for i = 1:numel(rejilla)
    w = [rejilla(i), (1 - rejilla(i)) * resto];
    utilBarrido(i, :) = (puntajes * w')';
    [~, ganadorBarrido(i)] = max(utilBarrido(i, :));
end
nCambios = sum(diff(ganadorBarrido) ~= 0);

%% Resultados impresos
nombreGanador = @(g) char(alternativas(g));
fprintf('=== Resultados con pesos=[%.2f %.2f %.2f %.2f], umbral=%.1f, prioritario=%s, tolerancia=%.1f ===\n', ...
    pesosBrutos, umbralMinimo, atributos(atributoPrioritario), toleranciaLex);
fprintf('\nPuntajes normalizados (0 a 10):\n');
fprintf('  %-9s %7s %8s %8s %8s\n', 'Alternativa', atributos);
for i = 1:nAlt
    fprintf('  %-9s %7.2f %8.2f %8.2f %8.2f\n', alternativas(i), puntajes(i, :));
end
fprintf('\nRegla aditiva ponderada (compensatoria):\n');
for i = 1:nAlt
    fprintf('  %d. %-9s utilidad = %.3f\n', i, alternativas(ordenAditiva(i)), utilidadOrdenada(i));
end
fprintf('  Elige: %s\n', nombreGanador(ganadorAditiva));
fprintf('\nRegla conjuntiva (mínimo %.1f en cada atributo): %d alternativa(s) aceptable(s)\n', ...
    umbralMinimo, nAceptables);
if nAceptables == 0
    fprintf('  Ninguna alternativa cumple el mínimo: la regla no elige.\n');
else
    fprintf('  Aceptables: %s\n', strjoin(alternativas(aceptables), ', '));
    fprintf('  Elige: %s\n', nombreGanador(ganadorConj));
end
fprintf('\nRegla lexicográfica (primero %s, tolerancia %.1f):\n', ...
    atributos(atributoPrioritario), toleranciaLex);
fprintf('  Elige: %s\n', nombreGanador(ganadorLex));
if nAceptables > 0 && ganadorAditiva == ganadorConj && ganadorConj == ganadorLex
    fprintf('\nLas tres reglas coinciden.\n');
else
    fprintf('\nLas reglas NO coinciden: la regla de decisión cambia la alternativa elegida.\n');
end
fprintf('\nBarrido del peso del precio (0 a 1, regla aditiva): el ganador cambia %d vez(veces)\n', nCambios);
inicio = 1;
for i = 2:numel(rejilla) + 1
    if i == numel(rejilla) + 1 || ganadorBarrido(i) ~= ganadorBarrido(inicio)
        fprintf('  %-9s de %.2f a %.2f\n', alternativas(ganadorBarrido(inicio)), rejilla(inicio), rejilla(i-1));
        inicio = i;
    end
end

%% Resultados y visualización — Figura 1: utilidad aditiva y elección de cada regla
colorGuinda = [0.42 0.12 0.23]; colorTeal = [0.16 0.49 0.51]; colorDorado = [0.72 0.59 0.35];
figure('Color', 'w', 'Position', [100 100 780 420]);
b = bar(utilidad, 0.6, 'FaceColor', [0.85 0.85 0.85], 'EdgeColor', [0.5 0.5 0.5]); hold on;
b.FaceColor = 'flat';
b.CData = repmat([0.85 0.85 0.85], nAlt, 1);
b.CData(ganadorAditiva, :) = colorGuinda;
% Cada regla marca su alternativa elegida justo sobre la barra; si dos reglas
% eligen la misma, las marcas se apilan hacia arriba.
alto = max(utilidad);
nivel = zeros(1, nAlt);
elecciones = {ganadorAditiva, 'Aditiva', colorGuinda, 'o'; ...
              ganadorConj,    'Conjuntiva', colorTeal, 'v'; ...
              ganadorLex,     'Lexicográfica', [0.55 0.42 0.2], 's'};
for e = 1:size(elecciones, 1)
    g = elecciones{e, 1};
    if g == 0, continue; end
    y = utilidad(g) + 0.35 + 0.6 * nivel(g);
    nivel(g) = nivel(g) + 1;
    plot(g, y, elecciones{e, 4}, 'MarkerSize', 8, 'MarkerFaceColor', elecciones{e, 3}, 'MarkerEdgeColor', elecciones{e, 3});
    text(g + 0.12, y, elecciones{e, 2}, 'Color', elecciones{e, 3}, 'FontWeight', 'bold', 'VerticalAlignment', 'middle');
end
hold off; grid on;
set(gca, 'XTick', 1:nAlt, 'XTickLabel', alternativas);
ylim([0 alto * 1.3]);
ylabel('Utilidad aditiva (0 a 10)');
title('Utilidad aditiva y alternativa elegida por cada regla -- datos sintéticos');

if ~exist('../../figuras/matlab', 'dir')
    mkdir('../../figuras/matlab');
end
exportgraphics(gcf, '../../figuras/matlab/cap06_reglas_decision.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap06_reglas_decision.png', 'Resolution', 300);

%% Resultados y visualización — Figura 2: sensibilidad al peso del precio
figure('Color', 'w', 'Position', [100 100 780 420]);
colores = lines(nAlt);
hold on;
for j = 1:nAlt
    plot(rejilla, utilBarrido(:, j), 'Color', colores(j, :), 'LineWidth', 1.8);
end
xline(pesos(1), 'k:', 'Peso actual', 'LabelVerticalAlignment', 'bottom');
hold off; grid on;
xlabel('Peso del precio (los demás pesos conservan sus proporciones)');
ylabel('Utilidad aditiva (0 a 10)');
title('¿Cuándo cambia la elección? Sensibilidad al peso del precio -- datos sintéticos');
legend(alternativas, 'Location', 'eastoutside');
ylim([0 10.5]);

exportgraphics(gcf, '../../figuras/matlab/cap06_sensibilidad_peso.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap06_sensibilidad_peso.png', 'Resolution', 300);

fprintf('\nFiguras exportadas a figuras/matlab/cap06_{reglas_decision,sensibilidad_peso}.{pdf,png}\n');
