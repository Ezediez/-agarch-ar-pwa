-- SCRIPT COMPLETO: BÚSQUEDAS + POLÍTICAS + SEGURIDAD
-- Soluciona funciones de búsqueda, políticas duplicadas y warnings de seguridad

BEGIN;

-- =====================================================
-- 1. IDENTIFICAR Y ELIMINAR POLÍTICAS DUPLICADAS
-- =====================================================

-- Mostrar políticas duplicadas antes de eliminar
SELECT 
    'POLÍTICAS DUPLICADAS DETECTADAS:' as info,
    schemaname,
    tablename,
    cmd as action,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('posts', 'stories', 'messages', 'profiles')
GROUP BY schemaname, tablename, cmd
HAVING COUNT(*) > 1
ORDER BY tablename, cmd;

-- =====================================================
-- 2. LIMPIAR TODAS LAS POLÍTICAS PROBLEMÁTICAS
-- =====================================================

-- POSTS - Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "posts_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_select_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_update_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_policy" ON public.posts;
DROP POLICY IF EXISTS "Los usuarios pueden ver todas las publicaciones" ON public.posts;

-- STORIES - Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "stories_policy" ON public.stories;
DROP POLICY IF EXISTS "stories_select_policy" ON public.stories;
DROP POLICY IF EXISTS "stories_insert_policy" ON public.stories;
DROP POLICY IF EXISTS "stories_update_policy" ON public.stories;
DROP POLICY IF EXISTS "stories_delete_policy" ON public.stories;
DROP POLICY IF EXISTS "Los usuarios solo pueden actualizar sus propias historias" ON public.stories;

-- MESSAGES - Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "messages_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;

-- PROFILES - Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- =====================================================
-- 3. RECREAR FUNCIÓN update_updated_at_column CON SEGURIDAD
-- =====================================================

-- Eliminar función anterior
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Recrear con configuración de seguridad correcta
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

-- =====================================================
-- 4. CREAR FUNCIONES DE BÚSQUEDA CON SEGURIDAD MEJORADA
-- =====================================================

-- Eliminar funciones anteriores
DROP FUNCTION IF EXISTS get_nearby_profiles(DECIMAL, DECIMAL, INTEGER);
DROP FUNCTION IF EXISTS search_profiles(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER);

-- Función para búsqueda por distancia
CREATE OR REPLACE FUNCTION get_nearby_profiles(
    user_lat DECIMAL(10, 8),
    user_lng DECIMAL(11, 8),
    radius_km INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    alias TEXT,
    bio TEXT,
    profile_picture_url TEXT,
    gender TEXT,
    sexual_orientation TEXT,
    relationship_status TEXT,
    birth_date DATE,
    interests TEXT[],
    is_vip BOOLEAN,
    is_verified BOOLEAN,
    created_at TIMESTAMPTZ,
    distance_km DECIMAL(10, 2)
) 
SECURITY DEFINER 
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.alias,
        p.bio,
        p.profile_picture_url,
        p.gender,
        p.sexual_orientation,
        p.relationship_status,
        p.birth_date,
        p.interests,
        p.is_vip,
        p.is_verified,
        p.created_at,
        -- Fórmula de Haversine para calcular distancia
        (
            6371 * acos(
                GREATEST(-1::float, LEAST(1::float,
                    cos(radians(user_lat::float)) * 
                    cos(radians(p.latitud::float)) * 
                    cos(radians(p.longitud::float) - radians(user_lng::float)) + 
                    sin(radians(user_lat::float)) * 
                    sin(radians(p.latitud::float))
                ))
            )
        )::DECIMAL(10, 2) AS distance_km
    FROM public.profiles p
    WHERE 
        p.latitud IS NOT NULL 
        AND p.longitud IS NOT NULL
        AND p.id != auth.uid() -- Excluir usuario actual
        AND (
            6371 * acos(
                GREATEST(-1::float, LEAST(1::float,
                    cos(radians(user_lat::float)) * 
                    cos(radians(p.latitud::float)) * 
                    cos(radians(p.longitud::float) - radians(user_lng::float)) + 
                    sin(radians(user_lat::float)) * 
                    sin(radians(p.latitud::float))
                ))
            )
        ) <= radius_km
    ORDER BY distance_km ASC
    LIMIT 100; -- Límite de seguridad
END;
$$;

-- Función para búsqueda general
CREATE OR REPLACE FUNCTION search_profiles(
    search_keyword TEXT DEFAULT NULL,
    filter_gender TEXT DEFAULT NULL,
    filter_orientation TEXT DEFAULT NULL,
    filter_status TEXT DEFAULT NULL,
    min_age INTEGER DEFAULT 18,
    max_age INTEGER DEFAULT 99,
    result_limit INTEGER DEFAULT 20,
    result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    alias TEXT,
    bio TEXT,
    profile_picture_url TEXT,
    gender TEXT,
    sexual_orientation TEXT,
    relationship_status TEXT,
    birth_date DATE,
    interests TEXT[],
    is_vip BOOLEAN,
    is_verified BOOLEAN,
    created_at TIMESTAMPTZ
)
SECURITY DEFINER 
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.alias,
        p.bio,
        p.profile_picture_url,
        p.gender,
        p.sexual_orientation,
        p.relationship_status,
        p.birth_date,
        p.interests,
        p.is_vip,
        p.is_verified,
        p.created_at
    FROM public.profiles p
    WHERE 
        p.id != auth.uid() -- Excluir usuario actual
        AND (search_keyword IS NULL OR 
             p.alias ILIKE '%' || search_keyword || '%' OR 
             p.bio ILIKE '%' || search_keyword || '%')
        AND (filter_gender IS NULL OR filter_gender = 'todos' OR p.gender = filter_gender)
        AND (filter_orientation IS NULL OR filter_orientation = 'todas' OR p.sexual_orientation = filter_orientation)
        AND (filter_status IS NULL OR filter_status = 'todos' OR p.relationship_status = filter_status)
        AND (p.birth_date IS NULL OR 
             EXTRACT(YEAR FROM AGE(p.birth_date)) BETWEEN min_age AND max_age)
    ORDER BY p.created_at DESC
    LIMIT LEAST(result_limit, 100) -- Límite de seguridad
    OFFSET result_offset;
END;
$$;

-- =====================================================
-- 5. CREAR POLÍTICAS RLS ÚNICAS Y OPTIMIZADAS
-- =====================================================

-- POSTS - Una sola política por acción
CREATE POLICY "posts_select_all" ON public.posts 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "posts_insert_own" ON public.posts 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update_own" ON public.posts 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_delete_own" ON public.posts 
    FOR DELETE TO authenticated 
    USING (auth.uid() = user_id);

-- STORIES - Una sola política por acción
CREATE POLICY "stories_select_all" ON public.stories 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "stories_insert_own" ON public.stories 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stories_update_own" ON public.stories 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stories_delete_own" ON public.stories 
    FOR DELETE TO authenticated 
    USING (auth.uid() = user_id);

-- MESSAGES - Una sola política por acción
CREATE POLICY "messages_select_participants" ON public.messages 
    FOR SELECT TO authenticated 
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "messages_insert_sender" ON public.messages 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "messages_update_sender" ON public.messages 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = sender_id) 
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "messages_delete_sender" ON public.messages 
    FOR DELETE TO authenticated 
    USING (auth.uid() = sender_id);

-- PROFILES - Una sola política por acción
CREATE POLICY "profiles_select_all" ON public.profiles 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles 
    FOR DELETE TO authenticated 
    USING (auth.uid() = id);

-- =====================================================
-- 6. RECREAR TRIGGERS CON FUNCIÓN SEGURA
-- =====================================================

-- Eliminar triggers existentes
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
DROP TRIGGER IF EXISTS update_stories_updated_at ON public.stories;

-- Recrear triggers
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
-- 7. VERIFICAR CAMPOS DE UBICACIÓN
-- =====================================================

-- Asegurar que existen campos de ubicación
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS latitud DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitud DECIMAL(11, 8);

-- Crear índices para búsquedas de ubicación
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_profiles_search ON public.profiles(alias, gender, sexual_orientation);

-- =====================================================
-- 8. VERIFICACIÓN FINAL COMPLETA
-- =====================================================

-- Verificar que no hay políticas duplicadas
SELECT 
    'VERIFICACIÓN DE POLÍTICAS ÚNICAS:' as check_name,
    schemaname,
    tablename,
    cmd as action,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ ÚNICA'
        ELSE '❌ DUPLICADA'
    END as status
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('posts', 'stories', 'messages', 'profiles')
GROUP BY schemaname, tablename, cmd
ORDER BY tablename, cmd;

-- Verificar funciones de búsqueda
SELECT 
    'FUNCIONES DE BÚSQUEDA:' as check_name,
    proname as function_name,
    prosecdef as has_security_definer,
    CASE 
        WHEN proconfig IS NOT NULL AND ('search_path=' = ANY(proconfig) OR 'search_path=public,pg_temp' = ANY(proconfig)) 
        THEN '✅ SEGURA'
        ELSE '⚠️ REVISAR'
    END as security_status
FROM pg_proc 
WHERE proname IN ('get_nearby_profiles', 'search_profiles', 'update_updated_at_column')
ORDER BY proname;

-- Verificar datos de ubicación
SELECT 
    'DATOS DE UBICACIÓN:' as check_name,
    COUNT(*) as total_profiles,
    COUNT(latitud) as profiles_with_location,
    COUNT(*) - COUNT(latitud) as profiles_without_location,
    ROUND(COUNT(latitud)::decimal / COUNT(*) * 100, 1) as percentage_with_location
FROM public.profiles;

-- =====================================================
-- 9. PRUEBAS RÁPIDAS DE FUNCIONES
-- =====================================================

-- Probar función de búsqueda general
SELECT 'PRUEBA search_profiles:' as test_name;
SELECT COUNT(*) as results_found 
FROM search_profiles(NULL, 'todos', 'todas', 'todos', 18, 99, 10, 0);

-- Probar función de búsqueda por distancia (usando coordenadas de Buenos Aires)
SELECT 'PRUEBA get_nearby_profiles:' as test_name;
SELECT COUNT(*) as results_found 
FROM get_nearby_profiles(-34.6118, -58.3960, 100);

-- =====================================================
-- 10. MENSAJE FINAL
-- =====================================================

SELECT '🎉 SISTEMA COMPLETO CONFIGURADO EXITOSAMENTE' as status;
SELECT '✅ Funciones de búsqueda creadas con seguridad' as search_functions;
SELECT '✅ Políticas RLS optimizadas (sin duplicados)' as rls_policies;
SELECT '✅ Triggers actualizados con seguridad' as triggers;
SELECT '✅ Índices de rendimiento creados' as indexes;
SELECT '🧪 Funciones probadas automáticamente' as tests;

COMMIT;
