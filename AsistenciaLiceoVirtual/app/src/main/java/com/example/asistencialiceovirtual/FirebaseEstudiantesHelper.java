package com.example.asistencialiceovirtual;

import android.content.Context;

import androidx.annotation.NonNull;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * Lee {@code estudiantes} en RTDB (mismo nodo que la web) y filtra por turno, nivel, grado y sección.
 */
public final class FirebaseEstudiantesHelper {

    private static final String NODE_ESTUDIANTES = "estudiantes";

    public interface EstudiantesListener {
        void onSuccess(List<Estudiante> estudiantes);

        void onFailure(String message);
    }

    private FirebaseEstudiantesHelper() {
    }

    public static void cargarPorAula(
            Context context,
            String turnoApk,
            String nivelFirebase,
            String grado,
            String seccion,
            EstudiantesListener listener) {

        if (context == null || listener == null) {
            return;
        }

        if (FirebaseAuth.getInstance().getCurrentUser() == null) {
            listener.onFailure(context.getString(R.string.alumnos_error_sesion));
            return;
        }

        DatabaseReference ref = FirebaseDatabase.getInstance(FirebaseLoginHelper.DATABASE_URL)
                .getReference()
                .child(NODE_ESTUDIANTES);

        ref.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                List<Estudiante> lista = new ArrayList<>();
                for (DataSnapshot child : snapshot.getChildren()) {
                    Estudiante e = parsear(child);
                    if (e == null) {
                        continue;
                    }
                    if (!CatalogoEscolar.coincideTurno(e.getTurno(), turnoApk)) {
                        continue;
                    }
                    if (!CatalogoEscolar.coincideNivel(e.getNivel(), nivelFirebase)) {
                        continue;
                    }
                    if (!CatalogoEscolar.coincideGrado(e.getGrado(), grado)) {
                        continue;
                    }
                    if (!CatalogoEscolar.coincideSeccion(e.getSeccion(), seccion)) {
                        continue;
                    }
                    lista.add(e);
                }

                Collections.sort(lista, Comparator.comparing(
                        e -> e.getNombresCompletos().toLowerCase(Locale.ROOT)));
                listener.onSuccess(lista);
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                if ("permission-denied".equals(error.getCode())) {
                    listener.onFailure(context.getString(R.string.alumnos_error_reglas));
                } else {
                    listener.onFailure(context.getString(R.string.alumnos_error_db, error.getMessage()));
                }
            }
        });
    }

    private static Estudiante parsear(DataSnapshot snapshot) {
        String nombre = readString(snapshot, "nombresCompletos", "nombreCompleto", "nombre");
        if (nombre == null) {
            return null;
        }
        return new Estudiante(
                snapshot.getKey() != null ? snapshot.getKey() : "",
                nombre,
                readString(snapshot, "nivel"),
                readString(snapshot, "grado"),
                readString(snapshot, "seccion"),
                readString(snapshot, "turno"));
    }

    private static String readString(DataSnapshot snapshot, String... keys) {
        for (String key : keys) {
            Object v = snapshot.child(key).getValue();
            if (v == null) {
                continue;
            }
            String texto = String.valueOf(v).trim();
            if (!texto.isEmpty() && !"null".equalsIgnoreCase(texto)) {
                return texto;
            }
        }
        return null;
    }
}
