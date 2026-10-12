/* verificar_cap04_datos.js — pruebas de la app de datos propios (Cap. 4):
   (1) los Excel de ejemplo, con tres ventanas de promedio móvil, dan los mismos resultados que MATLAB
       (referencias_cap04_datos.json, generado por referencias_cap04_datos.m): tendencia, amplitud,
       pendiente, mes pico/valle, comparación con el año anterior y frecuencia de términos;
   (2) el modelo reproduce la serie por defecto del script del libro (modelos/cap04.js);
   (3) las reglas de formato detectan los errores típicos (fechas, faltantes, longitud, ciclo).
   Uso:  node pruebas/verificar_cap04_datos.js   (desde matlab/utils/apps) */
'use strict';
const path = require('path'), fs = require('fs');
const raiz = path.join(__dirname, '..');
const XLSX = require(path.join(raiz, 'vendor', 'xlsx.full.min.js'));
const DP = require(path.join(raiz, 'modelos', 'cap02_datos.js'));
const Cap04 = require(path.join(raiz, 'modelos', 'cap04.js'));
const C4 = require(path.join(raiz, 'modelos', 'cap04_datos.js'));
const refs = require(path.join(__dirname, 'referencias_cap04_datos.json'));
const randn = require(path.join(raiz, 'datos', 'randn42.json'));

let total = 0, fallas = 0;
function comprobar(n, ok, d) { total++; if (!ok) fallas++; console.log((ok ? '[OK]    ' : '[FALLO] ') + n + (d ? ' · ' + d : '')); }
const cerca = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const leer = (wb, h) => XLSX.utils.sheet_to_json(wb.Sheets[h], { header: 1, raw: true, defval: null, blankrows: false });
const carpeta = path.join(raiz, '..', '..', 'cap04');
const cargar = f => XLSX.read(fs.readFileSync(path.join(carpeta, f)), { type: 'buffer' });

/* (1) contra MATLAB */
refs.filter(r => r.archivo !== 'terminos').forEach(function (r) {
  const wb = cargar(r.archivo), tabla = DP.procesarTabla(leer(wb, 'Serie')), sug = C4.sugerirColumnas(tabla);
  const S = C4.construirSerie(tabla, sug.fecha, sug.valor);
  const P = { periodosCiclo: r.ventana, ventanaReciente: 4 };
  const D = C4.descomponer(S, P), tag = r.archivo.replace('cap04_datos_ejemplo', 'ej').replace('.xlsx', '') + ' w=' + r.ventana;
  comprobar(tag + ': sin errores y frecuencia semanal detectada', S.errores.length === 0 && S.cicloDetectado === 52 && S.n === 104);
  comprobar(tag + ': mínimo, máximo y promedio', cerca(D.minimo, r.minimo, 1e-9) && cerca(D.maximo, r.maximo, 1e-9) && cerca(D.promedio, r.promedio, 1e-9));
  comprobar(tag + ': amplitud estacional (como el script)', cerca(D.ampEst, r.ampEst, 1e-9), D.ampEst.toFixed(4) + ' vs ' + r.ampEst.toFixed(4));
  comprobar(tag + ': amplitud de la zona central', cerca(D.ampCentral, r.ampCentral, 1e-9), D.ampCentral.toFixed(4) + ' vs ' + r.ampCentral.toFixed(4));
  comprobar(tag + ': pendiente de la tendencia (zona central)', cerca(D.pendiente, r.pendiente, 1e-9), D.pendiente.toFixed(5) + ' vs ' + r.pendiente.toFixed(5));
  comprobar(tag + ': tendencia en el primer y el último punto', cerca(D.tendencia[0], r.tend1, 1e-9) && cerca(D.tendencia[S.n - 1], r.tendFin, 1e-9));
  comprobar(tag + ': mes pico y mes valle', D.mesPico + 1 === r.mesPico && D.mesValle + 1 === r.mesValle, C4.MESES[D.mesPico] + '/' + C4.MESES[D.mesValle] + ' vs ' + r.mesPico + '/' + r.mesValle);
  const A = C4.compararAnioAnterior(S, P);
  if (r.cambioReciente !== undefined) comprobar(tag + ': cambio reciente y del año anterior', cerca(A.cambioReciente, r.cambioReciente, 1e-9) && cerca(A.cambioAnterior, r.cambioAnterior, 1e-9));
  else comprobar(tag + ': sin comparación si la serie es demasiado corta', A === null);
});
const rt = refs.find(r => r.archivo === 'terminos');
const tab = DP.procesarTabla(leer(cargar('cap04_datos_ejemplo.xlsx'), 'Comentarios'));
const com = C4.listaComentarios(tab, 'Comentario');
const T = C4.terminos(com, C4.PALABRAS_VACIAS, { minusculas: true, sinAcentos: false });
comprobar('Comentarios: 20 leídos y 71 términos distintos como MATLAB', com.length === rt.nComentarios && T.distintos === rt.distintos, com.length + '/' + T.distintos);
comprobar('Top 10 términos y frecuencias idénticos a MATLAB (mismo orden)', rt.top.every((t, i) => T.lista[i].palabra === t.palabra && T.lista[i].n === t.n),
  T.lista.slice(0, 10).map(t => t.palabra + t.n).join(' '));

/* (2) la serie por defecto del libro, sin redondear */
const defecto = Cap04.ejecutar(Cap04.DEFECTO, randn).serie;
const filas = [['Fecha', 'Interes']].concat(defecto.fechas.map((f, i) => [f, defecto.observada[i]]));
const S0 = C4.construirSerie(DP.procesarTabla(filas), 'Fecha', 'Interes'), D0 = C4.descomponer(S0, { periodosCiclo: 52, ventanaReciente: 4 });
comprobar('Serie del script (sin redondear): tendencia idéntica a Cap04.ejecutar', D0.tendencia.every((v, i) => cerca(v, defecto.tendencia[i], 1e-12)));
comprobar('Serie del script: componente estacional idéntico', D0.estacional.every((v, i) => cerca(v, defecto.estacional[i], 1e-12)));

/* (3) reglas de formato y casos límite */
const base = (n, f) => [['Fecha', 'Valor']].concat(Array.from({ length: n }, (_, i) => f(i)));
const dia = (i, paso) => new Date(Date.UTC(2024, 0, 1) + i * paso * 86400000).toISOString().slice(0, 10);
const serie = (filas, ...a) => { const t = DP.procesarTabla(filas); return C4.construirSerie(t, 'Fecha', 'Valor', ...a); };
const ok = serie(base(60, i => [dia(i, 7), 50 + i % 7]));
comprobar('Serie semanal válida: sin errores, ciclo 52', ok.errores.length === 0 && ok.cicloDetectado === 52);
comprobar('Serie mensual: ciclo 12', serie(base(40, i => [dia(i, 30.4375 | 0), 10 + i % 5])).cicloDetectado === 12 || serie(base(40, i => [dia(i, 30), 10 + i % 5])).cicloDetectado === 12);
comprobar('Serie diaria: ciclo 365', serie(base(60, i => [dia(i, 1), 10 + i % 5])).cicloDetectado === 365);
comprobar('Menos de 8 puntos: error', serie(base(5, i => [dia(i, 7), i])).errores.length === 1);
const hueco = serie(base(30, i => [dia(i, 7), i === 10 || i === 11 ? null : 100 + i]));
comprobar('Faltantes en medio: se interpolan y se avisa', hueco.rellenados === 2 && Math.abs(hueco.y[10] - 110) < 1e-9 && Math.abs(hueco.y[11] - 111) < 1e-9 && hueco.avisos.some(a => /interpolación/.test(a)), JSON.stringify(hueco.y.slice(9, 13)));
const bordes = serie(base(30, i => [dia(i, 7), i < 2 || i > 27 ? null : 5 + i]));
comprobar('Vacíos al inicio y al final: se recortan', bordes.n === 26 && bordes.avisos.some(a => /inicio o al final/.test(a)), String(bordes.n));
const desorden = base(20, i => [dia(19 - i, 7), 19 - i]);
comprobar('Fechas en desorden: se ordenan', serie(desorden).y[0] === 0 && serie(desorden).y[19] === 19);
const rep = base(20, i => [dia(i === 5 ? 4 : i, 7), i]);
comprobar('Fecha repetida: se conserva la primera y se avisa', serie(rep).n === 19 && serie(rep).avisos.some(a => /repetida/.test(a)));
comprobar('Fechas dd/mm/aaaa y texto ISO se leen', C4.aFecha('16/09/2024') === Date.UTC(2024, 8, 16) && C4.aFecha('2024-09-16') === Date.UTC(2024, 8, 16));
comprobar('Fecha serial de Excel se lee', C4.aFecha(45551) === Date.UTC(2024, 8, 16), new Date(C4.aFecha(45551)).toISOString());
comprobar('Todos los valores iguales: error', serie(base(20, i => [dia(i, 7), 5])).errores.length === 1);
comprobar('Intervalos irregulares (faltan semanas): aviso', serie(base(20, i => [dia(i < 10 ? i : i + 3, 7), i])).avisos.some(a => /intervalos/.test(a)));
const sinFecha = DP.procesarTabla([['Valor'], ...Array.from({ length: 12 }, (_, i) => [i + 1])]);
const sf = C4.construirSerie(sinFecha, null, 'Valor');
comprobar('Sin columna de fecha: se usa 1, 2, 3…', sf.errores.length === 0 && sf.fechas[0] === 1 && !sf.tieneFechas);
const corta = serie(base(30, i => [dia(i, 7), i]));
comprobar('Serie más corta que el ciclo: no hay comparación con el año anterior', C4.compararAnioAnterior(corta, { periodosCiclo: 52, ventanaReciente: 4 }) === null);
comprobar('Serie de un solo ciclo: sin dos ciclos', !C4.descomponer(serie(base(60, i => [dia(i, 7), i % 10])), { periodosCiclo: 52, ventanaReciente: 4 }).dosCiclos);
// veredictos: estacional / inusual
const w = 12, mk = f => serie(base(36, i => [dia(i, 30), f(i)]));
comprobar('Veredicto «estacional» cuando el salto se repite', C4.compararAnioAnterior(mk(i => 20 + (i % 12 >= 8 && i % 12 <= 11 ? (i % 12 - 7) * 10 : 0)), { periodosCiclo: w, ventanaReciente: 2 }).veredicto === 'estacional');
comprobar('Veredicto «inusual» cuando hoy salta y hace un año no', C4.compararAnioAnterior(mk(i => 20 + (i >= 34 ? 40 : 0)), { periodosCiclo: w, ventanaReciente: 2 }).veredicto === 'inusual');
comprobar('Veredicto «sin cambio» con serie plana al final', C4.compararAnioAnterior(mk(i => (i < 20 ? i : 20)), { periodosCiclo: w, ventanaReciente: 2 }).veredicto === 'sin cambio');
// texto
const t2 = C4.terminos(['Precio ALTO', 'precio, bajo', 'Envío rápido!'], ['el'], { minusculas: true, sinAcentos: true });
comprobar('Texto: minúsculas, sin acentos y sin puntuación', t2.lista[0].palabra === 'precio' && t2.lista[0].n === 2 && t2.lista.some(t => t.palabra === 'envio'));
const t3 = C4.terminos(['Precio precio'], [], { minusculas: false });
comprobar('Texto: sin pasar a minúsculas «Precio» y «precio» son distintos', t3.lista.length === 2);
comprobar('Palabras vacías: separa por espacios y comas', C4.limpiarPalabrasVacias('el la, de;  que').length === 4);
comprobar('Sugerir columnas: fecha y valor por nombre', (function () { const t = DP.procesarTabla([['Semana', 'Visitas', 'Otro'], ['2024-01-01', 5, 1], ['2024-01-08', 6, 2]]); const s = C4.sugerirColumnas(t); return s.fecha === 'Semana' && s.valor === 'Visitas'; })());

console.log('\n' + (total - fallas) + ' de ' + total + ' comprobaciones correctas.');
process.exit(fallas ? 1 : 0);
