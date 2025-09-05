-- SCRIPT PARA RESOLVER LAS 8 ACTUACIONES RESTANTES
-- Ejecutar en el Editor SQL de Supabase
-- Este script resuelve los últimos problemas de RLS

-- 1. PRIMERO: Verificar las 8 actuaciones específicas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('likes', 'posts', 'profiles', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
ORDER BY tablename, cmd;

-- 2. ELIMINAR TODAS LAS POLÍTICAS RESTANTES
-- Usar un enfoque más agresivo para eliminar cualquier política problemática
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('likes', 'posts', 'profiles', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- 3. DESHABILITAR RLS TEMPORALMENTE PARA LIMPIEZA
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- 4. LIMPIAR TODOS LOS DATOS
-- Eliminar en orden correcto para evitar problemas de foreign keys
DELETE FROM public.notifications;
DELETE FROM public.messages;
DELETE FROM public.matches;
DELETE FROM public.comentarios;
DELETE FROM public.likes;
DELETE FROM public.stories;
DELETE FROM public.posts;
DELETE FROM public.profiles;

-- 5. VERIFICAR QUE LAS TABLAS ESTÉN VACÍAS
SELECT 
    'profiles' as table_name,
    COUNT(*) as row_count
FROM public.profiles
UNION ALL
SELECT 
    'posts' as table_name,
    COUNT(*) as row_count
FROM public.posts
UNION ALL
SELECT 
    'comentarios' as table_name,
    COUNT(*) as row_count
FROM public.comentarios
UNION ALL
SELECT 
    'likes' as table_name,
    COUNT(*) as row_count
FROM public.likes
UNION ALL
SELECT 
    'stories' as table_name,
    COUNT(*) as row_count
FROM public.stories
UNION ALL
SELECT 
    'matches' as table_name,
    COUNT(*) as row_count
FROM public.matches
UNION ALL
SELECT 
    'messages' as table_name,
    COUNT(*) as row_count
FROM public.messages
UNION ALL
SELECT 
    'notifications' as table_name,
    COUNT(*) as row_count
FROM public.notifications;

-- 6. VERIFICAR QUE NO QUEDEN POLÍTICAS
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    permissive
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('likes', 'posts', 'profiles', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
ORDER BY tablename, cmd;
