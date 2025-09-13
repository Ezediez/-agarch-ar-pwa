// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAkOlKO8tn-aVuJMOoxy7vsgYBRD6THhP0",
  authDomain: "agarch-ar.com", // Configurado para tu dominio
  projectId: "sample-firebase-ai-app-b9230",
  storageBucket: "sample-firebase-ai-app-b9230.firebasestorage.app",
  messagingSenderId: "662769333165",
  appId: "1:662769333165:web:af268083ba47ffe2cc6724",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export default for compatibility
export default app;
