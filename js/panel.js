import { ref, get } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";
import { db } from "./firebase-config.js";
import { initPaginaProtegida, configurarCerrarSesion, esAccesoTotal } from "./auth-roles.js";

const usuario = initPaginaProtegida("panel");
if (!usuario) {
    throw new Error("Sin sesion");
}

const bienvenidaTexto = document.getElementById("bienvenidaTexto");
const detalleUsuario = document.getElementById("detalleUsuario");
const totalAsistenciasResumen = document.getElementById("totalAsistenciasResumen");
const aulasResumen = document.getElementById("aulasResumen");
const cargoResumen = document.getElementById("cargoResumen");
const NODOS_ASISTENCIA = ["asistencias", "asistencia", "asistencias_alumnos", "registros_asistencia"];

bienvenidaTexto.textContent = `Bienvenido(a), ${usuario.nombresCompletos}`;
detalleUsuario.textContent = `Cargo: ${usuario.cargo} | Correo: ${usuario.correo}`;
cargoResumen.textContent = usuario.cargo;

configurarCerrarSesion();

const accesosRapidos = document.getElementById("accesosRapidos");
if (accesosRapidos) {
    accesosRapidos.innerHTML = `
        <a class="btn-funcional" href="./alumnos.html">Registro de alumnos</a>
        ${esAccesoTotal(usuario.cargo) ? '<a class="btn-funcional" href="./registro.html">Registrar personal</a>' : ""}
    `;
}

function contarRegistros(snapshotVal) {
    if (!snapshotVal || typeof snapshotVal !== "object") {
        return { total: 0, aulas: 0 };
    }
    const filas = [];
    Object.values(snapshotVal).forEach((item) => {
        if (item && typeof item === "object") {
            const pareceFila = item.estudiante || item.nombreEstudiante || item.alumno || item.nombre;
            if (pareceFila) {
                filas.push(item);
            } else {
                Object.values(item).forEach((sub) => {
                    if (sub && typeof sub === "object") filas.push(sub);
                });
            }
        }
    });
    const aulas = new Set(filas.map((x) => x.grado || x.aula || x.nivel).filter(Boolean));
    return { total: filas.length, aulas: aulas.size };
}

async function cargarResumen() {
    for (const nodo of NODOS_ASISTENCIA) {
        const snapshot = await get(ref(db, nodo));
        if (snapshot.exists()) {
            const data = contarRegistros(snapshot.val());
            if (data.total > 0) {
                totalAsistenciasResumen.textContent = String(data.total);
                aulasResumen.textContent = String(data.aulas);
                return;
            }
        }
    }
    totalAsistenciasResumen.textContent = "0";
    aulasResumen.textContent = "0";
}

cargarResumen().catch(() => {
    totalAsistenciasResumen.textContent = "-";
    aulasResumen.textContent = "-";
});
