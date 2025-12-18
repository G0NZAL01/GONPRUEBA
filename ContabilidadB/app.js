// ===========================================================
// app.js — Contabilidad Local (CÓDIGO COMPLETO CORREGIDO)
// ===========================================================

// 1. GESTIÓN DE DATOS
class GestorDatos {
    constructor() {
        this.datos = this.cargarDatos();
        this.calcularSaldos();
    }

    cargarDatos() {
        const datosGuardados = localStorage.getItem('contabilidad_datos');
        return datosGuardados ? JSON.parse(datosGuardados) : { movimientos: [], saldos: { banco: 0, cash: 0, total: 0 } };
    }

    guardarDatos() {
        localStorage.setItem('contabilidad_datos', JSON.stringify(this.datos));
        this.calcularSaldos();
        return this.datos;
    }

    calcularSaldos() {
        const saldoBanco = this.datos.movimientos.filter(m => m.tipo === 'BANCO').reduce((sum, mov) => sum + mov.cantidad, 0);
        const saldoCash = this.datos.movimientos.filter(m => m.tipo === 'CASH').reduce((sum, mov) => sum + mov.cantidad, 0);
        this.datos.saldos = {
            banco: Math.round(saldoBanco * 100) / 100,
            cash: Math.round(saldoCash * 100) / 100,
            total: Math.round((saldoBanco + saldoCash) * 100) / 100
        };
    }

    agregarMovimiento(movimiento) {
        movimiento.id = Date.now().toString();
        // Almacenar en formato yyyy-mm-dd para ordenamiento
        movimiento.fecha = movimiento.fecha || this.formatearFechaParaAlmacenar(new Date());
        this.datos.movimientos.push(movimiento);
        return this.guardarDatos();
    }

    eliminarMovimiento(id) {
        this.datos.movimientos = this.datos.movimientos.filter(m => m.id !== id);
        return this.guardarDatos();
    }

    modificarMovimiento(id, movimientoActualizado) {
        const index = this.datos.movimientos.findIndex(m => m.id === id);
        if (index !== -1) {
            movimientoActualizado.id = id;
            // Asegurar que la fecha esté en formato de almacenamiento
            movimientoActualizado.fecha = this.formatearFechaParaAlmacenar(movimientoActualizado.fecha);
            this.datos.movimientos[index] = movimientoActualizado;
            return this.guardarDatos();
        }
        return this.datos;
    }

    importarDatos(jsonData) {
        try {
            const datosImportados = JSON.parse(jsonData);
            // Convertir fechas a formato de almacenamiento si vienen en formato dd/mm/yyyy
            if (datosImportados.movimientos) {
                datosImportados.movimientos.forEach(mov => {
                    if (mov.fecha && mov.fecha.includes('/')) {
                        mov.fecha = this.convertirDDMMYYYYaYYYYMMDD(mov.fecha);
                    }
                });
            }
            this.datos = datosImportados;
            this.guardarDatos();
            return true;
        } catch {
            return false;
        }
    }

    exportarDatos() {
        // Exportar con fechas en formato dd/mm/yyyy para mejor legibilidad
        const datosExportar = JSON.parse(JSON.stringify(this.datos));
        datosExportar.movimientos.forEach(mov => {
            mov.fecha = this.formatearFechaParaMostrar(mov.fecha);
        });
        return JSON.stringify(datosExportar, null, 2);
    }

    // Convertir fecha dd/mm/yyyy a yyyy-mm-dd para almacenamiento
    convertirDDMMYYYYaYYYYMMDD(fechaString) {
        if (!fechaString) return fechaString;
        const partes = fechaString.split('/');
        if (partes.length === 3) {
            const [dia, mes, anio] = partes;
            return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        }
        return fechaString;
    }

    // Convertir fecha yyyy-mm-dd a dd/mm/yyyy para mostrar
    formatearFechaParaMostrar(fechaString) {
        if (!fechaString) return fechaString;
        if (fechaString.includes('/')) {
            // Ya está en formato dd/mm/yyyy
            return fechaString;
        }
        const partes = fechaString.split('-');
        if (partes.length === 3) {
            const [anio, mes, dia] = partes;
            return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${anio}`;
        }
        return fechaString;
    }

    // Formatear fecha para almacenamiento (yyyy-mm-dd)
    formatearFechaParaAlmacenar(fechaString) {
        if (!fechaString) return fechaString;
        
        // Si ya está en formato yyyy-mm-dd
        if (fechaString.includes('-') && fechaString.split('-')[0].length === 4) {
            return fechaString;
        }
        
        // Si está en formato dd/mm/yyyy, convertir
        if (fechaString.includes('/')) {
            return this.convertirDDMMYYYYaYYYYMMDD(fechaString);
        }
        
        // Si es una fecha de JavaScript
        if (fechaString instanceof Date || !isNaN(Date.parse(fechaString))) {
            const fecha = new Date(fechaString);
            const anio = fecha.getFullYear();
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const dia = String(fecha.getDate()).padStart(2, '0');
            return `${anio}-${mes}-${dia}`;
        }
        
        return fechaString;
    }
}

// 2. VARIABLES GLOBALES E INICIALIZACIÓN
let editandoMovimientoId = null;
let todosLosMovimientos = [];
const gestorDatos = new GestorDatos();

document.addEventListener('DOMContentLoaded', () => {
    const datos = gestorDatos.datos;
    // Ordenar movimientos por fecha más reciente primero
    datos.movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    todosLosMovimientos = datos.movimientos;
    
    // Configurar la fecha actual en el input en formato dd/mm/yyyy
    const fechaActual = new Date();
    const dia = String(fechaActual.getDate()).padStart(2, '0');
    const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const anio = fechaActual.getFullYear();
    document.getElementById('inputFecha').value = `${dia}/${mes}/${anio}`;
    
    actualizarTablaYDom(datos);
});

// 3. FUNCIONES CRUD Y DOM
function actualizarTablaYDom(datos) {
    const tablaBody = document.getElementById('tablaMovimientos');
    if (!tablaBody) return;
    
    // Ordenar movimientos por fecha más reciente primero
    datos.movimientos.sort((a, b) => {
        // Si alguna fecha no está definida, manejarlo como fecha muy antigua
        const fechaA = a.fecha ? new Date(a.fecha) : new Date(0);
        const fechaB = b.fecha ? new Date(b.fecha) : new Date(0);
        return fechaB - fechaA; // Orden descendente (más reciente primero)
    });
    
    tablaBody.innerHTML = '';

    datos.movimientos.forEach(mov => {
        const fila = tablaBody.insertRow();
        fila.id = `movimiento-${mov.id}`;
        // Mostrar fecha en formato dd/mm/yyyy
        fila.insertCell().textContent = gestorDatos.formatearFechaParaMostrar(mov.fecha);
        fila.insertCell().textContent = mov.asunto;
        fila.insertCell().textContent = mov.tipo;
        fila.insertCell().textContent = parseFloat(mov.cantidad).toFixed(2) + ' €';

        const cellAcciones = fila.insertCell();
        cellAcciones.innerHTML = `
            <div class="acciones-botones">
                <button class="btn-modificar" onclick="iniciarModificacion('${mov.id}')">✏️</button>
                <button class="btn-eliminar" onclick="eliminarMovimiento('${mov.id}')">🗑️</button>
            </div>
        `;
    });

    document.getElementById('saldoBanco').textContent = datos.saldos.banco.toFixed(2);
    document.getElementById('saldoCash').textContent = datos.saldos.cash.toFixed(2);
    document.getElementById('saldoTotal').textContent = datos.saldos.total.toFixed(2);

    editandoMovimientoId = null;
    const btnGuardar = document.querySelector('button[onclick="guardarMovimiento()"]');
    if (btnGuardar) btnGuardar.textContent = 'OK / GUARDAR';
    
    // Actualizar todosLosMovimientos con el orden correcto
    todosLosMovimientos = [...datos.movimientos];
}

function guardarMovimiento() {
    let fecha = document.getElementById('inputFecha').value.trim();
    const asunto = document.getElementById('inputAsunto').value.trim();
    const tipo = document.getElementById('inputTipo').value;
    const cantidadStr = document.getElementById('inputCantidad').value.trim();

    // Validar formato de fecha dd/mm/yyyy
    if (!fecha || !asunto || !tipo || !cantidadStr) {
        alert("Por favor, rellena todos los campos.");
        return;
    }

    // Validar formato de fecha
    const regexFecha = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = fecha.match(regexFecha);
    if (!match) {
        alert("Formato de fecha incorrecto. Usa dd/mm/yyyy (ej: 25/12/2023)");
        return;
    }

    const [, dia, mes, anio] = match;
    // Validar fecha real
    const fechaObj = new Date(anio, mes - 1, dia);
    if (fechaObj.getDate() != dia || fechaObj.getMonth() + 1 != mes || fechaObj.getFullYear() != anio) {
        alert("Fecha no válida. Verifica el día, mes y año.");
        return;
    }

    // Asegurar formato dd/mm/yyyy con ceros a la izquierda
    fecha = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`;

    const cantidad = Number(cantidadStr.replace(',', '.'));
    if (!isFinite(cantidad)) {
        alert("La cantidad debe ser un número válido.");
        return;
    }

    const movimientoData = { fecha, asunto, tipo, cantidad };

    const datos = editandoMovimientoId
        ? gestorDatos.modificarMovimiento(editandoMovimientoId, movimientoData)
        : gestorDatos.agregarMovimiento(movimientoData);

    // Ordenar los datos antes de actualizar la tabla
    datos.movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    actualizarTablaYDom(datos);
    limpiarFormulario();
}

function limpiarFormulario() {
    // Establecer fecha actual en formato dd/mm/yyyy
    const fechaActual = new Date();
    const dia = String(fechaActual.getDate()).padStart(2, '0');
    const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const anio = fechaActual.getFullYear();
    
    document.getElementById('inputFecha').value = `${dia}/${mes}/${anio}`;
    document.getElementById('inputAsunto').value = '';
    document.getElementById('inputTipo').value = '';
    document.getElementById('inputCantidad').value = '';
    document.getElementById('inputAsunto').focus();
}

function eliminarMovimiento(id) {
    if (!confirm('¿Estás seguro?')) return;
    const datos = gestorDatos.eliminarMovimiento(id);
    // Ordenar los datos antes de actualizar la tabla
    datos.movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    actualizarTablaYDom(datos);
}

function iniciarModificacion(id) {
    const mov = todosLosMovimientos.find(m => m.id === id);
    if (!mov) return;

    // Mostrar fecha en formato dd/mm/yyyy
    document.getElementById('inputFecha').value = gestorDatos.formatearFechaParaMostrar(mov.fecha);
    document.getElementById('inputAsunto').value = mov.asunto;
    document.getElementById('inputTipo').value = mov.tipo;
    document.getElementById('inputCantidad').value = mov.cantidad;

    editandoMovimientoId = id;
    document.querySelector('button[onclick="guardarMovimiento()"]').textContent = 'ACTUALIZAR';
    document.querySelector('.formulario').scrollIntoView({ behavior: 'smooth' });
}

// 4. FILTROS
function aplicarFiltros() {
    const fechaDesde = document.getElementById('filtroFechaDesde').value;
    const fechaHasta = document.getElementById('filtroFechaHasta').value;
    const cantidadMin = document.getElementById('filtroCantidadMin').value;
    const cantidadMax = document.getElementById('filtroCantidadMax').value;
    const tipo = document.getElementById('filtroTipo').value;

    let movs = [...todosLosMovimientos];
    
    // Convertir fechas de filtro a formato yyyy-mm-dd para comparación
    if (fechaDesde) {
        const fechaDesdeFormatted = gestorDatos.convertirDDMMYYYYaYYYYMMDD(fechaDesde);
        movs = movs.filter(m => m.fecha >= fechaDesdeFormatted);
    }
    if (fechaHasta) {
        const fechaHastaFormatted = gestorDatos.convertirDDMMYYYYaYYYYMMDD(fechaHasta);
        movs = movs.filter(m => m.fecha <= fechaHastaFormatted);
    }
    if (cantidadMin) movs = movs.filter(m => m.cantidad >= parseFloat(cantidadMin));
    if (cantidadMax) movs = movs.filter(m => m.cantidad <= parseFloat(cantidadMax));
    if (tipo) movs = movs.filter(m => m.tipo === tipo);

    // Ordenar los movimientos filtrados por fecha más reciente primero
    movs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    actualizarTablaYDom({ movimientos: movs, saldos: gestorDatos.datos.saldos });
}

function limpiarFiltros() {
    document.getElementById('filtroFechaDesde').value = '';
    document.getElementById('filtroFechaHasta').value = '';
    document.getElementById('filtroCantidadMin').value = '';
    document.getElementById('filtroCantidadMax').value = '';
    document.getElementById('filtroTipo').value = '';
    
    // Asegurar que todosLosMovimientos esté ordenado
    gestorDatos.datos.movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    actualizarTablaYDom(gestorDatos.datos);
}

// 5. EXPORTACIÓN E IMPORTACIÓN
function exportarDatos() {
    try {
        const datos = gestorDatos.exportarDatos();
        const blob = new Blob([datos], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contabilidad_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) { alert('Error al exportar'); }
}

function exportarDatosAlternativo() {
    const datos = gestorDatos.exportarDatos();
    const nombreArchivo = 'contabilidad_' + new Date().toISOString().split('T')[0] + '.json';
    const nuevaVentana = window.open('', '_blank');
    
    if (!nuevaVentana) return alert('Permite las ventanas emergentes');

    nuevaVentana.document.write(`
        <html>
        <head>
            <title>Exportar</title>
            <style>
                body { font-family: sans-serif; padding: 20px; background: #f0f0f0; }
                .card { background: white; padding: 20px; border-radius: 8px; max-width: 800px; margin: auto; }
                pre { background: #272822; color: white; padding: 15px; border-radius: 5px; overflow: auto; max-height: 400px; }
                .btn-group { display: flex; gap: 10px; margin: 20px 0; }
                button { padding: 10px 20px; cursor: pointer; border: none; border-radius: 4px; font-weight: bold; }
                .btn-copy { background: #28a745; color: white; }
                .btn-close { background: #dc3545; color: white; }
                #msg { color: green; display: none; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>📊 Exportación de Datos</h2>
                <p>Copia el contenido y guárdalo como <b>${nombreArchivo}</b></p>
                <div id="msg">✅ ¡Copiado!</div>
                <div class="btn-group">
                    <button class="btn-copy" onclick="copiar()">📋 Copiar Texto</button>
                    <button class="btn-close" onclick="window.close()">🔙 Volver</button>
                </div>
                <pre id="jsonText">${datos}</pre>
            </div>
            <script>
                function copiar() {
                    const text = document.getElementById('jsonText').innerText;
                    navigator.clipboard.writeText(text).then(() => {
                        document.getElementById('msg').style.display = 'block';
                        setTimeout(() => document.getElementById('msg').style.display = 'none', 2000);
                    });
                }
            </script>
        </body>
        </html>
    `);
    nuevaVentana.document.close();
}

function manejarImportacion() {
    const input = document.getElementById('inputArchivo');
    const archivo = input.files[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        if (gestorDatos.importarDatos(e.target.result)) {
            // Ordenar después de importar
            gestorDatos.datos.movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            alert("✅ Importado correctamente");
            actualizarTablaYDom(gestorDatos.datos);
        } else {
            alert("❌ Error en el archivo");
        }
    };
    reader.readAsText(archivo);
    input.value = '';
}