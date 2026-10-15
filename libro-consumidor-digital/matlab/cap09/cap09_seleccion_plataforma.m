%% cap09_seleccion_plataforma.m — Selección de una herramienta de análisis con AHP y TOPSIS
% Título:       ¿Qué herramienta conviene para analizar el recorrido? AHP + TOPSIS
% Autor:        Prof. D.Sc. Barsekh-Onji Aboud
% Institución:  IPN — ESCA Unidad Santo Tomás
% Fecha:        2026-10-15
% Descripción:  Laboratorio del Cap. 8 (catálogo §9.2, fila 8). Un equipo debe
%               elegir entre cinco TIPOS de herramienta para analizar el
%               recorrido del consumidor. El script (1) obtiene los pesos de
%               cuatro criterios a partir de comparaciones por pares con el
%               Proceso Analítico Jerárquico, AHP (Saaty, 1977) y revisa si
%               los juicios son consistentes; (2) ordena las alternativas con
%               TOPSIS (Hwang y Yoon, 1981), que prefiere la más cercana a la
%               solución ideal y más lejana de la peor; y (3) barre el peso del
%               costo para ver en qué punto cambia la herramienta elegida.
%               Los tipos de herramienta y sus calificaciones son SINTÉTICOS e
%               ilustrativos: no evalúan ninguna marca ni producto real (§5.8
%               del prompt de proyecto) y envejecerían rápido si lo hicieran.
%               No hay números aleatorios. Este MISMO script es el del libro y
%               el de la práctica «Recorrido del consumidor digital»: el
%               estudiante solo modifica la sección de parámetros, corre el
%               script para cada caso y compara.
% Toolboxes requeridas: ninguna (MATLAB base).
% Tiempo de ejecución esperado: < 5 s.

clc; clear; close all; rng(42);

%% ===================================================================
%  PARÁMETROS — ESTA ES LA ÚNICA SECCIÓN QUE EL ESTUDIANTE DEBE EDITAR
%  ===================================================================
% Cada juicio dice cuántas veces es más importante el primer criterio que el
% segundo (escala de Saaty: 1 igual, 3 moderadamente, 5 fuertemente, 7 muy
% fuertemente, 9 extremadamente; valores menores que 1 invierten la
% comparación: 1/3 = 0.333 significa que el primero es 3 veces MENOS importante).
cobVsPriv = 2;         % cobertura del recorrido frente a privacidad (1/9 a 9)
cobVsInterop = 3;      % cobertura frente a interoperabilidad
cobVsCosto = 3;        % cobertura frente a costo
privVsInterop = 2;     % privacidad frente a interoperabilidad
privVsCosto = 2;       % privacidad frente a costo
interopVsCosto = 1;    % interoperabilidad frente a costo
% ===================================================================

juicios = [cobVsPriv cobVsInterop cobVsCosto privVsInterop privVsCosto interopVsCosto];
assert(all(juicios >= 1/9 - 1e-9 & juicios <= 9), 'Cada juicio debe estar entre 1/9 y 9.');

%% Datos — herramientas de análisis (no editar)
alternativas = ["Analítica web básica" "Mapas de calor y sesiones" "Analítica de embudo" ...
                "Plataforma de datos de clientes" "Suite todo en uno"];
criterios = ["Cobertura" "Privacidad" "Interoperabilidad" "Costo"];
%               cobertura  privacidad  interoper.  costo
%               (1 a 10)   (1 a 10)    (1 a 10)    (miles de MXN al año)
matrizDecision = [ 6          5           8           20     % Analítica web básica
                   5          4           5           60     % Mapas de calor y sesiones
                   8          6           7          180     % Analítica de embudo
                   9          8           9          600     % Plataforma de datos de clientes
                   7          7           4          350 ];  % Suite todo en uno
esCosto = [false false false true];
nAlt = size(matrizDecision, 1);
nCrit = numel(criterios);

%% Procesamiento — AHP: pesos a partir de comparaciones por pares
A = eye(nCrit);
A(1,2) = cobVsPriv;     A(1,3) = cobVsInterop;   A(1,4) = cobVsCosto;
A(2,3) = privVsInterop; A(2,4) = privVsCosto;
A(3,4) = interopVsCosto;
for i = 1:nCrit
    for j = i+1:nCrit
        A(j,i) = 1 / A(i,j);                 % recíproca: lo que A pesa sobre B, B lo pesa al revés
    end
end
[V, D] = eig(A);
[lambdaMax, k] = max(real(diag(D)));         % el valor propio principal
pesosAHP = abs(real(V(:, k)))';
pesosAHP = pesosAHP / sum(pesosAHP);         % pesos que suman 1
indiceConsistencia = (lambdaMax - nCrit) / (nCrit - 1);
indiceAleatorio = 0.90;                      % valor de Saaty para matrices de 4 x 4
razonConsistencia = indiceConsistencia / indiceAleatorio;
esConsistente = razonConsistencia < 0.10;

%% Procesamiento — TOPSIS
[cercaniaAHP, ordenAHP] = topsis(matrizDecision, pesosAHP, esCosto);
pesosIguales = ones(1, nCrit) / nCrit;
[cercaniaIguales, ordenIguales] = topsis(matrizDecision, pesosIguales, esCosto);
ganadorAHP = ordenAHP(1);
ganadorIguales = ordenIguales(1);

%% Procesamiento — barrido del peso del costo (los otros pesos conservan sus proporciones)
rejilla = 0:0.01:1;
resto = pesosAHP(1:3) / sum(pesosAHP(1:3));
ganadorBarrido = zeros(size(rejilla));
for i = 1:numel(rejilla)
    w = [(1 - rejilla(i)) * resto, rejilla(i)];
    cercaniaB = topsis(matrizDecision, w, esCosto);
    [~, ganadorBarrido(i)] = max(cercaniaB);
end
nCambios = sum(diff(ganadorBarrido) ~= 0);

%% Resultados impresos
fprintf('=== Resultados con juicios [%.3g %.3g %.3g %.3g %.3g %.3g] ===\n', juicios);
fprintf('\nAHP — pesos de los criterios:\n');
for c = 1:nCrit
    fprintf('  %-18s %.3f\n', criterios(c), pesosAHP(c));
end
fprintf('  lambda máximo = %.3f, índice de consistencia = %.4f, razón de consistencia = %.3f\n', ...
    lambdaMax, indiceConsistencia, razonConsistencia);
if esConsistente
    fprintf('  Los juicios son consistentes (razón < 0.10).\n');
else
    fprintf('  Los juicios NO son consistentes (razón >= 0.10): revisen las comparaciones antes de confiar en los pesos.\n');
end
fprintf('\nTOPSIS con los pesos de AHP (más cerca de 1 = mejor):\n');
for i = 1:nAlt
    fprintf('  %d. %-32s %.3f\n', i, alternativas(ordenAHP(i)), cercaniaAHP(ordenAHP(i)));
end
fprintf('  Elige: %s\n', alternativas(ganadorAHP));
fprintf('\nTOPSIS con pesos iguales (ignora los juicios):\n');
fprintf('  Elige: %s\n', alternativas(ganadorIguales));
if ganadorAHP == ganadorIguales
    fprintf('  Coincide con la elección con pesos AHP.\n');
else
    fprintf('  NO coincide: los juicios sobre la importancia de los criterios cambian la elección.\n');
end
fprintf('\nBarrido del peso del costo (0 a 1): el ganador cambia %d vez(veces)\n', nCambios);
inicio = 1;
for i = 2:numel(rejilla) + 1
    if i == numel(rejilla) + 1 || ganadorBarrido(i) ~= ganadorBarrido(inicio)
        fprintf('  %-32s de %.2f a %.2f\n', alternativas(ganadorBarrido(inicio)), rejilla(inicio), rejilla(i-1));
        inicio = i;
    end
end

%% Resultados y visualización — Figura 1: pesos AHP y cercanía TOPSIS
colorGuinda = [0.42 0.12 0.23]; colorTeal = [0.16 0.49 0.51]; colorDorado = [0.72 0.59 0.35];
figure('Color', 'w', 'Position', [100 100 900 420]);
subplot(1, 2, 1);
b1 = bar(pesosAHP, 0.6, 'FaceColor', colorTeal);
set(gca, 'XTickLabel', criterios, 'XTickLabelRotation', 20); ylabel('Peso (suma 1)'); grid on;
title(sprintf('Pesos AHP (razón de consistencia = %.3f)', razonConsistencia));
text(1:nCrit, pesosAHP + 0.02, compose('%.2f', pesosAHP), 'HorizontalAlignment', 'center');
ylim([0 max(pesosAHP) * 1.2]);

subplot(1, 2, 2);
b2 = bar(1:nAlt, [cercaniaAHP cercaniaIguales], 0.8);
b2(1).FaceColor = colorGuinda; b2(2).FaceColor = [0.72 0.72 0.72];
set(gca, 'XTick', 1:nAlt, 'XTickLabel', {'Web básica', 'Mapas calor', 'Embudo', 'CDP', 'Suite'}, 'XTickLabelRotation', 20);
ylabel('Cercanía a la solución ideal'); grid on; ylim([0 1]);
legend('Pesos AHP', 'Pesos iguales', 'Location', 'northeast');
title('TOPSIS');
sgtitle('Selección de herramienta: AHP + TOPSIS -- datos sintéticos');

if ~exist('../../figuras/matlab', 'dir')
    mkdir('../../figuras/matlab');
end
exportgraphics(gcf, '../../figuras/matlab/cap09_ahp_topsis.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap09_ahp_topsis.png', 'Resolution', 300);

%% Resultados y visualización — Figura 2: sensibilidad al peso del costo
figure('Color', 'w', 'Position', [100 100 780 420]);
hold on;
cercaniaBarrido = zeros(numel(rejilla), nAlt);
for i = 1:numel(rejilla)
    w = [(1 - rejilla(i)) * resto, rejilla(i)];
    cercaniaBarrido(i, :) = topsis(matrizDecision, w, esCosto)';
end
colores = lines(nAlt);
for j = 1:nAlt
    plot(rejilla, cercaniaBarrido(:, j), 'Color', colores(j, :), 'LineWidth', 1.8);
end
xline(pesosAHP(4), 'k:', 'Peso AHP del costo', 'LabelVerticalAlignment', 'bottom');
hold off; grid on;
xlabel('Peso del costo (los demás pesos conservan sus proporciones)');
ylabel('Cercanía TOPSIS');
title('¿Cuándo cambia la herramienta elegida? -- datos sintéticos');
legend({'Web básica', 'Mapas calor', 'Embudo', 'CDP', 'Suite'}, 'Location', 'eastoutside');

exportgraphics(gcf, '../../figuras/matlab/cap09_sensibilidad_costo.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap09_sensibilidad_costo.png', 'Resolution', 300);

fprintf('\nFiguras exportadas a figuras/matlab/cap09_{ahp_topsis,sensibilidad_costo}.{pdf,png}\n');

%% Funciones locales
function [cercania, orden] = topsis(X, w, esCosto)
    % TOPSIS: 1) normaliza cada columna por su norma euclidiana; 2) pondera;
    % 3) toma la mejor y la peor solución de cada criterio (invertidas en los
    % criterios de costo); 4) mide la cercanía relativa a la solución ideal.
    R = X ./ sqrt(sum(X.^2, 1));
    Vp = R .* w;
    mejor = max(Vp, [], 1); peor = min(Vp, [], 1);
    mejor(esCosto) = min(Vp(:, esCosto), [], 1);
    peor(esCosto) = max(Vp(:, esCosto), [], 1);
    dMejor = sqrt(sum((Vp - mejor).^2, 2));
    dPeor = sqrt(sum((Vp - peor).^2, 2));
    cercania = dPeor ./ (dMejor + dPeor);
    [~, orden] = sort(cercania, 'descend');
end
