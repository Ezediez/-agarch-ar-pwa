-- SCRIPT MÍNIMO: SOLO ARREGLAR POLÍTICAS DUPLICADAS
-- Enfoque conservador - Solo elimina duplicados específicos mencionados

BEGIN;

-- =====================================================
-- 1. IDENTIFICAR POLÍTICAS DUPLICADAS ESPECÍFICAS
-- =====================================================

-- Ver políticas duplicadas en posts (SELECT)
SELECT 
    'POSTS - Políticas SELECT duplicadas:' as info,
    policyname
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'posts' 
    AND cmd = 'SELECT'
ORDER BY policyname;

-- Ver políticas duplicadas en stories (UPDATE)
SELECT 
    'STORIES - Políticas UPDATE duplicadas:' as info,
    policyname
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'stories' 
    AND cmd = 'UPDATE'
ORDER BY policyname;

-- =====================================================
-- 2. ELIMINAR SOLO POLÍTICAS DUPLICADAS PROBLEMÁTICAS
-- =====================================================

-- POSTS: Eliminar solo la política con nombre descriptivo (mantener la técnica)
DROP POLICY IF EXISTS "Los usuarios pueden ver todas las publicaciones" ON public.posts;

-- STORIES: Eliminar solo la política con nombre descriptivo (mantener la técnica)
DROP POLICY IF EXISTS "Los usuarios solo pueden actualizar sus propias historias" ON public.stories;

-- =====================================================
-- 3. VERIFICAR QUE SOLO QUEDE UNA POLÍTICA POR ACCIÓN
-- =====================================================

-- Verificar posts SELECT (debería quedar solo 1)
SELECT 
    'POSTS SELECT después de limpieza:' as check_name,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ ÚNICA'
        ELSE '❌ AÚN DUPLICADA'
    END as status
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'posts' 
    AND cmd = 'SELECT';

-- Verificar stories UPDATE (debería quedar solo 1)
SELECT 
    'STORIES UPDATE después de limpieza:' as check_name,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ ÚNICA'
        ELSE '❌ AÚN DUPLICADA'
    END as status
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'stories' 
    AND cmd = 'UPDATE';

-- =====================================================
-- 4. SOLO ARREGLAR FUNCIÓN update_updated_at_column (MÍNIMO)
-- =====================================================

-- Solo arreglar el search_path de esta función específica
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Recrear solo los triggers necesarios
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
    BEFORE UPDATE ON public.stories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. VERIFICACIÓN MÍNIMA
-- =====================================================

-- Solo verificar que se solucionaron los problemas específicos
SELECT 
    'RESUMEN DE CAMBIOS MÍNIMOS:' as summary,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'posts' AND cmd = 'SELECT') as posts_select_policies,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stories' AND cmd = 'UPDATE') as stories_update_policies;

-- Verificar función de trigger
SELECT 
    'update_updated_at_column:' as function_name,
    CASE 
        WHEN proconfig IS NOT NULL AND 'search_path=' = ANY(proconfig) 
        THEN '✅ SEGURA'
        ELSE '⚠️ REVISAR'
    END as security_status
FROM pg_proc 
WHERE proname = 'update_updated_at_column';

SELECT '✅ Cambios mínimos aplicados - Solo duplicados específicos eliminados' as status;

COMMIT;
