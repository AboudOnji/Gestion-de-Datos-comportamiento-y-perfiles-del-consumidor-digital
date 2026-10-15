%% referencias_cap06_datos.m — Referencia MATLAB para la app de datos propios (Cap. 6)
% Autor:        Prof. D.Sc. Barsekh-Onji Aboud
% Institución:  IPN — ESCA Unidad Santo Tomás
% Descripción:  Lee matlab/cap06/cap06_datos_ejemplo.xlsx y cap06_datos_ejemplo_servicio.xlsx
%               (hojas «Alternativas» y «Criterios») y aplica la lógica de cap06_alternativas.m
%               (normalización min-max, regla aditiva, conjuntiva y lexicográfica, barrido del
%               peso de un atributo) a cada uno con varios escenarios. Guarda
%               referencias_cap06_datos.json para verificar_cap06_datos.js.
% Uso:          matlab -batch "run('referencias_cap06_datos.m')"

carpeta = fileparts(mfilename('fullpath'));
cap06 = fullfile(carpeta, '..', '..', '..', 'cap06');
archivos = {'cap06_datos_ejemplo.xlsx', 'cap06_datos_ejemplo_servicio.xlsx'};
salida = {};
for a = 1:numel(archivos)
    rawA = readcell(fullfile(cap06, archivos{a}), 'Sheet', 'Alternativas');
    rawC = readcell(fullfile(cap06, archivos{a}), 'Sheet', 'Criterios');
    nombres = string(rawA(2:end, 1));
    X = cell2mat(rawA(2:end, 2:end));
    atributos = string(rawA(1, 2:end));
    esCosto = lower(string(rawC(2:end, 2)))' == "costo";
    pesosArchivo = cell2mat(rawC(2:end, 3))';
    nAtr = numel(atributos);
    escenarios = struct('nombre', {'A', 'B', 'C', 'D'}, ...
        'pesos', {pesosArchivo, ones(1, nAtr), pesosArchivo, [1 zeros(1, nAtr-1)] + 0.1}, ...
        'umbral', {3.5, 3.5, 6, 2}, 'prio', {2, 1, 3, nAtr}, 'tol', {0.5, 0, 1.5, 0.5}, 'barrido', {1, nAtr, 2, 1});
    for e = 1:numel(escenarios)
        s = escenarios(e);
        r = evaluarAlternativas(X, esCosto, s.pesos, s.umbral, s.prio, s.tol, s.barrido);
        r.archivo = archivos{a}; r.escenario = s.nombre;
        r.params = struct('pesos', s.pesos, 'umbral', s.umbral, 'prio', s.prio, 'tol', s.tol, 'barrido', s.barrido);
        r.ganadorAditiva = char(nombres(r.gAd));
        if r.gCo == 0, r.ganadorConj = 'ninguna'; else, r.ganadorConj = char(nombres(r.gCo)); end
        r.ganadorLex = char(nombres(r.gLe));
        salida{end+1} = r; %#ok<SAGROW>
    end
end
fid = fopen(fullfile(carpeta, 'referencias_cap06_datos.json'), 'w');
fprintf(fid, '%s', jsonencode(salida, 'PrettyPrint', true));
fclose(fid);
fprintf('Referencias escritas en %s\n', fullfile(carpeta, 'referencias_cap06_datos.json'));

function r = evaluarAlternativas(X, esCosto, pesosBrutos, umbral, prio, tol, barrido)
    nAlt = size(X, 1); nAtr = size(X, 2);
    minimos = min(X, [], 1); maximos = max(X, [], 1);
    S = 10 * (X - minimos) ./ (maximos - minimos);
    S(:, maximos == minimos) = 5;                        % atributo constante: no discrimina
    S(:, esCosto) = 10 - S(:, esCosto);
    S(:, maximos == minimos) = 5;
    pesos = pesosBrutos / sum(pesosBrutos);
    utilidad = S * pesos';
    [~, ordenAd] = sort(utilidad, 'descend'); gAd = ordenAd(1);
    aceptables = all(S >= umbral, 2);
    if ~any(aceptables), gCo = 0; else, ua = utilidad; ua(~aceptables) = -Inf; [~, gCo] = max(ua); end
    [~, ordenPesos] = sort(pesos, 'descend');
    ordenAtr = [prio, ordenPesos(ordenPesos ~= prio)];
    cand = 1:nAlt;
    for k = ordenAtr
        mejor = max(S(cand, k)); cand = cand(S(cand, k) >= mejor - tol);
        if numel(cand) == 1, break; end
    end
    gLe = cand(1);
    rejilla = 0:0.01:1; resto = pesos; resto(barrido) = []; resto = resto / sum(resto);
    ganBar = zeros(size(rejilla));
    for i = 1:numel(rejilla)
        w = zeros(1, nAtr); w(barrido) = rejilla(i); w(setdiff(1:nAtr, barrido)) = (1 - rejilla(i)) * resto;
        [~, ganBar(i)] = max(S * w');
    end
    nCambios = sum(diff(ganBar) ~= 0);
    r = struct('gAd', gAd, 'gCo', gCo, 'gLe', gLe, 'utilidad', utilidad', 'utilGanador', utilidad(gAd), ...
        'nAceptables', sum(aceptables), 'nCambios', nCambios, 'ganBarrido', ganBar);
end
