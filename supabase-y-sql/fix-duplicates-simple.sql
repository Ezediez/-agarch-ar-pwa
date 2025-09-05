-- SCRIPT SIMPLE PARA ELIMINAR POLÍTICAS DUPLICADAS
-- Basado en el análisis anterior de 31 políticas

BEGIN;

-- PASO 1: Primero eliminamos la función problemática
DROP FUNCTION IF EXISTS generate_rls_refactor_scripts();

-- PASO 2: Verificar estado actual
SELECT 'ESTADO ACTUAL DE POLÍTICAS' as diagnostico;

SELECT 
    tablename,
    cmd,
    COUNT(*) as cantidad,
    string_agg(policyname, ', ') as nombres
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- PASO 3: Eliminar políticas duplicadas específicas identificadas anteriormente

-- MESSAGES: Mantener solo las políticas _participants/_sender, eliminar _policy
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;  
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;

-- POSTS: Mantener solo posts_select_all, eliminar Users can view all posts
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;

-- PROFILES: Mantener solo profiles_select_all, eliminar profiles_select_policy si existe
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- STORIES: Mantener solo las políticas _own, eliminar _policy
DROP POLICY IF EXISTS "stories_insert_policy" ON public.stories;
DROP POLICY IF EXISTS "stories_select_policy" ON public.stories;

-- PASO 4: Verificar resultado final
SELECT 'RESULTADO DESPUÉS DE LIMPIEZA' as diagnostico;

SELECT 
    tablename,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY total_policies DESC;

-- PASO 5: Listar políticas duplicadas restantes (debería estar vacío)
SELECT 
    'DUPLICADAS RESTANTES (DEBERÍA ESTAR VACÍO)' as diagnostico;

SELECT 
    tablename,
    cmd,
    COUNT(*) as cantidad,
    string_agg(policyname, ', ') as nombres
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1;

COMMIT;

SELECT 'POLÍTICAS DUPLICADAS ELIMINADAS EXITOSAMENTE' as resultado;



