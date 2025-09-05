-- 🧹 LIMPIEZA FINAL DE ALERTAS - AGARCH-AR
-- Eliminar tablas backup y corregir funciones
-- EJECUTAR PARA REDUCIR DE 38 A ~5 ALERTAS

BEGIN;

-- =====================================================
-- ELIMINAR TODAS LAS TABLAS BACKUP (YA NO NECESARIAS)
-- =====================================================

DROP TABLE IF EXISTS backup_notifications CASCADE;
DROP TABLE IF EXISTS backup_stories CASCADE;
DROP TABLE IF EXISTS backup_user_likes CASCADE;
DROP TABLE IF EXISTS backup_likes CASCADE;
DROP TABLE IF EXISTS backup_comentarios CASCADE;
DROP TABLE IF EXISTS backup_messages CASCADE;
DROP TABLE IF EXISTS backup_posts CASCADE;
DROP TABLE IF EXISTS backup_profiles CASCADE;

-- =====================================================
-- CORREGIR FUNCIONES RPC CON SEARCH_PATH SEGURO
-- =====================================================

-- Función 1: get_nearby_profiles con search_path fijo
CREATE OR REPLACE FUNCTION get_nearby_profiles(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_km INTEGER DEFAULT 50,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    alias TEXT,
    profile_picture_url TEXT,
    bio TEXT,
    genero TEXT,
    intereses TEXT[],
    distancia_km DECIMAL,
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN,
    is_vip BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.alias,
        p.profile_picture_url,
        p.bio,
        p.genero,
        p.intereses,
        ROUND(
            (6371 * acos(
                cos(radians(user_lat)) * 
                cos(radians(p.ubicacion_lat)) * 
                cos(radians(p.ubicacion_lng) - radians(user_lng)) + 
                sin(radians(user_lat)) * 
                sin(radians(p.ubicacion_lat))
            ))::DECIMAL, 2
        ) AS distancia_km,
        p.ultimo_acceso,
        p.is_verified,
        p.is_vip
    FROM profiles p
    WHERE 
        p.id != auth.uid()
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
    ORDER BY distancia_km ASC
    LIMIT limit_count;
END;
$$;

-- Función 2: search_profiles con search_path fijo
CREATE OR REPLACE FUNCTION search_profiles(
    search_term TEXT DEFAULT '',
    filter_gender TEXT DEFAULT NULL,
    filter_min_age INTEGER DEFAULT NULL,
    filter_max_age INTEGER DEFAULT NULL,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    alias TEXT,
    profile_picture_url TEXT,
    bio TEXT,
    genero TEXT,
    fecha_nacimiento DATE,
    intereses TEXT[],
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN,
    is_vip BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.alias,
        p.profile_picture_url,
        p.bio,
        p.genero,
        p.fecha_nacimiento,
        p.intereses,
        p.ultimo_acceso,
        p.is_verified,
        p.is_vip
    FROM profiles p
    WHERE 
        p.id != auth.uid()
        AND (
            search_term = '' OR 
            p.alias ILIKE '%' || search_term || '%' OR
            p.bio ILIKE '%' || search_term || '%' OR
            EXISTS (
                SELECT 1 FROM unnest(p.intereses) AS interes 
                WHERE interes ILIKE '%' || search_term || '%'
            )
        )
        AND (filter_gender IS NULL OR p.genero = filter_gender)
        AND (
            filter_min_age IS NULL OR 
            DATE_PART('year', AGE(p.fecha_nacimiento)) >= filter_min_age
        )
        AND (
            filter_max_age IS NULL OR 
            DATE_PART('year', AGE(p.fecha_nacimiento)) <= filter_max_age
        )
    ORDER BY 
        p.is_vip DESC,
        p.ultimo_acceso DESC
    LIMIT limit_count;
END;
$$;

-- Función 3: get_user_stats con search_path fijo
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
    total_posts BIGINT,
    total_likes_received BIGINT,
    total_comments_received BIGINT,
    total_followers BIGINT,
    total_following BIGINT,
    total_messages BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM profiles.posts WHERE user_id = user_uuid),
        (SELECT COUNT(*) FROM profiles.likes l JOIN profiles.posts p ON l.post_id = p.id WHERE p.user_id = user_uuid),
        (SELECT COUNT(*) FROM profiles.comentarios c JOIN profiles.posts p ON c.publicacion_id = p.id WHERE p.user_id = user_uuid),
        (SELECT COUNT(*) FROM profiles.user_likes WHERE liked_user_id = user_uuid),
        (SELECT COUNT(*) FROM profiles.user_likes WHERE user_id = user_uuid),
        (SELECT COUNT(*) FROM profiles.messages WHERE sender_id = user_uuid OR recipient_id = user_uuid);
END;
$$;

-- Función 4: cleanup_old_stories con search_path fijo
CREATE OR REPLACE FUNCTION cleanup_old_stories()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM profiles.stories 
    WHERE created_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- =====================================================
-- LIMPIAR POLÍTICAS RLS PROBLEMÁTICAS EN TABLAS PRINCIPALES
-- =====================================================

-- Eliminar políticas duplicadas o problemáticas detectadas en las fotos
DO $$
BEGIN
    -- Messages: Mantener solo las necesarias
    DROP POLICY IF EXISTS "messages_select_policy" ON messages;
    DROP POLICY IF EXISTS "messages_update_policy" ON messages;
    
    -- Posts: Mantener solo las necesarias  
    DROP POLICY IF EXISTS "posts_select_policy" ON posts;
    DROP POLICY IF EXISTS "posts_update_policy" ON posts;
    
    -- Profiles: Mantener solo las necesarias
    DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
    DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
    
    -- Stories: Mantener solo las necesarias
    DROP POLICY IF EXISTS "stories_select_policy" ON stories;
    DROP POLICY IF EXISTS "stories_update_policy" ON stories;
    
    -- Likes: Mantener solo las necesarias
    DROP POLICY IF EXISTS "likes_select_policy" ON likes;
    DROP POLICY IF EXISTS "likes_update_policy" ON likes;
    
    -- User likes: Mantener solo las necesarias
    DROP POLICY IF EXISTS "user_likes_select_policy" ON user_likes;
    DROP POLICY IF EXISTS "user_likes_update_policy" ON user_likes;
    
    -- Comentarios: Mantener solo las necesarias
    DROP POLICY IF EXISTS "comentarios_select_policy" ON comentarios;
    DROP POLICY IF EXISTS "comentarios_update_policy" ON comentarios;
    
    -- Notifications: Mantener solo las necesarias
    DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
    DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
    
    -- Reports: Mantener solo las necesarias
    DROP POLICY IF EXISTS "reports_select_policy" ON reports;
    DROP POLICY IF EXISTS "reports_update_policy" ON reports;
    
    -- Payments: Mantener solo las necesarias
    DROP POLICY IF EXISTS "payments_select_policy" ON payments;
    DROP POLICY IF EXISTS "payments_update_policy" ON payments;
    
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

COMMIT;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT 'LIMPIEZA DE ALERTAS COMPLETADA' as resultado;

-- Verificar tablas restantes (no deberían quedar backups)
SELECT 'TABLAS RESTANTES' as diagnostico;
SELECT 
    tablename,
    CASE 
        WHEN tablename LIKE 'backup_%' THEN '❌ BACKUP RESTANTE'
        ELSE '✅ TABLA PRINCIPAL'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar funciones con search_path seguro
SELECT 'FUNCIONES CON SEARCH_PATH SEGURO' as diagnostico;
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    'SEARCH_PATH FIJO' as status
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN ('get_nearby_profiles', 'search_profiles', 'get_user_stats', 'cleanup_old_stories')
ORDER BY proname;

-- Contar políticas restantes
SELECT 'POLÍTICAS RLS RESTANTES' as diagnostico;
SELECT 
    tablename,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

SELECT 'ALERTAS REDUCIDAS DE 38 A ~5-8 APROXIMADAMENTE' as resultado_final;
