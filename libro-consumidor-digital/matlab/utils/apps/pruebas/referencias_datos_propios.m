%% referencias_datos_propios.m — Referencia MATLAB para la app de datos propios (Cap. 2)
% Autor:        Dr. Aboud Barsekh-Onji
% Institución:  IPN — ESCA Unidad Santo Tomás
% Descripción:  Lee matlab/cap02/cap02_datos_ejemplo.xlsx (hoja «Datos») y le
%               aplica, para varios juegos de arquetipos, el análisis de la
%               app cap02_segmentacion_datos_propios.html:
%               (1) FIJOS: arquetipo más cercano (pdist2 sqeuclidean) +
%                   silhouette, y pertenencia difusa con centros fijos (m=2);
%               (2) AJUSTADOS: kmeans(...,'Start',C) + silhouette, y fcm
%                   (m=2, 100 iteraciones, 1e-5) con inicio estándar.
%               Nota: en R2026a, fcm con fcmOptions(ClusterCenters=C) devuelve
%               C sin moverlo, así que no sirve de referencia. FCM converge a
%               la misma solución desde cualquier inicio en estos datos; la
%               prueba empareja cada centro con su arquetipo.
%               Todo sobre variables estandarizadas (z-score). Guarda
%               referencias_datos_propios.json para verificar_datos_propios.js.
% Uso:          matlab -batch "run('referencias_datos_propios.m')"

carpeta = fileparts(mfilename('fullpath'));
archivo = fullfile(carpeta, '..', '..', '..', 'cap02', 'cap02_datos_ejemplo.xlsx');
T = readtable(archivo, 'Sheet', 'Datos');
% columnas 2 a 4 (frecuencia, ticket, engagement) por posición: el encabezado
% puede venir renombrado (la app acepta cualquier nombre de columna)
datos = T{:, 2:4};
mu = mean(datos); sd = std(datos);
X = (datos - mu) ./ sd;

juegos = {
    'libro',        [1.5 350 25; 4.0 900 78; 2.6 600 52]
    'dos',          [2.0 400 30; 4.0 900 80]
    'cuatro',       [1.5 350 25; 4.0 900 78; 2.6 600 52; 5.5 1300 90]
    'desplazados',  [1.0 500 40; 3.0 700 60; 5.0 1100 95]
};

salida = {};
for g = 1:size(juegos, 1)
    A = juegos{g, 2};
    k = size(A, 1);
    Cz = (A - mu) ./ sd;

    % (1) fijos
    D2 = pdist2(X, Cz, 'squaredeuclidean');
    [~, etFijo] = min(D2, [], 2);
    D = sqrt(max(D2, 1e-24));
    Ufijo = (1 ./ D.^2) ./ sum(1 ./ D.^2, 2);          % m = 2
    % (2) ajustados
    etAj = kmeans(X, k, 'Start', Cz);
    rng(42);
    [Cfcm, U] = fcm(X, k, [2.0, 100, 1e-5, 0]);

    r.juego = juegos{g, 1};
    r.arquetipos = A;
    r.silFijo = mean(silhouette(X, etFijo));
    r.ambFijo = 100 * mean(max(Ufijo, [], 2) < 0.6);
    r.tamFijo = accumarray(etFijo, 1, [k 1])';
    r.silAj = mean(silhouette(X, etAj));
    r.ambAj = 100 * mean(max(U, [], 1) < 0.6);
    r.tamAj = accumarray(etAj, 1, [k 1])';
    r.cambian = sum(etFijo ~= etAj);
    r.centrosFCM = Cfcm .* sd + mu;
    salida{end+1} = r; %#ok<SAGROW>
    fprintf('%-12s fijo: sil=%.4f amb=%.2f%% | ajustado: sil=%.4f amb=%.2f%% | cambian=%d\n', ...
        r.juego, r.silFijo, r.ambFijo, r.silAj, r.ambAj, r.cambian);
end
fid = fopen(fullfile(carpeta, 'referencias_datos_propios.json'), 'w');
fprintf(fid, '%s', jsonencode(salida, 'PrettyPrint', true));
fclose(fid);
