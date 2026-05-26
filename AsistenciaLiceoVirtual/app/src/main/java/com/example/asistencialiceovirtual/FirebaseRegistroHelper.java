package com.example.asistencialiceovirtual;

import android.content.Context;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

import java.util.HashMap;
import java.util.Map;

/**
 * Guarda el registro en {@code usuarios/{DNI}} en la BD indicada, sin lecturas previas:
 * los datos que envías se escriben tal cual (crea o reemplaza ese nodo).
 */
public final class FirebaseRegistroHelper {

    public interface RegistroListener {
        void onSuccess();

        void onFailure(String message);
    }

    private FirebaseRegistroHelper() {
    }

    public static void registrarUsuario(
            Context context,
            String nombreCompleto,
            String dni,
            String clave,
            RegistroListener listener) {
        if (context == null || listener == null) {
            return;
        }

        DatabaseReference ref = FirebaseDatabase.getInstance(FirebaseLoginHelper.DATABASE_URL)
                .getReference()
                .child("usuarios")
                .child(dni);

        Map<String, Object> datos = new HashMap<>();
        datos.put("nombreCompleto", nombreCompleto.trim().replaceAll("\\s+", " "));
        datos.put("clave", clave);

        ref.setValue(datos, (error, ref1) -> {
            if (error != null) {
                listener.onFailure(
                        context.getString(R.string.registro_error_guardar, error.getMessage()));
            } else {
                listener.onSuccess();
            }
        });
    }
}
