/* datos_comun.js — piezas de interfaz compartidas por las apps «datos propios» de los
   Cap. 6 a 9: lectura de Excel/CSV con SheetJS, zona de arrastrar y soltar, vista previa de
   una tabla y descarga de resultados en Excel. Solo para el navegador. */
(function (raiz) {
  'use strict';
  const DatosUI = {};
  const normalizarNombre = n => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  DatosUI.normalizarNombre = normalizarNombre;

  // Lee un archivo (.xlsx, .xls, .ods, .csv) y devuelve {nombres, hoja(nombre) -> filas}
  DatosUI.leerLibro = function (archivo, alListo, alError) {
    const lector = new FileReader();
    lector.onload = function (e) {
      try {
        const bytes = new Uint8Array(e.target.result);
        let wb;
        if (/\.(csv|txt)$/i.test(archivo.name)) {
          let texto;
          try { texto = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch (_) { texto = new TextDecoder('windows-1252').decode(bytes); }
          wb = XLSX.read(texto.replace(/^﻿/, ''), { type: 'string' });
        } else wb = XLSX.read(bytes, { type: 'array' });
        alListo(DatosUI.envolverLibro(wb));
      } catch (err) { alError(err); }
    };
    lector.readAsArrayBuffer(archivo);
  };
  DatosUI.envolverLibro = function (wb) {
    return {
      nombres: wb.SheetNames,
      hoja: n => XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: null, blankrows: false }),
      buscar: function (...claves) { // primera hoja cuyo nombre normalizado empieza con alguna clave
        return wb.SheetNames.find(n => claves.some(c => normalizarNombre(n).startsWith(c)));
      }
    };
  };
  // Libro en memoria a partir de {hojas: {Nombre: filas}} (ejemplos incluidos en la página)
  DatosUI.libroDeObjeto = function (hojas) {
    const nombres = Object.keys(hojas);
    return { nombres, hoja: n => hojas[n], buscar: (...claves) => nombres.find(n => claves.some(c => normalizarNombre(n).startsWith(c))) };
  };

  DatosUI.conectarSubida = function (input, caja, alArchivo) {
    input.addEventListener('change', () => { if (input.files[0]) alArchivo(input.files[0]); input.value = ''; });
    ['dragenter', 'dragover'].forEach(ev => caja.addEventListener(ev, e => { e.preventDefault(); caja.classList.add('encima'); }));
    ['dragleave', 'drop'].forEach(ev => caja.addEventListener(ev, e => { e.preventDefault(); caja.classList.remove('encima'); }));
    caja.addEventListener('drop', e => { if (e.dataTransfer.files[0]) alArchivo(e.dataTransfer.files[0]); });
  };

  // Vista previa (primeras n filas) de una tabla de DatosPropios.procesarTabla
  DatosUI.vistaTabla = function (tabla, n) {
    n = n || 8;
    let h = '<table class="tabla"><thead><tr><th>Fila</th>' + tabla.columnas.map(c => '<th>' + UI.esc(c.nombre) + '</th>').join('') + '</tr></thead><tbody>';
    tabla.filasDatos.slice(0, n).forEach(r => {
      h += '<tr><td>' + r.filaExcel + '</td>' + r.celdas.map(v => '<td>' + (v === null || v === undefined ? '<i>vacía</i>' : UI.esc(v)) + '</td>').join('') + '</tr>';
    });
    return h + '</tbody></table><div class="nota">Primeras ' + Math.min(n, tabla.filasDatos.length) + ' filas de ' + tabla.filasDatos.length + ' (número de fila como en Excel).</div>';
  };

  // hojas: [{nombre, filas (arreglo de arreglos), anchos (opcional)}]
  DatosUI.descargarLibro = function (archivo, hojas) {
    const wb = XLSX.utils.book_new();
    hojas.forEach(function (h) {
      const ws = XLSX.utils.aoa_to_sheet(h.filas);
      if (h.anchos) ws['!cols'] = h.anchos.map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws, h.nombre);
    });
    XLSX.writeFile(wb, archivo);
  };

  DatosUI.cajaEstado = function (sel, tabla, origen, extra) {
    const est = UI.$(sel);
    if (!tabla) { est.textContent = 'Aún no hay datos.'; return; }
    est.innerHTML = (tabla.errores.length ? '⚠ ' : '✔ ') + '<b>' + UI.esc(origen) + '</b> · ' + tabla.filasDatos.length + ' filas' + (extra || '') +
      (tabla.errores.length ? '<br>' + tabla.errores.map(UI.esc).join('<br>') : '') +
      (tabla.avisos.length ? '<br>' + tabla.avisos.map(a => 'ℹ ' + UI.esc(a)).join('<br>') : '');
  };

  raiz.DatosUI = DatosUI;
})(this);
