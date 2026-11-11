%% cap09_tipos_y_modelos.m — Tipos de comportamiento de compra y actitud multiatributo
% Título:       Cuadrantes de Assael y modelo de acción razonada (Fishbein y Ajzen)
% Autor:        Prof. D.Sc. Barsekh-Onji Aboud
% Institución:  IPN — ESCA Unidad Santo Tomás
% Fecha:        2026-11-11
% Descripción:  Laboratorio del Cap. 9 (catálogo §9.2, filas 9 y 11).
%               PARTE A. Clasifica episodios de compra SINTÉTICOS en los
%               cuatro tipos de comportamiento (complejo, reductor de
%               disonancia, habitual y variado) según dos medidas: el
%               involucramiento y la diferencia percibida entre marcas.
%               Muestra que el tipo depende del episodio y de los umbrales,
%               no del producto.
%               PARTE B. Calcula la actitud multiatributo (suma de creencia
%               por evaluación), la norma subjetiva y la intención de compra
%               de tres marcas ficticias, y localiza el peso social en que
%               cambia la marca elegida.
%               Datos SINTÉTICOS (rng(42)): no representan a ninguna marca ni
%               persona real. Este MISMO script es el del libro y el de la
%               práctica «Análisis del comportamiento del consumidor»: el
%               estudiante solo modifica la sección de parámetros.
% Toolboxes requeridas: ninguna (MATLAB base).
% Tiempo de ejecución esperado: < 10 s.

clc; clear; close all; rng(42);

%% ===================================================================
%  PARÁMETROS — ESTA ES LA ÚNICA SECCIÓN QUE EL ESTUDIANTE DEBE EDITAR
%  ===================================================================
% --- Parte A: cuadrantes de Assael ---
episodiosPorCategoria = 40;   % episodios de compra simulados por categoría (10 a 200)
dispersion = 1.5;             % qué tan distintos son los episodios dentro de una categoría (0 a 3)
umbralInvolucramiento = 4;    % puntaje (escala 1 a 7) desde el cual el involucramiento es ALTO (2 a 6)
umbralDiferencias = 4;        % puntaje (escala 1 a 7) desde el cual las diferencias entre marcas son ALTAS (2 a 6)

% --- Parte B: acción razonada (tres marcas, cuatro atributos, tres referentes) ---
pesoActitud = 0.60;           % peso de la actitud en la intención (0 a 1; se reescala para que sume 1 con pesoNorma)
pesoNorma = 0.40;             % peso de la norma subjetiva en la intención (0 a 1)
% Evaluación de cada atributo: qué tan bueno es para la persona (-3 muy malo a +3 muy bueno)
evaluaciones = [3 2 2 1];     % precio accesible, batería, sonido, reseñas
% Creencia: qué tan probable es que la marca tenga el atributo (0 a 10); una fila por marca
creencias = [ 9 5 3 5 ;       % Marca A (económica)
              6 7 6 7 ;       % Marca B (equilibrada)
              2 8 9 8 ];      % Marca C (premium)
% Motivación para complacer a cada referente (0 a 10): amistades, creadora de contenido, familia
motivacion = [6 8 4];
% Creencia normativa: cuánto aprueba cada referente la marca (-3 la rechaza a +3 la aprueba); una fila por marca
normativas = [ 2  0  2 ;      % Marca A
               1  1  1 ;      % Marca B
               1  2  0 ];     % Marca C
% ===================================================================

assert(episodiosPorCategoria >= 1, 'episodiosPorCategoria debe ser al menos 1.');
assert(pesoActitud >= 0 && pesoNorma >= 0 && (pesoActitud + pesoNorma) > 0, ...
    'Los pesos deben ser no negativos y no ambos cero.');
assert(size(creencias,2) == numel(evaluaciones), 'creencias necesita una columna por atributo.');
assert(size(normativas,2) == numel(motivacion), 'normativas necesita una columna por referente.');
assert(size(creencias,1) == size(normativas,1), 'creencias y normativas necesitan la misma cantidad de marcas.');

%% Datos — categorías sintéticas (no editar)
% Cada categoría tiene un perfil típico (puntaje medio de involucramiento y de
% diferencias percibidas, escala 1 a 7). Cada episodio se aleja del perfil de
% forma uniforme en ±dispersion y se recorta a [1, 7]. Se consumen números
% uniformes con rand(), una sola llamada, en este orden: columna 1 =
% involucramiento, columna 2 = diferencias.
categorias = {'Laptop', 'Colchón', 'Detergente', 'Botana', 'Audífonos'};
perfil = [6.0 5.5 ;     % Laptop: mucho riesgo y marcas distintas
          5.5 2.5 ;     % Colchón: mucho riesgo, marcas parecidas
          2.0 2.0 ;     % Detergente: poco riesgo, marcas parecidas
          2.0 5.0 ;     % Botana: poco riesgo, sabores distintos
          4.8 4.6 ];    % Audífonos: cerca de los umbrales (caso frontera)
nCat = numel(categorias);
nEp = episodiosPorCategoria;
U = rand(nCat * nEp, 2);
cat_id = repelem((1:nCat)', nEp);
inv = min(7, max(1, perfil(cat_id,1) + dispersion * (2*U(:,1) - 1)));
dif = min(7, max(1, perfil(cat_id,2) + dispersion * (2*U(:,2) - 1)));

%% Parte A — clasificación en cuatro tipos
altoInv = inv >= umbralInvolucramiento;
altoDif = dif >= umbralDiferencias;
tipo = zeros(nCat*nEp, 1);
tipo( altoInv &  altoDif) = 1;   % complejo
tipo( altoInv & ~altoDif) = 2;   % reductor de disonancia
tipo(~altoInv & ~altoDif) = 3;   % habitual
tipo(~altoInv &  altoDif) = 4;   % variado
nombresTipo = {'Complejo', 'Reductor de disonancia', 'Habitual', 'Variado'};

conteo = zeros(nCat, 4);
for c = 1:nCat
    conteo(c,:) = histcounts(tipo(cat_id == c), 0.5:1:4.5);
end
porcentaje = 100 * conteo / nEp;
[maxPct, tipoDominante] = max(porcentaje, [], 2);

fprintf('\n=== PARTE A: tipos de comportamiento de compra ===\n');
fprintf('Umbrales: involucramiento >= %.1f ; diferencias >= %.1f ; %d episodios por categoría\n\n', ...
    umbralInvolucramiento, umbralDiferencias, nEp);
fprintf('%-11s %10s %22s %10s %10s | %-22s %s\n', 'Categoría', 'Complejo', 'Reductor disonancia', 'Habitual', 'Variado', 'Tipo dominante', '% que no coincide');
for c = 1:nCat
    fprintf('%-11s %9.1f%% %21.1f%% %9.1f%% %9.1f%% | %-22s %.1f%%\n', categorias{c}, ...
        porcentaje(c,1), porcentaje(c,2), porcentaje(c,3), porcentaje(c,4), ...
        nombresTipo{tipoDominante(c)}, 100 - maxPct(c));
end
fprintf('\nEpisodios en total: %d. Distribución global: ', nCat*nEp);
globalPct = 100 * histcounts(tipo, 0.5:1:4.5) / numel(tipo);
for k = 1:4, fprintf('%s %.1f%%  ', nombresTipo{k}, globalPct(k)); end
fprintf('\n');

% Sensibilidad al umbral: se mueven los dos umbrales juntos de 2.5 a 5.5
umbrales = 2.5:0.25:5.5;
pctUmbral = zeros(numel(umbrales), 4);
for k = 1:numel(umbrales)
    ai = inv >= umbrales(k);
    ad = dif >= umbrales(k);
    t = zeros(size(inv));
    t( ai &  ad) = 1;  t( ai & ~ad) = 2;  t(~ai & ~ad) = 3;  t(~ai &  ad) = 4;
    pctUmbral(k,:) = 100 * histcounts(t, 0.5:1:4.5) / numel(t);
end

%% Figura 1 — cuadrantes y composición por categoría
colTipo = [0.435 0.114 0.275 ;     % guinda
           0.769 0.482 0.200 ;     % ámbar
           0.106 0.431 0.478 ;     % teal
           0.350 0.350 0.350 ];    % gris
figure('Color', 'w', 'Position', [100 100 1000 430]);
tiledlayout(1, 2, 'TileSpacing', 'compact', 'Padding', 'compact');
nexttile; hold on;
for k = 1:4
    idx = tipo == k;
    scatter(inv(idx), dif(idx), 22, colTipo(k,:), 'filled', 'MarkerFaceAlpha', 0.65, 'DisplayName', nombresTipo{k});
end
xline(umbralInvolucramiento, '--k', 'HandleVisibility', 'off');
yline(umbralDiferencias, '--k', 'HandleVisibility', 'off');
for c = 1:nCat
    text(perfil(c,1), perfil(c,2), ['  ' categorias{c}], 'FontWeight', 'bold', 'FontSize', 9, 'Clipping', 'on');
    plot(perfil(c,1), perfil(c,2), 'k+', 'MarkerSize', 9, 'LineWidth', 1.4, 'HandleVisibility', 'off');
end
xlabel('Involucramiento (1 a 7)'); ylabel('Diferencias percibidas entre marcas (1 a 7)');
title('Episodios de compra en los cuatro cuadrantes');
xlim([1 7]); ylim([1 7]); grid on; box on;
legend('Location', 'southoutside', 'NumColumns', 2);
nexttile;
b = bar(porcentaje, 'stacked', 'EdgeColor', 'none');
for k = 1:4, b(k).FaceColor = colTipo(k,:); end
set(gca, 'XTickLabel', categorias);
ylabel('Porcentaje de episodios'); ylim([0 100]);
title('Composición por categoría'); grid on; box on;
legend(nombresTipo, 'Location', 'southoutside', 'NumColumns', 2);
exportgraphics(gcf, '../../figuras/matlab/cap09_cuadrantes.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap09_cuadrantes.png', 'Resolution', 300);

%% Parte B — actitud multiatributo, norma subjetiva e intención
nMarcas = size(creencias, 1);
marcas = arrayfun(@(k) sprintf('Marca %c', 'A' + k - 1), 1:nMarcas, 'UniformOutput', false);
A_bruta = creencias * evaluaciones(:);                     % suma de creencia x evaluación
A_norm = A_bruta / (10 * sum(abs(evaluaciones)));           % rango [-1, 1]
SN_bruta = normativas * motivacion(:);                      % suma de creencia normativa x motivación
SN_norm = SN_bruta / (3 * sum(motivacion));                 % rango [-1, 1]
wA = pesoActitud / (pesoActitud + pesoNorma);
wN = pesoNorma / (pesoActitud + pesoNorma);
BI = wA * A_norm + wN * SN_norm;
[~, ganadora] = max(BI);
[~, ganadoraSoloActitud] = max(A_norm);
[~, ganadoraSoloNorma] = max(SN_norm);

fprintf('\n=== PARTE B: acción razonada (Fishbein y Ajzen) ===\n');
fprintf('Pesos reescalados: actitud %.2f, norma %.2f\n\n', wA, wN);
fprintf('%-9s %10s %10s %12s %12s %12s\n', 'Marca', 'Σ b·e', 'Actitud', 'Σ nb·mc', 'Norma', 'Intención');
for k = 1:nMarcas
    fprintf('%-9s %10.1f %10.3f %12.1f %12.3f %12.3f\n', marcas{k}, A_bruta(k), A_norm(k), SN_bruta(k), SN_norm(k), BI(k));
end
fprintf('\nMarca con mayor intención: %s\n', marcas{ganadora});
fprintf('Ganaría solo por actitud: %s ; solo por norma social: %s\n', marcas{ganadoraSoloActitud}, marcas{ganadoraSoloNorma});

% Sensibilidad al peso de la norma: wN de 0 a 1
wGrid = linspace(0, 1, 201);
BIgrid = (1 - wGrid') * A_norm' + wGrid' * SN_norm';          % 201 x nMarcas
[~, gGrid] = max(BIgrid, [], 2);
cambios = find(diff(gGrid) ~= 0);
if isempty(cambios)
    fprintf('Con cualquier peso de la norma entre 0 y 1 gana %s: no hay cambio de elección.\n', marcas{gGrid(1)});
else
    for j = cambios'
        fprintf('La elección pasa de %s a %s cuando el peso de la norma está cerca de %.2f\n', ...
            marcas{gGrid(j)}, marcas{gGrid(j+1)}, (wGrid(j) + wGrid(j+1)) / 2);
    end
end

%% Figura 2 — actitud, norma, intención y sensibilidad
figure('Color', 'w', 'Position', [100 100 1000 430]);
tiledlayout(1, 2, 'TileSpacing', 'compact', 'Padding', 'compact');
nexttile;
bar([A_norm SN_norm BI]);
set(gca, 'XTickLabel', marcas);
ylabel('Puntaje normalizado (-1 a 1)');
title(sprintf('Actitud, norma e intención (peso norma = %.2f)', wN));
legend({'Actitud', 'Norma subjetiva', 'Intención'}, 'Location', 'southoutside', 'NumColumns', 3);
grid on; box on;
nexttile; hold on;
colMarca = lines(nMarcas);
for k = 1:nMarcas
    plot(wGrid, BIgrid(:,k), 'LineWidth', 2, 'Color', colMarca(k,:));
end
for j = cambios'
    xline((wGrid(j) + wGrid(j+1)) / 2, ':k', 'HandleVisibility', 'off');
end
xline(wN, '--k', 'HandleVisibility', 'off');
xlabel('Peso de la norma subjetiva'); ylabel('Intención');
title('Sensibilidad al peso social');
legend(marcas, 'Location', 'southoutside', 'NumColumns', nMarcas);
grid on; box on;
exportgraphics(gcf, '../../figuras/matlab/cap09_fishbein.pdf', 'ContentType', 'vector');
exportgraphics(gcf, '../../figuras/matlab/cap09_fishbein.png', 'Resolution', 300);

fprintf('\nFiguras guardadas en figuras/matlab/ (cap09_cuadrantes, cap09_fishbein).\n');
