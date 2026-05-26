import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";
import { auth, db } from "./firebase-config.js";
import { rutaInicioPorCargo } from "./auth-roles.js";
import { registrarInicioSesion } from "./auditoria.js";

const WEB_USERS_NODE = "usuarios_web";
const loginForm = document.getElementById("loginForm");
const estadoLogin = document.getElementById("estadoLogin");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const correo = document.getElementById("correo").value.trim().toLowerCase();
    const clave = document.getElementById("clave").value;

    if (!correo || !clave) {
        estadoLogin.textContent = "Completa todos los campos.";
        return;
    }

    try {
        estadoLogin.textContent = "Verificando...";

        const credencial = await signInWithEmailAndPassword(auth, correo, clave);
        const { uid } = credencial.user;

        const perfilSnap = await get(ref(db, `${WEB_USERS_NODE}/${uid}`));
        if (!perfilSnap.exists()) {
            estadoLogin.textContent = "Acceso correcto, pero falta perfil en base de datos.";
            return;
        }

        const perfil = perfilSnap.val();

        const usuarioActivo = {
            uid,
            nombresCompletos: perfil.nombresCompletos,
            correo: perfil.correo,
            cargo: perfil.cargo
        };

        sessionStorage.setItem("usuario_activo", JSON.stringify(usuarioActivo));
        await registrarInicioSesion(usuarioActivo);

        estadoLogin.textContent = `Bienvenido(a), ${perfil.nombresCompletos}.`;
        window.location.href = rutaInicioPorCargo(perfil.cargo);
    } catch (error) {
        if (error.code === "auth/invalid-credential") {
            estadoLogin.textContent = "Correo o contrasena incorrectos.";
            return;
        }

        estadoLogin.textContent = "No se pudo validar el acceso. Revisa Firebase.";
        console.error(error);
    }
});
