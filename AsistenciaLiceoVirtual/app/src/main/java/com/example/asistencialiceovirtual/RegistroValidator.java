package com.example.asistencialiceovirtual;

import android.text.TextUtils;

import androidx.annotation.Nullable;

import java.util.regex.Pattern;

/**
 * Validación mínima: solo lo necesario para que el formulario no esté vacío y el DNI sea numérico.
 * El nombre no debe contener dígitos (lo pediste para el registro).
 */
public final class RegistroValidator {

    private static final Pattern CONTIENE_DIGITO = Pattern.compile(".*\\d.*");

    private RegistroValidator() {
    }

    @Nullable
    public static Integer validarNombreCompleto(String raw) {
        if (raw == null) {
            return R.string.registro_error_nombre_vacio;
        }
        String nombre = raw.trim().replaceAll("\\s+", " ");
        if (nombre.isEmpty()) {
            return R.string.registro_error_nombre_vacio;
        }
        if (CONTIENE_DIGITO.matcher(nombre).find()) {
            return R.string.registro_error_nombre_numeros;
        }
        return null;
    }

    @Nullable
    public static Integer validarDni(String raw) {
        if (raw == null) {
            return R.string.registro_error_dni_vacio;
        }
        String dni = raw.trim();
        if (dni.isEmpty()) {
            return R.string.registro_error_dni_vacio;
        }
        if (dni.length() > 8) {
            return R.string.registro_error_dni_largo;
        }
        for (int i = 0; i < dni.length(); i++) {
            if (!Character.isDigit(dni.charAt(i))) {
                return R.string.registro_error_dni_solo_numeros;
            }
        }
        return null;
    }

    @Nullable
    public static Integer validarClave(String raw) {
        if (TextUtils.isEmpty(raw)) {
            return R.string.registro_error_clave_vacia;
        }
        return null;
    }
}
