-- SCRIPT PARA RESOLVER LAS 26 ACTUACIONES RESTANTES
-- Ejecutar en el Editor SQL de Supabase
-- Este script elimina políticas duplicadas específicas

-- 1. PRIMERO: Verificar las políticas duplicadas específicas
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
    AND tablename IN ('likes', 'posts', 'profiles', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
ORDER BY tablename, cmd, policy_count DESC;

-- 2. ELIMINAR POLÍTICAS DUPLICADAS ESPECÍFICAS
-- Eliminar políticas con nombres genéricos que pueden estar causando conflictos

-- LIKES - Mantener solo las políticas optimizadas
DROP POLICY IF EXISTS "Enable read access for all users" ON public.likes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.likes;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.likes;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.likes;

-- POSTS - Mantener solo las políticas optimizadas
DROP POLICY IF EXISTS "Enable read access for all users" ON public.posts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.posts;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.posts;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.posts;

-- PROFILES - Mantener solo las políticas optimizadas
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

-- COMENTARIOS - Mantener solo las políticas optimizadas
DROP POLICY IF EXISTS "Enable read access for all users" ON public.comentarios;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.comentarios;
DROP POLICY IF EXISTS "Enable update for users based on usuario_id" ON public.comentarios;
DROP POLICY IF EXISTS "Enable delete for users based on usuario_id" ON public.comentarios;

-- STORIES - Mantener solo las políticas optimizadas
DROP POLICY IF EXISTS "Enable read access for all users" ON public.stories;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.stories;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.stories;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.stories;

-- MATCHES - Mantener solo las políticas optimizadas
DROP POLICY IF EXISTS "Enable read access for all users" ON public.matches;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.matches;
DROP POLICY IF EXISTS "Enable update for users based on user1_id" ON public.matches;
DROP POLICY IF EXISTS "Enable delete for users based on user1_id" ON public.matches;

-- MESSAGES - Mantener solo las políticas optimizadas
DROP POLICY IF EXISTS "Enable read access for all users" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.messages;
DROP POLICY IF EXISTS "Enable update for users based on sender_id" ON public.messages;
DROP POLICY IF EXISTS "Enable delete for users based on sender_id" ON public.messages;

-- NOTIFICATIONS - Mantener solo las políticas optimizadas
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notifications;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.notifications;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.notifications;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.notifications;

-- 3. ELIMINAR CUALQUIER POLÍTICA RESTANTE CON NOMBRES GENÉRICOS
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('likes', 'posts', 'profiles', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
        AND policyname NOT LIKE '%_insert_policy'
        AND policyname NOT LIKE '%_select_policy'
        AND policyname NOT LIKE '%_update_policy'
        AND policyname NOT LIKE '%_delete_policy'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- 4. VERIFICAR QUE SOLO QUEDEN LAS POLÍTICAS OPTIMIZADAS
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

-- 5. CONTAR POLÍTICAS POR TABLA PARA VERIFICAR
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('likes', 'posts', 'profiles', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
GROUP BY tablename
ORDER BY tablename;
