%% referencias_cap07_datos.m — Referencia MATLAB para la app de datos propios (Cap. 7)
% Autor:        Prof. D.Sc. Barsekh-Onji Aboud
% Institución:  IPN — ESCA Unidad Santo Tomás
% Descripción:  Lee matlab/cap07/cap07_datos_ejemplo.xlsx y cap07_datos_ejemplo_tienda.xlsx
%               (hoja «Recorridos»), estima la cadena de Markov de primer orden entre canales y
%               calcula la conversión del modelo, el último clic, el primer clic, el reparto lineal y
%               el efecto de remoción (misma lógica que cap07_journey_markov.m, con la cadena
%               ESTIMADA de los datos) para cuatro escenarios (colapsar repetidos sí/no y longitud
%               mínima 1 o 2). Guarda referencias_cap07_datos.json para verificar_cap07_datos.js.
% Uso:          matlab -batch "run('referencias_cap07_datos.m')"

carpeta = fileparts(mfilename('fullpath'));
cap07 = fullfile(carpeta, '..', '..', '..', 'cap07');
archivos = {'cap07_datos_ejemplo.xlsx', 'cap07_datos_ejemplo_tienda.xlsx'};
escenarios = struct('colapsar', {0, 1, 0, 1}, 'longMin', {1, 1, 2, 2});
salida = {};
for a = 1:numel(archivos)
    raw = readcell(fullfile(cap07, archivos{a}), 'Sheet', 'Recorridos');
    enc = lower(string(raw(1, :)));
    cRuta = find(enc == "canales" | enc == "ruta", 1);
    cConv = find(enc == "convirtio", 1);
    cCant = find(enc == "cantidad", 1);
    n = size(raw, 1) - 1;
    rutas = cell(n, 1); conv = false(n, 1); w = ones(n, 1);
    for i = 1:n
        rutas{i} = strtrim(split(string(raw{i+1, cRuta}), ">"))';
        v = raw{i+1, cConv};
        if isnumeric(v), conv(i) = v > 0; else, conv(i) = ismember(lower(string(v)), ["si" "sí" "yes" "true" "1"]); end
        if ~isempty(cCant), w(i) = raw{i+1, cCant}; end
    end
    for e = 1:numel(escenarios)
        r = analizarRutas(rutas, conv, w, escenarios(e).colapsar, escenarios(e).longMin);
        r.archivo = archivos{a}; r.colapsar = escenarios(e).colapsar; r.longMin = escenarios(e).longMin;
        salida{end+1} = r; %#ok<SAGROW>
    end
end
fid = fopen(fullfile(carpeta, 'referencias_cap07_datos.json'), 'w');
fprintf(fid, '%s', jsonencode(salida, 'PrettyPrint', true));
fclose(fid);
fprintf('Referencias escritas en %s\n', fullfile(carpeta, 'referencias_cap07_datos.json'));

function r = analizarRutas(rutas, conv, w, colapsar, longMin)
    n = numel(rutas);
    if colapsar
        for i = 1:n
            p = rutas{i}; k = lower(p);
            mantener = [true, k(2:end) ~= k(1:end-1)];
            rutas{i} = p(mantener);
        end
    end
    largos = cellfun(@numel, rutas);
    sel = largos >= longMin;
    rutas = rutas(sel); conv = conv(sel); w = w(sel); largos = largos(sel);
    nRutas = sum(w); nConv = sum(w(conv));
    nombres = strings(0); claves = strings(0);
    for i = 1:numel(rutas)
        for c = rutas{i}
            if ~any(claves == lower(c)), claves(end+1) = lower(c); nombres(end+1) = c; end %#ok<AGROW>
        end
    end
    K = numel(nombres);
    ini = zeros(1, K); Qc = zeros(K); cv = zeros(1, K); nu = zeros(1, K);
    ultimo = zeros(1, K); primero = zeros(1, K); lineal = zeros(1, K); apar = zeros(1, K);
    for i = 1:numel(rutas)
        ids = arrayfun(@(c) find(claves == lower(c)), rutas{i}); L = numel(ids);
        ini(ids(1)) = ini(ids(1)) + w(i);
        for j = 1:L-1, Qc(ids(j), ids(j+1)) = Qc(ids(j), ids(j+1)) + w(i); end
        if conv(i)
            cv(ids(L)) = cv(ids(L)) + w(i); ultimo(ids(L)) = ultimo(ids(L)) + w(i); primero(ids(1)) = primero(ids(1)) + w(i);
            for j = 1:L, lineal(ids(j)) = lineal(ids(j)) + w(i) / L; end
        else
            nu(ids(L)) = nu(ids(L)) + w(i);
        end
        for j = 1:L, apar(ids(j)) = apar(ids(j)) + w(i); end
    end
    salidas = sum(Qc, 2)' + cv + nu;
    pi0 = ini / nRutas; Q = Qc ./ salidas'; rr = cv ./ salidas;
    pModelo = pi0 / (eye(K) - Q) * rr';
    efecto = zeros(1, K);
    for c = 1:K
        k = setdiff(1:K, c);
        efecto(c) = 1 - (pi0(k) / (eye(numel(k)) - Q(k, k)) * rr(k)') / pModelo;
    end
    remocion = efecto / sum(efecto);
    largo = sum(largos .* w) / nRutas;
    r = struct('nRutas', nRutas, 'nConv', nConv, 'tasa', 100 * nConv / nRutas, 'pModelo', 100 * pModelo, 'largo', largo, ...
        'nombres', {cellstr(nombres)}, 'apariciones', apar, 'ultimo', 100 * ultimo / nConv, 'primero', 100 * primero / nConv, ...
        'lineal', 100 * lineal / nConv, 'remocion', 100 * remocion);
end
