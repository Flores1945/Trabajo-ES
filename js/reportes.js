import { ref, get } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";
import { db } from "./firebase-config.js";
import {
    initPaginaProtegida,
    configurarCerrarSesion,
    CARGOS,
    esAccesoTotal,
    puedeGestionarAlumnos,
    esSoloLecturaAlumnos
} from "./auth-roles.js";
import {
    cargarMovimientos,
    filtrarMovimientosPorVisor,
    puedeVerRegistroAuditoria,
    cargosVisiblesEnReportes,
    ESTILO_CARGO,
    formatearFechaHora,
    textoAccion
} from "./auditoria.js";

const usuario = initPaginaProtegida("reportes");
if (!usuario) {
    throw new Error("Sin sesion");
}

configurarCerrarSesion();
configurarAccesosLaterales();

const vistaAuditoria = document.getElementById("vistaAuditoria");
const vistaPortal = document.getElementById("vistaPortal");

if (puedeVerRegistroAuditoria(usuario.cargo)) {
    vistaAuditoria?.classList.remove("oculto");
    iniciarVistaAuditoria();
} else {
    vistaPortal?.classList.remove("oculto");
    iniciarVistaPortal();
}

function configurarAccesosLaterales() {
    const cont = document.getElementById("accesosReportes");
    if (!cont) return;

    let html = `<a class="btn-funcional" href="./alumnos.html">Lista de alumnos</a>`;
    if (esAccesoTotal(usuario.cargo)) {
        html += `<a class="btn-funcional" href="./asistencias.html">Ver asistencias</a>`;
        html += `<a class="btn-funcional" href="./panel.html">Panel principal</a>`;
    }
    cont.innerHTML = html;
}

function renderLeyenda() {
    const leyenda = document.getElementById("leyendaCargos");
    if (!leyenda) return;

    const cargos = cargosVisiblesEnReportes(usuario.cargo);
    leyenda.innerHTML = cargos
        .map((cargo) => {
            const s = ESTILO_CARGO[cargo];
            if (!s) return "";
            return `<span class="leyenda-item"><span class="leyenda-punto" style="background:${s.color}"></span>(${s.etiqueta.toLowerCase()})</span>`;
        })
        .join("");
}

let movimientosCache = [];

async function iniciarVistaAuditoria() {
    const subtitulo = document.getElementById("subtituloAuditoria");
    if (usuario.cargo === CARGOS.DIRECTOR) {
        subtitulo.textContent =
            "Ves el historial de Apafa, Docentes, Sub Docentes y Subdirector. Tus acciones como Director no se guardan.";
    } else {
        subtitulo.textContent =
            "Ves movimientos de Apafa, Docentes y Sub Docentes. No ves los del Director ni los tuyos.";
    }

    renderLeyenda();
    poblarFiltroCargos();
    document.getElementById("filtroCargoAuditoria")?.addEventListener("change", renderTablaMovimientos);
    document.getElementById("buscarUsuarioAuditoria")?.addEventListener("input", renderTablaMovimientos);
    document.getElementById("recargarAuditoriaBtn")?.addEventListener("click", () => cargarYMostrarMovimientos());

    await cargarYMostrarMovimientos();
}

function poblarFiltroCargos() {
    const select = document.getElementById("filtroCargoAuditoria");
    if (!select) return;

    const cargos = cargosVisiblesEnReportes(usuario.cargo);

    cargos.forEach((cargo) => {
        const opt = document.createElement("option");
        opt.value = cargo;
        opt.textContent = cargo;
        select.appendChild(opt);
    });
}

async function cargarYMostrarMovimientos() {
    const estado = document.getElementById("estadoAuditoria");
    estado.textContent = "Cargando movimientos...";

    try {
        const todos = await cargarMovimientos();
        movimientosCache = filtrarMovimientosPorVisor(todos, usuario.cargo, usuario.uid);
        renderTablaMovimientos();
        const activos = movimientosCache.filter((m) => m.tipo === "actividad").length;
        const eventos = movimientosCache.filter((m) => m.tipo === "evento").length;
        estado.textContent = `${movimientosCache.length} registro(s): ${activos} sesion(es) activa(s), ${eventos} evento(s) de inicio/cierre.`;
    } catch (error) {
        const codigo = error?.code || "";
        if (codigo.includes("permission-denied")) {
            estado.textContent =
                "Permiso denegado: en Firebase agrega .read en el nodo padre movimientos_actividad (ver FIREBASE-CONEXION.md).";
        } else {
            estado.textContent = `Error al cargar: ${codigo || error?.message || "desconocido"}`;
        }
        console.error(error);
    }
}

function renderTablaMovimientos() {
    const tbody = document.getElementById("tablaMovimientosBody");
    if (!tbody) return;

    const filtroCargo = document.getElementById("filtroCargoAuditoria")?.value || "";
    const busqueda = (document.getElementById("buscarUsuarioAuditoria")?.value || "").trim().toLowerCase();

    let lista = [...movimientosCache];
    if (filtroCargo) lista = lista.filter((m) => m.cargo === filtroCargo);
    if (busqueda) {
        lista = lista.filter((m) => m.nombresCompletos.toLowerCase().includes(busqueda));
    }

    tbody.innerHTML = "";

    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="5">No hay movimientos para mostrar.</td></tr>`;
        return;
    }

    lista.forEach((m) => {
        const estilo = ESTILO_CARGO[m.cargo] || { clase: "", etiqueta: m.cargo };
        const tr = document.createElement("tr");
        tr.className = `fila-movimiento ${estilo.clase}`;
        tr.innerHTML = `
            <td>${formatearFechaHora(m.fechaHora)}</td>
            <td class="celda-usuario">
                <strong>${m.nombresCompletos}</strong>
                <span>${m.correo || m.uid}</span>
            </td>
            <td><span class="etiqueta-cargo ${estilo.clase}">(${estilo.etiqueta.toLowerCase()})</span></td>
            <td><span class="accion-chip">${textoAccion(m.accion)}</span></td>
            <td>${m.detalle}${m.pagina ? ` <em>· ${m.pagina}</em>` : ""}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function iniciarVistaPortal() {
    document.getElementById("portalSaludo").textContent = `Hola, ${usuario.nombresCompletos}`;
    document.getElementById("portalDetalle").textContent = `Sesion activa como ${usuario.cargo}.`;
    document.getElementById("portalBadgeCargo").textContent = usuario.cargo;

    const titulo = document.getElementById("portalTituloRol");
    const mensaje = document.getElementById("portalMensajeRol");
    const tips = document.getElementById("portalTipsLista");

    if (usuario.cargo === CARGOS.APAFA) {
        titulo.textContent = "Centro APAFA";
        mensaje.textContent =
            "Desde aqui coordinas el registro de alumnos. Los reportes de asistencia y el historial de movimientos los gestiona la direccion.";
        tips.innerHTML = `
            <li>Registra nuevos alumnos con grado, seccion y turno correctos.</li>
            <li>Actualiza datos cuando un estudiante cambie de seccion.</li>
            <li>Exporta la lista Excel solo cuando necesites un respaldo.</li>
        `;
    } else if (esSoloLecturaAlumnos(usuario.cargo)) {
        titulo.textContent = "Centro docente";
        mensaje.textContent =
            "Consulta la lista de alumnos por grado, seccion y turno. No tienes acceso al historial de movimientos ni a exportaciones de asistencia.";
        document.getElementById("statTurnoInfo").textContent = "Filtra Dia o Tarde en la lista de alumnos";
        tips.innerHTML = `
            <li>Revisa tu lista antes de cada jornada.</li>
            <li>Usa los filtros para ubicar rapidamente tu aula.</li>
            <li>Ante cambios de matricula, informa a APAFA o direccion.</li>
        `;
    }

    if (!puedeGestionarAlumnos(usuario.cargo)) {
        const enlace = document.getElementById("enlaceAlumnosPortal");
        if (enlace) enlace.textContent = "Consultar lista de alumnos";
    }

    try {
        const snap = await get(ref(db, "estudiantes"));
        const total = snap.exists() ? Object.keys(snap.val()).length : 0;
        document.getElementById("statAlumnos").textContent = String(total);
    } catch {
        document.getElementById("statAlumnos").textContent = "-";
    }
}
