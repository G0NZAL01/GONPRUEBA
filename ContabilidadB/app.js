// app.js - Versión con exportar alternativo restaurado (copiar al portapapeles)

let movimientos = JSON.parse(localStorage.getItem('movimientos')) || [];

// Función para formatear fecha de YYYY-MM-DD a dd/mm/yyyy
function formatearFecha(yyyy_mm_dd) {
    if (!yyyy_mm_dd) return '';
    const [año, mes, día] = yyyy_mm_dd.split('-');
    return `${día}/${mes}/${año}`;
}

// Función para convertir dd/mm/yyyy a YYYY-MM-DD (para compatibilidad)
function fechaToISO(dd_mm_yyyy) {
    if (!dd_mm_yyyy) return '';
    const [día, mes, año] = dd_mm_yyyy.split('/');
    return `${año}-${mes.padStart(2, '0')}-${día.padStart(2, '0')}`;
}

function guardarMovimiento() {
    const fechaInput = document.getElementById('inputFecha').value; // YYYY-MM-DD
    const asunto = document.getElementById('inputAsunto').value.trim();
    const tipo = document.getElementById('inputTipo').value;
    const cantidadStr = document.getElementById('inputCantidad').value.trim();

    if (!fechaInput || !asunto || !tipo || !cantidadStr) {
        alert("⚠️ Por favor, completa todos los campos.");
        return;
    }

    const cantidad = parseFloat(cantidadStr);
    if (isNaN(cantidad)) {
        alert("⚠️ La cantidad debe ser un número válido (ej: 150 o -35.50).");
        return;
    }

    const fecha = formatearFecha(fechaInput);

    const movimiento = {
        fecha: fecha,
        fechaISO: fechaInput,
        asunto,
        tipo,
        cantidad
    };

    movimientos.push(movimiento);
    localStorage.setItem('movimientos', JSON.stringify(movimientos));

    limpiarFormulario();
    restaurarBotonGuardar();
    actualizarTabla();
    actualizarSaldos();
}

function limpiarFormulario() {
    document.getElementById('inputFecha').value = '';
    document.getElementById('inputAsunto').value = '';
    document.getElementById('inputTipo').value = '';
    document.getElementById('inputCantidad').value = '';
}

function restaurarBotonGuardar() {
    const boton = document.querySelector('.formulario button');
    boton.textContent = 'OK / GUARDAR';
    boton.onclick = guardarMovimiento;
}

function editarMovimiento(index) {
    const mov = movimientos[index];

    const [día, mes, año] = mov.fecha.split('/');
    document.getElementById('inputFecha').value = `${año}-${mes.padStart(2, '0')}-${día.padStart(2, '0')}`;

    document.getElementById('inputAsunto').value = mov.asunto;
    document.getElementById('inputTipo').value = mov.tipo;
    document.getElementById('inputCantidad').value = mov.cantidad;

    const boton = document.querySelector('.formulario button');
    boton.textContent = '💾 ACTUALIZAR';
    boton.onclick = function() {
        actualizarMovimiento(index);
    };
}

function actualizarMovimiento(index) {
    const fechaInput = document.getElementById('inputFecha').value;
    const asunto = document.getElementById('inputAsunto').value.trim();
    const tipo = document.getElementById('inputTipo').value;
    const cantidadStr = document.getElementById('inputCantidad').value.trim();

    if (!fechaInput || !asunto || !tipo || !cantidadStr) {
        alert("⚠️ Por favor, completa todos los campos.");
        return;
    }

    const cantidad = parseFloat(cantidadStr);
    if (isNaN(cantidad)) {
        alert("⚠️ La cantidad debe ser un número válido.");
        return;
    }

    const fecha = formatearFecha(fechaInput);

    movimientos[index] = {
        fecha: fecha,
        fechaISO: fechaInput,
        asunto,
        tipo,
        cantidad
    };

    localStorage.setItem('movimientos', JSON.stringify(movimientos));

    limpiarFormulario();
    restaurarBotonGuardar();
    actualizarTabla();
    actualizarSaldos();
}

function eliminarMovimiento(index) {
    if (confirm("¿Seguro que quieres eliminar este movimiento?")) {
        movimientos.splice(index, 1);
        localStorage.setItem('movimientos', JSON.stringify(movimientos));
        actualizarTabla();
        actualizarSaldos();
    }
}

function obtenerMovimientosOrdenados(lista = movimientos) {
    return [...lista].sort((a, b) => b.fechaISO.localeCompare(a.fechaISO));
}

function actualizarTabla(filtrados = movimientos) {
    const tbody = document.getElementById('tablaMovimientos');
    tbody.innerHTML = '';

    const listaOrdenada = obtenerMovimientosOrdenados(filtrados);

    if (listaOrdenada.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No hay movimientos registrados</td></tr>';
        return;
    }

    listaOrdenada.forEach((mov, indexOriginal) => {
        const indexReal = movimientos.indexOf(mov);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${mov.fecha}</td>
            <td>${mov.asunto}</td>
            <td>${mov.tipo}</td>
            <td class="${mov.cantidad >= 0 ? 'ingreso' : 'gasto'}">${mov.cantidad.toFixed(2)} €</td>
            <td class="acciones">
                <button onclick="editarMovimiento(${indexReal})">✏️</button>
                <button onclick="eliminarMovimiento(${indexReal})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarSaldos() {
    let saldoBanco = 0;
    let saldoCash = 0;

    movimientos.forEach(mov => {
        if (mov.tipo === 'BANCO') saldoBanco += mov.cantidad;
        else if (mov.tipo === 'CASH') saldoCash += mov.cantidad;
    });

    document.getElementById('saldoBanco').textContent = saldoBanco.toFixed(2);
    document.getElementById('saldoCash').textContent = saldoCash.toFixed(2);
    document.getElementById('saldoTotal').textContent = (saldoBanco + saldoCash).toFixed(2);
}

function aplicarFiltros() {
    let filtrados = [...movimientos];

    const fechaDesde = document.getElementById('filtroFechaDesde').value;
    const fechaHasta = document.getElementById('filtroFechaHasta').value;
    const cantidadMin = parseFloat(document.getElementById('filtroCantidadMin').value);
    const cantidadMax = parseFloat(document.getElementById('filtroCantidadMax').value);
    const tipo = document.getElementById('filtroTipo').value;

    if (fechaDesde) filtrados = filtrados.filter(mov => mov.fechaISO >= fechaDesde);
    if (fechaHasta) filtrados = filtrados.filter(mov => mov.fechaISO <= fechaHasta);
    if (!isNaN(cantidadMin)) filtrados = filtrados.filter(mov => mov.cantidad >= cantidadMin);
    if (!isNaN(cantidadMax)) filtrados = filtrados.filter(mov => mov.cantidad <= cantidadMax);
    if (tipo) filtrados = filtrados.filter(mov => mov.tipo === tipo);

    actualizarTabla(filtrados);
}

function limpiarFiltros() {
    document.getElementById('filtroFechaDesde').value = '';
    document.getElementById('filtroFechaHasta').value = '';
    document.getElementById('filtroCantidadMin').value = '';
    document.getElementById('filtroCantidadMax').value = '';
    document.getElementById('filtroTipo').value = '';
    actualizarTabla();
}

function exportarDatos() {
    const dataStr = JSON.stringify(movimientos, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contabilidad_b_datos.json';
    a.click();
    URL.revokeObjectURL(url);
}

// CAMBIO AQUÍ: Restaurado al comportamiento original (copiar al portapapeles)
function exportarDatosAlternativo() {
    const datosJSON = JSON.stringify(movimientos, null, 2);
    
    // Intentamos copiar al portapapeles (funciona en la mayoría de navegadores modernos y apps WebView)
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(datosJSON).then(() => {
            alert("✅ Datos copiados al portapapeles.\nPégalo en un archivo .json para guardar.");
        }).catch(() => {
            // Fallback si falla clipboard
            prompt("No se pudo copiar automáticamente. Copia manualmente:", datosJSON);
        });
    } else {
        // Fallback para navegadores muy antiguos
        prompt("Copia el texto de abajo y guárdalo en un archivo .json:", datosJSON);
    }
}

function manejarImportacion() {
    const archivo = document.getElementById('inputArchivo').files[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const datos = JSON.parse(e.target.result);
            if (Array.isArray(datos)) {
                movimientos = datos.map(mov => {
                    if (!mov.fechaISO && mov.fecha) {
                        mov.fechaISO = fechaToISO(mov.fecha);
                    }
                    return mov;
                });
                localStorage.setItem('movimientos', JSON.stringify(movimientos));
                actualizarTabla();
                actualizarSaldos();
                alert("✅ Datos importados correctamente.");
            } else {
                alert("❌ Formato de archivo incorrecto.");
            }
        } catch (err) {
            alert("❌ Error al leer el archivo JSON.");
        }
    };
    reader.readAsText(archivo);
}

// Inicializar la aplicación
actualizarTabla();
actualizarSaldos();