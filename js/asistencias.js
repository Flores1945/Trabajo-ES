import { ref, get, push, set, update } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";
import { db } from "./firebase-config.js";
import {
    initPaginaProtegida,
    configurarCerrarSesion,
    puedeExportarAsistencias
} from "./auth-roles.js";
import { registrarMovimiento } from "./auditoria.js";
import { exportarAsistenciasExcelFormal } from "./export-excel-asistencias.js";
import {
    NIVEL_PRIMARIA,
    NIVEL_SECUNDARIA,
    SECCIONES,
    gradosPorNivel,
    generarNombreCompletoAleatorio
} from "./catalogo-escolar.js";

const usuario = initPaginaProtegida("asistencias");
if (!usuario) {
    throw new Error("Sin sesion");
}

configurarCerrarSesion();

if (!puedeExportarAsistencias(usuario.cargo)) {
    document.getElementById("bloqueExportacion")?.classList.add("oculto");
}

const filtroGrado = document.getElementById("filtroGrado");
const filtroSeccion = document.getElementById("filtroSeccion");
const filtroTurno = document.getElementById("filtroTurno");
const filtroFechaDesde = document.getElementById("filtroFechaDesde");
const filtroFechaHasta = document.getElementById("filtroFechaHasta");
const buscarEstudiante = document.getElementById("buscarEstudiante");
const exportarSeleccionBtn = document.getElementById("exportarSeleccionBtn");
const exportarTodoBtn = document.getElementById("exportarTodoBtn");
const cargarDemoBtn = document.getElementById("cargarDemoBtn");
const limpiarDemoBtn = document.getElementById("limpiarDemoBtn");
const tablaAsistenciasBody = document.getElementById("tablaAsistenciasBody");
const tablaIndicadoresBody = document.getElementById("tablaIndicadoresBody");
const estadoAsistencia = document.getElementById("estadoAsistencia");
const resumenFiltrado = document.getElementById("resumenFiltrado");
const NODOS_ASISTENCIA = ["asistencias", "asistencia", "asistencias_alumnos", "registros_asistencia"];
const NODO_PRINCIPAL_ESCRITURA = "asistencias";
let asistencias = [];

if (estadoAsistencia) {
    estadoAsistencia.textContent = "Script de asistencias cargado. Listo para operar.";
}

function mensajeErrorFirebase(error, contexto) {
    const codigo = error?.code || "sin-codigo";
    if (codigo.includes("permission-denied")) {
        return `${contexto} (permission-denied): revisa reglas del nodo asistencias.`;
    }
    if (codigo.includes("network")) {
        return `${contexto} (network): revisa tu conexion.`;
    }
    return `${contexto} (${codigo})`;
}

function normalizarTurno(turnoRaw) {
    const t = (turnoRaw || "").toString().trim();
    if (t.toLowerCase() === "noche") return "Tarde";
    if (t.toLowerCase() === "mañana" || t.toLowerCase() === "manana") return "Dia";
    return t || "Sin dato";
}

function normalizarFila(item) {
    const fechaHora = item.fechaHora || item.fecha || item.timestamp || "Sin dato";
    return {
        estudiante: item.estudiante || item.nombreEstudiante || item.alumno || item.nombre || "Sin dato",
        nivel: item.nivel || "",
        grado: item.grado || item.aula || "Sin dato",
        seccion: item.seccion || item.salon || "Sin dato",
        turno: normalizarTurno(item.turno || item.horario),
        estado: (item.estado || item.condicion || item.asistencia || "Asistencia").toString(),
        tomadoPor: item.tomadoPor || item.registradoPor || item.docente || item.usuario || "Sin dato",
        fechaHora,
        fechaNormalizada: normalizarFechaTexto(String(fechaHora))
    };
}

function extraerAsistencias(snapshotVal) {
    if (!snapshotVal || typeof snapshotVal !== "object") {
        return [];
    }

    const salida = [];
    Object.values(snapshotVal).forEach((item) => {
        if (item && typeof item === "object") {
            if (
                item.estudiante || item.nombreEstudiante || item.alumno ||
                item.grado || item.aula || item.seccion
            ) {
                salida.push(normalizarFila(item));
                return;
            }

            Object.values(item).forEach((subItem) => {
                if (subItem && typeof subItem === "object") {
                    salida.push(normalizarFila(subItem));
                }
            });
        }
    });
    return salida;
}

function setOpcionesSelect(selectElement, valores, tituloDefault) {
    selectElement.innerHTML = `<option value="">${tituloDefault}</option>`;
    valores.forEach((valor) => {
        const option = document.createElement("option");
        option.value = valor;
        option.textContent = valor;
        selectElement.appendChild(option);
    });
}

function poblarFiltros(data) {
    const grados = [...new Set(data.map((x) => x.grado).filter(Boolean))].sort();
    const secciones = [...new Set(data.map((x) => x.seccion).filter(Boolean))].sort();
    const turnosData = [...new Set(data.map((x) => x.turno).filter(Boolean))];
    const turnos = [...new Set([...turnosData, "Dia", "Tarde"])].sort();
    setOpcionesSelect(filtroGrado, grados, "Todos");
    setOpcionesSelect(filtroSeccion, secciones, "Todas");
    setOpcionesSelect(filtroTurno, turnos, "Todos");
}

function normalizarFechaTexto(valor) {
    if (!valor || typeof valor !== "string") return "";
    const isoMatch = valor.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];
    const localMatch = valor.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (localMatch) {
        return `${localMatch[3]}-${localMatch[2]}-${localMatch[1]}`;
    }
    return "";
}

function aplicarFiltros() {
    const grado = filtroGrado.value;
    const seccion = filtroSeccion.value;
    const turno = filtroTurno.value;
    const fechaDesde = filtroFechaDesde.value;
    const fechaHasta = filtroFechaHasta.value;
    const texto = buscarEstudiante.value.trim().toLowerCase();

    return asistencias.filter((x) => {
        const cumpleGrado = !grado || x.grado === grado;
        const cumpleSeccion = !seccion || x.seccion === seccion;
        const cumpleTurno = !turno || x.turno === turno;
        const fechaFila = x.fechaNormalizada;
        const cumpleFechaDesde = !fechaDesde || (fechaFila && fechaFila >= fechaDesde);
        const cumpleFechaHasta = !fechaHasta || (fechaFila && fechaFila <= fechaHasta);
        const cumpleTexto = !texto || x.estudiante.toLowerCase().includes(texto);
        return cumpleGrado && cumpleSeccion && cumpleTurno && cumpleFechaDesde && cumpleFechaHasta && cumpleTexto;
    });
}

function renderTabla(data) {
    tablaAsistenciasBody.innerHTML = "";
    if (!data.length) {
        tablaAsistenciasBody.innerHTML = `<tr><td colspan="7">No hay asistencias para los filtros seleccionados.</td></tr>`;
        return;
    }

    data.forEach((fila) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${fila.estudiante}</td>
            <td>${fila.grado}</td>
            <td>${fila.seccion}</td>
            <td>${fila.turno}</td>
            <td>${fila.estado}</td>
            <td>${fila.tomadoPor}</td>
            <td>${fila.fechaHora}</td>
        `;
        tablaAsistenciasBody.appendChild(tr);
    });
}

function exportarExcel(data, nombreArchivo) {
    if (!data.length) {
        estadoAsistencia.textContent = "No hay datos para exportar.";
        return;
    }

    exportarAsistenciasExcelFormal(data, nombreArchivo);
    registrarMovimiento(
        "exportacion_asistencias",
        `Exporto asistencias a Excel: ${nombreArchivo} (${data.length} registros)`,
        { pagina: "asistencias" }
    );
}

function actualizarResumen(data) {
    const aulas = new Set(data.map((x) => `${x.grado} - ${x.seccion}`));
    resumenFiltrado.textContent = `Registros mostrados: ${data.length} | Aulas: ${aulas.size}`;
}

function tipoEstado(estadoRaw) {
    const estado = (estadoRaw || "").toString().trim().toLowerCase();
    if (["tarde", "tardanza", "late"].includes(estado)) return "tardanza";
    if (["inasistencia", "falto", "ausente", "f", "absent"].includes(estado)) return "inasistencia";
    return "asistencia";
}

function renderIndicadoresPorAula(data) {
    tablaIndicadoresBody.innerHTML = "";
    const agrupado = new Map();

    data.forEach((fila) => {
        const aula = `${fila.grado} - ${fila.seccion}`;
        if (!agrupado.has(aula)) {
            agrupado.set(aula, { asistencia: 0, tardanza: 0, inasistencia: 0 });
        }
        const item = agrupado.get(aula);
        const tipo = tipoEstado(fila.estado);
        item[tipo] += 1;
    });

    if (!agrupado.size) {
        tablaIndicadoresBody.innerHTML = `<tr><td colspan="4">Sin datos para indicador por aula.</td></tr>`;
        return;
    }

    [...agrupado.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([aula, conteo]) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${aula}</td>
                <td>${conteo.asistencia}</td>
                <td>${conteo.tardanza}</td>
                <td>${conteo.inasistencia}</td>
            `;
            tablaIndicadoresBody.appendChild(tr);
        });
}

function generarRegistrosDemo() {
    const estadosCiclicos = ["Asistencia", "Asistencia", "Tardanza", "Asistencia", "Inasistencia", "Justificacion"];
    const salida = [];
    const loteDemo = `demo_${new Date().toISOString()}`;

    for (let i = 0; i < 60; i += 1) {
        const nivel = i % 3 === 0 ? NIVEL_SECUNDARIA : NIVEL_PRIMARIA;
        const grados = gradosPorNivel(nivel);
        const grado = grados[i % grados.length];
        const seccion = SECCIONES[(i * 7 + 3) % SECCIONES.length];
        const turno = i % 2 === 0 ? "Dia" : "Tarde";
        const estado = estadosCiclicos[(i + seccion.charCodeAt(0)) % estadosCiclicos.length];

        salida.push({
            estudiante: generarNombreCompletoAleatorio(),
            nivel,
            grado,
            seccion,
            turno,
            estado,
            tomadoPor: usuario?.nombresCompletos || "Directivo",
            fechaHora: new Date(Date.now() - i * 5400000).toISOString(),
            demo: true,
            demoLote: loteDemo
        });
    }

    return salida;
}

async function cargarAsistencias() {
    estadoAsistencia.textContent = "Cargando asistencias...";
    let data = [];

    for (const nodo of NODOS_ASISTENCIA) {
        const snapshot = await get(ref(db, nodo));
        if (snapshot.exists()) {
            data = extraerAsistencias(snapshot.val());
            if (data.length) {
                estadoAsistencia.textContent = `Datos cargados desde nodo: ${nodo}`;
                break;
            }
        }
    }

    if (!data.length) {
        estadoAsistencia.textContent = "No se encontraron asistencias en los nodos esperados.";
    }

    asistencias = data;
    poblarFiltros(asistencias);
    const inicial = aplicarFiltros();
    renderTabla(inicial);
    actualizarResumen(inicial);
    renderIndicadoresPorAula(inicial);
}

function refrescarVista() {
    const data = aplicarFiltros();
    renderTabla(data);
    actualizarResumen(data);
    renderIndicadoresPorAula(data);
}

filtroGrado.addEventListener("change", refrescarVista);
filtroSeccion.addEventListener("change", refrescarVista);
filtroTurno.addEventListener("change", refrescarVista);
filtroFechaDesde.addEventListener("change", refrescarVista);
filtroFechaHasta.addEventListener("change", refrescarVista);
buscarEstudiante.addEventListener("input", refrescarVista);

exportarSeleccionBtn.addEventListener("click", () => {
    const ahora = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    exportarExcel(aplicarFiltros(), `asistencias_aula_seleccionada_${ahora}.xlsx`);
});

limpiarDemoBtn.addEventListener("click", async () => {
    try {
        estadoAsistencia.textContent = "Limpiando registros demo...";
        const snapshot = await get(ref(db, NODO_PRINCIPAL_ESCRITURA));
        if (!snapshot.exists()) {
            estadoAsistencia.textContent = "No hay registros para limpiar.";
            return;
        }

        const data = snapshot.val();
        const updates = {};
        let eliminados = 0;

        Object.entries(data).forEach(([key, value]) => {
            if (value && value.demo === true) {
                updates[`${NODO_PRINCIPAL_ESCRITURA}/${key}`] = null;
                eliminados += 1;
            }
        });

        if (!eliminados) {
            estadoAsistencia.textContent = "No se encontraron registros demo.";
            return;
        }

        await update(ref(db), updates);
        await registrarMovimiento("limpiar_demo", `Limpio datos demo de asistencias (${eliminados} registros)`, {
            pagina: "asistencias"
        });
        estadoAsistencia.textContent = `Demo limpiada: ${eliminados} registros eliminados.`;
        await cargarAsistencias();
    } catch (error) {
        estadoAsistencia.textContent = mensajeErrorFirebase(error, "No se pudo limpiar la demo");
        console.error(error);
    }
});

exportarTodoBtn.addEventListener("click", () => {
    const ahora = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    exportarExcel(asistencias, `asistencias_todas_las_aulas_${ahora}.xlsx`);
});

cargarDemoBtn.addEventListener("click", async () => {
    try {
        estadoAsistencia.textContent = "Cargando 60 estudiantes demo en Firebase...";
        const demo = generarRegistrosDemo();
        const asistenciasRef = ref(db, NODO_PRINCIPAL_ESCRITURA);
        await Promise.all(
            demo.map((fila) => {
                const nuevoRef = push(asistenciasRef);
                return set(nuevoRef, fila);
            })
        );
        const verificacion = await get(asistenciasRef);
        let totalDemo = 0;
        if (verificacion.exists()) {
            const data = verificacion.val();
            totalDemo = Object.values(data).filter((x) => x?.demo === true).length;
        }
        await registrarMovimiento("datos_demo", "Creo 60 registros demo de asistencias", { pagina: "asistencias" });
        estadoAsistencia.textContent = `Demo creada: 60 registros enviados. Demos detectadas en DB: ${totalDemo}.`;
        await cargarAsistencias();
    } catch (error) {
        estadoAsistencia.textContent = mensajeErrorFirebase(error, "No se pudo crear la demo en Firebase");
        console.error(error);
    }
});

cargarAsistencias().catch((error) => {
    estadoAsistencia.textContent = mensajeErrorFirebase(error, "Error al leer asistencias en Firebase");
    console.error(error);
});
