%% referencias_parte2.m — Salidas de referencia de MATLAB para las apps de la Parte II (Cap. 5-8)
% Autor:        Prof. D.Sc. Barsekh-Onji Aboud
% Institución:  IPN — ESCA Unidad Santo Tomás
% Descripción:  Igual que referencias_matlab.m, pero para los scripts de la
%               Parte II. Corre los scripts REALES con los casos del ejercicio
%               propuesto (y algunos extra) y guarda sus resultados en
%               referencias_parte2.json, contra el que verificar_parte2.js
%               compara las apps. Cada corrida usa una copia temporal del
%               script con el bloque de parámetros sobrescrito y SIN
%               exportgraphics (no toca las figuras del libro).
% Uso:          matlab -batch "run('referencias_parte2.m')"

carpetaPruebas = fileparts(mfilename('fullpath'));
carpetaMatlab = fullfile(carpetaPruebas, '..', '..', '..');
set(0, 'DefaultFigureVisible', 'off');

% {capitulo, caso, script, sobrescrituras, parametros a registrar}
p05 = {'pesoPrecio','pesoCalidad','pesoEntrega','pesoResenas','umbralMinimo','atributoPrioritario','toleranciaLex'};
corridas = {
 'cap06', 'A', 'cap06/cap06_alternativas.m', '', p05
 'cap06', 'B', 'cap06/cap06_alternativas.m', 'pesoPrecio = 0.80; pesoCalidad = 0.10; pesoEntrega = 0.05; pesoResenas = 0.05;', p05
 'cap06', 'C', 'cap06/cap06_alternativas.m', 'umbralMinimo = 6; atributoPrioritario = 3;', p05
 'cap06', 'extra', 'cap06/cap06_alternativas.m', 'pesoPrecio = 0.1; pesoCalidad = 0.1; umbralMinimo = 1; atributoPrioritario = 4; toleranciaLex = 1.5;', p05
};
p06 = {'pAvanzar','pRetroceder','pAbandonar','inicioRedes','convBusqueda','convDirecto'};
corridas = [corridas; {
 'cap07', 'A', 'cap07/cap07_journey_markov.m', '', p06
 'cap07', 'B', 'cap07/cap07_journey_markov.m', 'pRetroceder = 0.25;', p06
 'cap07', 'C', 'cap07/cap07_journey_markov.m', 'inicioRedes = 0.70; convDirecto = 0.60;', p06
 'cap07', 'extra', 'cap07/cap07_journey_markov.m', 'pAvanzar = 0.5; pRetroceder = 0; pAbandonar = 0.2; inicioRedes = 0; convBusqueda = 0.55; convDirecto = 0.05;', p06
}];

p07 = {'nNodos','nComunidades','pDentro','pEntre','nSemillas','umbral','criterio'};
corridas = [corridas; {
 'cap08', 'A', 'cap08/cap08_red_influencia.m', '', p07
 'cap08', 'B', 'cap08/cap08_red_influencia.m', 'pEntre = 0.06;', p07
 'cap08', 'C', 'cap08/cap08_red_influencia.m', 'pDentro = 0.35;', p07
 'cap08', 'extra criterio 2', 'cap08/cap08_red_influencia.m', 'criterio = 2; nSemillas = 6; umbral = 0.30;', p07
 'cap08', 'extra n=90', 'cap08/cap08_red_influencia.m', 'nNodos = 90; nComunidades = 4; criterio = 3;', p07
 'cap08', 'extra n=100', 'cap08/cap08_red_influencia.m', 'nNodos = 100; nComunidades = 5; pDentro = 0.15; pEntre = 0.03; nSemillas = 8; umbral = 0.15; criterio = 2;', p07
}];

p08 = {'cobVsPriv','cobVsInterop','cobVsCosto','privVsInterop','privVsCosto','interopVsCosto'};
corridas = [corridas; {
 'cap09', 'A', 'cap09/cap09_seleccion_plataforma.m', '', p08
 'cap09', 'B', 'cap09/cap09_seleccion_plataforma.m', 'cobVsPriv = 0.333; cobVsInterop = 0.5; cobVsCosto = 0.2; privVsInterop = 1; privVsCosto = 0.5; interopVsCosto = 0.333;', p08
 'cap09', 'C', 'cap09/cap09_seleccion_plataforma.m', 'cobVsPriv = 5; cobVsInterop = 0.333; cobVsCosto = 3; privVsInterop = 0.2; privVsCosto = 3; interopVsCosto = 7;', p08
 'cap09', 'extra', 'cap09/cap09_seleccion_plataforma.m', 'cobVsPriv = 1; cobVsInterop = 1; cobVsCosto = 1; privVsInterop = 1; privVsCosto = 1; interopVsCosto = 1;', p08
 'cap09', 'extra 2', 'cap09/cap09_seleccion_plataforma.m', 'cobVsPriv = 9; cobVsInterop = 7; cobVsCosto = 0.2; privVsInterop = 0.5; privVsCosto = 4; interopVsCosto = 6;', p08
}];

% Expresiones (evaluadas en el workspace del script) -> nombre de métrica en la app
metricas.cap06 = {'ganadorAditiva','char(alternativas(ganadorAditiva))'; 'utilGanador','utilidad(ganadorAditiva)'; ...
    'nAceptables','nAceptables'; 'ganadorConj','char(subsref(["ninguna" alternativas], substruct(''()'', {ganadorConj+1})))'; ...
    'ganadorLex','char(alternativas(ganadorLex))'; ...
    'coinciden','char(subsref(["no" "sí"], substruct(''()'', {1+(nAceptables>0 && ganadorAditiva==ganadorConj && ganadorConj==ganadorLex)})))'; ...
    'nCambios','nCambios'};
metricas.cap07 = {'pConv','100*pConv'; 'pConvLineal','100*pConvLineal'; 'pasos','pasosEsperados'; 'pasosConv','pasosConv'; ...
    'kMediana','kMediana'; 'pConv10','100*cumReal(11)'; 'pConv10Lineal','100*cumLineal(11)'; 'pConvCanales','100*pConvCanales'; ...
    'ultimoBusqueda','100*ultimoClic(1)'; 'ultimoRedes','100*ultimoClic(2)'; 'ultimoCorreo','100*ultimoClic(3)'; 'ultimoDirecto','100*ultimoClic(4)'; ...
    'remocionBusqueda','100*atribucionRemocion(1)'; 'remocionRedes','100*atribucionRemocion(2)'; 'remocionCorreo','100*atribucionRemocion(3)'; 'remocionDirecto','100*atribucionRemocion(4)'; ...
    'canalSubestimado','char(canales(cMax))'};
metricas.cap08 = {'nConexiones','numedges(G)'; 'gradoMax','max(gradoNodo)'; 'gradoProm','mean(gradoNodo)'; 'coinciden','nCoinciden'; ...
    'adopGrado','adopcionPorCriterio(1)'; 'adopInter','adopcionPorCriterio(2)'; 'adopCerc','adopcionPorCriterio(3)'; ...
    'perifGrado','adopcionPeriferica(1)'; 'perifInter','adopcionPeriferica(2)'; 'perifCerc','adopcionPeriferica(3)'; ...
    'promedioAzar','promedioAzar'; 'adopFinal','adopcionFinal'; 'rondas','rondasElegido'; ...
    'mejorCriterio','char(nombresMedidas(mejorCriterio))'; 'maxInter','max(intermediacion)'};
metricas.cap09 = {'pesoCobertura','pesosAHP(1)'; 'pesoPrivacidad','pesosAHP(2)'; 'pesoInterop','pesosAHP(3)'; 'pesoCosto','pesosAHP(4)'; ...
    'lambdaMax','lambdaMax'; 'cr','razonConsistencia'; 'consistente','char(subsref(["no" "sí"], substruct(''()'', {1+esConsistente})))'; ...
    'ganadorAHP','char(alternativas(ganadorAHP))'; 'cercaniaGanador','cercaniaAHP(ganadorAHP)'; 'ganadorIguales','char(alternativas(ganadorIguales))'; 'nCambios','nCambios'};
%%METRICAS_EXTRA%%

salida = {};
for i = 1:size(corridas, 1)
    [cap, caso, script, sobre, nombresParam] = corridas{i, :};
    r = correrScript(fullfile(carpetaMatlab, script), sobre, nombresParam, metricas.(cap));
    r.cap = cap; r.caso = caso;
    r = rmfield(r, 'decisionTexto');
    salida{end+1} = r; %#ok<SAGROW>
    fprintf('[OK] %s caso %s\n', cap, caso);
end

fid = fopen(fullfile(carpetaPruebas, 'referencias_parte2.json'), 'w');
fprintf(fid, '%s', jsonencode(salida, 'PrettyPrint', true));
fclose(fid);
fprintf('Referencias escritas en %s\n', fullfile(carpetaPruebas, 'referencias_parte2.json'));

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
    setappdata(0, 'refResultado', zz_res);
    close all;
end
