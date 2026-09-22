%% exportar_datos_matlab.m — Exporta los números aleatorios de MATLAB para las apps
% Autor:        Dr. Aboud Barsekh-Onji
% Institución:  IPN — ESCA Unidad Santo Tomás
% Descripción:  Las apps interactivas (capNN_*_interactivo.html) no pueden
%               reproducir el generador de MATLAB en el navegador. Para que
%               sus resultados coincidan EXACTAMENTE con los del libro, este
%               script exporta:
%               (1) randn42.json: los primeros 15 000 valores de randn tras
%                   rng(42) — los usan cap02 (datos de arquetipos) y cap04
%                   (ruido de la serie: normrnd(0,s,n,1) = s*randn(n,1)).
%               (2) cap03_datos.json: la base sintética de cap03 (recencia,
%                   frecuencia, monto ensuciado) para nClientes = 100:50:1000.
%               Correr solo si se cambia la forma de generar datos en los
%               scripts; después, volver a correr construir_apps.py.
% Uso:          matlab -batch "run('exportar_datos_matlab.m')"

carpeta = fileparts(mfilename('fullpath'));

%% (1) Flujo de randn tras rng(42)
rng(42); z = randn(15000,1);
fid = fopen(fullfile(carpeta, 'randn42.json'), 'w');
fprintf(fid, '['); fprintf(fid, '%.9g,', z(1:end-1)); fprintf(fid, '%.9g]', z(end));
fclose(fid);

%% (2) Datos de cap03_rfm_clv_ab.m para varios tamaños de base
ns = 100:50:1000;
fid = fopen(fullfile(carpeta, 'cap03_datos.json'), 'w');
fprintf(fid, '{');
for k = 1:numel(ns)
    nClientes = ns(k); rng(42);
    % Mismas líneas que la sección "Datos" de cap03_rfm_clv_ab.m
    recenciaDias  = round(exprnd(60, nClientes, 1));
    frecuencia    = poissrnd(4, nClientes, 1) + 1;
    montoPromedio = normrnd(450, 150, nClientes, 1);
    idxFaltante = randperm(nClientes, round(0.05*nClientes));
    montoPromedio(idxFaltante) = NaN;
    idxAtipico = randperm(nClientes, round(0.02*nClientes));
    montoPromedio(idxAtipico) = montoPromedio(idxAtipico) * 8;
    m = sprintf('%.6f,', montoPromedio); m = strrep(m, 'NaN', 'null'); m = m(1:end-1);
    fprintf(fid, '"%d":{"r":[%s],"f":[%s],"m":[%s]}', nClientes, ...
        strjoin(string(recenciaDias'), ','), strjoin(string(frecuencia'), ','), m);
    if k < numel(ns), fprintf(fid, ','); end
end
fprintf(fid, '}');
fclose(fid);
fprintf('Datos exportados en %s\n', carpeta);
