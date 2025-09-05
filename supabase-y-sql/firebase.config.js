// 🔥 CONFIGURACIÓN FIREBASE - AGARCH-AR
// Configuración para migrar de Supabase a Firebase

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAkOlKO8tn-aVuJMOoxy7vsgYBRD6THhP0",
  authDomain: "sample-firebase-ai-app-b9230.firebaseapp.com",
  projectId: "sample-firebase-ai-app-b9230",
  storageBucket: "sample-firebase-ai-app-b9230.firebasestorage.app",
  messagingSenderId: "662769333165",
  appId: "1:662769333165:web:17ddb2b264d4c0e3cc6724"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
