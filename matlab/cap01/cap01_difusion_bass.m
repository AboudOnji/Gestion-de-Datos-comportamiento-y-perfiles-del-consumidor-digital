%% cap01_difusion_bass.m — Difusión de la adopción de un canal digital
% Título:       Modelo de Bass aplicado a la adopción de un canal digital
% Autor:        Dr. Aboud Barsekh-Onji
% Institución:  IPN — ESCA Unidad Santo Tomás
% Fecha:        2026-09-18
% Descripción:  Laboratorio del Cap. 1 (catálogo §9.2, fila 1). El modelo de
%               Bass describe la velocidad de adopción de una innovación como
%               la suma de un efecto de innovación (adopción independiente de
%               otros adoptantes) y un efecto de imitación (adopción por
%               contagio social). Aquí se usa para ilustrar, con parámetros
%               DIDÁCTICOS (no calibrados con datos reales de mercado — así
%               se decidió en Fase 1, ver docs/dudas.md pregunta 4), cómo la
%               proporción relativa de innovación e imitación cambia la forma
%               de la curva de adopción de un canal digital.
% Referencia conceptual: Bass, F.M. (1969). A New Product Growth Model for
%               Consumer Durables. Management Science, 15(5), 215-227.
% Toolboxes requeridas: ninguna (MATLAB base).
% Tiempo de ejecución esperado: < 5 s.

clc; clear; close all; rng(42);

%% Parámetros — DATOS DIDÁCTICOS, no calibrados con datos reales de mercado
p = 0.03;      % coeficiente de innovación (adopción "espontánea")
q = 0.38;      % coeficiente de imitación (adopción por contagio social)
m = 1;         % mercado potencial, normalizado a 1 (100% del mercado objetivo)
tFinal = 20;   % periodos (p. ej., trimestres desde el lanzamiento)

%% Datos: vector de tiempo
t = (0:0.05:tFinal)';

%% Procesamiento: solución cerrada del modelo de Bass F(t)
% F(t) = fracción del mercado potencial que ya adoptó al tiempo t
F = (1 - exp(-(p+q).*t)) ./ (1 + (q/p).*exp(-(p+q).*t));
adopcionAcumulada = m .* F;
tasaAdopcion = [0; diff(adopcionAcumulada)] ./ [1; diff(t)];

% Tiempo del pico de adopción (máxima velocidad de adopción), forma cerrada:
tPico = log(q/p) / (p+q);
fprintf('Parámetros didácticos: p=%.3f (innovación), q=%.3f (imitación)\n', p, q);
fprintf('Pico de adopción en t* = %.2f periodos (%.1f%% del mercado adoptado)\n', ...
    tPico, 100*interp1(t, adopcionAcumulada, tPico));
fprintf('Adopción acumulada al periodo %d: %.1f%% del mercado potencial\n', ...
    tFinal, 100*adopcionAcumulada(end));

%% Resultados y visualización — Figura 1: curva base
figure('Color', 'w', 'Position', [100 100 700 420]);

subplot(1,2,1);
plot(t, adopcionAcumulada, 'LineWidth', 2, 'Color', [0.42 0.12 0.23]);
hold on;
plot(tPico, interp1(t, adopcionAcumulada, tPico), 'o', ...
    'MarkerSize', 7, 'MarkerFaceColor', [0.72 0.59 0.35], 'MarkerEdgeColor', 'k');
grid on;
xlabel('Periodo (trimestre)');
ylabel('Adopción acumulada (fracción de m)');
title('Adopción acumulada');
legend('F(t)', 'pico de adopción', 'Location', 'southeast');

subplot(1,2,2);
plot(t, tasaAdopcion, 'LineWidth', 2, 'Color', [0.16 0.49 0.51]);
grid on;
xlabel('Periodo (trimestre)');
ylabel('Tasa de adopción');
title('Tasa de adopción (dF/dt)');

sgtitle('Modelo de Bass -- datos didácticos (p=0.03, q=0.38)');

if ~exist('../../figuras/matlab', 'dir')
    mkdir('../../figuras/matlab');
end
exportgraphics(gcf, '../../figuras/matlab/cap01_bass_base.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap01_bass_base.png', 'Resolution', 300);

%% Resultados y visualización — Figura 2: sensibilidad a innovación vs. imitación
% Tres escenarios didácticos que ilustran cómo cambia la FORMA de la curva
% según predomine la innovación (adopción gradual) o la imitación (adopción
% explosiva tipo "efecto de red").
escenarios = struct( ...
    'nombre', {'Innovación domina', 'Balance', 'Imitación domina'}, ...
    'p',      {0.08, 0.03, 0.01}, ...
    'q',      {0.10, 0.38, 0.55}, ...
    'color',  {[0.72 0.59 0.35], [0.42 0.12 0.23], [0.16 0.49 0.51]});

figure('Color', 'w', 'Position', [100 100 620 420]);
hold on;
for i = 1:numel(escenarios)
    Fi = (1 - exp(-(escenarios(i).p+escenarios(i).q).*t)) ./ ...
         (1 + (escenarios(i).q/escenarios(i).p).*exp(-(escenarios(i).p+escenarios(i).q).*t));
    plot(t, Fi, 'LineWidth', 2, 'Color', escenarios(i).color, ...
        'DisplayName', sprintf('%s (p=%.2f, q=%.2f)', escenarios(i).nombre, ...
        escenarios(i).p, escenarios(i).q));
end
hold off;
grid on;
xlabel('Periodo (trimestre)');
ylabel('Adopción acumulada (fracción de m)');
title('Sensibilidad de la curva de adopción a innovación (p) vs. imitación (q)');
legend('Location', 'southeast');

exportgraphics(gcf, '../../figuras/matlab/cap01_bass_sensibilidad.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap01_bass_sensibilidad.png', 'Resolution', 300);

fprintf('Figuras exportadas a figuras/matlab/cap01_bass_{base,sensibilidad}.{pdf,png}\n');
