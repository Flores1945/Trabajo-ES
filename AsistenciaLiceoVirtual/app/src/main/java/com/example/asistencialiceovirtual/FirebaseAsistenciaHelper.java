package com.example.asistencialiceovirtual;

import android.content.Context;

import androidx.annotation.NonNull;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Registra asistencia en el nodo {@code asistencias} de Firebase RTDB,
 * con la misma estructura que usa la web ({@code js/asistencias.js}).
 *
 * Usa una clave determinista ({@code estudianteId_fecha}) para que al cambiar
 * el estado del mismo alumno en el mismo dia se sobrescriba el registro anterior.
 */
public final class FirebaseAsistenciaHelper {

    private static final String NODE_ASISTENCIAS = "asistencias";

    public interface AsistenciaListener {
        void onSuccess();
        void onFailure(String message);
    }

    private FirebaseAsistenciaHelper() {
    }

    /**
     * Registra (o sobrescribe) la asistencia de un estudiante para el dia actual.
     *
     * @param context       contexto Android
     * @param estudiante    datos del alumno
     * @param estado        Puntual | Tardanza | Falta | Justificacion
     * @param tomadoPor     nombre del docente que registra
     * @param listener      callback de resultado
     */
    public static void registrarAsistencia(
            Context context,
            Estudiante estudiante,
            String estado,
            String tomadoPor,
            AsistenciaListener listener) {

        if (context == null || listener == null) {
            return;
        }

        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
        if (user == null) {
            listener.onFailure(context.getString(R.string.alumnos_error_sesion));
            return;
        }

        String fechaHoy = new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).format(new Date());
        String claveAsistencia = estudiante.getId() + "_" + fechaHoy;

        DatabaseReference ref = FirebaseDatabase.getInstance(FirebaseLoginHelper.DATABASE_URL)
                .getReference()
                .child(NODE_ASISTENCIAS)
                .child(claveAsistencia);

        String fechaHora = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.ROOT)
                .format(new Date());

        Map<String, Object> datos = new HashMap<>();
        datos.put("estudiante", estudiante.getNombresCompletos());
        datos.put("nivel", estudiante.getNivel());
        datos.put("grado", estudiante.getGrado());
        datos.put("seccion", estudiante.getSeccion());
        datos.put("turno", estudiante.getTurno());
        datos.put("estado", estado);
        datos.put("tomadoPor", tomadoPor);
        datos.put("fechaHora", fechaHora);

        ref.setValue(datos)
                .addOnSuccessListener(unused -> listener.onSuccess())
                .addOnFailureListener(e -> {
                    String msg = e.getMessage();
                    if (msg != null && msg.contains("permission")) {
                        listener.onFailure(context.getString(R.string.asistencia_error_reglas));
                    } else {
                        listener.onFailure(context.getString(R.string.asistencia_error_guardar, msg));
                    }
                });
    }
}
