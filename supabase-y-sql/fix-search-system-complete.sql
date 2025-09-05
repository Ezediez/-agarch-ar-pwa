-- ARREGLAR SISTEMA DE BÚSQUEDAS COMPLETO
-- Soluciona función RPC, campos de ubicación y políticas

BEGIN;

-- =====================================================
-- 1. VERIFICAR ESTRUCTURA DE TABLA PROFILES
-- =====================================================

-- Verificar campos de ubicación existentes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name IN ('latitud', 'longitud', 'location_lat', 'location_lng')
ORDER BY column_name;

-- =====================================================
-- 2. ESTANDARIZAR CAMPOS DE UBICACIÓN
-- =====================================================

-- Agregar campos de ubicación si no existen (con nombres estándar)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS latitud DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitud DECIMAL(11, 8);

-- Crear índices para búsquedas de ubicación
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(latitud, longitud);

-- =====================================================
-- 3. CREAR FUNCIÓN RPC PARA BÚSQUEDAS POR DISTANCIA
-- =====================================================

-- Eliminar función anterior si existe
DROP FUNCTION IF EXISTS get_nearby_profiles(DECIMAL, DECIMAL, INTEGER);
DROP FUNCTION IF EXISTS get_nearby_profiles(user_lat DECIMAL, user_lng DECIMAL, radius_km INTEGER);

-- Crear función corregida con nombres de campos correctos
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
) AS $$
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
                GREATEST(-1, LEAST(1,
                    cos(radians(user_lat)) * 
                    cos(radians(p.latitud)) * 
                    cos(radians(p.longitud) - radians(user_lng)) + 
                    sin(radians(user_lat)) * 
                    sin(radians(p.latitud))
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
                GREATEST(-1, LEAST(1,
                    cos(radians(user_lat)) * 
                    cos(radians(p.latitud)) * 
                    cos(radians(p.longitud) - radians(user_lng)) + 
                    sin(radians(user_lat)) * 
                    sin(radians(p.latitud))
                ))
            )
        ) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- =====================================================
-- 4. CREAR FUNCIÓN PARA BÚSQUEDA GENERAL (SIN UBICACIÓN)
-- =====================================================

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
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- =====================================================
-- 5. VERIFICAR POLÍTICAS RLS PARA BÚSQUEDAS
-- =====================================================

-- Verificar que profiles permite SELECT a usuarios autenticados
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND cmd = 'SELECT';

-- Si no hay política SELECT para profiles, crearla
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
        RAISE NOTICE 'Creada política SELECT para profiles';
    END IF;
END $$;

-- =====================================================
-- 6. VERIFICAR FUNCIONES CREADAS
-- =====================================================

-- Verificar que las funciones existen
SELECT 
    'Funciones de búsqueda creadas:' as info,
    proname as function_name,
    prosecdef as has_security_definer
FROM pg_proc 
WHERE proname IN ('get_nearby_profiles', 'search_profiles')
ORDER BY proname;

-- =====================================================
-- 7. DATOS DE PRUEBA PARA UBICACIONES (OPCIONAL)
-- =====================================================

-- Comentar/descomentar según necesidad
-- UPDATE public.profiles 
-- SET latitud = -34.6118, longitud = -58.3960 -- Buenos Aires
-- WHERE latitud IS NULL AND id = auth.uid();

-- =====================================================
-- 8. VERIFICACIÓN FINAL
-- =====================================================

SELECT 'Sistema de búsquedas configurado correctamente' as status;

-- Mostrar estadísticas
SELECT 
    COUNT(*) as total_profiles,
    COUNT(latitud) as profiles_with_location,
    COUNT(*) - COUNT(latitud) as profiles_without_location
FROM public.profiles;

COMMIT;
