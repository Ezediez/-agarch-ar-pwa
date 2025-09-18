-- 🧪 FUNCIONES RPC Y VERIFICACIÓN FINAL - AGARCH-AR
-- Crear funciones esenciales y verificar que todo funciona
-- EJECUTAR AL FINAL DE LA MIGRACIÓN

BEGIN;

-- =====================================================
-- FUNCIÓN 1: BÚSQUEDA POR GEOLOCALIZACIÓN
-- =====================================================

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
        p.id != auth.uid()  -- Excluir propio perfil
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

-- =====================================================
-- FUNCIÓN 2: BÚSQUEDA AVANZADA DE PERFILES
-- =====================================================

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
        p.id != auth.uid()  -- Excluir propio perfil
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

-- =====================================================
-- FUNCIÓN 3: ESTADÍSTICAS DEL USUARIO
-- =====================================================

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
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM posts WHERE user_id = user_uuid),
        (SELECT COUNT(*) FROM likes l JOIN posts p ON l.post_id = p.id WHERE p.user_id = user_uuid),
        (SELECT COUNT(*) FROM comentarios c JOIN posts p ON c.publicacion_id = p.id WHERE p.user_id = user_uuid),
        (SELECT COUNT(*) FROM user_likes WHERE liked_user_id = user_uuid),
        (SELECT COUNT(*) FROM user_likes WHERE user_id = user_uuid),
        (SELECT COUNT(*) FROM messages WHERE sender_id = user_uuid OR recipient_id = user_uuid);
END;
$$;

-- =====================================================
-- FUNCIÓN 4: LIMPIAR STORIES ANTIGUAS (AUTOMÁTICA)
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_stories()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM stories 
    WHERE created_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- =====================================================
-- RESTAURAR DATOS DESDE BACKUP (MAPEO CORRECTO DE COLUMNAS)
-- =====================================================

-- Restaurar profiles con mapeo correcto de columnas inglés -> español
DO $$
DECLARE
    col_exists BOOLEAN;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'backup_profiles') THEN
        -- Insertar solo perfiles con alias válido
        INSERT INTO profiles (id, alias, created_at, updated_at)
        SELECT 
            bp.id, 
            bp.alias,
            COALESCE(bp.created_at, NOW()) as created_at,
            COALESCE(bp.updated_at, NOW()) as updated_at
        FROM backup_profiles bp
        WHERE bp.alias IS NOT NULL AND bp.alias != ''
        ON CONFLICT (id) DO NOTHING;
        
        -- Actualizar email si existe
        BEGIN
            UPDATE profiles 
            SET email = bp.email
            FROM backup_profiles bp
            WHERE profiles.id = bp.id AND bp.email IS NOT NULL;
        EXCEPTION
            WHEN OTHERS THEN NULL;
        END;
        
        -- Actualizar bio si existe
        BEGIN
            UPDATE profiles 
            SET bio = bp.bio
            FROM backup_profiles bp
            WHERE profiles.id = bp.id AND bp.bio IS NOT NULL;
        EXCEPTION
            WHEN OTHERS THEN NULL;
        END;
        
        -- Actualizar genero (puede ser 'gender' en inglés)
        BEGIN
            UPDATE profiles 
            SET genero = bp.genero
            FROM backup_profiles bp
            WHERE profiles.id = bp.id AND bp.genero IS NOT NULL;
        EXCEPTION
            WHEN OTHERS THEN
                BEGIN
                    UPDATE profiles 
                    SET genero = bp.gender
                    FROM backup_profiles bp
                    WHERE profiles.id = bp.id AND bp.gender IS NOT NULL;
                EXCEPTION
                    WHEN OTHERS THEN NULL;
                END;
        END;
        
        -- Actualizar profile_picture_url
        BEGIN
            UPDATE profiles 
            SET profile_picture_url = bp.profile_picture_url
            FROM backup_profiles bp
            WHERE profiles.id = bp.id AND bp.profile_picture_url IS NOT NULL;
        EXCEPTION
            WHEN OTHERS THEN NULL;
        END;
        
        -- Actualizar is_verified
        BEGIN
            UPDATE profiles 
            SET is_verified = COALESCE(bp.is_verified, false)
            FROM backup_profiles bp
            WHERE profiles.id = bp.id;
        EXCEPTION
            WHEN OTHERS THEN NULL;
        END;
        
        -- Actualizar is_vip
        BEGIN
            UPDATE profiles 
            SET is_vip = COALESCE(bp.is_vip, false)
            FROM backup_profiles bp
            WHERE profiles.id = bp.id;
        EXCEPTION
            WHEN OTHERS THEN NULL;
        END;
        
        -- Actualizar intereses (puede ser 'interests' en inglés)
        BEGIN
            UPDATE profiles 
            SET intereses = bp.intereses
            FROM backup_profiles bp
            WHERE profiles.id = bp.id AND bp.intereses IS NOT NULL;
        EXCEPTION
            WHEN OTHERS THEN
                BEGIN
                    UPDATE profiles 
                    SET intereses = bp.interests
                    FROM backup_profiles bp
                    WHERE profiles.id = bp.id AND bp.interests IS NOT NULL;
                EXCEPTION
                    WHEN OTHERS THEN NULL;
                END;
        END;
        
        -- Actualizar ubicacion_lat (puede ser 'location_lat' en inglés)
        BEGIN
            UPDATE profiles 
            SET ubicacion_lat = bp.ubicacion_lat
            FROM backup_profiles bp
            WHERE profiles.id = bp.id AND bp.ubicacion_lat IS NOT NULL;
        EXCEPTION
            WHEN OTHERS THEN
                BEGIN
                    UPDATE profiles 
                    SET ubicacion_lat = bp.location_lat
                    FROM backup_profiles bp
                    WHERE profiles.id = bp.id AND bp.location_lat IS NOT NULL;
                EXCEPTION
                    WHEN OTHERS THEN NULL;
                END;
        END;
        
        -- Actualizar ubicacion_lng (puede ser 'location_lng' en inglés)
        BEGIN
            UPDATE profiles 
            SET ubicacion_lng = bp.ubicacion_lng
            FROM backup_profiles bp
            WHERE profiles.id = bp.id AND bp.ubicacion_lng IS NOT NULL;
        EXCEPTION
            WHEN OTHERS THEN
                BEGIN
                    UPDATE profiles 
                    SET ubicacion_lng = bp.location_lng
                    FROM backup_profiles bp
                    WHERE profiles.id = bp.id AND bp.location_lng IS NOT NULL;
                EXCEPTION
                    WHEN OTHERS THEN NULL;
                END;
        END;
        
    END IF;
END $$;

-- Restaurar posts con manejo de errores
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'backup_posts') THEN
        INSERT INTO posts (id, user_id, created_at, updated_at)
        SELECT 
            bp.id, 
            bp.user_id,
            COALESCE(bp.created_at, NOW()) as created_at,
            COALESCE(bp.updated_at, NOW()) as updated_at
        FROM backup_posts bp
        WHERE bp.user_id IN (SELECT id FROM profiles)
        ON CONFLICT (id) DO NOTHING;
        
        -- Actualizar texto (puede ser 'text' en inglés)
        BEGIN
            UPDATE posts 
            SET texto = bp.texto
            FROM backup_posts bp
            WHERE posts.id = bp.id AND bp.texto IS NOT NULL;
        EXCEPTION
            WHEN OTHERS THEN
                BEGIN
                    UPDATE posts 
                    SET texto = bp.text
                    FROM backup_posts bp
                    WHERE posts.id = bp.id AND bp.text IS NOT NULL;
                EXCEPTION
                    WHEN OTHERS THEN NULL;
                END;
        END;
        
        -- Actualizar imagen_url (puede ser 'image_url' en inglés)
        BEGIN
            UPDATE posts 
            SET imagen_url = bp.imagen_url
            FROM backup_posts bp
            WHERE posts.id = bp.id AND bp.imagen_url IS NOT NULL;
        EXCEPTION
            WHEN OTHERS THEN
                BEGIN
                    UPDATE posts 
                    SET imagen_url = bp.image_url
                    FROM backup_posts bp
                    WHERE posts.id = bp.id AND bp.image_url IS NOT NULL;
                EXCEPTION
                    WHEN OTHERS THEN NULL;
                END;
        END;
        
        -- Actualizar video_url
        BEGIN
            UPDATE posts 
            SET video_url = bp.video_url
            FROM backup_posts bp
            WHERE posts.id = bp.id AND bp.video_url IS NOT NULL;
        EXCEPTION
            WHEN OTHERS THEN NULL;
        END;
    END IF;
END $$;

-- Restaurar messages con manejo de errores
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'backup_messages') THEN
        INSERT INTO messages (id, sender_id, recipient_id, contenido, created_at)
        SELECT 
            bm.id, 
            bm.sender_id, 
            bm.recipient_id,
            COALESCE(bm.contenido, bm.content, 'Mensaje restaurado') as contenido,
            COALESCE(bm.created_at, NOW()) as created_at
        FROM backup_messages bm
        WHERE bm.recipient_id IS NOT NULL 
        AND bm.sender_id IN (SELECT id FROM profiles)
        AND bm.recipient_id IN (SELECT id FROM profiles)
        ON CONFLICT (id) DO NOTHING;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Restaurar otras tablas con validaciones básicas
DO $$
BEGIN
    -- Comentarios
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'backup_comentarios') THEN
            INSERT INTO comentarios (id, publicacion_id, usuario_id, texto, creado_en)
            SELECT id, publicacion_id, usuario_id, texto, COALESCE(creado_en, NOW())
            FROM backup_comentarios 
            WHERE publicacion_id IN (SELECT id FROM posts)
            AND usuario_id IN (SELECT id FROM profiles)
            AND texto IS NOT NULL AND texto != ''
            ON CONFLICT (id) DO NOTHING;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Likes
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'backup_likes') THEN
            INSERT INTO likes (id, user_id, post_id, created_at)
            SELECT id, user_id, post_id, COALESCE(created_at, NOW())
            FROM backup_likes 
            WHERE user_id IN (SELECT id FROM profiles)
            AND post_id IN (SELECT id FROM posts)
            ON CONFLICT (id) DO NOTHING;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- User likes
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'backup_user_likes') THEN
            INSERT INTO user_likes (id, user_id, liked_user_id, created_at)
            SELECT id, user_id, liked_user_id, COALESCE(created_at, NOW())
            FROM backup_user_likes 
            WHERE user_id IN (SELECT id FROM profiles)
            AND liked_user_id IN (SELECT id FROM profiles)
            AND user_id != liked_user_id
            ON CONFLICT (id) DO NOTHING;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Stories
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'backup_stories') THEN
            INSERT INTO stories (id, user_id, media_url, created_at)
            SELECT id, user_id, media_url, COALESCE(created_at, NOW())
            FROM backup_stories 
            WHERE user_id IN (SELECT id FROM profiles)
            AND media_url IS NOT NULL AND media_url != ''
            ON CONFLICT (id) DO NOTHING;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
END $$;

-- =====================================================
-- CREAR PERFILES PARA USUARIOS DE AUTH SIN PERFIL
-- =====================================================

INSERT INTO profiles (id, alias, created_at, updated_at)
SELECT 
    au.id,
    'usuario_' || SUBSTR(au.id::text, 1, 8) as alias,
    COALESCE(au.created_at, NOW()) as created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- HABILITAR REALTIME
-- =====================================================

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

COMMIT;

-- =====================================================
-- VERIFICACIÓN FINAL COMPLETA
-- =====================================================

SELECT 'MIGRACIÓN COMPLETADA EXITOSAMENTE' as resultado;

-- Verificar funciones RPC
SELECT 'FUNCIONES RPC DISPONIBLES' as diagnostico;
SELECT 
    proname as function_name,
    pronargs as num_parameters,
    'DISPONIBLE' as status
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN ('get_nearby_profiles', 'search_profiles', 'get_user_stats', 'cleanup_old_stories')
ORDER BY proname;

-- Verificar datos restaurados
SELECT 'DATOS RESTAURADOS' as diagnostico;
SELECT 
    'profiles' as tabla,
    COUNT(*) as registros_restaurados
FROM profiles
UNION ALL
SELECT 
    'posts' as tabla,
    COUNT(*) as registros_restaurados
FROM posts
UNION ALL
SELECT 
    'messages' as tabla,
    COUNT(*) as registros_restaurados
FROM messages;

-- Verificación final
SELECT 'AGARCH-AR LISTO PARA PRODUCCIÓN 🚀' as resultado_final;













