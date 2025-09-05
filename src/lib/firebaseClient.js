// 🔥 FIREBASE CLIENT - REEMPLAZO DE SUPABASE
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, updateDoc, query, where, limit, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

// Servicios Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Compatibilidad con API de Supabase
export const supabase = {
  auth: {
    signUp: async ({ email, password }) => {
      console.log('🔥 Firebase signUp called:', email);
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        console.log('🔥 Firebase signUp success:', result.user.uid);
        return { data: { user: result.user }, error: null };
      } catch (error) {
        console.error('🔥 Firebase signUp error:', error);
        return { data: null, error };
      }
    },
    
    signInWithPassword: async ({ email, password }) => {
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { data: { user: result.user }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    
    signOut: async () => {
      try {
        await firebaseSignOut(auth);
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    
    onAuthStateChange: (callback) => {
      return onAuthStateChanged(auth, (user) => {
        callback('SIGNED_IN', { user });
      });
    }
  },
  
  from: (table) => ({
    select: (fields) => ({
      eq: (column, value) => ({
        single: async () => {
          try {
            const q = query(collection(db, table), where(column, "==", value), limit(1));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return { data: null, error: null };
            const doc = snapshot.docs[0];
            return { data: { id: doc.id, ...doc.data() }, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      })
    }),
    
    insert: async (data) => {
      try {
        const docRef = await addDoc(collection(db, table), {
          ...data,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        return { data: { id: docRef.id, ...data }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    
    update: (data) => ({
      eq: async (column, value) => {
        try {
          const q = query(collection(db, table), where(column, "==", value));
          const snapshot = await getDocs(q);
          
          const updates = snapshot.docs.map(doc => 
            updateDoc(doc.ref, { ...data, updated_at: serverTimestamp() })
          );
          
          await Promise.all(updates);
          return { data: null, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    })
  }),
  
  rpc: async (functionName, params) => {
    console.log(`🔥 Firebase RPC: ${functionName}`, params);
    
    if (functionName === 'handle_user_interaction') {
      try {
        // Crear mensaje
        await addDoc(collection(db, 'messages'), {
          senderId: auth.currentUser?.uid,
          recipientId: params.target_user_id,
          contenido: params.initial_message,
          timestamp: serverTimestamp(),
          message_type: 'text'
        });
        
        // Crear notificación
        await addDoc(collection(db, 'notifications'), {
          user_id: params.target_user_id,
          type: 'message',
          title: 'Nuevo mensaje',
          message: 'Tienes un nuevo mensaje',
          timestamp: serverTimestamp(),
          read: false
        });
        
        return { 
          data: { 
            success: true, 
            message: 'Mensaje enviado correctamente',
            action: 'message_sent'
          }, 
          error: null 
        };
      } catch (error) {
        return { 
          data: { 
            success: false, 
            error: error.message 
          }, 
          error 
        };
      }
    }
    
    return { data: null, error: new Error(`Function ${functionName} not implemented`) };
  }
};

export default app;
