%% cap08_red_influencia.m — Influenciadores en una red social simulada y cascada por umbral
% Título:       ¿Quién influye? Centralidad y contagio en una red social sintética
% Autor:        Prof. D.Sc. Barsekh-Onji Aboud
% Institución:  IPN — ESCA Unidad Santo Tomás
% Fecha:        2026-10-15
% Descripción:  Laboratorio del Cap. 7 (catálogo §9.2, fila 7). Genera una red
%               social SINTÉTICA con comunidades: la gente se conecta mucho
%               dentro de su grupo (familia, escuela, afición) y poco con
%               otros grupos; unos pocos «puentes» unen los grupos.
%               Identifica a los candidatos a «influenciador» con
%               tres medidas de centralidad (grado, intermediación y
%               cercanía) y simula una cascada de adopción por umbral
%               (Granovetter, 1978): una persona adopta un producto cuando
%               al menos una fracción `umbral` de sus contactos ya lo adoptó.
%               Compara tres formas de elegir a las personas semilla:
%               las más centrales, las menos centrales y al azar (promedio
%               de 100 sorteos).
%               Datos SINTÉTICOS (rng(42)): la red no representa a ninguna
%               plataforma ni a ninguna persona real (§5.8 del prompt de
%               proyecto). Este MISMO script es el del libro y el de la
%               práctica «Recorrido del consumidor digital»: el estudiante
%               solo modifica la sección de parámetros, corre el script para
%               cada caso y compara.
% Toolboxes requeridas: ninguna (MATLAB base; usa graph, centrality y distances).
% Tiempo de ejecución esperado: < 10 s.

clc; clear; close all; rng(42);

%% ===================================================================
%  PARÁMETROS — ESTA ES LA ÚNICA SECCIÓN QUE EL ESTUDIANTE DEBE EDITAR
%  ===================================================================
nNodos = 60;           % número de personas en la red (30 a 100)
nComunidades = 3;      % grupos en que se reparte la gente (2 a 5)
pDentro = 0.20;        % prob. de que dos personas del mismo grupo se conozcan (0.05 a 0.50)
pEntre = 0.01;         % prob. de que dos personas de grupos distintos se conozcan (0 a 0.10)
nSemillas = 3;         % personas a las que se regala/muestra el producto (1 a 10)
umbral = 0.25;         % fracción de contactos que deben haber adoptado (0.05 a 0.90)
criterio = 1;          % medida para elegir semillas: 1 grado, 2 intermediación, 3 cercanía
% ===================================================================

assert(nNodos >= 6 * nComunidades, 'Cada grupo necesita al menos 6 personas: reduzcan nComunidades o aumenten nNodos.');
assert(nSemillas <= nNodos, 'nSemillas no puede pasar de nNodos.');

%% Datos — red sintética con comunidades (no editar)
% Cada persona pertenece a un grupo (bloques contiguos). Hay tres tipos de conexión:
%  (1) un «esqueleto» fijo: cada persona conoce a la siguiente de su grupo;
%  (2) un puente fijo entre grupos vecinos: la última persona de cada grupo
%      conoce a la primera del siguiente;
%  (3) conexiones al azar: dos personas se conocen con probabilidad pDentro
%      (mismo grupo) o pEntre (grupos distintos).
n = nNodos;
grupo = ceil((1:n)' * nComunidades / n);
A = false(n);
for i = 1:n-1
    if grupo(i) == grupo(i+1), A(i, i+1) = true; end
end
for g = 1:nComunidades-1
    ultimo = find(grupo == g, 1, 'last');
    A(ultimo, ultimo + 1) = true;
end
for j = 2:n
    for i = 1:j-1
        if grupo(i) == grupo(j), p = pDentro; else, p = pEntre; end
        if rand() < p, A(i, j) = true; end
    end
end
A = A | A';
G = graph(A);

%% Procesamiento — centralidad
gradoNodo = degree(G);
% Se redondea a 9 decimales para que los empates entre personas simétricas no
% dependan de errores de redondeo del orden de 1e-16.
intermediacion = round(centrality(G, 'betweenness'), 9);
D = distances(G);
cercania = round((n - 1) ./ sum(D, 2), 9);  % inverso de la distancia media a los demás
medidas = [gradoNodo, intermediacion, cercania];
nombresMedidas = ["grado" "intermediación" "cercanía"];

%% Procesamiento — cascada de adopción por umbral
% Una persona adopta en cada ronda si la fracción de sus contactos que ya
% adoptó es >= umbral. Se repite hasta que nadie más adopta.
cascada = @(semillas) simularCascada(A, gradoNodo, semillas, umbral);

adopcionPorCriterio = zeros(1, 3);
rondasPorCriterio = zeros(1, 3);
adopcionPeriferica = zeros(1, 3);
semillasCentrales = cell(1, 3);
for c = 1:3
    [~, orden] = sort(medidas(:, c), 'descend');      % estable: los empates conservan el orden original
    semillasCentrales{c} = orden(1:nSemillas);
    [adopt, rondas] = cascada(semillasCentrales{c});
    adopcionPorCriterio(c) = 100 * mean(adopt);
    rondasPorCriterio(c) = rondas;
    adoptP = cascada(orden(end-nSemillas+1:end));
    adopcionPeriferica(c) = 100 * mean(adoptP);
end

% Semillas al azar: 100 sorteos con el mismo generador (rng(42) ya consumido por la red)
nSorteos = 100;
adopcionAzar = zeros(1, nSorteos);
for s = 1:nSorteos
    [~, ordenAzar] = sort(rand(n, 1));
    adoptA = cascada(ordenAzar(1:nSemillas));
    adopcionAzar(s) = 100 * mean(adoptA);
end
promedioAzar = mean(adopcionAzar);

[adoptElegido, rondasElegido, adopcionPorRonda] = simularCascada(A, gradoNodo, semillasCentrales{criterio}, umbral);
adopcionFinal = 100 * mean(adoptElegido);
[~, mejorCriterio] = max(adopcionPorCriterio);       % empates: gana el primero

%% Resultados impresos
fprintf('=== Resultados con nNodos=%d, nComunidades=%d, pDentro=%.2f, pEntre=%.2f, nSemillas=%d, umbral=%.2f, criterio=%s ===\n', ...
    nNodos, nComunidades, pDentro, pEntre, nSemillas, umbral, nombresMedidas(criterio));
fprintf('\nRed: %d personas, %d conexiones. Grado: máximo=%d, promedio=%.2f\n', ...
    n, numedges(G), max(gradoNodo), mean(gradoNodo));
[~, ordenGrado] = sort(gradoNodo, 'descend');
[~, ordenInter] = sort(intermediacion, 'descend');
fprintf('Las 5 personas con más conexiones (grado):         %s\n', num2str(ordenGrado(1:min(5,n))'));
fprintf('Las 5 personas con más intermediación:             %s\n', num2str(ordenInter(1:min(5,n))'));
nCoinciden = numel(intersect(ordenGrado(1:min(5,n)), ordenInter(1:min(5,n))));
fprintf('Coinciden en las dos listas: %d de 5\n', nCoinciden);
fprintf('\nCascada por umbral (%.0f%% de los contactos), %d semillas:\n', 100*umbral, nSemillas);
fprintf('  %-20s %12s %12s\n', 'Criterio de semillas', 'Centrales', 'Periféricas');
for c = 1:3
    fprintf('  %-20s %11.1f%% %11.1f%%\n', nombresMedidas(c), adopcionPorCriterio(c), adopcionPeriferica(c));
end
fprintf('  %-20s %11.1f%% (promedio de %d sorteos)\n', 'Al azar', promedioAzar, nSorteos);
fprintf('\nCon el criterio elegido (%s): adopción final %.1f%% en %d rondas\n', ...
    nombresMedidas(criterio), adopcionFinal, rondasElegido);
fprintf('Mejor criterio de los tres: %s\n', nombresMedidas(mejorCriterio));

%% Resultados y visualización — Figura 1: la red
colorGuinda = [0.42 0.12 0.23]; colorTeal = [0.16 0.49 0.51]; colorDorado = [0.72 0.59 0.35];
figure('Color', 'w', 'Position', [100 100 780 520]);
h = plot(G, 'Layout', 'force', 'EdgeColor', [0.75 0.75 0.75], 'NodeLabel', {});
h.MarkerSize = 4 + 14 * (intermediacion / max(intermediacion));
colores = repmat([0.72 0.72 0.72], n, 1);
colores(adoptElegido, :) = repmat(colorTeal, sum(adoptElegido), 1);
colores(semillasCentrales{criterio}, :) = repmat(colorGuinda, nSemillas, 1);
h.NodeColor = colores;
axis off;
title(sprintf('Red sintética: tamaño = intermediación; guinda = semillas (%s); verde azulado = adoptó', nombresMedidas(criterio)), 'FontSize', 10);

if ~exist('../../figuras/matlab', 'dir')
    mkdir('../../figuras/matlab');
end
exportgraphics(gcf, '../../figuras/matlab/cap08_red_influencia.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap08_red_influencia.png', 'Resolution', 300);

%% Resultados y visualización — Figura 2: seguidores no es influencia
figure('Color', 'w', 'Position', [100 100 900 420]);
subplot(1, 2, 1);
scatter(gradoNodo, intermediacion, 36, [0.72 0.72 0.72], 'filled', 'MarkerEdgeColor', [0.4 0.4 0.4]); hold on;
scatter(gradoNodo(semillasCentrales{criterio}), intermediacion(semillasCentrales{criterio}), 70, colorGuinda, 'filled');
hold off; grid on;
xlabel('Conexiones (grado)'); ylabel('Intermediación');
title('Conexiones frente a intermediación');
legend('Personas', 'Semillas elegidas', 'Location', 'northwest');

subplot(1, 2, 2);
b = bar(1:4, [adopcionPorCriterio'; promedioAzar], 0.6, 'FaceColor', 'flat');
b.CData = [colorGuinda; colorGuinda; colorGuinda; 0.72 0.72 0.72];
set(gca, 'XTick', 1:4, 'XTickLabel', [nombresMedidas "al azar"]);
ylabel('% de la red que adopta'); ylim([0 105]); grid on;
title(sprintf('Adopción final con %d semillas', nSemillas));
sgtitle('¿Quién influye de verdad? -- red sintética');

exportgraphics(gcf, '../../figuras/matlab/cap08_seguidores_vs_influencia.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap08_seguidores_vs_influencia.png', 'Resolution', 300);

fprintf('\nFiguras exportadas a figuras/matlab/cap08_{red_influencia,seguidores_vs_influencia}.{pdf,png}\n');

%% Funciones locales
function [adopt, rondas, porRonda] = simularCascada(A, grado, semillas, umbral)
    n = size(A, 1);
    adopt = false(n, 1);
    adopt(semillas) = true;
    rondas = 0;
    porRonda = mean(adopt);
    for ronda = 1:200
        fraccion = (double(A) * double(adopt)) ./ grado;
        nuevos = ~adopt & fraccion >= umbral;
        if ~any(nuevos), break; end
        adopt(nuevos) = true;
        rondas = ronda;
        porRonda(end+1) = mean(adopt); %#ok<AGROW>
    end
end
