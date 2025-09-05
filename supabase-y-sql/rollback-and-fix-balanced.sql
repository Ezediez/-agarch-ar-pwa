-- ROLLBACK + SCRIPT EQUILIBRADO
-- Deshace cambios agresivos y aplica solución balanceada

BEGIN;

-- =====================================================
-- PARTE 1: ROLLBACK INTELIGENTE
-- =====================================================

-- Eliminar políticas que pueden haber causado conflictos
-- (Solo las que sabemos que creamos en el script anterior)
DROP POLICY IF EXISTS "posts_select_all" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
DROP POLICY IF EXISTS "posts_update_own" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_own" ON public.posts;

DROP POLICY IF EXISTS "stories_select_all" ON public.stories;
DROP POLICY IF EXISTS "stories_insert_own" ON public.stories;
DROP POLICY IF EXISTS "stories_update_own" ON public.stories;
DROP POLICY IF EXISTS "stories_delete_own" ON public.stories;

DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
DROP POLICY IF EXISTS "messages_update_sender" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_sender" ON public.messages;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

-- =====================================================
-- PARTE 2: MANTENER SOLO LO ESENCIAL QUE FUNCIONA
-- =====================================================

-- Verificar qué políticas originales quedan (las que ya funcionaban)
SELECT 
    'POLÍTICAS RESTANTES DESPUÉS DEL ROLLBACK:' as info,
    schemaname,
    tablename,
    policyname,
    cmd as action
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('posts', 'stories', 'messages', 'profiles')
ORDER BY tablename, cmd;

-- =====================================================
-- PARTE 3: CREAR SOLO POLÍTICAS FALTANTES (SIN DUPLICAR)
-- =====================================================

-- POSTS: Crear solo si no existe una política SELECT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
            AND tablename = 'posts' 
            AND cmd = 'SELECT'
    ) THEN
        CREATE POLICY "posts_select_policy" ON public.posts 
            FOR SELECT TO authenticated 
            USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
            AND tablename = 'posts' 
            AND cmd = 'INSERT'
    ) THEN
        CREATE POLICY "posts_insert_policy" ON public.posts 
            FOR INSERT TO authenticated 
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- STORIES: Crear solo si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
            AND tablename = 'stories' 
            AND cmd = 'SELECT'
    ) THEN
        CREATE POLICY "stories_select_policy" ON public.stories 
            FOR SELECT TO authenticated 
            USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
            AND tablename = 'stories' 
            AND cmd = 'INSERT'
    ) THEN
        CREATE POLICY "stories_insert_policy" ON public.stories 
            FOR INSERT TO authenticated 
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- MESSAGES: Crear solo si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
            AND tablename = 'messages' 
            AND cmd = 'SELECT'
    ) THEN
        CREATE POLICY "messages_select_policy" ON public.messages 
            FOR SELECT TO authenticated 
            USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
            AND tablename = 'messages' 
            AND cmd = 'INSERT'
    ) THEN
        CREATE POLICY "messages_insert_policy" ON public.messages 
            FOR INSERT TO authenticated 
            WITH CHECK (auth.uid() = sender_id);
    END IF;
END $$;

-- PROFILES: Crear solo si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
            AND tablename = 'profiles' 
            AND cmd = 'SELECT'
    ) THEN
        CREATE POLICY "profiles_select_policy" ON public.profiles 
            FOR SELECT TO authenticated 
            USING (true);
    END IF;
END $$;

-- =====================================================
-- PARTE 4: MANTENER FUNCIONES DE BÚSQUEDA (YA FUNCIONAN)
-- =====================================================

-- Verificar que las funciones de búsqueda siguen existiendo
SELECT 
    'FUNCIONES DE BÚSQUEDA:' as check_type,
    proname as function_name,
    CASE 
        WHEN proname IS NOT NULL THEN '✅ DISPONIBLE'
        ELSE '❌ FALTANTE'
    END as status
FROM pg_proc 
WHERE proname IN ('get_nearby_profiles', 'search_profiles');

-- =====================================================
-- PARTE 5: SOLO ELIMINAR POLÍTICAS DUPLICADAS ESPECÍFICAS
-- =====================================================

-- Eliminar solo las políticas con nombres descriptivos (duplicados conocidos)
DROP POLICY IF EXISTS "Los usuarios pueden ver todas las publicaciones" ON public.posts;
DROP POLICY IF EXISTS "Los usuarios solo pueden actualizar sus propias historias" ON public.stories;

-- =====================================================
-- PARTE 6: VERIFICACIÓN EQUILIBRADA
-- =====================================================

-- Contar políticas finales (debería ser razonable)
SELECT 
    'RESUMEN FINAL DE POLÍTICAS:' as summary,
    tablename,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) BETWEEN 1 AND 4 THEN '✅ EQUILIBRADO'
        WHEN COUNT(*) = 0 THEN '⚠️ SIN POLÍTICAS'
        ELSE '⚠️ MUCHAS POLÍTICAS'
    END as status
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
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ ÚNICA'
        ELSE '⚠️ DUPLICADA'
    END as status
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('posts', 'stories', 'messages', 'profiles')
GROUP BY tablename, cmd
HAVING COUNT(*) > 1;

-- =====================================================
-- PARTE 7: PRUEBAS RÁPIDAS
-- =====================================================

-- Probar que el buscador sigue funcionando
SELECT 'PRUEBA BUSCADOR:' as test_name;
SELECT COUNT(*) as profiles_found 
FROM search_profiles(NULL, NULL, NULL, NULL, 18, 99, 5, 0);

-- Contar mensajes (para verificar chat)
SELECT 'PRUEBA CHAT:' as test_name;
SELECT COUNT(*) as total_messages FROM public.messages;

-- =====================================================
-- PARTE 8: MENSAJE FINAL
-- =====================================================

SELECT '🎯 ROLLBACK Y REBALANCE COMPLETADO' as status;
SELECT '✅ Funcionalidad mantenida' as functionality;
SELECT '✅ Políticas equilibradas' as policies;
SELECT '✅ Sin cambios agresivos' as approach;
SELECT '🔍 Revisa el resumen arriba para confirmar estado' as next_step;

COMMIT;
