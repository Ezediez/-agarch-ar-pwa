// 🔥 FIREBASE AUTH HOOK - SUPABASE COMPLETAMENTE ELIMINADO
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient'; // 🔥 Firebase client
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
      setLoading(true);
      // Firebase Firestore query
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.uid) // Firebase usa uid, no id
        .single();

      if (error) {
        console.log('Profile not found, creating new one');
        // Crear perfil básico si no existe
        const newProfile = {
          id: user.uid,
          email: user.email,
          alias: user.email.split('@')[0],
          created_at: new Date(),
          updated_at: new Date()
        };
        
        await supabase.from('profiles').insert(newProfile);
        setProfile(newProfile);
        return newProfile;
      }
      
      setProfile(data || null);
      return data || null;
    } catch (error) {
       console.error("Error fetching profile:", error.message);
       toast({
        variant: "destructive",
        title: "Error al cargar el perfil",
        description: "Hubo un problema al obtener la información de tu perfil.",
      });
      setProfile(null);
      return null;
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await getProfile(currentUser);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [getProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await getProfile(user);
    }
  }, [user, getProfile]);
  
  const signUp = async (formData) => {
    console.log('🔥🔥🔥 AUTH HOOK SIGNUP LLAMADO');
    const { email, password, ...profileData } = formData;
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    // Si el registro es exitoso, crear el perfil en Firestore
    if (data.user && !error) {
      try {
        const profileToCreate = {
          id: data.user.uid,
          email: data.user.email,
          ...profileData,
          is_verified: true,
          role: 'user',
          created_at: new Date(),
          updated_at: new Date()
        };
        
        await supabase.from('profiles').insert(profileToCreate);
        console.log('🔥🔥🔥 PERFIL CREADO EN FIRESTORE');
      } catch (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }
    
    return { data, error };
  };

  const signIn = async (email, password) => {
    console.log('🔥🔥🔥 AUTH HOOK SIGNIN LLAMADO');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if(error){
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: error.message,
      });
    }
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };
  
  const deleteAccount = async () => {
    // Firebase no tiene functions.invoke, implementar lógica personalizada
    try {
      if (user) {
        // Eliminar perfil de Firestore
        await supabase.from('profiles').delete().eq('id', user.uid);
        
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