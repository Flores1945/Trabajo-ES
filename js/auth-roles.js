export const CARGOS = {
    DIRECTOR: "Director",
    SUBDIRECTOR: "Subdirector",
    APAFA: "Apafa",
    DOCENTE: "Docente",
    SUB_DOCENTE: "Sub Docente"
};

export const PAGINAS = {
    PANEL: "panel",
    ASISTENCIAS: "asistencias",
    REPORTES: "reportes",
    ALUMNOS: "alumnos",
    REGISTRO_PERSONAL: "registro"
};

const ACCESO_POR_CARGO = {
    [CARGOS.DIRECTOR]: [PAGINAS.PANEL, PAGINAS.ASISTENCIAS, PAGINAS.REPORTES, PAGINAS.ALUMNOS, PAGINAS.REGISTRO_PERSONAL],
    [CARGOS.SUBDIRECTOR]: [PAGINAS.PANEL, PAGINAS.ASISTENCIAS, PAGINAS.REPORTES, PAGINAS.ALUMNOS, PAGINAS.REGISTRO_PERSONAL],
    [CARGOS.APAFA]: [PAGINAS.REPORTES, PAGINAS.ALUMNOS],
    [CARGOS.DOCENTE]: [PAGINAS.REPORTES, PAGINAS.ALUMNOS],
    [CARGOS.SUB_DOCENTE]: [PAGINAS.REPORTES, PAGINAS.ALUMNOS]
};

const RUTA_INICIO = {
    [CARGOS.DIRECTOR]: "./panel.html",
    [CARGOS.SUBDIRECTOR]: "./panel.html",
    [CARGOS.APAFA]: "./reportes.html",
    [CARGOS.DOCENTE]: "./reportes.html",
    [CARGOS.SUB_DOCENTE]: "./reportes.html"
};

const MENU_ITEMS = [
    { id: PAGINAS.PANEL, label: "Inicio", href: "./panel.html" },
    { id: PAGINAS.ASISTENCIAS, label: "Registro de asistencias", href: "./asistencias.html" },
    { id: PAGINAS.REPORTES, label: "Reportes", href: "./reportes.html" },
    { id: PAGINAS.ALUMNOS, label: "Registro de alumnos", href: "./alumnos.html" },
    { id: PAGINAS.REGISTRO_PERSONAL, label: "Registrar personal", href: "./registro.html" }
];

export function obtenerUsuario() {
    try {
        return JSON.parse(sessionStorage.getItem("usuario_activo") || "null");
    } catch {
        return null;
    }
}

export function puedeAcceder(cargo, pagina) {
    return (ACCESO_POR_CARGO[cargo] || []).includes(pagina);
}

export function rutaInicioPorCargo(cargo) {
    return RUTA_INICIO[cargo] || "./index.html";
}

export function esAccesoTotal(cargo) {
    return cargo === CARGOS.DIRECTOR || cargo === CARGOS.SUBDIRECTOR;
}

export function puedeGestionarAlumnos(cargo) {
    return [CARGOS.DIRECTOR, CARGOS.SUBDIRECTOR, CARGOS.APAFA].includes(cargo);
}

export function esSoloLecturaAlumnos(cargo) {
    return cargo === CARGOS.DOCENTE || cargo === CARGOS.SUB_DOCENTE;
}

export function puedeExportarAsistencias(cargo) {
    return esAccesoTotal(cargo);
}

export function initPaginaProtegida(paginaActual) {
    const usuario = obtenerUsuario();
    if (!usuario) {
        window.location.href = "./index.html";
        return null;
    }
    if (!puedeAcceder(usuario.cargo, paginaActual)) {
        window.location.href = rutaInicioPorCargo(usuario.cargo);
        return null;
    }
    renderMenuNavegacion(usuario.cargo, paginaActual);
    import("./auditoria.js").then(({ registrarVisitaPagina }) => {
        registrarVisitaPagina(paginaActual);
    });
    return usuario;
}

export function renderMenuNavegacion(cargo, paginaActiva) {
    const contenedor = document.getElementById("menuNavegacion");
    if (!contenedor) return;

    const permitidos = ACCESO_POR_CARGO[cargo] || [];
    contenedor.innerHTML = MENU_ITEMS
        .filter((item) => permitidos.includes(item.id))
        .map((item) => {
            const activo = item.id === paginaActiva ? " activo" : "";
            return `<a class="btn-funcional${activo}" href="${item.href}">${item.label}</a>`;
        })
        .join("");
}

export function configurarCerrarSesion() {
    const btn = document.getElementById("cerrarSesionBtn");
    if (!btn || btn.dataset.configurado === "1") return;

    btn.dataset.configurado = "1";
    btn.addEventListener("click", async () => {
        const usuario = obtenerUsuario();
        if (usuario) {
            const { registrarCierreSesion } = await import("./auditoria.js");
            await registrarCierreSesion(usuario);
        }
        const { signOut } = await import("https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js");
        const { auth } = await import("./firebase-config.js");
        await signOut(auth);
        sessionStorage.removeItem("usuario_activo");
        window.location.href = "./index.html";
    });
}
