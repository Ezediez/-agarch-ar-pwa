-- ARREGLAR WARNINGS DE SEGURIDAD EN FUNCIONES DE BÚSQUEDA
-- Soluciona el problema de search_path mutable

BEGIN;

-- =====================================================
-- 1. VERIFICAR FUNCIONES ACTUALES
-- =====================================================

-- Ver funciones con problemas de search_path
SELECT 
    proname as function_name,
    prosecdef as has_security_definer,
    proconfig as config_settings
FROM pg_proc 
WHERE proname IN ('get_nearby_profiles', 'search_profiles', 'update_updated_at_column')
ORDER BY proname;

-- =====================================================
-- 2. RECREAR FUNCIÓN update_updated_at_column CON SECURITY
-- =====================================================

-- Eliminar función anterior
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Recrear con configuración de seguridad correcta
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =====================================================
-- 3. RECREAR FUNCIÓN get_nearby_profiles CON SECURITY MEJORADA
-- =====================================================

-- Eliminar función anterior
DROP FUNCTION IF EXISTS get_nearby_profiles(DECIMAL, DECIMAL, INTEGER);

-- Recrear con configuración de seguridad correcta
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
    ORDER BY distance_km ASC;
END;
$$;

-- =====================================================
-- 4. RECREAR FUNCIÓN search_profiles CON SECURITY MEJORADA
-- =====================================================

-- Eliminar función anterior
DROP FUNCTION IF EXISTS search_profiles(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER);

-- Recrear con configuración de seguridad correcta
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
    LIMIT result_limit
    OFFSET result_offset;
END;
$$;

-- =====================================================
-- 5. RECREAR TRIGGERS CON FUNCIÓN CORREGIDA
-- =====================================================

-- Recrear triggers que usan update_updated_at_column
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;

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

-- =====================================================
-- 6. VERIFICACIÓN FINAL DE SEGURIDAD
-- =====================================================

-- Verificar que las funciones tienen configuración de seguridad correcta
SELECT 
    proname as function_name,
    prosecdef as has_security_definer,
    proconfig as security_config,
    CASE 
        WHEN proconfig IS NULL THEN '⚠️ Sin configuración'
        WHEN 'search_path=' = ANY(proconfig) OR 'search_path=public,pg_temp' = ANY(proconfig) THEN '✅ Configuración segura'
        ELSE '⚠️ Configuración insegura'
    END as security_status
FROM pg_proc 
WHERE proname IN ('get_nearby_profiles', 'search_profiles', 'update_updated_at_column')
ORDER BY proname;

-- =====================================================
-- 7. PRUEBA RÁPIDA DE FUNCIONES
-- =====================================================

-- Probar función de búsqueda general
SELECT 'Prueba search_profiles:' as test_name;
SELECT COUNT(*) as total_results 
FROM search_profiles('', 'todos', 'todas', 'todos', 18, 99, 10, 0);

-- Probar función de búsqueda por distancia (si hay ubicaciones)
SELECT 'Prueba get_nearby_profiles:' as test_name;
SELECT COUNT(*) as total_results 
FROM get_nearby_profiles(-34.6118, -58.3960, 100);

SELECT '🎉 Funciones de búsqueda corregidas y probadas exitosamente' as status;

COMMIT;
