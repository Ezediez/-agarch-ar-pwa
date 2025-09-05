-- 🔧 FUNCIÓN ADICIONAL: GET_USER_LIKES
-- Función para obtener la lista de usuarios que le gustan a un usuario
-- COMPLEMENTO AL SCRIPT 08-FUNCIONES-faltantes-criticas.sql

BEGIN;

-- =====================================================
-- FUNCIÓN: GET_USER_LIKES_LIST (LISTA MEJORADA)
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_likes_list(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    alias TEXT,
    profile_picture_url TEXT,
    bio TEXT,
    gender TEXT,
    is_verified BOOLEAN,
    is_vip BOOLEAN,
    liked_at TIMESTAMP WITH TIME ZONE,
    ubicacion_lat DECIMAL,
    ubicacion_lng DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Si no se proporciona user_uuid, usar el usuario actual
    IF user_uuid IS NULL THEN
        current_user_id := auth.uid();
    ELSE
        current_user_id := user_uuid;
    END IF;
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id,
        p.alias,
        p.profile_picture_url,
        p.bio,
        p.gender,
        p.is_verified,
        p.is_vip,
        ul.created_at as liked_at,
        p.ubicacion_lat,
        p.ubicacion_lng
    FROM user_likes ul
    JOIN profiles p ON ul.liked_user_id = p.id
    WHERE ul.user_id = current_user_id
    ORDER BY ul.created_at DESC;
END;
$$;

COMMIT;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT 'FUNCIÓN GET_USER_LIKES_LIST CREADA' as resultado;

SELECT 
    proname as function_name,
    'DISPONIBLE' as status
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname = 'get_user_likes_list';
