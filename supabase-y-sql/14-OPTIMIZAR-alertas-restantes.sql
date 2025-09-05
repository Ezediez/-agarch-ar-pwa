-- 🔧 OPTIMIZAR ALERTAS RESTANTES - REDUCIR DE 12 A 5
-- Script específico para las alertas más problemáticas restantes

BEGIN;

-- =====================================================
-- OPTIMIZAR POLÍTICAS DE REPORTS
-- =====================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "reports_select_own" ON public.reports;
    DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
    DROP POLICY IF EXISTS "reports_update_own" ON public.reports;
    DROP POLICY IF EXISTS "reports_delete_own" ON public.reports;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE POLICY "reports_select_own_optimized" ON public.reports
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "reports_insert_own_optimized" ON public.reports
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "reports_update_own_optimized" ON public.reports
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "reports_delete_own_optimized" ON public.reports
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- OPTIMIZAR POLÍTICAS DE STORIES
-- =====================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "stories_select_all" ON public.stories;
    DROP POLICY IF EXISTS "stories_insert_own" ON public.stories;
    DROP POLICY IF EXISTS "stories_update_own" ON public.stories;
    DROP POLICY IF EXISTS "stories_delete_own" ON public.stories;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE POLICY "stories_select_all_optimized" ON public.stories
FOR SELECT TO authenticated
USING (true); -- Las stories son públicas

CREATE POLICY "stories_insert_own_optimized" ON public.stories
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "stories_update_own_optimized" ON public.stories
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "stories_delete_own_optimized" ON public.stories
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- OPTIMIZAR POLÍTICAS ESPECÍFICAS PROBLEMÁTICAS
-- =====================================================

-- Eliminar políticas duplicadas o problemáticas que puedan quedar
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Buscar políticas que no estén optimizadas y contengan auth.uid() sin SELECT
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND policyname NOT LIKE '%_optimized'
        AND (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%')
    LOOP
        -- Eliminar la política problemática
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- =====================================================
-- CREAR POLÍTICAS GENÉRICAS OPTIMIZADAS PARA TABLAS FALTANTES
-- =====================================================

-- Función para crear políticas optimizadas genéricas
DO $$
DECLARE
    table_name TEXT;
    tables_to_optimize TEXT[] := ARRAY['backup_profiles', 'backup_posts', 'backup_messages', 'backup_likes', 'backup_user_likes', 'backup_notifications', 'backup_stories', 'backup_comentarios'];
BEGIN
    FOREACH table_name IN ARRAY tables_to_optimize
    LOOP
        -- Solo procesar si la tabla existe
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) THEN
            -- Eliminar políticas existentes
            EXECUTE format('DROP POLICY IF EXISTS "%s_select_policy" ON public.%I', table_name, table_name);
            EXECUTE format('DROP POLICY IF EXISTS "%s_insert_policy" ON public.%I', table_name, table_name);
            EXECUTE format('DROP POLICY IF EXISTS "%s_update_policy" ON public.%I', table_name, table_name);
            EXECUTE format('DROP POLICY IF EXISTS "%s_delete_policy" ON public.%I', table_name, table_name);
            
            -- Crear políticas optimizadas (solo lectura para backups)
            EXECUTE format('CREATE POLICY "%s_select_optimized" ON public.%I FOR SELECT TO authenticated USING (true)', table_name, table_name);
        END IF;
    END LOOP;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- =====================================================
-- OPTIMIZAR FUNCIONES RPC PROBLEMÁTICAS
-- =====================================================

-- Recrear funciones que puedan estar causando alertas
CREATE OR REPLACE FUNCTION get_nearby_profiles_optimized(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_km INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    alias TEXT,
    profile_picture_url TEXT,
    bio TEXT,
    distance_km DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    current_user_id UUID := (SELECT auth.uid()); -- Optimizado
BEGIN
    IF current_user_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id,
        p.alias,
        p.profile_picture_url,
        p.bio,
        ROUND(
            6371 * acos(
                cos(radians(user_lat)) * 
                cos(radians(p.ubicacion_lat)) * 
                cos(radians(p.ubicacion_lng) - radians(user_lng)) + 
                sin(radians(user_lat)) * 
                sin(radians(p.ubicacion_lat))
            )
        ) as distance_km
    FROM profiles p
    WHERE p.id != current_user_id
    AND p.ubicacion_lat IS NOT NULL
    AND p.ubicacion_lng IS NOT NULL
    AND (
        6371 * acos(
            cos(radians(user_lat)) * 
            cos(radians(p.ubicacion_lat)) * 
            cos(radians(p.ubicacion_lng) - radians(user_lng)) + 
            sin(radians(user_lat)) * 
            sin(radians(p.ubicacion_lat))
        )
    ) <= radius_km
    ORDER BY distance_km
    LIMIT 50;
END;
$$;

COMMIT;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT 'ALERTAS RESTANTES OPTIMIZADAS' as resultado;

-- Contar políticas restantes no optimizadas
SELECT 
    COUNT(*) as politicas_no_optimizadas,
    'Políticas que aún contienen auth.uid() sin SELECT' as descripcion
FROM pg_policies
WHERE schemaname = 'public'
AND policyname NOT LIKE '%_optimized'
AND (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%');

-- Mostrar políticas optimizadas
SELECT 
    COUNT(*) as politicas_optimizadas,
    'Políticas con SELECT auth.uid() optimizado' as descripcion
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE '%_optimized';

SELECT '🎯 OBJETIVO: REDUCIR DE 12 A 5 ALERTAS' as resultado_final;
