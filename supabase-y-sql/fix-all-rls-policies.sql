-- Script para verificar y limpiar políticas RLS en todas las tablas principales
-- Ejecutar en el Editor SQL de Supabase

-- 1. Verificar todas las políticas que pueden tener conflictos
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    permissive,
    COUNT(*) OVER (PARTITION BY schemaname, tablename, cmd, roles) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('likes', 'posts', 'comentarios', 'profiles', 'matches', 'messages')
ORDER BY tablename, cmd, policy_count DESC;

-- 2. Limpiar políticas redundantes en posts
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Los usuarios pueden crear publicaciones" ON public.posts;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own posts" ON public.posts;

CREATE POLICY "posts_insert_policy" 
ON public.posts
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_select_policy" 
ON public.posts
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "posts_update_policy" 
ON public.posts
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_delete_policy" 
ON public.posts
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 3. Limpiar políticas redundantes en comentarios
DROP POLICY IF EXISTS "Users can create comments" ON public.comentarios;
DROP POLICY IF EXISTS "Los usuarios pueden crear comentarios" ON public.comentarios;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own comments" ON public.comentarios;

CREATE POLICY "comentarios_insert_policy" 
ON public.comentarios
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "comentarios_select_policy" 
ON public.comentarios
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "comentarios_update_policy" 
ON public.comentarios
FOR UPDATE 
TO authenticated
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "comentarios_delete_policy" 
ON public.comentarios
FOR DELETE 
TO authenticated
USING (auth.uid() = usuario_id);

-- 4. Limpiar políticas redundantes en profiles
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Los usuarios pueden gestionar su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own profile" ON public.profiles;

CREATE POLICY "profiles_insert_policy" 
ON public.profiles
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_select_policy" 
ON public.profiles
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "profiles_update_policy" 
ON public.profiles
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Habilitar RLS en todas las tablas principales
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. Verificar el resultado final
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    permissive
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('likes', 'posts', 'comentarios', 'profiles', 'matches', 'messages')
ORDER BY tablename, cmd;
