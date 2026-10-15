%% referencias_cap09_datos.m — Referencia MATLAB para la app de datos propios (Cap. 9)
% Autor:        Prof. D.Sc. Barsekh-Onji Aboud
% Institución:  IPN — ESCA Unidad Santo Tomás
% Descripción:  Lee matlab/cap09/cap09_datos_ejemplo.xlsx y cap09_datos_ejemplo_agencia.xlsx (hojas
%               «Alternativas», «Criterios» y «Juicios») y aplica la lógica de
%               cap09_seleccion_plataforma.m (AHP con eig, razón de consistencia con el índice
%               aleatorio de Saaty según el número de criterios, TOPSIS y barrido del peso de un
%               criterio) con tres escenarios de juicios: los del archivo, todos iguales a 1 y el
%               primer criterio extremadamente más importante. Guarda referencias_cap09_datos.json
%               para verificar_cap09_datos.js.
% Uso:          matlab -batch "run('referencias_cap09_datos.m')"

carpeta = fileparts(mfilename('fullpath'));
cap09 = fullfile(carpeta, '..', '..', '..', 'cap09');
archivos = {'cap09_datos_ejemplo.xlsx', 'cap09_datos_ejemplo_agencia.xlsx'};
RI = [0 0 0.58 0.90 1.12 1.24 1.32 1.41];
salida = {};
for a = 1:numel(archivos)
    rawA = readcell(fullfile(cap09, archivos{a}), 'Sheet', 'Alternativas');
    rawC = readcell(fullfile(cap09, archivos{a}), 'Sheet', 'Criterios');
    rawJ = readcell(fullfile(cap09, archivos{a}), 'Sheet', 'Juicios');
    alternativas = string(rawA(2:end, 1));
    X = cell2mat(rawA(2:end, 2:end));
    criterios = string(rawA(1, 2:end));
    n = numel(criterios);
    esCosto = lower(string(rawC(2:end, 2)))' == "costo";
    Jarchivo = ones(n);
    if size(rawJ, 2) == 3                                     % formato lista
        for k = 2:size(rawJ, 1)
            i = find(criterios == string(rawJ{k, 1})); j = find(criterios == string(rawJ{k, 2}));
            Jarchivo(i, j) = rawJ{k, 3}; Jarchivo(j, i) = 1 / rawJ{k, 3};
        end
    else                                                      % formato matriz: solo el triángulo superior
        M = cell2mat(rawJ(2:end, 2:end));
        for i = 1:n
            for j = i+1:n, Jarchivo(i, j) = M(i, j); Jarchivo(j, i) = 1 / M(i, j); end
        end
    end
    Juno = ones(n);
    Jprim = ones(n); for j = 2:n, Jprim(1, j) = 9; Jprim(j, 1) = 1/9; end
    escenarios = struct('nombre', {'A', 'B', 'C'}, 'J', {Jarchivo, Juno, Jprim}, 'barrido', {1, min(2, n), n});
    for e = 1:numel(escenarios)
        s = escenarios(e);
        r = evaluarAHP(X, esCosto, s.J, s.barrido, RI);
        r.archivo = archivos{a}; r.escenario = s.nombre; r.barrido = s.barrido; r.J = s.J;
        r.ganadorAHP = char(alternativas(r.gAHP)); r.ganadorIguales = char(alternativas(r.gIg));
        salida{end+1} = r; %#ok<SAGROW>
    end
end
fid = fopen(fullfile(carpeta, 'referencias_cap09_datos.json'), 'w');
fprintf(fid, '%s', jsonencode(salida, 'PrettyPrint', true));
fclose(fid);
fprintf('Referencias escritas en %s\n', fullfile(carpeta, 'referencias_cap09_datos.json'));

function r = evaluarAHP(X, esCosto, J, barrido, RI)
    n = size(J, 1);
    [V, D] = eig(J); [lambdaMax, k] = max(real(diag(D)));
    pesos = abs(real(V(:, k)))'; pesos = pesos / sum(pesos);
    ci = (lambdaMax - n) / (n - 1); cr = ci / RI(n);
    peor = ''; mejor = -1;
    for i = 1:n
        for j = i+1:n
            d = abs(log(J(i, j) * pesos(j) / pesos(i)));
            if d > mejor + 1e-12, mejor = d; peor = sprintf('%d-%d', i, j); end
        end
    end
    [cerc, ordenA] = topsis(X, pesos, esCosto);
    [~, ordenI] = topsis(X, ones(1, n) / n, esCosto);
    rejilla = 0:0.01:1; resto = pesos; resto(barrido) = []; resto = resto / sum(resto);
    ganBar = zeros(size(rejilla));
    for i = 1:numel(rejilla)
        w = zeros(1, n); w(barrido) = rejilla(i); w(setdiff(1:n, barrido)) = (1 - rejilla(i)) * resto;
        c = topsis(X, w, esCosto); [~, ganBar(i)] = max(c);
    end
    r = struct('pesos', pesos, 'lambdaMax', lambdaMax, 'cr', cr, 'consistente', char(subsref(["no" "sí"], substruct('()', {1 + (cr < 0.10)}))), ...
        'gAHP', ordenA(1), 'gIg', ordenI(1), 'cercaniaGanador', cerc(ordenA(1)), 'nCambios', sum(diff(ganBar) ~= 0), 'ganBarrido', ganBar, 'peorPar', peor);
end

function [cercania, orden] = topsis(X, w, esCosto)
    R = X ./ sqrt(sum(X.^2, 1)); Vp = R .* w;
    mejor = max(Vp, [], 1); peor = min(Vp, [], 1);
    mejor(esCosto) = min(Vp(:, esCosto), [], 1); peor(esCosto) = max(Vp(:, esCosto), [], 1);
    dM = sqrt(sum((Vp - mejor).^2, 2)); dP = sqrt(sum((Vp - peor).^2, 2));
    cercania = dP ./ (dM + dP); [~, orden] = sort(cercania, 'descend');
end
