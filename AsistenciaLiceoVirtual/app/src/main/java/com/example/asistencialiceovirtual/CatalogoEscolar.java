package com.example.asistencialiceovirtual;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * Mismos valores que la web ({@code js/catalogo-escolar.js} y nodo {@code estudiantes}).
 */
public final class CatalogoEscolar {

    public static final String NIVEL_PRIMARIA = "Primaria";
    public static final String NIVEL_SECUNDARIA = "Secundaria";

    public static final String TURNO_DIA = "Dia";
    public static final String TURNO_TARDE = "Tarde";

    private static final List<String> GRADOS_PRIMARIA =
            Arrays.asList("1°", "2°", "3°", "4°", "5°", "6°");
    private static final List<String> GRADOS_SECUNDARIA =
            Arrays.asList("1°", "2°", "3°", "4°", "5°");
    private static final List<String> SECCIONES =
            Arrays.asList("A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
                    "K", "L", "M", "N", "O");

    private CatalogoEscolar() {
    }

    public static List<String> gradosPorNivel(String nivelFirebase) {
        if (NIVEL_PRIMARIA.equals(nivelFirebase)) {
            return GRADOS_PRIMARIA;
        }
        if (NIVEL_SECUNDARIA.equals(nivelFirebase)) {
            return GRADOS_SECUNDARIA;
        }
        return GRADOS_PRIMARIA;
    }

    public static List<String> secciones() {
        return SECCIONES;
    }

    /** Código interno APK ({@code manana} / {@code tarde}) → valor en Firebase. */
    public static String turnoFirebaseDesdeApk(String turnoApk) {
        if (NivelEscolarActivity.TURNO_TARDE.equals(turnoApk)) {
            return TURNO_TARDE;
        }
        return TURNO_DIA;
    }

    /** Clave interna ({@code primaria} / {@code secundaria}) → valor en Firebase. */
    public static String nivelFirebaseDesdeApk(String nivelApk) {
        if (GradoSeccionActivity.NIVEL_SECUNDARIA.equals(nivelApk)) {
            return NIVEL_SECUNDARIA;
        }
        return NIVEL_PRIMARIA;
    }

    public static boolean coincideTurno(String turnoDb, String turnoApk) {
        String esperado = turnoFirebaseDesdeApk(turnoApk);
        String normalizado = normalizarTurno(turnoDb);
        return esperado.equalsIgnoreCase(normalizado);
    }

    public static String normalizarTurno(String turnoDb) {
        if (turnoDb == null) {
            return "";
        }
        String t = turnoDb.trim();
        if (t.isEmpty()) {
            return "";
        }
        String bajo = t.toLowerCase(Locale.ROOT);
        if ("tarde".equals(bajo) || "noche".equals(bajo)) {
            return TURNO_TARDE;
        }
        if ("dia".equals(bajo) || "día".equals(bajo) || "manana".equals(bajo) || "mañana".equals(bajo)) {
            return TURNO_DIA;
        }
        return t.substring(0, 1).toUpperCase(Locale.ROOT) + t.substring(1).toLowerCase(Locale.ROOT);
    }

    public static boolean coincideNivel(String nivelDb, String nivelFirebase) {
        if (nivelDb == null || nivelFirebase == null) {
            return false;
        }
        return nivelFirebase.equalsIgnoreCase(nivelDb.trim());
    }

    public static boolean coincideGrado(String gradoDb, String gradoSeleccionado) {
        if (gradoDb == null || gradoSeleccionado == null) {
            return false;
        }
        return gradoSeleccionado.trim().equals(gradoDb.trim());
    }

    public static boolean coincideSeccion(String seccionDb, String seccionSeleccionada) {
        if (seccionDb == null || seccionSeleccionada == null) {
            return false;
        }
        return seccionSeleccionada.trim().equalsIgnoreCase(seccionDb.trim());
    }
}
