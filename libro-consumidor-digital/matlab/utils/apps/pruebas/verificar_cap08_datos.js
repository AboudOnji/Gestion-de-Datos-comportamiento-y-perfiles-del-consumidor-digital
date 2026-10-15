/* verificar_cap08_datos.js — pruebas de la app de datos propios (Cap. 8):
   (1) los Excel de ejemplo, con cuatro escenarios cada uno, dan los mismos resultados que MATLAB
       (referencias_cap08_datos.json): conexiones, grado, componentes, coincidencias de rankings,
       adopción con semillas centrales, periféricas y al azar (100 sorteos), rondas e intermediación máxima;
   (2) la red del libro exportada a Excel reproduce exactamente a cap08.js (las mismas 182 conexiones
       y los mismos resultados con los valores por defecto);
   (3) las reglas de formato detectan los errores típicos.
   Uso:  node pruebas/verificar_cap08_datos.js   (desde matlab/utils/apps) */
'use strict';
const path = require('path'), fs = require('fs');
const raiz = path.join(__dirname, '..');
const XLSX = require(path.join(raiz, 'vendor', 'xlsx.full.min.js'));
const DP = require(path.join(raiz, 'modelos', 'cap02_datos.js'));
const Cap08 = require(path.join(raiz, 'modelos', 'cap08.js'));
const C8 = require(path.join(raiz, 'modelos', 'cap08_datos.js'));
const rand42 = require(path.join(raiz, 'datos', 'rand42.json'));
const refs = require(path.join(__dirname, 'referencias_cap08_datos.json'));

let total = 0, fallas = 0;
function comprobar(n, ok, d) { total++; if (!ok) fallas++; console.log((ok ? '[OK]    ' : '[FALLO] ') + n + (d ? ' · ' + d : '')); }
const cerca = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const leer = (wb, h) => XLSX.utils.sheet_to_json(wb.Sheets[h], { header: 1, raw: true, defval: null, blankrows: false });
const carpeta = path.join(raiz, '..', '..', 'cap08');
const cargar = f => XLSX.read(fs.readFileSync(path.join(carpeta, f)), { type: 'buffer' });
const leerRed = wb => C8.leerRed(DP.procesarTabla(leer(wb, 'Conexiones')), DP.procesarTabla(leer(wb, 'Personas')));

/* (1) contra MATLAB */
const cache = {};
refs.forEach(function (r) {
  const wb = cache[r.archivo] || (cache[r.archivo] = cargar(r.archivo));
  const red = leerRed(wb), tag = r.archivo.replace('cap08_datos_ejemplo', 'ej').replace('.xlsx', '') + ' s=' + r.nSemillas + ' u=' + r.umbral + ' c=' + r.criterio;
  const R = C8.analizar(red, { nSemillas: r.nSemillas, umbral: r.umbral, criterio: r.criterio }, rand42), m = R.metricas;
  comprobar(tag + ': red leída sin errores (' + r.nPersonas + ' personas, ' + r.nConexiones + ' conexiones)', red.errores.length === 0 && m.nPersonas === r.nPersonas && m.nConexiones === r.nConexiones);
  comprobar(tag + ': grado, componentes y coincidencias', cerca(m.gradoMax, r.gradoMax, 1e-12) && cerca(m.gradoProm, r.gradoProm, 1e-12) && m.nComp === r.nComp && m.mayorComp === r.mayorComp && m.coinciden === r.coinciden);
  comprobar(tag + ': intermediación máxima', cerca(m.maxInter, r.maxInter, 1e-8), m.maxInter.toFixed(4) + ' vs ' + r.maxInter.toFixed(4));
  comprobar(tag + ': adopción con semillas centrales', cerca(m.adopGrado, r.adopGrado, 1e-9) && cerca(m.adopInter, r.adopInter, 1e-9) && cerca(m.adopCerc, r.adopCerc, 1e-9),
    [m.adopGrado, m.adopInter, m.adopCerc].map(x => x.toFixed(1)).join('/') + ' vs ' + [r.adopGrado, r.adopInter, r.adopCerc].map(x => x.toFixed(1)).join('/'));
  comprobar(tag + ': adopción con semillas periféricas', cerca(m.perifGrado, r.perifGrado, 1e-9) && cerca(m.perifInter, r.perifInter, 1e-9) && cerca(m.perifCerc, r.perifCerc, 1e-9));
  comprobar(tag + ': promedio de los 100 sorteos al azar', cerca(m.promedioAzar, r.promedioAzar, 1e-9), m.promedioAzar.toFixed(3) + ' vs ' + r.promedioAzar.toFixed(3));
  comprobar(tag + ': adopción final, rondas y mejor criterio', cerca(m.adopFinal, r.adopFinal, 1e-9) && m.rondas === r.rondas && m.mejorCriterio === r.mejorCriterio);
});

/* (2) la red del libro */
{
  const red = leerRed(cargar('cap08_datos_ejemplo.xlsx'));
  const R = C8.analizar(red, C8.DEFECTO, rand42), L = Cap08.ejecutar(Cap08.DEFECTO, rand42);
  comprobar('Libro: 182 conexiones como el script', red.lista.length === L.metricas.nConexiones && L.metricas.nConexiones === 182);
  comprobar('Libro: grado e intermediación idénticos a cap08.js', R.grado.every((g, i) => g === L.grado[i]) && R.inter.every((x, i) => cerca(x, L.inter[i], 1e-9)));
  comprobar('Libro: cercanía idéntica (la red es conexa)', R.cerc.every((x, i) => cerca(x, L.cerc[i], 1e-9)));
  comprobar('Libro: mismas adopciones con semillas centrales y periféricas que cap08.js', cerca(R.metricas.adopGrado, L.metricas.adopGrado, 1e-9) && cerca(R.metricas.adopInter, L.metricas.adopInter, 1e-9) && cerca(R.metricas.adopCerc, L.metricas.adopCerc, 1e-9) &&
    cerca(R.metricas.perifGrado, L.metricas.perifGrado, 1e-9), R.adopCentral.map(x => x.toFixed(1)).join('/'));
  // los sorteos al azar usan aquí el INICIO del flujo de rand (el script lo usa después de generar la red): promedios parecidos, no idénticos
  comprobar('Libro: promedio al azar parecido (±12 puntos; otros 100 sorteos)', Math.abs(R.promAzar - L.promAzar) < 12, R.promAzar.toFixed(1) + ' vs ' + L.promAzar.toFixed(1));
}

/* (3) reglas de formato */
const aristas = n => Array.from({ length: n }, (_, i) => ['u' + (i % 12), 'u' + ((i * 5 + 3) % 12)]).filter(e => e[0] !== e[1]);
const leerF = (con, per) => C8.leerRed(DP.procesarTabla([['Persona_A', 'Persona_B']].concat(con)), per ? DP.procesarTabla(per) : null);
comprobar('Formato: lista correcta sin errores', leerF(aristas(40)).errores.length === 0);
comprobar('Formato: pocas personas', leerF([['a', 'b'], ['b', 'c'], ['c', 'a']]).errores.some(e => /al menos 10 personas/.test(e)));
comprobar('Formato: duplicados y lazos se avisan', (function () { const r = leerF(aristas(40).concat([['u1', 'u1'], ['u2', 'u7'], ['u7', 'u2']])); return r.avisos.some(a => /consigo misma/.test(a)) && r.avisos.some(a => /repetida/.test(a)); })());
comprobar('Formato: persona fuera de la hoja «Personas»', leerF(aristas(40), [['Persona'], ['u0'], ['u1'], ['u2']]).errores.some(e => /no está en la hoja «Personas»/.test(e)));
comprobar('Formato: demasiadas personas', leerF(Array.from({ length: 200 }, (_, i) => ['n' + i, 'n' + (i + 1)])).errores.some(e => /el máximo es 150/.test(e)));
comprobar('Formato: una sola columna', C8.leerRed(DP.procesarTabla([['Persona_A'], ['a'], ['b']]), null).errores.length > 0);

console.log('\n' + (total - fallas) + ' de ' + total + ' comprobaciones correctas.');
process.exit(fallas ? 1 : 0);
