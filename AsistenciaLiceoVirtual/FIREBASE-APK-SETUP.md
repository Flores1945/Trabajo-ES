# Firebase en la APK — configuracion obligatoria

## Problema frecuente: "DNI o contraseña incorrectos"

Suele ser una de estas causas:

1. **`google-services.json` incorrecto** (archivo de prueba / API key falsa) → Auth falla siempre.
2. **No existe** `indice_login_apk/{dni}` en Realtime Database.
3. **Cargo** no es `Docente` ni `Sub Docente`.
4. **Contraseña** distinta a la del registro web (Firebase Auth).

---

## Paso 1: Descargar el `google-services.json` REAL

1. [Firebase Console](https://console.firebase.google.com) → proyecto **liceo-asistencia**.
2. Icono engranaje → **Configuracion del proyecto**.
3. En **Tus apps**, si no hay app Android:
   - **Agregar app** → Android.
   - Nombre del paquete: `com.example.liceoasistenciavirtual` (igual que en `app/build.gradle.kts`).
   - Registrar app.
4. **Descargar `google-services.json`**.
5. Reemplazar el archivo en:
   `AsistenciaLiceoVirtual/app/google-services.json`
6. En Android Studio: **Sync Project with Gradle Files** y vuelve a instalar la APK.

> El `mobilesdk_app_id` de Android es distinto al de la web. Por eso debes usar el archivo descargado, no inventar uno.

---

## Paso 2: Reglas de Realtime Database

Debe existir (y estar publicado):

```json
"indice_login_apk": {
  "$dni": {
    ".read": true,
    ".write": "auth != null"
  }
}
```

---

## Paso 3: Registrar docente en la WEB

1. `html/registro.html` → cargo **Docente** o **Sub Docente**.
2. DNI **8 digitos**, correo y contraseña (minimo 6).
3. En Firebase → **Datos** → comprobar:
   - `indice_login_apk` → `{tu_dni}` → `correo`, `cargo`, `nombresCompletos`
   - **Authentication** → **Users** → aparece el correo.

---

## Paso 4: Login en la APK

- **DNI:** los mismos 8 digitos del registro.
- **Contraseña:** la misma del registro web (no la clave antigua del nodo `usuarios`).

---

## Authentication

En Firebase → **Authentication** → **Sign-in method** → **Correo/Contrasena** = **Habilitado**.
