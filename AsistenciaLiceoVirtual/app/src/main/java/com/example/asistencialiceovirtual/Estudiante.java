package com.example.asistencialiceovirtual;

import androidx.annotation.NonNull;

public class Estudiante {

    private final String id;
    private final String nombresCompletos;
    private final String nivel;
    private final String grado;
    private final String seccion;
    private final String turno;

    public Estudiante(
            @NonNull String id,
            @NonNull String nombresCompletos,
            String nivel,
            String grado,
            String seccion,
            String turno) {
        this.id = id;
        this.nombresCompletos = nombresCompletos;
        this.nivel = nivel == null ? "" : nivel;
        this.grado = grado == null ? "" : grado;
        this.seccion = seccion == null ? "" : seccion;
        this.turno = turno == null ? "" : turno;
    }

    @NonNull
    public String getId() {
        return id;
    }

    @NonNull
    public String getNombresCompletos() {
        return nombresCompletos;
    }

    public String getNivel() {
        return nivel;
    }

    public String getGrado() {
        return grado;
    }

    public String getSeccion() {
        return seccion;
    }

    public String getTurno() {
        return turno;
    }
}
