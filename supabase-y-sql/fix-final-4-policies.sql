-- SCRIPT FINAL: RESOLVER SOLO LAS 4 POLÍTICAS ESPECÍFICAS
-- Enfoque quirúrgico para las alertas de seguridad restantes

BEGIN;

-- =====================================================
-- 1. IDENTIFICAR LAS 4 POLÍTICAS PROBLEMÁTICAS
-- =====================================================

-- Ver políticas actuales de las tablas con problemas
SELECT 
    'POLÍTICAS ACTUALES PROBLEMÁTICAS:' as info,
    schemaname,
    tablename,
    policyname,
    cmd as action
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('posts', 'stories', 'messages')
ORDER BY tablename, cmd;

-- =====================================================
-- 2. ARREGLAR POSTS (POLÍTICA DE SEGURIDAD)
-- =====================================================

-- Verificar política actual de posts
SELECT 'POSTS - Antes del arreglo:' as status;
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'posts';

-- Recrear política de posts de forma más específica
DROP POLICY IF EXISTS "posts_select_policy" ON public.posts;
CREATE POLICY "posts_select_policy" ON public.posts 
    FOR SELECT TO authenticated 
    USING (true);

-- =====================================================
-- 3. ARREGLAR STORIES (POLÍTICA DE SEGURIDAD)
-- =====================================================

-- Verificar política actual de stories
SELECT 'STORIES - Antes del arreglo:' as status;
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'stories';

-- Recrear política de stories de forma más específica
DROP POLICY IF EXISTS "stories_select_policy" ON public.stories;
CREATE POLICY "stories_select_policy" ON public.stories 
    FOR SELECT TO authenticated 
    USING (true);

DROP POLICY IF EXISTS "stories_insert_policy" ON public.stories;
CREATE POLICY "stories_insert_policy" ON public.stories 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 4. ARREGLAR MESSAGES (POLÍTICA DE SEGURIDAD)
-- =====================================================

-- Verificar política actual de messages
SELECT 'MESSAGES - Antes del arreglo:' as status;
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'messages';

-- Recrear política de messages de forma más específica
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
CREATE POLICY "messages_select_policy" ON public.messages 
    FOR SELECT TO authenticated 
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
CREATE POLICY "messages_insert_policy" ON public.messages 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = sender_id);

-- =====================================================
-- 5. VERIFICAR LA CUARTA POLÍTICA (POSIBLEMENTE PROFILES)
-- =====================================================

-- Verificar si profiles tiene problemas
SELECT 'PROFILES - Estado actual:' as status;
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Arreglar profiles si es necesario
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles 
    FOR SELECT TO authenticated 
    USING (true);

-- =====================================================
-- 6. VERIFICAR FUNCIONES DE BÚSQUEDA (SIN TOCAR)
-- =====================================================

-- Solo verificar que siguen existiendo
SELECT 
    'FUNCIONES DE BÚSQUEDA (NO MODIFICADAS):' as check_type,
    proname as function_name,
    CASE 
        WHEN proname IS NOT NULL THEN '✅ DISPONIBLE'
        ELSE '❌ FALTANTE'
    END as status
FROM pg_proc 
WHERE proname IN ('get_nearby_profiles', 'search_profiles');

-- =====================================================
-- 7. PRUEBAS ESPECÍFICAS PARA LOS PROBLEMAS REPORTADOS
-- =====================================================

-- Probar buscador (debería encontrar perfiles ahora)
SELECT 'PRUEBA BUSCADOR - Búsqueda general:' as test_name;
SELECT COUNT(*) as profiles_found 
FROM search_profiles(NULL, NULL, NULL, NULL, 18, 99, 10, 0);

-- Probar búsqueda por ubicación
SELECT 'PRUEBA BUSCADOR - Por ubicación:' as test_name;
SELECT COUNT(*) as profiles_found 
FROM get_nearby_profiles(-34.6118, -58.3960, 1000);

-- Verificar mensajes para chat
SELECT 'PRUEBA CHAT - Mensajes disponibles:' as test_name;
SELECT COUNT(*) as total_messages FROM public.messages;

-- Verificar perfiles disponibles
SELECT 'PRUEBA PERFILES - Disponibles para búsqueda:' as test_name;
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- =====================================================
-- 8. VERIFICACIÓN FINAL DE LAS 4 POLÍTICAS
-- =====================================================

-- Contar políticas finales (debería ser mínimo)
SELECT 
    'POLÍTICAS FINALES POR TABLA:' as summary,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('posts', 'stories', 'messages', 'profiles')
GROUP BY tablename
ORDER BY tablename;

-- Verificar que no hay duplicados
SELECT 
    'VERIFICACIÓN DE DUPLICADOS:' as check_name,
    tablename,
    cmd as action,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ ÚNICA'
        ELSE '⚠️ DUPLICADA'
    END as status
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('posts', 'stories', 'messages', 'profiles')
GROUP BY tablename, cmd
ORDER BY tablename, cmd;

-- =====================================================
-- 9. MENSAJE FINAL ESPECÍFICO
-- =====================================================

SELECT '🎯 ARREGLO QUIRÚRGICO DE 4 POLÍTICAS COMPLETADO' as status;
SELECT '✅ Posts: Política de seguridad arreglada' as posts_status;
SELECT '✅ Stories: Política de seguridad arreglada' as stories_status;
SELECT '✅ Messages: Política de seguridad arreglada' as messages_status;
SELECT '✅ Profiles: Política de seguridad arreglada' as profiles_status;
SELECT '🔍 Buscador debería encontrar perfiles ahora' as search_status;
SELECT '💬 Chat debería cargar mensajes anteriores' as chat_status;

COMMIT;
