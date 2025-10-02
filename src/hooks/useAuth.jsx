// 🔥 FIREBASE AUTH HOOK - USANDO FIREBASE NATIVO
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast.jsx';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const getProfile = useCallback(async (user) => {
    if (!user) {
      setProfile(null);
      return null;
    }
    
    try {
      // Firebase Firestore query
      const profileRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        console.log('Profile not found, creating new one');
        // Crear perfil básico si no existe
        const newProfile = {
          id: user.uid,
          email: user.email,
          alias: user.email.split('@')[0],
          created_at: new Date(),
          updated_at: new Date()
        };
        
        await setDoc(profileRef, newProfile);
        setProfile(newProfile);
        return newProfile;
      }
      
      const profileData = profileSnap.data();
      console.log('📥 Perfil cargado desde Firestore:', {
        id: profileSnap.id,
        alias: profileData?.alias,
        profile_picture_url: profileData?.profile_picture_url,
        fotos: profileData?.fotos?.length || 0,
        updated_at: profileData?.updated_at
      });
      setProfile(profileData || null);
      return profileData || null;
    } catch (error) {
       console.error("Error fetching profile:", error.message);
       toast({
        variant: "destructive",
        title: "Error al cargar el perfil",
        description: "Hubo un problema al obtener la información de tu perfil.",
      });
      setProfile(null);
      return null;
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setSession(currentUser ? { user: currentUser } : null);
      setUser(currentUser);
      if (currentUser) {
        await getProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [getProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      console.log('🔄 Refrescando perfil desde Firestore...');
      await getProfile(user);
    }
  }, [user, getProfile]);

  const forceRefreshProfile = useCallback(async () => {
    if (user) {
      console.log('🔄 Forzando actualización de perfil...');
      // Limpiar estado actual y recargar desde Firestore
      setProfile(null);
      await getProfile(user);
    }
  }, [user, getProfile]);
  
  const signUp = async (formData) => {
    console.log('🔥🔥🔥 FIREBASE SIGNUP LLAMADO');
    const { email, password, ...profileData } = formData;
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Crear el perfil en Firestore
      const profileToCreate = {
        id: user.uid,
        email: user.email,
        ...profileData,
        is_verified: true,
        role: 'user',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const profileRef = doc(db, 'profiles', user.uid);
      await setDoc(profileRef, profileToCreate);
      console.log('🔥🔥🔥 PERFIL CREADO EN FIRESTORE');
      
      return { data: { user }, error: null };
    } catch (error) {
      console.error('FIREBASE SIGNUP ERROR:', error.code, error.message);
      
      // Mapear errores comunes
      const errorMap = {
        'auth/operation-not-allowed': 'El proveedor Email/Password no está habilitado en Firebase.',
        'auth/email-already-in-use': 'Este correo ya está registrado.',
        'auth/invalid-email': 'El correo electrónico no es válido.',
        'auth/weak-password': 'La contraseña es demasiado débil (mínimo 6 caracteres).'
      };
      
      const friendlyError = errorMap[error.code] || 'Error al crear la cuenta.';
      
      return { data: null, error: { message: friendlyError, code: error.code } };
    }
  };

  const signIn = async (email, password) => {
    console.log('🔥🔥🔥 FIREBASE SIGNIN LLAMADO');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      return { data: { user }, error: null };
    } catch (error) {
      console.error('FIREBASE SIGNIN ERROR:', error.code, error.message);
      
      const errorMap = {
        'auth/operation-not-allowed': 'El proveedor Email/Password no está habilitado en Firebase.',
        'auth/invalid-credential': 'Credenciales inválidas.',
        'auth/user-not-found': 'Usuario no encontrado.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/invalid-email': 'El correo electrónico no es válido.'
      };
      
      const friendlyError = errorMap[error.code] || 'Error al iniciar sesión.';
      
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: friendlyError,
      });
      
      return { data: null, error: { message: friendlyError, code: error.code } };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };
  
  const deleteAccount = async () => {
    try {
      if (user) {
        // Eliminar perfil de Firestore
        const profileRef = doc(db, 'profiles', user.uid);
        await deleteDoc(profileRef);
        
        // Eliminar usuario de Authentication (requiere reautenticación reciente)
        await user.delete();
        
        toast({
          title: "Cuenta eliminada",
          description: "Tu cuenta ha sido eliminada permanentemente.",
        });
        await signOut();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al eliminar la cuenta",
        description: error.message,
      });
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    forceRefreshProfile,
    deleteAccount
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
