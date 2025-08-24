import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
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
      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }
      
      setProfile(data || null);
      return data || null;
    } catch (error) {
       console.error("Error fetching profile:", error.message);
       toast({
        variant: "destructive",
        title: "Error al cargar el perfil",
        description: "Hubo un problema al obtener la información de tu perfil. Por favor, intenta de nuevo más tarde.",
      });
      setProfile(null);
      return null;
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
      subscription.unsubscribe();
    };
  }, [getProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await getProfile(user);
    }
  }, [user, getProfile]);
  
  const signUp = async (formData) => {
    const { email, password, ...profileData } = formData;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { ...profileData, is_verified: true, role: 'user' } },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
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
    const { error } = await supabase.functions.invoke('delete-user');
    if (error) {
       toast({
        variant: "destructive",
        title: "Error al eliminar la cuenta",
        description: error.message,
      });
    } else {
       toast({
        title: "Cuenta eliminada",
        description: "Tu cuenta ha sido eliminada permanentemente.",
      });
      await signOut();
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