%% cap07_journey_markov.m — El customer journey como cadena de Markov
% Título:       Recorrido del consumidor digital: etapas, tiempo a conversión y atribución
% Autor:        Prof. D.Sc. Barsekh-Onji Aboud
% Institución:  IPN — ESCA Unidad Santo Tomás
% Fecha:        2026-10-15
% Descripción:  Laboratorio del Cap. 6 (catálogo §9.2, fila 6). Dos bloques:
%               (1) El recorrido por las etapas (Atención, Interés, Deseo)
%               como cadena de Markov con dos estados absorbentes
%               (Conversión y Abandono). Calcula la probabilidad de convertir,
%               el número esperado de contactos hasta convertir y lo compara
%               con un embudo lineal (sin retrocesos).
%               (2) La atribución de las conversiones entre cuatro canales con
%               tres modelos: último clic, primer clic y efecto de remoción
%               de la cadena de Markov (Anderl et al., 2016).
%               Todos los números son SINTÉTICOS e ilustrativos: no son tasas
%               de ninguna marca ni mercado real (§5.8 del prompt de
%               proyecto). No hay números aleatorios: el cálculo es exacto y
%               el resultado es idéntico en cada corrida. Este MISMO script es
%               el del libro y el de la práctica «Recorrido del consumidor
%               digital»: el estudiante solo modifica la sección de
%               parámetros, corre el script para cada caso y compara.
% Toolboxes requeridas: ninguna (MATLAB base).
% Tiempo de ejecución esperado: < 5 s.

clc; clear; close all; rng(42);

%% ===================================================================
%  PARÁMETROS — ESTA ES LA ÚNICA SECCIÓN QUE EL ESTUDIANTE DEBE EDITAR
%  ===================================================================
pAvanzar = 0.30;       % prob. por contacto de pasar a la etapa siguiente (> 0)
pRetroceder = 0.10;    % prob. por contacto de volver a la etapa anterior ("messy middle")
pAbandonar = 0.15;     % prob. por contacto de abandonar el recorrido
inicioRedes = 0.40;    % fracción de recorridos que empiezan en redes sociales (0 a 1)
convBusqueda = 0.30;   % prob. de convertir en un contacto de búsqueda (0 a 0.60)
convDirecto = 0.35;    % prob. de convertir en un contacto directo (0 a 0.80)
% ===================================================================

assert(pAvanzar > 0, 'pAvanzar debe ser mayor que 0.');
assert(pAvanzar + pRetroceder + pAbandonar <= 1, 'pAvanzar + pRetroceder + pAbandonar no puede pasar de 1.');

%% Procesamiento — Bloque 1: cadena de Markov de las etapas
etapas = ["Atención" "Interés" "Deseo"];
nPasosMax = 30;                                       % horizonte de la curva de tiempo a conversión
[pConv, pasosEsperados, pasosConv, cumReal, Q, R] = cadenaEtapas(pAvanzar, pRetroceder, pAbandonar, nPasosMax);
[pConvLineal, pasosLineal, pasosConvLineal, cumLineal] = cadenaEtapas(pAvanzar, 0, pAbandonar, nPasosMax);
% Contacto en que se alcanza la mitad de las conversiones que habrá en total
kMediana = find(cumReal >= 0.5 * pConv, 1) - 1;
kMedianaLineal = find(cumLineal >= 0.5 * pConvLineal, 1) - 1;

%% Procesamiento — Bloque 2: atribución entre canales
canales = ["Búsqueda" "Redes sociales" "Correo" "Directo"];
% Probabilidades de transición entre canales (filas = canal de origen).
% Lo que falta para sumar 1 en cada fila (conversión incluida) es abandono.
QC = [0.10 0.05 0.10 0.15      % desde Búsqueda
      0.30 0.15 0.05 0.05      % desde Redes sociales
      0.15 0.05 0.05 0.25      % desde Correo
      0.05 0.00 0.05 0.10];    % desde Directo
rC = [convBusqueda; 0.02; 0.10; convDirecto];          % prob. de convertir desde cada canal
assert(all(sum(QC, 2) + rC <= 1 + 1e-12), 'convBusqueda o convDirecto demasiado altos: la fila pasa de 1.');
baseInicio = [0.35 0.40 0.10 0.15];                     % reparto inicial de referencia
resto = baseInicio([1 3 4]) / sum(baseInicio([1 3 4]));
pi0 = zeros(1, 4);
pi0(2) = inicioRedes;
pi0([1 3 4]) = (1 - inicioRedes) * resto;               % el resto se reparte en proporción

pConvCanales = conversionDesde(pi0, QC, rC, true(1, 4));
visitas = pi0 / (eye(4) - QC);                          % visitas esperadas a cada canal
ultimoClic = (visitas .* rC') / pConvCanales;           % fracción de conversiones con ese canal al final
valorDesdeCanal = ((eye(4) - QC) \ rC)';                % prob. de convertir si se empieza en cada canal
primerClic = (pi0 .* valorDesdeCanal) / pConvCanales;   % fracción de conversiones que empezaron ahí
efectoRemocion = zeros(1, 4);
for c = 1:4
    mantener = true(1, 4); mantener(c) = false;
    efectoRemocion(c) = 1 - conversionDesde(pi0, QC, rC, mantener) / pConvCanales;
end
atribucionRemocion = efectoRemocion / sum(efectoRemocion);   % normalizado: suma 100 %

%% Resultados impresos
fprintf('=== Resultados con pAvanzar=%.2f, pRetroceder=%.2f, pAbandonar=%.2f, inicioRedes=%.2f, convBusqueda=%.2f, convDirecto=%.2f ===\n', ...
    pAvanzar, pRetroceder, pAbandonar, inicioRedes, convBusqueda, convDirecto);
fprintf('\nBloque 1 — Recorrido por etapas (empieza en Atención):\n');
fprintf('  Probabilidad de convertir: %.1f%% (embudo lineal sin retrocesos: %.1f%%)\n', 100*pConv, 100*pConvLineal);
fprintf('  Contactos esperados hasta salir del recorrido: %.2f (lineal: %.2f)\n', pasosEsperados, pasosLineal);
fprintf('  Contactos esperados hasta convertir, entre quienes convierten: %.2f (lineal: %.2f)\n', pasosConv, pasosConvLineal);
fprintf('  Contacto en que se alcanza la mitad de las conversiones: %d (lineal: %d)\n', kMediana, kMedianaLineal);
fprintf('  Recorridos convertidos en 10 contactos o menos: %.1f%% (lineal: %.1f%%)\n', 100*cumReal(11), 100*cumLineal(11));
fprintf('\nBloque 2 — Atribución de las conversiones entre canales (probabilidad de convertir: %.1f%%):\n', 100*pConvCanales);
fprintf('  %-15s %10s %10s %12s\n', 'Canal', 'Ultimo clic', 'Primer clic', 'Remocion');
for c = 1:4
    fprintf('  %-15s %9.1f%% %9.1f%% %11.1f%%\n', canales(c), 100*ultimoClic(c), 100*primerClic(c), 100*atribucionRemocion(c));
end
[~, cMax] = max(atribucionRemocion - ultimoClic);
fprintf('  El canal más subestimado por el último clic es: %s\n', canales(cMax));

%% Resultados y visualización — Figura 1: matriz de transición y tiempo a conversión
colorGuinda = [0.42 0.12 0.23]; colorTeal = [0.16 0.49 0.51]; colorDorado = [0.72 0.59 0.35];
figure('Color', 'w', 'Position', [100 100 900 420]);
subplot(1, 2, 1);
P = [Q R; zeros(2, 3) eye(2)];                         % matriz de transición completa (5 x 5)
nombresEstados = [etapas "Conversión" "Abandono"];
imagesc(P, [0 max(0.5, max(P(:)))]);
colormap(gca, [linspace(1, 0.42, 64)' linspace(0.96, 0.12, 64)' linspace(0.97, 0.23, 64)']);
for i = 1:5
    for j = 1:5
        if P(i, j) > 0
            if P(i, j) > 0.5, colorTexto = 'w'; else, colorTexto = 'k'; end
            text(j, i, sprintf('%.2f', P(i, j)), 'HorizontalAlignment', 'center', 'Color', colorTexto, 'FontSize', 9);
        end
    end
end
set(gca, 'XTick', 1:5, 'XTickLabel', nombresEstados, 'YTick', 1:5, 'YTickLabel', nombresEstados, 'XTickLabelRotation', 30);
xlabel('Hacia'); ylabel('Desde');
title('Matriz de transición por contacto');

subplot(1, 2, 2);
plot(0:nPasosMax, 100*cumReal, 'Color', colorGuinda, 'LineWidth', 2.4); hold on;
plot(0:nPasosMax, 100*cumLineal, '--', 'Color', colorTeal, 'LineWidth', 2.0);
yline(100*pConv, ':', 'Color', colorGuinda);
hold off; grid on;
xlabel('Contactos'); ylabel('% acumulado de recorridos convertidos');
title('Tiempo a conversión');
legend('Con retrocesos', 'Embudo lineal', 'Location', 'southeast');
sgtitle('Recorrido por etapas como cadena de Markov -- datos sintéticos');

if ~exist('../../figuras/matlab', 'dir')
    mkdir('../../figuras/matlab');
end
exportgraphics(gcf, '../../figuras/matlab/cap07_markov_etapas.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap07_markov_etapas.png', 'Resolution', 300);

%% Resultados y visualización — Figura 2: tres modelos de atribución
figure('Color', 'w', 'Position', [100 100 780 420]);
b = bar(100 * [ultimoClic' primerClic' atribucionRemocion'], 0.8);
b(1).FaceColor = [0.72 0.72 0.72]; b(2).FaceColor = colorDorado; b(3).FaceColor = colorGuinda;
grid on;
set(gca, 'XTickLabel', canales);
ylabel('% de las conversiones atribuido');
legend('Último clic', 'Primer clic', 'Efecto de remoción (Markov)', 'Location', 'northeast');
title('¿Qué canal se lleva el crédito? Tres modelos de atribución -- datos sintéticos');

exportgraphics(gcf, '../../figuras/matlab/cap07_atribucion.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap07_atribucion.png', 'Resolution', 300);

fprintf('\nFiguras exportadas a figuras/matlab/cap07_{markov_etapas,atribucion}.{pdf,png}\n');

%% Funciones locales
function [pConv, pasos, pasosConv, cum, Q, R] = cadenaEtapas(pa, pr, pb, K)
    % Estados transitorios: Atención, Interés, Deseo. Absorbentes: Conversión, Abandono.
    Q = zeros(3); R = zeros(3, 2);
    for i = 1:3
        if i < 3, Q(i, i+1) = pa; else, R(i, 1) = pa; end
        if i > 1, Q(i, i-1) = pr; end
        R(i, 2) = pb;
        Q(i, i) = 1 - pa - pb - pr * (i > 1);          % se queda en la etapa
    end
    N = inv(eye(3) - Q);                               % matriz fundamental: visitas esperadas
    B = N * R;                                         % prob. de terminar en cada absorbente
    t = N * ones(3, 1);                                % contactos esperados hasta absorberse
    pConv = B(1, 1);
    pasos = t(1);
    pasosConv = (N * N * R(:, 1));                     % E[T * 1{conversión}]
    pasosConv = pasosConv(1) / pConv;
    cum = zeros(1, K + 1);                             % P(convertido en k contactos o menos)
    v = [1 0 0];
    for k = 1:K
        cum(k + 1) = cum(k) + v * R(:, 1);
        v = v * Q;
    end
end

function p = conversionDesde(pi0, QC, rC, mantener)
    % Probabilidad de convertir si solo existen los canales marcados en "mantener":
    % quien llega a un canal eliminado se pierde (va a «nulo»).
    k = find(mantener);
    N = inv(eye(numel(k)) - QC(k, k));
    p = pi0(k) * N * rC(k);
end
