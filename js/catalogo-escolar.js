export const NIVEL_PRIMARIA = "Primaria";
export const NIVEL_SECUNDARIA = "Secundaria";

export const SECCIONES = "ABCDEFGHIJKLMNO".split("");

const GRADOS_PRIMARIA = ["1°", "2°", "3°", "4°", "5°", "6°"];
const GRADOS_SECUNDARIA = ["1°", "2°", "3°", "4°", "5°"];

export function gradosPorNivel(nivel) {
    if (nivel === NIVEL_PRIMARIA) return [...GRADOS_PRIMARIA];
    if (nivel === NIVEL_SECUNDARIA) return [...GRADOS_SECUNDARIA];
    return [];
}

export function llenarOpcionesNivel(select, textoDefault = "Selecciona") {
    if (!select) return;
    const actual = select.value;
    select.innerHTML = `
        <option value="">${textoDefault}</option>
        <option value="${NIVEL_PRIMARIA}">${NIVEL_PRIMARIA}</option>
        <option value="${NIVEL_SECUNDARIA}">${NIVEL_SECUNDARIA}</option>
    `;
    if (actual) select.value = actual;
}

export function llenarOpcionesGrado(select, nivel, textoDefault = "Selecciona", valorPreferido = "") {
    if (!select) return;
    const grados = gradosPorNivel(nivel);
    select.innerHTML = `<option value="">${textoDefault}</option>`;
    select.disabled = !grados.length;

    grados.forEach((g) => {
        const opt = document.createElement("option");
        opt.value = g;
        opt.textContent = g;
        select.appendChild(opt);
    });

    if (valorPreferido && grados.includes(valorPreferido)) {
        select.value = valorPreferido;
    }
}

export function llenarOpcionesSeccion(select, textoDefault = "Selecciona", valorPreferido = "") {
    if (!select) return;
    select.innerHTML = `<option value="">${textoDefault}</option>`;
    SECCIONES.forEach((letra) => {
        const opt = document.createElement("option");
        opt.value = letra;
        opt.textContent = letra;
        select.appendChild(opt);
    });
    if (valorPreferido && SECCIONES.includes(valorPreferido)) {
        select.value = valorPreferido;
    }
}

export function enlazarNivelYGrado(selectNivel, selectGrado) {
    if (!selectNivel || !selectGrado) return;

    const actualizar = () => {
        llenarOpcionesGrado(selectGrado, selectNivel.value, "Selecciona", selectGrado.value);
    };

    selectNivel.addEventListener("change", () => {
        llenarOpcionesGrado(selectGrado, selectNivel.value);
    });

    actualizar();
}

const NOMBRES = [
    "Aaron", "Adriana", "Bruno", "Camila", "Diego", "Elena", "Fabian", "Gabriela",
    "Hugo", "Irene", "Javier", "Karen", "Luis", "Mariana", "Nicolas", "Olga",
    "Pablo", "Rosa", "Samuel", "Teresa", "Ulises", "Valeria", "William", "Ximena",
    "Yahir", "Zoe", "Andrea", "Benjamin", "Cesar", "Diana", "Emilio", "Flora"
];

const APELLIDOS = [
    "Quispe", "Mamani", "Rojas", "Vargas", "Torres", "Flores", "Gutierrez", "Silva",
    "Castro", "Morales", "Herrera", "Medina", "Aguilar", "Paredes", "Soto", "Ramirez",
    "Chavez", "Diaz", "Ortega", "Reyes", "Campos", "Salazar", "Nunez", "Vega"
];

function elegir(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
}

export function generarNombreCompletoAleatorio() {
    const segundoApellido = Math.random() > 0.35 ? ` ${elegir(APELLIDOS)}` : "";
    return `${elegir(NOMBRES)} ${elegir(APELLIDOS)}${segundoApellido}`;
}

export function generarAlumnoDemoAleatorio() {
    const nivel = Math.random() > 0.48 ? NIVEL_PRIMARIA : NIVEL_SECUNDARIA;
    const grados = gradosPorNivel(nivel);
    return {
        nombresCompletos: generarNombreCompletoAleatorio(),
        nivel,
        grado: elegir(grados),
        seccion: elegir(SECCIONES),
        turno: Math.random() > 0.42 ? "Dia" : "Tarde"
    };
}
