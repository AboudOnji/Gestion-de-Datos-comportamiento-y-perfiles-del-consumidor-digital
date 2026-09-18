%% cap01_difusion_bass.m — Difusión de la adopción de un canal digital
% Título:       Modelo de Bass aplicado a la adopción de un canal digital
% Autor:        Dr. Aboud Barsekh-Onji
% Institución:  IPN — ESCA Unidad Santo Tomás
% Fecha:        2026-09-18
% Descripción:  Laboratorio del Cap. 1 (catálogo §9.2, fila 1) y script de la
%               Práctica 1 de la Unidad I. El modelo de Bass describe la
%               velocidad de adopción de una innovación como la suma de un
%               efecto de innovación (adopción independiente de otros
%               adoptantes) y un efecto de imitación (adopción por contagio
%               social). Este MISMO script es el que se usa en el libro y en
%               la práctica: el estudiante solo modifica la sección de
%               parámetros, corre el script para cada caso que le pidan, y
%               compara los resultados impresos y las figuras entre corridas.
%               Parámetros DIDÁCTICOS (no calibrados con datos reales de
%               mercado — ver docs/dudas.md, pregunta 4).
% Referencia conceptual: Bass, F.M. (1969). A New Product Growth Model for
%               Consumer Durables. Management Science, 15(5), 215-227.
% Toolboxes requeridas: ninguna (MATLAB base).
% Tiempo de ejecución esperado: < 5 s.

clc; clear; close all; rng(42);

%% ===================================================================
%  PARÁMETROS — ESTA ES LA ÚNICA SECCIÓN QUE EL ESTUDIANTE DEBE EDITAR
%  Cambien estos cuatro valores para representar un caso distinto (otro
%  canal digital, otro escenario de innovación/imitación) y vuelvan a
%  correr el script completo (Run). No es necesario tocar nada más abajo.
%  ===================================================================
p = 0.03;      % coeficiente de innovación (adopción "espontánea")
q = 0.38;      % coeficiente de imitación (adopción por contagio social)
m = 1;         % mercado potencial, normalizado a 1 (100% del mercado objetivo)
tFinal = 20;   % periodos a simular (p. ej., trimestres desde el lanzamiento)
% ===================================================================

%% Datos: vector de tiempo (no editar)
t = (0:0.05:tFinal)';

%% Procesamiento: solución cerrada del modelo de Bass F(t)
% F(t) = fracción del mercado potencial que ya adoptó al tiempo t
F = (1 - exp(-(p+q).*t)) ./ (1 + (q/p).*exp(-(p+q).*t));
adopcionAcumulada = m .* F;
tasaAdopcion = [0; diff(adopcionAcumulada)] ./ [1; diff(t)];

% Tiempo del pico de adopción (máxima velocidad de adopción), forma cerrada:
tPico = log(q/p) / (p+q);
adopcionEnElPico = interp1(t, adopcionAcumulada, tPico);

%% Resultados: valores clave impresos (anótenlos para comparar entre corridas)
fprintf('=== Resultados con p=%.3f, q=%.3f, m=%.2f, tFinal=%d ===\n', p, q, m, tFinal);
fprintf('Pico de adopción en t* = %.2f periodos (%.1f%% del mercado adoptado)\n', ...
    tPico, 100*adopcionEnElPico);
fprintf('Adopción acumulada al final del periodo simulado: %.1f%% del mercado potencial\n', ...
    100*adopcionAcumulada(end));
fprintf('Tasa de adopción máxima: %.4f (fracción del mercado por periodo)\n', max(tasaAdopcion));

%% Visualización — Figura 1: adopción acumulada
figure('Color', 'w', 'Position', [100 100 560 420]);
plot(t, adopcionAcumulada, 'LineWidth', 2, 'Color', [0.42 0.12 0.23]);
hold on;
plot(tPico, adopcionEnElPico, 'o', 'MarkerSize', 8, ...
    'MarkerFaceColor', [0.72 0.59 0.35], 'MarkerEdgeColor', 'k');
hold off;
grid on;
xlabel('Periodo (trimestre)');
ylabel('Adopción acumulada (fracción de m)');
title(sprintf('Adopción acumulada (p=%.2f, q=%.2f)', p, q));
legend('F(t)', 'pico de adopción', 'Location', 'southeast');

if ~exist('../../figuras/matlab', 'dir')
    mkdir('../../figuras/matlab');
end
exportgraphics(gcf, '../../figuras/matlab/cap01_bass_acumulada.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap01_bass_acumulada.png', 'Resolution', 300);

%% Visualización — Figura 2: tasa de adopción
figure('Color', 'w', 'Position', [100 100 560 420]);
plot(t, tasaAdopcion, 'LineWidth', 2, 'Color', [0.16 0.49 0.51]);
hold on;
xline(tPico, ':k', 'pico');
hold off;
grid on;
xlabel('Periodo (trimestre)');
ylabel('Tasa de adopción (dF/dt)');
title(sprintf('Tasa de adopción (p=%.2f, q=%.2f)', p, q));

exportgraphics(gcf, '../../figuras/matlab/cap01_bass_tasa.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap01_bass_tasa.png', 'Resolution', 300);

fprintf('Figuras exportadas a figuras/matlab/cap01_bass_{acumulada,tasa}.{pdf,png}\n');
