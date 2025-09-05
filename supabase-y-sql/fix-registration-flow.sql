-- ARREGLAR FLUJO DE REGISTRO
-- Verificar y corregir problemas en creación de perfiles

BEGIN;

-- 1. VERIFICAR TRIGGER DE CREACION DE PERFILES
SELECT 'VERIFICANDO TRIGGER PROFILES' as diagnostico;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND trigger_schema = 'auth';

-- 2. RECREAR TRIGGER DE CREACION AUTOMATICA DE PERFILES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.raw_user_meta_data->>'full_name', ''),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 3. ELIMINAR TRIGGER ANTERIOR SI EXISTE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. CREAR NUEVO TRIGGER
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. VERIFICAR PERFILES INCOMPLETOS
SELECT 'PERFILES INCOMPLETOS' as diagnostico;
SELECT 
    id,
    email,
    alias,
    full_name,
    created_at
FROM public.profiles 
WHERE alias IS NULL OR alias = ''
ORDER BY created_at DESC
LIMIT 10;

-- 6. VERIFICAR POLITICAS DE PROFILES
SELECT 'POLITICAS PROFILES' as diagnostico;
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 7. ASEGURAR POLITICAS CORRECTAS PARA PROFILES
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles 
    FOR SELECT TO authenticated 
    USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = id);

-- 8. HABILITAR RLS EN PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 9. VERIFICAR USUARIOS SIN PERFIL
SELECT 'USUARIOS SIN PERFIL' as diagnostico;
SELECT 
    u.id,
    u.email,
    u.created_at,
    CASE WHEN p.id IS NULL THEN 'SIN PERFIL' ELSE 'CON PERFIL' END as estado_perfil
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.created_at > NOW() - INTERVAL '7 days'
ORDER BY u.created_at DESC
LIMIT 10;

-- 10. CREAR PERFILES FALTANTES PARA USUARIOS RECIENTES
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'nombre_completo', u.raw_user_meta_data->>'full_name', ''),
    u.created_at,
    NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL 
  AND u.created_at > NOW() - INTERVAL '7 days'
ON CONFLICT (id) DO NOTHING;

SELECT 'REGISTRO FLOW ARREGLADO' as resultado;
SELECT 'Trigger creado, perfiles faltantes agregados, políticas corregidas' as detalles;

COMMIT;
