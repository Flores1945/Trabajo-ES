import { ref, push, set, get, update } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";
import { db } from "./firebase-config.js";
import { CARGOS, obtenerUsuario } from "./auth-roles.js";

/** Eventos puntuales: solo inicio y cierre de sesion */
export const NODO_MOVIMIENTOS = "movimientos";

/** Una fila por usuario (uid): se actualiza al cambiar de pagina o accion */
export const NODO_ACTIVIDAD = "movimientos_actividad";

const EVENTOS_HISTORICO = new Set(["inicio_sesion", "cierre_sesion"]);

export const ESTILO_CARGO = {
    [CARGOS.DIRECTOR]: { clase: "cargo-director", etiqueta: "Director", color: "#f59e0b" },
    [CARGOS.SUBDIRECTOR]: { clase: "cargo-subdirector", etiqueta: "Subdirector", color: "#3b82f6" },
    [CARGOS.APAFA]: { clase: "cargo-apafa", etiqueta: "Apafa", color: "#22c55e" },
    [CARGOS.DOCENTE]: { clase: "cargo-docente", etiqueta: "Docente", color: "#a855f7" },
    [CARGOS.SUB_DOCENTE]: { clase: "cargo-sub-docente", etiqueta: "Sub Docente", color: "#06b6d4" }
};

/** El Director no genera datos de auditoria; solo consulta. */
export function debeRegistrarAuditoria(cargo) {
    return cargo !== CARGOS.DIRECTOR;
}

const NOMBRES_PAGINA = {
    panel: "Panel principal",
    asistencias: "Registro de asistencias",
    reportes: "Reportes",
    alumnos: "Registro de alumnos",
    registro: "Registro de personal",
    login: "Inicio de sesion"
};

function refActividad(uid) {
    return ref(db, `${NODO_ACTIVIDAD}/${uid}`);
}

function nombrePagina(paginaId) {
    return NOMBRES_PAGINA[paginaId] || paginaId;
}

/** Actualiza un solo registro por usuario (no crea filas nuevas). */
async function actualizarActividadSesion(usuario, campos) {
    if (!debeRegistrarAuditoria(usuario.cargo)) return;

    const ahora = new Date().toISOString();
    const base = {
        uid: usuario.uid,
        nombresCompletos: usuario.nombresCompletos,
        correo: usuario.correo || "",
        cargo: usuario.cargo,
        fechaActualizacion: ahora
    };

    try {
        const snap = await get(refActividad(usuario.uid));
        if (snap.exists()) {
            await update(refActividad(usuario.uid), { ...campos, ...base });
        } else {
            await set(refActividad(usuario.uid), {
                ...base,
                sesionInicio: ahora,
                paginaActual: campos.paginaActual || "",
                paginaEntradaHora: campos.paginaEntradaHora || ahora,
                ultimaAccion: campos.ultimaAccion || "sesion_activa",
                ultimaAccionDetalle: campos.ultimaAccionDetalle || "",
                ultimaAccionHora: campos.ultimaAccionHora || ahora
            });
        }
    } catch (error) {
        console.warn("No se pudo actualizar actividad:", error);
    }
}

export async function registrarMovimiento(accion, detalle, extra = {}) {
    const usuario = obtenerUsuario();
    if (!usuario) return;

    const ahora = new Date().toISOString();
    await actualizarActividadSesion(usuario, {
        ultimaAccion: accion,
        ultimaAccionDetalle: detalle,
        ultimaAccionHora: ahora,
        pagina: extra.pagina || ""
    });
}

export function registrarVisitaPagina(paginaId) {
    const usuario = obtenerUsuario();
    if (!usuario) return Promise.resolve();

    const ahora = new Date().toISOString();
    const nombre = nombrePagina(paginaId);

    return actualizarActividadSesion(usuario, {
        paginaActual: paginaId,
        paginaEntradaHora: ahora,
        ultimaAccion: "en_pagina",
        ultimaAccionDetalle: `En ${nombre}`,
        ultimaAccionHora: ahora,
        pagina: paginaId
    });
}

export async function registrarInicioSesion(usuario) {
    if (!usuario || !debeRegistrarAuditoria(usuario.cargo)) {
        return;
    }

    const ahora = new Date().toISOString();

    try {
        await set(push(ref(db, NODO_MOVIMIENTOS)), {
            uid: usuario.uid,
            nombresCompletos: usuario.nombresCompletos,
            correo: usuario.correo || "",
            cargo: usuario.cargo,
            accion: "inicio_sesion",
            detalle: "Inicio de sesion en el portal web",
            pagina: "login",
            fechaHora: ahora
        });

        await set(refActividad(usuario.uid), {
            uid: usuario.uid,
            nombresCompletos: usuario.nombresCompletos,
            correo: usuario.correo || "",
            cargo: usuario.cargo,
            sesionInicio: ahora,
            paginaActual: "login",
            paginaEntradaHora: ahora,
            ultimaAccion: "inicio_sesion",
            ultimaAccionDetalle: "Sesion iniciada",
            ultimaAccionHora: ahora,
            fechaActualizacion: ahora
        });
    } catch (error) {
        console.warn("Auditoria inicio sesion:", error);
    }
}

export async function registrarCierreSesion(usuario) {
    if (!usuario || !debeRegistrarAuditoria(usuario.cargo)) {
        return;
    }

    const ahora = new Date().toISOString();

    try {
        await set(push(ref(db, NODO_MOVIMIENTOS)), {
            uid: usuario.uid,
            nombresCompletos: usuario.nombresCompletos,
            correo: usuario.correo || "",
            cargo: usuario.cargo,
            accion: "cierre_sesion",
            detalle: "Cerro sesion en el portal web",
            pagina: "",
            fechaHora: ahora
        });

        await set(refActividad(usuario.uid), null);
    } catch (error) {
        console.warn("Auditoria cierre sesion:", error);
    }
}

function filaDesdeEvento(id, data) {
    return {
        id,
        tipo: "evento",
        uid: data.uid || "",
        nombresCompletos: data.nombresCompletos || "Sin nombre",
        correo: data.correo || "",
        cargo: data.cargo || "Desconocido",
        accion: data.accion,
        detalle: data.detalle || "",
        pagina: data.pagina || "",
        fechaHora: data.fechaHora || ""
    };
}

function filaDesdeActividad(uid, data) {
    const paginaLabel = nombrePagina(data.paginaActual || data.pagina || "");
    const entrada = data.paginaEntradaHora ? formatearFechaHora(data.paginaEntradaHora) : "-";
    const detalle = [
        `Pagina actual: ${paginaLabel} (desde ${entrada})`,
        data.ultimaAccionDetalle ? `Ultima accion: ${data.ultimaAccionDetalle}` : ""
    ]
        .filter(Boolean)
        .join(" · ");

    return {
        id: `actividad_${uid}`,
        tipo: "actividad",
        uid,
        nombresCompletos: data.nombresCompletos || "Sin nombre",
        correo: data.correo || "",
        cargo: data.cargo || "Desconocido",
        accion: data.ultimaAccion || "sesion_activa",
        detalle,
        pagina: data.paginaActual || data.pagina || "",
        fechaHora: data.fechaActualizacion || data.ultimaAccionHora || data.paginaEntradaHora || ""
    };
}

export async function cargarMovimientos() {
    const [snapEventos, snapActividad] = await Promise.all([
        get(ref(db, NODO_MOVIMIENTOS)),
        get(ref(db, NODO_ACTIVIDAD))
    ]);

    const filas = [];

    if (snapEventos.exists()) {
        Object.entries(snapEventos.val()).forEach(([id, data]) => {
            if (EVENTOS_HISTORICO.has(data.accion)) {
                filas.push(filaDesdeEvento(id, data));
            }
        });
    }

    if (snapActividad.exists()) {
        Object.entries(snapActividad.val()).forEach(([uid, data]) => {
            if (data && typeof data === "object") {
                filas.push(filaDesdeActividad(uid, data));
            }
        });
    }

    return filas.sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));
}

/** Cargos que aparecen en leyenda y filtro de Reportes (sin Director). */
export function cargosVisiblesEnReportes(cargoVisor) {
    if (cargoVisor === CARGOS.DIRECTOR) {
        return [CARGOS.SUBDIRECTOR, CARGOS.APAFA, CARGOS.DOCENTE, CARGOS.SUB_DOCENTE];
    }
    if (cargoVisor === CARGOS.SUBDIRECTOR) {
        return [CARGOS.APAFA, CARGOS.DOCENTE, CARGOS.SUB_DOCENTE];
    }
    return [];
}

export function filtrarMovimientosPorVisor(movimientos, cargoVisor, uidVisor = "") {
    const sinDirector = movimientos.filter((m) => m.cargo !== CARGOS.DIRECTOR);
    const permitidos = cargosVisiblesEnReportes(cargoVisor);

    if (cargoVisor === CARGOS.DIRECTOR) {
        return sinDirector.filter((m) => permitidos.includes(m.cargo));
    }
    if (cargoVisor === CARGOS.SUBDIRECTOR) {
        return sinDirector.filter(
            (m) => permitidos.includes(m.cargo) && m.uid !== uidVisor
        );
    }
    return [];
}

export function puedeVerRegistroAuditoria(cargo) {
    return cargo === CARGOS.DIRECTOR || cargo === CARGOS.SUBDIRECTOR;
}

export function formatearFechaHora(iso) {
    if (!iso) return "-";
    try {
        return new Date(iso).toLocaleString("es-PE", {
            dateStyle: "short",
            timeStyle: "medium"
        });
    } catch {
        return iso;
    }
}

export function textoAccion(accion) {
    const mapa = {
        inicio_sesion: "Inicio de sesion",
        cierre_sesion: "Cierre de sesion",
        en_pagina: "En pagina",
        sesion_activa: "Sesion activa",
        visita_pagina: "En pagina",
        registro_alumno: "Registro de alumno",
        modificacion_alumno: "Modificacion de alumno",
        eliminacion_alumno: "Eliminacion de alumno",
        exportacion_alumnos: "Exportacion Excel (alumnos)",
        exportacion_asistencias: "Exportacion Excel (asistencias)",
        datos_demo: "Datos de prueba",
        limpiar_demo: "Limpieza de demo",
        registro_personal: "Alta de personal"
    };
    return mapa[accion] || accion.replace(/_/g, " ");
}
