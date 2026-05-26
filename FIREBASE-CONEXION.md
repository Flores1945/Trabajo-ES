# Firebase - Liceo Asistencia (Web)

## Nodos en Realtime Database

```json
{
  "usuarios": {},
  "usuarios_web": {
    "UID_AUTH": {
      "uid": "UID_AUTH",
      "nombresCompletos": "Nombre Apellido",
      "dni": "12345678",
      "correo": "correo@ejemplo.com",
      "celular": "999888777",
      "cargo": "Director",
      "fechaRegistro": "2026-04-28T12:00:00.000Z"
    }
  },
  "estudiantes": {
    "PUSH_ID": {
      "nombresCompletos": "Estudiante Ejemplo",
      "grado": "3ro",
      "seccion": "A",
      "turno": "Dia",
      "fechaRegistro": "2026-04-28T12:00:00.000Z",
      "fechaActualizacion": "2026-04-28T12:00:00.000Z"
    }
  },
  "movimientos": {
    "PUSH_ID": {
      "uid": "UID_AUTH",
      "accion": "inicio_sesion",
      "detalle": "Inicio de sesion en el portal web",
      "fechaHora": "2026-04-28T12:00:00.000Z"
    }
  },
  "movimientos_actividad": {
    "UID_AUTH": {
      "paginaActual": "alumnos",
      "paginaEntradaHora": "2026-04-28T12:05:00.000Z",
      "ultimaAccion": "en_pagina",
      "ultimaAccionDetalle": "En Registro de alumnos",
      "ultimaAccionHora": "2026-04-28T12:05:00.000Z",
      "fechaActualizacion": "2026-04-28T12:05:00.000Z"
    }
  },
  "asistencias": {
    "PUSH_ID": {
      "estudiante": "Estudiante Ejemplo",
      "grado": "3ro",
      "seccion": "A",
      "turno": "Dia",
      "estado": "Asistencia",
      "tomadoPor": "Nombre docente",
      "fechaHora": "2026-04-28T12:00:00.000Z"
    }
  }
}
```

## Cargos permitidos (`usuarios_web.cargo`)

| Cargo | Acceso |
|-------|--------|
| Director | Todo |
| Subdirector | Todo |
| Apafa | Solo registro/lista de alumnos |
| Docente | Reportes (portal), lista de alumnos (lectura + filtros) |
| Sub Docente | Reportes (portal), lista de alumnos (lectura + filtros) |
| Apafa | Reportes (portal), registro/lista de alumnos |

### Registro de movimientos (solo directivos en pantalla)

| Quien mira | Que ve |
|------------|--------|
| Director | Todos los movimientos |
| Subdirector | Apafa, Docentes, Sub Docentes (no Director) |
| Apafa / Docentes | Portal informativo sin historial de otros |

## Reglas recomendadas (Realtime Database)

```json
{
  "rules": {
    ".read": false,
    ".write": false,

    "usuarios": {
      ".read": true,
      ".write": true
    },

    "usuarios_web": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    },

    "estudiantes": {
      ".read": "auth != null",
      ".write": "auth != null"
    },

    "asistencias": {
      ".read": "auth != null",
      ".write": "auth != null"
    },

    "movimientos": {
      ".read": "auth != null",
      ".write": "auth != null"
    },

    "movimientos_actividad": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && auth.uid === $uid"
      }
    },

    "indice_login_apk": {
      "$dni": {
        ".read": true,
        ".write": "auth != null"
      }
    }
  }
}
```

### Login APK (DNI + contraseña web)

Al registrar personal en la web se crea `indice_login_apk/{dni}` con `correo`, `cargo`, `nombresCompletos`. La APK lee ese indice (sin auth) y luego inicia sesion con **Firebase Auth** usando el mismo correo y contraseña del registro web. Solo **Docente** y **Sub Docente**.

Usuarios registrados antes de este cambio: vuelva a guardarlos desde la web o cree el nodo `indice_login_apk/{dni}` manualmente en Firebase.

> Para produccion, conviene restringir escritura de `estudiantes` solo a cargos APAFA/Director/Subdirector usando custom claims o validacion en Cloud Functions. En esta fase web, la UI ya limita por rol.

## Authentication

- Metodo: **Email / Password** (habilitado en Firebase Console).
- La web usa `js/firebase-config.js` con el SDK CDN 12.12.0.

## Archivos web relacionados

| Funcion | Archivo |
|---------|---------|
| Config Firebase | `js/firebase-config.js` |
| Roles y permisos | `js/auth-roles.js` |
| Login | `js/login.js` |
| Registro personal | `js/registro.js` |
| Alumnos CRUD | `js/alumnos.js` |
| Asistencias | `js/asistencias.js` |
| Auditoria / movimientos | `js/auditoria.js` |
| Reportes y portal | `js/reportes.js` |

## Pagina nueva

- `html/alumnos.html` — registro, edicion y lista de alumnos en nodo `estudiantes`.
