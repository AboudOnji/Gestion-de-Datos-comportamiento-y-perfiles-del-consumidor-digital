%% referencias_cap04_datos.m — Referencia MATLAB para la app de datos propios (Cap. 4)
% Autor:        Dr. Aboud Barsekh-Onji
% Institución:  IPN — ESCA Unidad Santo Tomás
% Descripción:  Lee matlab/cap04/cap04_datos_ejemplo.xlsx (hojas «Serie» y «Comentarios») y
%               matlab/cap04/cap04_datos_ejemplo_caso.xlsx (estudio de caso) y aplica la
%               lógica de cap04_series_texto.m con tres ventanas de media móvil (52, 13 y 4):
%               tendencia = movmean(y, w), estacional = y - tendencia, amplitud, pendiente
%               y amplitud de la zona central, mes pico/valle de la estacionalidad media, cambio
%               de los últimos k periodos contra los k anteriores y contra un ciclo antes, y
%               los 10 términos más frecuentes (Text Analytics Toolbox, mismo flujo del script).
%               Guarda referencias_cap04_datos.json para verificar_cap04_datos.js.
% Uso:          matlab -batch "run('referencias_cap04_datos.m')"

carpeta = fileparts(mfilename('fullpath'));
cap04 = fullfile(carpeta, '..', '..', '..', 'cap04');
archivos = {'cap04_datos_ejemplo.xlsx', 'cap04_datos_ejemplo_caso.xlsx'};
ventanas = [52 13 4];
k = 4;
salida = {};
for a = 1:numel(archivos)
    T = readtable(fullfile(cap04, archivos{a}), 'Sheet', 'Serie');
    y = T.Interes_busqueda; fechas = T.Fecha; n = numel(y);
    for w = ventanas
        tend = movmean(y, w);
        est = y - tend;
        bordes = min(floor(w/2), floor(n/2));
        i1 = bordes + 1; i2 = n - bordes;                  % zona central (base 1)
        r = struct('archivo', archivos{a}, 'ventana', w);
        r.minimo = min(y); r.maximo = max(y); r.promedio = mean(y);
        r.ampEst = max(est) - min(est);
        r.ampCentral = max(est(i1:i2)) - min(est(i1:i2));
        r.pendiente = (tend(i2) - tend(i1)) / (i2 - i1);
        r.tend1 = tend(1); r.tendFin = tend(end);
        % estacionalidad media por mes (zona central)
        m = month(fechas(i1:i2)); e = est(i1:i2);
        perfil = nan(12,1);
        for q = 1:12, if any(m == q), perfil(q) = mean(e(m == q)); end, end
        [~, mp] = max(perfil); [~, mv] = min(perfil);
        r.mesPico = mp; r.mesValle = mv;
        if n >= w + 2*k
            r.cambioReciente = mean(y(n-k+1:n)) - mean(y(n-2*k+1:n-k));
            r.cambioAnterior = mean(y(n-k-w+1:n-w)) - mean(y(n-2*k-w+1:n-k-w));
        end
        salida{end+1} = r; %#ok<SAGROW>
    end
end

% Frecuencia de términos: mismo flujo del script (erasePunctuation, tokenizedDocument, removeWords, bagOfWords)
C = readtable(fullfile(cap04, 'cap04_datos_ejemplo.xlsx'), 'Sheet', 'Comentarios');
comentarios = string(C.Comentario);
documentos = tokenizedDocument(erasePunctuation(comentarios));
palabrasVacias = ["el","la","los","las","un","una","unos","unas","y","o", ...
    "de","del","al","a","en","que","se","con","por","para","mi","muy", ...
    "lo","su","fue","es","fui","tuve","fallo","esta","estaba","pero","no"];
documentos = removeWords(documentos, palabrasVacias);
bolsa = bagOfWords(documentos);
conteo = full(sum(bolsa.Counts, 1));
[frec, orden] = sort(conteo, 'descend');
palabras = bolsa.Vocabulary(orden);
top = struct('palabra', {}, 'n', {});
for i = 1:10, top(i).palabra = char(palabras(i)); top(i).n = frec(i); end
salida{end+1} = struct('archivo', 'terminos', 'nComentarios', numel(comentarios), 'distintos', numel(palabras), 'top', top);

fid = fopen(fullfile(carpeta, 'referencias_cap04_datos.json'), 'w');
fprintf(fid, '%s', jsonencode(salida, 'PrettyPrint', true));
fclose(fid);
fprintf('Referencias escritas en %s\n', fullfile(carpeta, 'referencias_cap04_datos.json'));
