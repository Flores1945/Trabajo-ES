import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBgtKPc7X-fj-A-EN86XIs8idFCrUu3NAQ",
    authDomain: "liceo-asistencia.firebaseapp.com",
    databaseURL: "https://liceo-asistencia-default-rtdb.firebaseio.com",
    projectId: "liceo-asistencia",
    storageBucket: "liceo-asistencia.firebasestorage.app",
    messagingSenderId: "799929195707",
    appId: "1:799929195707:web:98a54bc4d80b27f4369d9e",
    measurementId: "G-BZED9B3YL3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { auth, db };