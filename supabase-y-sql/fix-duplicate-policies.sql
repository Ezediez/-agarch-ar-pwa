-- ELIMINAR POLITICAS DUPLICADAS Y CONFLICTIVAS
-- Basado en el análisis de 31 políticas

BEGIN;

-- 1. BACKUP DE POLITICAS ACTUALES
SELECT 'BACKUP ANTES DE LIMPIEZA' as info;
SELECT 
    tablename,
    policyname,
    cmd,
    'DROP POLICY IF EXISTS "' || policyname || '" ON public.' || tablename || ';' as backup_command
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 2. ELIMINAR DUPLICADOS EN MESSAGES (6 -> 3)
-- Mantener solo las esenciales
DROP POLICY IF EXISTS "messages_delete_sender" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
DROP POLICY IF EXISTS "messages_update_sender" ON public.messages;

-- Mantener estas 3 políticas principales
-- messages_select_policy (o messages_select_participants)
-- messages_insert_policy  
-- messages_update_policy

-- 3. ELIMINAR DUPLICADOS EN POSTS (5 -> 4)
-- Eliminar SELECT duplicado
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;
-- Mantener: posts_select_all, posts_insert_own, posts_update_own, posts_delete_own

-- 4. ELIMINAR DUPLICADOS EN STORIES (5 -> 4)  
-- Eliminar UPDATE duplicado
DROP POLICY IF EXISTS "Users can only update their own stories" ON public.stories;
-- Mantener: stories_select_all, stories_insert_own, stories_update_own, stories_delete_own

-- 5. VERIFICAR POLITICAS RESTANTES
SELECT 'POLITICAS DESPUES DE LIMPIEZA' as resultado;
SELECT 
    tablename,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY total_policies DESC, tablename;

-- 6. CONTAR TOTAL
SELECT 'TOTAL POLITICAS OPTIMIZADAS' as resultado, COUNT(*) as cantidad
FROM pg_policies 
WHERE schemaname = 'public';

SELECT 'DUPLICADOS ELIMINADOS' as estado;
SELECT 'Deberían quedar aproximadamente 25-27 políticas' as expectativa;

COMMIT;
