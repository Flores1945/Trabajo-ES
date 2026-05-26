package com.example.asistencialiceovirtual;

import android.content.Context;

import androidx.annotation.NonNull;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException;
import com.google.firebase.auth.FirebaseAuthInvalidUserException;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Login APK: DNI + contraseña del registro web (Firebase Auth + indice_login_apk).
 */
public final class FirebaseLoginHelper {

    public static final String DATABASE_URL = "https://liceo-asistencia-default-rtdb.firebaseio.com";

    private static final String NODE_INDICE_DNI = "indice_login_apk";
    private static final String CARGO_DOCENTE = "Docente";
    private static final String CARGO_SUB_DOCENTE = "Sub Docente";

    public interface LoginListener {
        void onSuccess(User user);

        void onFailure(String message);
    }

    private FirebaseLoginHelper() {
    }

    public static void login(Context context, String dni, String password, LoginListener listener) {
        if (context == null || listener == null) {
            return;
        }

        String normalizedPass = password == null ? "" : password.trim();
        List<String> dniKeys = variantesDni(dni);

        if (dniKeys.isEmpty() || normalizedPass.isEmpty()) {
            listener.onFailure(context.getString(R.string.login_campos_vacios));
            return;
        }

        buscarIndice(context, dniKeys, 0, normalizedPass, listener);
    }

    private static void buscarIndice(
            Context context,
            List<String> dniKeys,
            int index,
            String password,
            LoginListener listener) {

        if (index >= dniKeys.size()) {
            listener.onFailure(context.getString(R.string.login_error_indice));
            return;
        }

        String dniKey = dniKeys.get(index);
        DatabaseReference refIndice = FirebaseDatabase.getInstance(DATABASE_URL)
                .getReference()
                .child(NODE_INDICE_DNI)
                .child(dniKey);

        refIndice.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                if (!snapshot.exists()) {
                    buscarIndice(context, dniKeys, index + 1, password, listener);
                    return;
                }

                String correo = readValue(snapshot, "correo");
                String cargo = readValue(snapshot, "cargo");
                String nombre = readValue(snapshot, "nombresCompletos", "nombreCompleto", "nombre");

                if (correo == null || cargo == null || nombre == null) {
                    listener.onFailure(context.getString(R.string.login_error_perfil));
                    return;
                }

                if (!puedeUsarApk(cargo)) {
                    listener.onFailure(context.getString(R.string.login_error_solo_docentes));
                    return;
                }

                String email = correo.trim().toLowerCase();
                FirebaseAuth.getInstance()
                        .signInWithEmailAndPassword(email, password)
                        .addOnCompleteListener(task -> {
                            if (task.isSuccessful()) {
                                listener.onSuccess(new User(nombre, cargo, null));
                                return;
                            }
                            listener.onFailure(mensajeErrorAuth(context, task.getException()));
                        });
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                if ("permission-denied".equals(error.getCode())) {
                    listener.onFailure(context.getString(R.string.login_error_reglas));
                } else {
                    listener.onFailure(context.getString(R.string.login_error_db, error.getMessage()));
                }
            }
        });
    }

    /** Variantes de clave DNI (con/sin ceros a la izquierda). */
    static List<String> variantesDni(String dni) {
        Set<String> keys = new LinkedHashSet<>();
        if (dni == null) {
            return new ArrayList<>();
        }
        String soloDigitos = dni.trim().replaceAll("\\D", "");
        if (soloDigitos.isEmpty()) {
            return new ArrayList<>();
        }

        keys.add(soloDigitos);

        if (soloDigitos.length() < 8) {
            keys.add(String.format("%08d", Long.parseLong(soloDigitos)));
        }

        if (soloDigitos.length() == 8 && soloDigitos.startsWith("0")) {
            String sinCeros = soloDigitos.replaceFirst("^0+", "");
            if (!sinCeros.isEmpty()) {
                keys.add(sinCeros);
            }
        }

        return new ArrayList<>(keys);
    }

    private static String mensajeErrorAuth(Context context, Exception error) {
        if (error instanceof FirebaseAuthInvalidUserException) {
            return context.getString(R.string.login_error_usuario_auth);
        }
        if (error instanceof FirebaseAuthInvalidCredentialsException) {
            return context.getString(R.string.login_error_clave);
        }
        if (error != null && error.getMessage() != null) {
            String msg = error.getMessage().toLowerCase();
            if (msg.contains("api key") || msg.contains("api_key") || msg.contains("configuration")) {
                return context.getString(R.string.login_error_config_apk);
            }
        }
        return context.getString(R.string.login_error);
    }

    private static boolean puedeUsarApk(String cargo) {
        return CARGO_DOCENTE.equalsIgnoreCase(cargo.trim())
                || CARGO_SUB_DOCENTE.equalsIgnoreCase(cargo.trim());
    }

    private static String readValue(DataSnapshot snapshot, String... keys) {
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
