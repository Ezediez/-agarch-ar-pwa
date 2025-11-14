// Firebase Configuration for AGARCH-AR
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAkOlKO8tn-aVuJMOoxy7vsgYBRD6THhP0",
  authDomain: "agarch-ar.com", // Cambiado de sample-firebase-ai-app-b9230.firebaseapp.com
  databaseURL: "",
  projectId: "sample-firebase-ai-app-b9230",
  storageBucket: "sample-firebase-ai-app-b9230.firebasestorage.app",
  messagingSenderId: "662769333165",
  appId: "1:662769333165:web:af268083ba47ffe2cc6724",
  measurementId: ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Development mode - connect to emulators
if (process.env.NODE_ENV === 'development') {
  try {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    console.log('Emulators already connected');
  }
}

export { auth, db };
export default app;
