import { ref, get, push, set, update } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";
import { db } from "./firebase-config.js";
import {
    initPaginaProtegida,
    configurarCerrarSesion,
    puedeGestionarAlumnos,
    esSoloLecturaAlumnos
} from "./auth-roles.js";
import { registrarMovimiento } from "./auditoria.js";
import {
    NIVEL_PRIMARIA,
    NIVEL_SECUNDARIA,
    SECCIONES,
    gradosPorNivel,
    llenarOpcionesNivel,
    llenarOpcionesGrado,
    llenarOpcionesSeccion,
    enlazarNivelYGrado,
    generarAlumnoDemoAleatorio
} from "./catalogo-escolar.js";

const NODO_ESTUDIANTES = "estudiantes";
const usuario = initPaginaProtegida("alumnos");
if (!usuario) {
    throw new Error("Sin sesion");
}

const soloLectura = esSoloLecturaAlumnos(usuario.cargo);
const puedeEditar = puedeGestionarAlumnos(usuario.cargo);

const formAlumno = document.getElementById("formAlumno");
const panelFormulario = document.getElementById("panelFormulario");
const tituloFormulario = document.getElementById("tituloFormulario");
const subtituloPagina = document.getElementById("subtituloPagina");
const alumnoIdInput = document.getElementById("alumnoId");
const selectNivel = document.getElementById("nivel");
const selectGrado = document.getElementById("grado");
const selectSeccion = document.getElementById("seccion");
const filtroNivel = document.getElementById("filtroNivel");
const filtroGrado = document.getElementById("filtroGrado");
const filtroSeccion = document.getElementById("filtroSeccion");
const filtroTurno = document.getElementById("filtroTurno");
const tablaAlumnosBody = document.getElementById("tablaAlumnosBody");
const estadoAlumnos = document.getElementById("estadoAlumnos");
const accionesLista = document.getElementById("accionesLista");
const colAcciones = document.getElementById("colAcciones");
const exportarListaBtn = document.getElementById("exportarListaBtn");
const limpiarFormBtn = document.getElementById("limpiarFormBtn");
const cargarDemoAlumnosBtn = document.getElementById("cargarDemoAlumnosBtn");
const limpiarDemoAlumnosBtn = document.getElementById("limpiarDemoAlumnosBtn");

let alumnos = [];

configurarCerrarSesion();
inicializarFormularioEscolar();
configurarModoPorRol();

function inicializarFormularioEscolar() {
    llenarOpcionesNivel(selectNivel);
    llenarOpcionesSeccion(selectSeccion);
    enlazarNivelYGrado(selectNivel, selectGrado);

    llenarSelect(filtroSeccion, [...SECCIONES], "Todas");
}

function configurarModoPorRol() {
    const layoutAlumnos = document.querySelector(".layout-alumnos");
    if (soloLectura) {
        panelFormulario.classList.add("oculto");
        if (layoutAlumnos) layoutAlumnos.classList.add("sin-formulario");
        subtituloPagina.textContent =
            "Consulta de alumnos por nivel, grado, seccion y turno (solo lectura).";
        if (accionesLista) accionesLista.style.display = "none";
    } else {
        subtituloPagina.textContent = "Registro, modificacion y listado de alumnos.";
    }
}

function limpiarFormulario() {
    alumnoIdInput.value = "";
    formAlumno.reset();
    selectGrado.disabled = true;
    selectGrado.innerHTML = `<option value="">Selecciona nivel primero</option>`;
    tituloFormulario.textContent = "Nuevo alumno";
}

function cargarFormularioEdicion(alumno) {
    alumnoIdInput.value = alumno.id;
    document.getElementById("nombresCompletos").value = alumno.nombresCompletos;
    selectNivel.value = alumno.nivel || "";
    llenarOpcionesGrado(selectGrado, selectNivel.value, "Selecciona", alumno.grado);
    selectSeccion.value = alumno.seccion;
    document.getElementById("turno").value = alumno.turno;
    tituloFormulario.textContent = "Modificar alumno";
    panelFormulario.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function cargarAlumnos() {
    estadoAlumnos.textContent = "Cargando alumnos...";
    const snapshot = await get(ref(db, NODO_ESTUDIANTES));

    if (!snapshot.exists()) {
        alumnos = [];
    } else {
        alumnos = Object.entries(snapshot.val()).map(([id, data]) => ({
            id,
            nombresCompletos: data.nombresCompletos || "",
            nivel: data.nivel || "",
            grado: data.grado || "",
            seccion: data.seccion || "",
            turno: data.turno === "Noche" ? "Tarde" : data.turno || "",
            demo: data.demo === true
        }));
    }

    poblarFiltros();
    renderTabla();
    estadoAlumnos.textContent = `Total en base de datos: ${alumnos.length} alumnos.`;
}

function poblarFiltros() {
    const grados = [...new Set(alumnos.map((a) => a.grado).filter(Boolean))].sort(ordenarGrado);
    const secciones = [...new Set(alumnos.map((a) => a.seccion).filter(Boolean))].sort();

    llenarSelect(filtroGrado, grados, "Todos");
    if (secciones.length) {
        llenarSelect(filtroSeccion, secciones, "Todas");
    }
}

function ordenarGrado(a, b) {
    const na = parseInt(String(a).replace(/\D/g, ""), 10) || 99;
    const nb = parseInt(String(b).replace(/\D/g, ""), 10) || 99;
    return na - nb;
}

function llenarSelect(select, valores, textoDefault) {
    const actual = select.value;
    select.innerHTML = `<option value="">${textoDefault}</option>`;
    valores.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        select.appendChild(opt);
    });
    if ([...select.options].some((o) => o.value === actual)) {
        select.value = actual;
    }
}

function aplicarFiltros() {
    const nivel = filtroNivel.value;
    const grado = filtroGrado.value;
    const seccion = filtroSeccion.value;
    const turno = filtroTurno.value;

    return alumnos.filter((a) => {
        const okNivel = !nivel || a.nivel === nivel;
        const okGrado = !grado || a.grado === grado;
        const okSeccion = !seccion || a.seccion === seccion;
        const okTurno = !turno || a.turno === turno;
        return okNivel && okGrado && okSeccion && okTurno;
    });
}

function renderTabla() {
    const data = aplicarFiltros();
    tablaAlumnosBody.innerHTML = "";

    if (!data.length) {
        const cols = soloLectura ? 5 : 6;
        tablaAlumnosBody.innerHTML = `<tr><td colspan="${cols}">No hay alumnos para los filtros seleccionados.</td></tr>`;
        return;
    }

    data.forEach((alumno) => {
        const tr = document.createElement("tr");
        const accionesHtml = puedeEditar
            ? `<td class="celda-acciones">
                <button type="button" class="btn-tabla editar" data-id="${alumno.id}">Editar</button>
                <button type="button" class="btn-tabla eliminar" data-id="${alumno.id}">Eliminar</button>
               </td>`
            : "";

        tr.innerHTML = `
            <td>${alumno.nombresCompletos}</td>
            <td>${alumno.nivel || "-"}</td>
            <td>${alumno.grado}</td>
            <td>${alumno.seccion}</td>
            <td>${alumno.turno}</td>
            ${accionesHtml}
        `;
        tablaAlumnosBody.appendChild(tr);
    });

    if (!puedeEditar && colAcciones) {
        colAcciones.style.display = "none";
    }

    document.querySelectorAll(".btn-tabla.editar").forEach((btn) => {
        btn.addEventListener("click", () => {
            const alumno = alumnos.find((a) => a.id === btn.dataset.id);
            if (alumno) cargarFormularioEdicion(alumno);
        });
    });

    document.querySelectorAll(".btn-tabla.eliminar").forEach((btn) => {
        btn.addEventListener("click", () => eliminarAlumno(btn.dataset.id));
    });
}

function validarFormularioAlumno() {
    const nivel = selectNivel.value;
    const grado = selectGrado.value;
    const gradosValidos = gradosPorNivel(nivel);

    if (!nivel || !gradosValidos.includes(grado)) {
        estadoAlumnos.textContent = "Selecciona nivel y un grado valido para ese nivel.";
        return false;
    }
    return true;
}

async function guardarAlumno(event) {
    event.preventDefault();
    if (!puedeEditar || !validarFormularioAlumno()) return;

    const payload = {
        nombresCompletos: document.getElementById("nombresCompletos").value.trim(),
        nivel: selectNivel.value,
        grado: selectGrado.value,
        seccion: selectSeccion.value,
        turno: document.getElementById("turno").value,
        fechaActualizacion: new Date().toISOString()
    };

    try {
        const id = alumnoIdInput.value;
        if (id) {
            await update(ref(db, `${NODO_ESTUDIANTES}/${id}`), payload);
            await registrarMovimiento(
                "modificacion_alumno",
                `Modifico alumno: ${payload.nombresCompletos} (${payload.nivel} ${payload.grado} ${payload.seccion}, ${payload.turno})`,
                { pagina: "alumnos" }
            );
            estadoAlumnos.textContent = "Alumno actualizado correctamente.";
        } else {
            payload.fechaRegistro = new Date().toISOString();
            await set(push(ref(db, NODO_ESTUDIANTES)), payload);
            await registrarMovimiento(
                "registro_alumno",
                `Registro alumno: ${payload.nombresCompletos} (${payload.nivel} ${payload.grado} ${payload.seccion}, ${payload.turno})`,
                { pagina: "alumnos" }
            );
            estadoAlumnos.textContent = "Alumno registrado correctamente.";
        }
        limpiarFormulario();
        await cargarAlumnos();
    } catch (error) {
        estadoAlumnos.textContent = "Error al guardar en Firebase (revisa reglas del nodo estudiantes).";
        console.error(error);
    }
}

async function eliminarAlumno(id) {
    if (!puedeEditar) return;
    if (!confirm("Eliminar este alumno?")) return;

    try {
        const alumno = alumnos.find((a) => a.id === id);
        await update(ref(db, `${NODO_ESTUDIANTES}/${id}`), null);
        await registrarMovimiento(
            "eliminacion_alumno",
            `Elimino alumno: ${alumno?.nombresCompletos || id}`,
            { pagina: "alumnos" }
        );
        estadoAlumnos.textContent = "Alumno eliminado.";
        if (alumnoIdInput.value === id) limpiarFormulario();
        await cargarAlumnos();
    } catch (error) {
        estadoAlumnos.textContent = "No se pudo eliminar el alumno.";
        console.error(error);
    }
}

async function cargarDemoAlumnos() {
    if (!puedeEditar) return;

    try {
        estadoAlumnos.textContent = "Cargando 60 alumnos demo...";
        const loteDemo = `demo_alumnos_${new Date().toISOString()}`;
        const refEstudiantes = ref(db, NODO_ESTUDIANTES);

        await Promise.all(
            Array.from({ length: 60 }, () => {
                const alumno = generarAlumnoDemoAleatorio();
                return set(push(refEstudiantes), {
                    ...alumno,
                    fechaRegistro: new Date().toISOString(),
                    demo: true,
                    demoLote: loteDemo
                });
            })
        );

        await registrarMovimiento("datos_demo", "Creo 60 alumnos demo en registro de alumnos", {
            pagina: "alumnos"
        });
        estadoAlumnos.textContent = "60 alumnos demo registrados con datos variados.";
        await cargarAlumnos();
    } catch (error) {
        estadoAlumnos.textContent = "No se pudo cargar la demo (revisa reglas de estudiantes).";
        console.error(error);
    }
}

async function limpiarDemoAlumnos() {
    if (!puedeEditar) return;

    try {
        estadoAlumnos.textContent = "Limpiando alumnos demo...";
        const snapshot = await get(ref(db, NODO_ESTUDIANTES));
        if (!snapshot.exists()) {
            estadoAlumnos.textContent = "No hay alumnos para limpiar.";
            return;
        }

        const updates = {};
        let eliminados = 0;

        Object.entries(snapshot.val()).forEach(([id, data]) => {
            if (data?.demo === true) {
                updates[`${NODO_ESTUDIANTES}/${id}`] = null;
                eliminados += 1;
            }
        });

        if (!eliminados) {
            estadoAlumnos.textContent = "No se encontraron alumnos demo.";
            return;
        }

        await update(ref(db), updates);
        await registrarMovimiento("limpiar_demo", `Limpio ${eliminados} alumnos demo`, { pagina: "alumnos" });
        estadoAlumnos.textContent = `Demo limpiada: ${eliminados} alumnos eliminados.`;
        await cargarAlumnos();
    } catch (error) {
        estadoAlumnos.textContent = "No se pudo limpiar la demo de alumnos.";
        console.error(error);
    }
}

function exportarListaExcel() {
    const data = aplicarFiltros();
    if (!data.length) {
        estadoAlumnos.textContent = "No hay datos para exportar.";
        return;
    }

    const filas = data.map((a) => ({
        "Nombres completos": a.nombresCompletos,
        Nivel: a.nivel || "-",
        Grado: a.grado,
        Seccion: a.seccion,
        Turno: a.turno
    }));

    const hoja = XLSX.utils.json_to_sheet(filas);
    hoja["!cols"] = [{ wch: 38 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 12 }];
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Alumnos");
    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(libro, `lista_alumnos_${fecha}.xlsx`);
    registrarMovimiento("exportacion_alumnos", `Exporto lista de alumnos (${data.length} filas)`, {
        pagina: "alumnos"
    });
}

formAlumno.addEventListener("submit", guardarAlumno);
limpiarFormBtn?.addEventListener("click", limpiarFormulario);
filtroNivel?.addEventListener("change", renderTabla);
filtroGrado.addEventListener("change", renderTabla);
filtroSeccion.addEventListener("change", renderTabla);
filtroTurno.addEventListener("change", renderTabla);
exportarListaBtn?.addEventListener("click", exportarListaExcel);
cargarDemoAlumnosBtn?.addEventListener("click", cargarDemoAlumnos);
limpiarDemoAlumnosBtn?.addEventListener("click", limpiarDemoAlumnos);

cargarAlumnos().catch((error) => {
    estadoAlumnos.textContent = "Error al cargar estudiantes desde Firebase.";
    console.error(error);
});
