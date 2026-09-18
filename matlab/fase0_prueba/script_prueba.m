%% script_prueba.m — Verificación de andamiaje MATLAB (Fase 0)
% Título:       Difusión de adopción de un canal digital (modelo de Bass) — prueba
% Autor:        Prof. D.Sc. Barsekh-Onji Aboud
% Institución:  IPN — ESCA Unidad Santo Tomás
% Fecha:        2026-09-18
% Descripción:  Script de verificación del flujo de trabajo MATLAB -> figura
%               vectorial -> LaTeX para el Cap. 1 (catálogo §9.2). Genera una
%               curva de adopción con el modelo de Bass usando parámetros
%               ILUSTRATIVOS (no calibrados con datos reales de mercado).
% Toolboxes requeridas: ninguna (MATLAB base).
% Tiempo de ejecución esperado: < 5 s.

clc; clear; close all; rng(42);

%% Parámetros (ilustrativos, no calibrados; ver \datoPendiente en el texto)
p = 0.03;     % coeficiente de innovación
q = 0.38;     % coeficiente de imitación
m = 1;        % mercado potencial normalizado
tFinal = 20;  % periodos (p. ej., trimestres)

%% Datos: vector de tiempo
t = (0:0.05:tFinal)';

%% Procesamiento: solución cerrada del modelo de Bass F(t)
F = (1 - exp(-(p+q).*t)) ./ (1 + (q/p).*exp(-(p+q).*t));
adopcionAcumulada = m .* F;
tasaAdopcion = [0; diff(adopcionAcumulada)] ./ [1; diff(t)];

fprintf('Adopción acumulada al periodo %d: %.2f%% del mercado potencial\n', ...
    tFinal, 100*adopcionAcumulada(end));

%% Resultados y visualización
figure('Color', 'w', 'Position', [100 100 700 420]);

subplot(1,2,1);
plot(t, adopcionAcumulada, 'LineWidth', 2, 'Color', [0.42 0.12 0.23]);
grid on;
xlabel('Periodo (trimestre)', 'Interpreter', 'latex');
ylabel('Adopción acumulada (fracción de $m$)', 'Interpreter', 'latex');
title('Adopción acumulada', 'Interpreter', 'latex');

subplot(1,2,2);
plot(t, tasaAdopcion, 'LineWidth', 2, 'Color', [0.16 0.49 0.51]);
grid on;
xlabel('Periodo (trimestre)', 'Interpreter', 'latex');
ylabel('Tasa de adopción', 'Interpreter', 'latex');
title('Tasa de adopción', 'Interpreter', 'latex');

% Nota de convención: se escribe el acento directamente en UTF-8 (é, á) y NO
% con comandos LaTeX de acento (\'e); estos últimos no se interpretan bien en
% el renderer de MATLAB. Se usa el interprete 'tex' por defecto (no 'latex')
% para el titulo compuesto para evitar truncamientos observados en Fase 0.
sgtitle('Modelo de Bass -- datos sintéticos, parámetros ilustrativos (p=0.03, q=0.38)');

%% Exportación (vectorial para el libro, PNG 300 dpi para Beamer)
if ~exist('../../figuras/matlab', 'dir')
    mkdir('../../figuras/matlab');
end
exportgraphics(gcf, '../../figuras/matlab/fase0_bass_prueba.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/fase0_bass_prueba.png', 'Resolution', 300);

fprintf('Figura exportada a figuras/matlab/fase0_bass_prueba.{pdf,png}\n');
