%% referencias_matlab.m — Genera las salidas de referencia de MATLAB para las apps
% Autor:        Dr. Aboud Barsekh-Onji
% Institución:  IPN — ESCA Unidad Santo Tomás
% Descripción:  Corre los scripts REALES de cada capítulo con los parámetros
%               de los casos del "Ejercicio propuesto" (y algunos extra) y
%               guarda sus resultados en referencias_matlab.json, contra el
%               que verificar_modelos.js compara las apps interactivas.
%               Cada corrida usa una copia temporal del script con el bloque
%               de parámetros sobrescrito y SIN exportgraphics (para no tocar
%               las figuras del libro).
% Uso:          matlab -batch "run('referencias_matlab.m')"

carpetaPruebas = fileparts(mfilename('fullpath'));
carpetaMatlab = fullfile(carpetaPruebas, '..', '..', '..');
set(0, 'DefaultFigureVisible', 'off');

c02B = 'centrosTipicos = mean(centrosTipicos) + 0.5*(centrosTipicos - mean(centrosTipicos));';
c02C = ['centrosTipicos = [centrosTipicos; 5.5, 1300, 90]; ' ...
        'dispersionTipica = [dispersionTipica; 0.7, 180, 8];'];

% {capitulo, caso, script, sobrescrituras, parametros a registrar}
corridas = {
 'cap01', 'A', 'cap01/cap01_difusion_bass.m', 'p = 0.08; q = 0.10;', {'p','q','m','tFinal'}
 'cap01', 'B', 'cap01/cap01_difusion_bass.m', '',                    {'p','q','m','tFinal'}
 'cap01', 'C', 'cap01/cap01_difusion_bass.m', 'p = 0.01; q = 0.55;', {'p','q','m','tFinal'}
 'cap01', 'extra tFinal=40', 'cap01/cap01_difusion_bass.m', 'tFinal = 40; p = 0.02;', {'p','q','m','tFinal'}
 'cap02', 'A', 'cap02/cap02_segmentacion.m', '',   {'centrosTipicos','dispersionTipica','nClientesPorSegmento'}
 'cap02', 'B', 'cap02/cap02_segmentacion.m', c02B, {'centrosTipicos','dispersionTipica','nClientesPorSegmento'}
 'cap02', 'C', 'cap02/cap02_segmentacion.m', c02C, {'centrosTipicos','dispersionTipica','nClientesPorSegmento'}
 'cap02', 'extra n=150', 'cap02/cap02_segmentacion.m', 'nClientesPorSegmento = 150;', {'centrosTipicos','dispersionTipica','nClientesPorSegmento'}
 'cap03', 'A', 'cap03/cap03_rfm_clv_ab.m', '', {'nClientes','horizonteAnios','alfa','nA','conversionesA','nB','conversionesB'}
 'cap03', 'B', 'cap03/cap03_rfm_clv_ab.m', 'nA = 6000; conversionesA = 660; nB = 5900; conversionesB = 795;', {'nClientes','horizonteAnios','alfa','nA','conversionesA','nB','conversionesB'}
 'cap03', 'C', 'cap03/cap03_rfm_clv_ab.m', 'alfa = 0.10;', {'nClientes','horizonteAnios','alfa','nA','conversionesA','nB','conversionesB'}
 'cap03', 'extra n=650, h=5', 'cap03/cap03_rfm_clv_ab.m', 'nClientes = 650; horizonteAnios = 5;', {'nClientes','horizonteAnios','alfa','nA','conversionesA','nB','conversionesB'}
 'cap04', 'A', 'cap04/cap04_series_texto.m', '', {'nSemanas','crecimientoSemanal','amplitudEstacional','desviacionRuido'}
 'cap04', 'B', 'cap04/cap04_series_texto.m', 'amplitudEstacional = 3;', {'nSemanas','crecimientoSemanal','amplitudEstacional','desviacionRuido'}
 'cap04', 'C', 'cap04/cap04_series_texto.m', 'desviacionRuido = 15;', {'nSemanas','crecimientoSemanal','amplitudEstacional','desviacionRuido'}
 'cap04', 'extra 156 semanas', 'cap04/cap04_series_texto.m', 'nSemanas = 156; crecimientoSemanal = 0.1;', {'nSemanas','crecimientoSemanal','amplitudEstacional','desviacionRuido'}
};

% Expresiones (evaluadas en el workspace del script) -> nombre de métrica en la app
metricas.cap01 = {'tPico','tPico'; 'pctPico','100*adopcionEnElPico'; 'pctFinal','100*adopcionAcumulada(end)'; 'tasaMax','max(tasaAdopcion)'};
metricas.cap02 = {'silProm','mean(siluetaKmeans)'; 'pctAmbiguos','100*proporcionAmbiguos'};
metricas.cap03 = {'convA','100*pA'; 'convB','100*pB'; 'z','z'; 'valorP','valorP'; ...
                  'clvCampeon','mean(clv(segmento == "Campeón"))'; 'clvLeal','mean(clv(segmento == "Leal"))'; ...
                  'clvRiesgo','mean(clv(segmento == "En riesgo"))'; 'clvPerdido','mean(clv(segmento == "Perdido"))'};
metricas.cap04 = {'minimo','min(interesBusqueda)'; 'maximo','max(interesBusqueda)'; ...
                  'promedio','mean(interesBusqueda)'; 'ampEst','max(componenteEstacional) - min(componenteEstacional)'};

salida = {};
for i = 1:size(corridas, 1)
    [cap, caso, script, sobre, nombresParam] = corridas{i, :};
    r = correrScript(fullfile(carpetaMatlab, script), sobre, nombresParam, metricas.(cap));
    r.cap = cap; r.caso = caso;
    if strcmp(cap, 'cap03')
        r.esperado.decision = r.decisionTexto;
    end
    r = rmfield(r, 'decisionTexto');
    salida{end+1} = r; %#ok<SAGROW>
    fprintf('[OK] %s caso %s\n', cap, caso);
end

fid = fopen(fullfile(carpetaPruebas, 'referencias_matlab.json'), 'w');
fprintf(fid, '%s', jsonencode(salida, 'PrettyPrint', true));
fclose(fid);
fprintf('Referencias escritas en %s\n', fullfile(carpetaPruebas, 'referencias_matlab.json'));

function r = correrScript(archivo, sobrescrituras, nombresParam, metricas)
    % Copia temporal junto al script original (mismas rutas relativas)
    texto = fileread(archivo);
    lineas = splitlines(string(texto));
    iFin = find(startsWith(lineas, "% ====="), 1);   % cierre del bloque de parámetros
    lineas = [lineas(1:iFin); string(sobrescrituras); lineas(iFin+1:end)];
    lineas = replace(lineas, "exportgraphics(", "%exportgraphics(");
    [carpeta, nombre] = fileparts(archivo);
    % Nombre único por corrida: MATLAB guarda en caché los scripts por nombre
    % y, si se reutilizara, correría la versión anterior.
    % (no se usa rand: cada script reinicia rng(42) y el nombre se repetiría).
    contador = getappdata(0, 'refContador'); if isempty(contador), contador = 0; end
    contador = contador + 1; setappdata(0, 'refContador', contador);
    temporal = fullfile(carpeta, "tmp_ref_" + nombre + "_" + contador + ".m");
    writelines(lineas, temporal);
    limpiar = onCleanup(@() delete(temporal));
    setappdata(0, 'refMetricas', metricas);
    setappdata(0, 'refNombres', nombresParam);
    ejecutarAislado(temporal);
    r = getappdata(0, 'refResultado');
end

function ejecutarAislado(temporal)
    % El script hace "clear": todo lo que se necesite después va en appdata.
    % Las variables locales llevan prefijo zz_ para no chocar con las del
    % script (p. ej. cap01 usa "m" como mercado potencial).
    evalc('run(temporal)');
    zz_m = getappdata(0, 'refMetricas'); zz_nombres = getappdata(0, 'refNombres');
    zz_res = struct('params', struct(), 'esperado', struct(), 'decisionTexto', '');
    for zz_j = 1:numel(zz_nombres)
        zz_res.params.(zz_nombres{zz_j}) = eval(zz_nombres{zz_j});
    end
    for zz_j = 1:size(zz_m, 1)
        zz_res.esperado.(zz_m{zz_j,1}) = eval(zz_m{zz_j,2});
    end
    if exist('valorP', 'var')
        if valorP < alfa, zz_res.decisionTexto = 'Se rechaza H0'; else, zz_res.decisionTexto = 'No se rechaza H0'; end
    end
    setappdata(0, 'refResultado', zz_res);
    close all;
end
