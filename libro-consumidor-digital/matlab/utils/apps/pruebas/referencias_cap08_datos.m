%% referencias_cap08_datos.m — Referencia MATLAB para la app de datos propios (Cap. 8)
% Autor:        Prof. D.Sc. Barsekh-Onji Aboud
% Institución:  IPN — ESCA Unidad Santo Tomás
% Descripción:  Lee matlab/cap08/cap08_datos_ejemplo.xlsx y cap08_datos_ejemplo_club.xlsx (hojas
%               «Personas» y «Conexiones»), construye el grafo y aplica la lógica de
%               cap08_red_influencia.m: grado, intermediación (centrality), cercanía (inverso de la
%               distancia media a las personas alcanzables), cascada por umbral con semillas
%               centrales, periféricas y 100 sorteos al azar (rng(42), sort(rand(n,1))) para cuatro
%               escenarios. Guarda referencias_cap08_datos.json para verificar_cap08_datos.js.
% Uso:          matlab -batch "run('referencias_cap08_datos.m')"

carpeta = fileparts(mfilename('fullpath'));
cap08 = fullfile(carpeta, '..', '..', '..', 'cap08');
archivos = {'cap08_datos_ejemplo.xlsx', 'cap08_datos_ejemplo_club.xlsx'};
escenarios = struct('nSemillas', {3, 3, 5, 2}, 'umbral', {0.25, 0.30, 0.20, 0.35}, 'criterio', {1, 2, 3, 1});
nombresMedidas = ["grado" "intermediación" "cercanía"];
salida = {};
for a = 1:numel(archivos)
    rawP = readcell(fullfile(cap08, archivos{a}), 'Sheet', 'Personas');
    rawC = readcell(fullfile(cap08, archivos{a}), 'Sheet', 'Conexiones');
    nombres = string(rawP(2:end, 1));
    n = numel(nombres);
    ea = zeros(size(rawC, 1) - 1, 1); eb = ea;
    for i = 1:numel(ea)
        ea(i) = find(nombres == string(rawC{i+1, 1}));
        eb(i) = find(nombres == string(rawC{i+1, 2}));
    end
    G = graph(ea, eb, [], n);
    G = simplify(G);                                   % sin duplicados ni lazos
    A = full(adjacency(G));
    grado = degree(G);
    inter = round(centrality(G, 'betweenness'), 9);
    D = distances(G);
    cerc = zeros(n, 1);
    for i = 1:n
        d = D(i, :); alc = d(isfinite(d) & d > 0);
        if ~isempty(alc), cerc(i) = round(numel(alc) / sum(alc), 9); end
    end
    medidas = [grado, inter, cerc];
    for e = 1:numel(escenarios)
        s = escenarios(e);
        adopC = zeros(1, 3); adopP = zeros(1, 3);
        for c = 1:3
            [~, orden] = sort(medidas(:, c), 'descend');
            adopC(c) = 100 * mean(cascada(A, grado, orden(1:s.nSemillas), s.umbral));
            adopP(c) = 100 * mean(cascada(A, grado, orden(end-s.nSemillas+1:end), s.umbral));
        end
        rng(42);
        azar = zeros(1, 100);
        for k = 1:100
            [~, oa] = sort(rand(n, 1));
            azar(k) = 100 * mean(cascada(A, grado, oa(1:s.nSemillas), s.umbral));
        end
        [~, orden] = sort(medidas(:, s.criterio), 'descend');
        [adoptE, rondas] = cascada(A, grado, orden(1:s.nSemillas), s.umbral);
        [~, og] = sort(grado, 'descend'); [~, oi] = sort(inter, 'descend');
        m5 = min(5, n);
        [~, mejor] = max(adopC);
        comp = conncomp(G);
        r = struct('archivo', archivos{a}, 'nSemillas', s.nSemillas, 'umbral', s.umbral, 'criterio', s.criterio, ...
            'nPersonas', n, 'nConexiones', numedges(G), 'gradoMax', max(grado), 'gradoProm', mean(grado), ...
            'nComp', max(comp), 'mayorComp', max(accumarray(comp', 1)), 'coinciden', numel(intersect(og(1:m5), oi(1:m5))), ...
            'adopGrado', adopC(1), 'adopInter', adopC(2), 'adopCerc', adopC(3), 'perifGrado', adopP(1), 'perifInter', adopP(2), 'perifCerc', adopP(3), ...
            'promedioAzar', mean(azar), 'adopFinal', 100 * mean(adoptE), 'rondas', rondas, 'mejorCriterio', char(nombresMedidas(mejor)), 'maxInter', max(inter));
        salida{end+1} = r; %#ok<SAGROW>
    end
end
fid = fopen(fullfile(carpeta, 'referencias_cap08_datos.json'), 'w');
fprintf(fid, '%s', jsonencode(salida, 'PrettyPrint', true));
fclose(fid);
fprintf('Referencias escritas en %s\n', fullfile(carpeta, 'referencias_cap08_datos.json'));

function [adopt, rondas] = cascada(A, grado, semillas, umbral)
    n = size(A, 1); adopt = false(n, 1); adopt(semillas) = true; rondas = 0;
    for ronda = 1:200
        fraccion = (double(A) * double(adopt)) ./ grado;
        nuevos = ~adopt & fraccion >= umbral;
        if ~any(nuevos), break; end
        adopt(nuevos) = true; rondas = ronda;
    end
end
