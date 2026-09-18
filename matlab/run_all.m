%% run_all.m — Ejecuta todos los scripts de laboratorio del libro y registra fallos
% Dr. Aboud Barsekh-Onji · IPN — ESCA Unidad Santo Tomás
% Se ejecuta desde la raíz del proyecto: matlab -batch "run('matlab/run_all.m')"
% Registra éxito/fallo de cada script en docs/registro-matlab.md.
%
% NOTA DE DISEÑO (hallazgo de Fase 0): cada script de capítulo empieza con
% "clc; clear; close all;" por convención (§9.1). Si se ejecutaran con run()
% dentro de ESTE mismo proceso, ese "clear" borraría las variables de este
% propio orquestador (fid, contador, etc.). Por eso cada script se lanza como
% un subproceso MATLAB independiente vía "matlab -batch", igual que lo haría
% un lector siguiendo el libro script por script.
%
% NOTA (Fase 0): solo existe el script de prueba de andamiaje (fase0_prueba).
% Los scripts cap01..cap18 se agregan conforme se escriben los capítulos.

raizProyecto = fileparts(mfilename('fullpath'));
scripts = { fullfile(raizProyecto, 'fase0_prueba', 'script_prueba.m') };
% TODO (Fase 2+): agregar aquí matlab/capNN/*.m conforme se escriban los capítulos.

logPath = fullfile(raizProyecto, '..', 'docs', 'registro-matlab.md');
fid = fopen(logPath, 'w');
fprintf(fid, '# Registro de ejecución de scripts MATLAB\n\n');
fprintf(fid, 'Última ejecución: %s\n\n', datestr(now, 'yyyy-mm-dd HH:MM'));
fprintf(fid, '| Script | Estado | Mensaje |\n|---|---|---|\n');

for i = 1:numel(scripts)
    scriptActual = scripts{i};
    [carpeta, nombre] = fileparts(scriptActual);
    comando = sprintf('matlab -batch "run(''%s'')"', scriptActual);
    [estado, salida] = system(comando);
    if estado == 0
        fprintf(fid, '| %s | OK | — |\n', nombre);
        fprintf('[OK] %s\n', nombre);
    else
        mensaje = strrep(salida, newline, ' ');
        if numel(mensaje) > 200
            mensaje = [mensaje(1:200) '...'];
        end
        fprintf(fid, '| %s | FALLO | %s |\n', nombre, mensaje);
        fprintf('[FALLO] %s: %s\n', nombre, mensaje);
    end
end

fclose(fid);
fprintf('Registro escrito en docs/registro-matlab.md\n');
