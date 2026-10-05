%% referencias_cap03_datos.m — Referencia MATLAB para la app de datos propios (Cap. 3)
% Autor:        Dr. Aboud Barsekh-Onji
% Institución:  IPN — ESCA Unidad Santo Tomás
% Descripción:  Lee matlab/cap03/cap03_datos_ejemplo.xlsx y le aplica la misma
%               lógica de cap03_rfm_clv_ab.m (imputación por mediana, acotado
%               1.5xRIC, quintiles con discretize, segmentos, CLV) más las dos
%               extensiones de la app: anualizar la frecuencia (mesesPeriodo) y
%               CLV descontado (tasaDescuento). También calcula la prueba A/B
%               de la hoja «Experimento» con el IC de la diferencia y la muestra
%               por versión para potencia 80 % (norminv). Guarda
%               referencias_cap03_datos.json para verificar_cap03_datos.js.
% Uso:          matlab -batch "run('referencias_cap03_datos.m')"

carpeta = fileparts(mfilename('fullpath'));
archivo = fullfile(carpeta, '..', '..', '..', 'cap03', 'cap03_datos_ejemplo.xlsx');
T = readtable(archivo, 'Sheet', 'Datos');
recenciaDias = T{:, 2}; frecuencia = T{:, 3}; montoPromedio = T{:, 4};
nClientes = height(T);

casos = {
    'defecto',          3, 12, 0
    'horizonte 5',      5, 12, 0
    'semestral',        3,  6, 0
    'descontado 10%',   3, 12, 0.10
    'todo junto',       4,  6, 0.08
};

salida = {};
for c = 1:size(casos, 1)
    horizonteAnios = casos{c, 2}; mesesPeriodo = casos{c, 3}; tasa = casos{c, 4};
    nFalt = sum(isnan(montoPromedio));
    medianaMonto = median(montoPromedio, 'omitnan');
    montoLimpio = montoPromedio; montoLimpio(isnan(montoLimpio)) = medianaMonto;
    q1 = prctile(montoLimpio, 25); q3 = prctile(montoLimpio, 75);
    limiteSuperior = q3 + 1.5*(q3 - q1);
    esAtipico = montoLimpio > limiteSuperior;
    montoLimpio(esAtipico) = limiteSuperior;

    pR = 6 - discretize(recenciaDias, prctile(recenciaDias, 0:20:100), 'IncludedEdge', 'right');
    pF = discretize(frecuencia, prctile(frecuencia, 0:20:100), 'IncludedEdge', 'right');
    pM = discretize(montoLimpio, prctile(montoLimpio, 0:20:100), 'IncludedEdge', 'right');
    pR(isnan(pR)) = 3; pF(isnan(pF)) = 3; pM(isnan(pM)) = 3;
    rfmTotal = pR + pF + pM;
    segmento = strings(nClientes, 1);
    segmento(rfmTotal >= 12) = "Campeón";
    segmento(rfmTotal >= 9 & rfmTotal < 12) = "Leal";
    segmento(rfmTotal >= 6 & rfmTotal < 9) = "En riesgo";
    segmento(rfmTotal < 6) = "Perdido";

    factor = sum((1 + tasa) .^ -(1:horizonteAnios));
    if tasa == 0, factor = horizonteAnios; end
    clv = montoLimpio .* (frecuencia * 12 / mesesPeriodo) * factor;
    r = struct('caso', casos{c, 1}, 'horizonteAnios', horizonteAnios, 'mesesPeriodo', mesesPeriodo, 'tasaDescuento', tasa);
    r.nFalt = nFalt; r.limSup = limiteSuperior; r.nAtipicos = sum(esAtipico);
    for s = ["Campeón", "Leal", "En riesgo", "Perdido"]
        k = matlab.lang.makeValidName(replace(s, "ó", "o"));
        r.("n_" + k) = sum(segmento == s);
        r.("clv_" + k) = mean(clv(segmento == s));
        r.("pctClv_" + k) = 100 * sum(clv(segmento == s)) / sum(clv);
    end
    ordenado = sort(clv, 'descend');
    r.pctTop20 = 100 * sum(ordenado(1:round(0.2*nClientes))) / sum(clv);
    salida{end+1} = r; %#ok<SAGROW>
end

% Prueba A/B de la hoja Experimento
E = readtable(archivo, 'Sheet', 'Experimento');
esA = strcmp(E.Version, 'A'); esB = strcmp(E.Version, 'B');
nA = sum(esA); cA = sum(E.Convirtio(esA)); nB = sum(esB); cB = sum(E.Convirtio(esB));
ab = struct();
ab.nA = nA; ab.cA = cA; ab.nB = nB; ab.cB = cB;
for alfa = [0.05 0.10]
    pA = cA/nA; pB = cB/nB; pC = (cA+cB)/(nA+nB);
    z = (pB-pA) / sqrt(pC*(1-pC)*(1/nA+1/nB));
    valorP = 2*(1-normcdf(abs(z)));
    zc = norminv(1 - alfa/2);
    ee = sqrt(pA*(1-pA)/nA + pB*(1-pB)/nB);
    nNec = ceil((zc + norminv(0.8))^2 * (pA*(1-pA) + pB*(1-pB)) / (pB-pA)^2);
    k = sprintf('a%03d', round(alfa*100));
    ab.(k) = struct('alfa', alfa, 'z', z, 'valorP', valorP, 'difInf', (pB-pA) - zc*ee, 'difSup', (pB-pA) + zc*ee, 'nNecesario', nNec);
end
salida{end+1} = struct('caso', 'ab', 'ab', ab);

fid = fopen(fullfile(carpeta, 'referencias_cap03_datos.json'), 'w');
fprintf(fid, '%s', jsonencode(salida, 'PrettyPrint', true));
fclose(fid);
fprintf('Referencias escritas en %s\n', fullfile(carpeta, 'referencias_cap03_datos.json'));
