/**
 * Exportacion formal por aulas: un bloque (cuadro) por grado + seccion + turno.
 * Columnas de fechas horizontales con codigos V / F / T / J.
 */

function formatoFechaColumna(fechaNormalizada) {
    if (!fechaNormalizada || !/^\d{4}-\d{2}-\d{2}$/.test(fechaNormalizada)) {
        return "Sin fecha";
    }
    const [anio, mes, dia] = fechaNormalizada.split("-");
    return `${dia}/${mes}/${anio}`;
}

export function estadoACodigoAsistencia(estadoRaw) {
    const e = (estadoRaw || "").toString().trim().toLowerCase();
    if (e.includes("justif") || e === "j") return "J";
    if (e.includes("tard") || e === "t" || e === "tarde") return "T";
    if (e.includes("inasist") || e.includes("falta") || e.includes("ausent") || e === "f") return "F";
    if (e.includes("asist") || e === "v" || e.includes("present")) return "V";
    return (estadoRaw || "").toString().charAt(0).toUpperCase() || "-";
}

function ordenGrado(grado) {
    const texto = (grado || "").toString().toLowerCase();
    const match = texto.match(/(\d+)/);
    if (match) return parseInt(match[1], 10);
    const mapa = { primero: 1, segundo: 2, tercero: 3, cuarto: 4, quinto: 5, sexto: 6 };
    for (const [nombre, num] of Object.entries(mapa)) {
        if (texto.includes(nombre)) return num;
    }
    return 99;
}

function claveAula(fila) {
    return `${fila.nivel || ""}|${fila.grado}|${fila.seccion}|${fila.turno}`;
}

function claveEstudianteEnAula(fila) {
    return fila.estudiante;
}

function filaVacia(columnas) {
    return new Array(columnas).fill("");
}

function tituloAula(nivel, grado, seccion, turno) {
    const prefijo = nivel ? `${nivel} ` : "";
    return `AULA ${prefijo}${grado} — SECCION ${seccion} — TURNO ${turno}`;
}

export function construirHojaAsistenciasPorAulas(data) {
    const fechasSet = new Set();
    const porAula = new Map();

    data.forEach((fila) => {
        const fecha = fila.fechaNormalizada || "";
        if (fecha) fechasSet.add(fecha);

        const aulaKey = claveAula(fila);
        if (!porAula.has(aulaKey)) {
            porAula.set(aulaKey, {
                nivel: fila.nivel || "",
                grado: fila.grado,
                seccion: fila.seccion,
                turno: fila.turno,
                alumnos: new Map()
            });
        }

        const bloque = porAula.get(aulaKey);
        const estKey = claveEstudianteEnAula(fila);
        if (!bloque.alumnos.has(estKey)) {
            bloque.alumnos.set(estKey, {
                nombresCompletos: fila.estudiante,
                nivel: fila.nivel || "",
                grado: fila.grado,
                seccion: fila.seccion,
                turno: fila.turno,
                porFecha: {}
            });
        }
        if (fecha) {
            bloque.alumnos.get(estKey).porFecha[fecha] = estadoACodigoAsistencia(fila.estado);
        }
    });

    const fechasOrdenadas = [...fechasSet].sort();
    const encabezadosFecha = fechasOrdenadas.map(formatoFechaColumna);
    const encabezado = ["Nombres completos", "Nivel", "Grado", "Seccion", "Turno", ...encabezadosFecha];
    const totalColumnas = encabezado.length;

    const aulasOrdenadas = [...porAula.values()].sort((a, b) => {
        const g = ordenGrado(a.grado) - ordenGrado(b.grado);
        if (g !== 0) return g;
        const s = String(a.seccion).localeCompare(String(b.seccion), "es");
        if (s !== 0) return s;
        return String(a.turno).localeCompare(String(b.turno), "es");
    });

    const matriz = [];
    const merges = [];
    let filaActual = 0;

    const agregarMergeTitulo = (filaIndex) => {
        if (totalColumnas > 1) {
            merges.push({
                s: { r: filaIndex, c: 0 },
                e: { r: filaIndex, c: totalColumnas - 1 }
            });
        }
    };

    const tituloDoc = filaVacia(totalColumnas);
    tituloDoc[0] = "I.E. LICEO TRUJILLO — REGISTRO DE ASISTENCIAS";
    matriz.push(tituloDoc);
    agregarMergeTitulo(filaActual);
    filaActual += 1;

    matriz.push(filaVacia(totalColumnas));
    filaActual += 1;

    aulasOrdenadas.forEach((aula, indice) => {
        const filaTituloAula = filaVacia(totalColumnas);
        filaTituloAula[0] = tituloAula(aula.nivel, aula.grado, aula.seccion, aula.turno);
        matriz.push(filaTituloAula);
        agregarMergeTitulo(filaActual);
        filaActual += 1;

        matriz.push([...encabezado]);
        filaActual += 1;

        const alumnosOrdenados = [...aula.alumnos.values()].sort((a, b) =>
            a.nombresCompletos.localeCompare(b.nombresCompletos, "es")
        );

        alumnosOrdenados.forEach((alumno) => {
            const fila = [alumno.nombresCompletos, alumno.nivel, alumno.grado, alumno.seccion, alumno.turno];
            fechasOrdenadas.forEach((fecha) => {
                fila.push(alumno.porFecha[fecha] || "");
            });
            matriz.push(fila);
            filaActual += 1;
        });

        if (indice < aulasOrdenadas.length - 1) {
            matriz.push(filaVacia(totalColumnas));
            matriz.push(filaVacia(totalColumnas));
            filaActual += 2;
        }
    });

    return { matriz, merges, totalColumnas, totalAulas: aulasOrdenadas.length };
}

export function aplicarEstiloHojaAsistencias(hoja, totalColumnas) {
    const anchos = [{ wch: 38 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 12 }];
    for (let i = 5; i < totalColumnas; i += 1) {
        anchos.push({ wch: 14 });
    }
    hoja["!cols"] = anchos;
}

export function exportarAsistenciasExcelFormal(data, nombreArchivo) {
    const { matriz, merges, totalColumnas } = construirHojaAsistenciasPorAulas(data);
    const hoja = XLSX.utils.aoa_to_sheet(matriz);

    if (merges.length) {
        hoja["!merges"] = merges;
    }

    aplicarEstiloHojaAsistencias(hoja, totalColumnas);

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Asistencias");
    XLSX.writeFile(libro, nombreArchivo);
}
