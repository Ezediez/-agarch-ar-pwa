-- 🔧 FUNCIONES FALTANTES CRÍTICAS - AGARCH-AR
-- Crear funciones que faltan para likes, mensajes y notificaciones
-- EJECUTAR MAÑANA PRIMERA PRIORIDAD

BEGIN;

-- =====================================================
-- FUNCIÓN 1: HANDLE_USER_INTERACTION (LIKES Y MENSAJES)
-- =====================================================

CREATE OR REPLACE FUNCTION handle_user_interaction(
    initial_message TEXT,
    target_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    current_user_id UUID;
    interaction_result JSON;
    like_exists BOOLEAN;
BEGIN
    -- Obtener ID del usuario actual
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Usuario no autenticado');
    END IF;
    
    IF current_user_id = target_user_id THEN
        RETURN json_build_object('success', false, 'error', 'No puedes interactuar contigo mismo');
    END IF;
    
    -- Verificar si ya existe un like
    SELECT EXISTS(
        SELECT 1 FROM user_likes 
        WHERE user_id = current_user_id AND liked_user_id = target_user_id
    ) INTO like_exists;
    
    IF like_exists THEN
        -- Si ya le dio like, crear mensaje directo
        INSERT INTO messages (sender_id, recipient_id, contenido, created_at)
        VALUES (current_user_id, target_user_id, initial_message, NOW());
        
        -- Crear notificación de mensaje
        INSERT INTO notifications (user_id, tipo, titulo, mensaje, datos_extra, created_at)
        VALUES (
            target_user_id, 
            'mensaje', 
            'Nuevo mensaje', 
            'Tienes un nuevo mensaje',
            json_build_object('sender_id', current_user_id),
            NOW()
        );
        
        interaction_result := json_build_object(
            'success', true, 
            'action', 'message_sent',
            'message', 'Mensaje enviado exitosamente'
        );
    ELSE
        -- Si no le dio like, crear like
        INSERT INTO user_likes (user_id, liked_user_id, created_at)
        VALUES (current_user_id, target_user_id, NOW())
        ON CONFLICT (user_id, liked_user_id) DO NOTHING;
        
        -- Crear notificación de like
        INSERT INTO notifications (user_id, tipo, titulo, mensaje, datos_extra, created_at)
        VALUES (
            target_user_id, 
            'seguidor', 
            'Nuevo seguidor', 
            'Alguien te empezó a seguir',
            json_build_object('follower_id', current_user_id),
            NOW()
        );
        
        interaction_result := json_build_object(
            'success', true, 
            'action', 'like_added',
            'message', 'Like agregado exitosamente'
        );
    END IF;
    
    RETURN interaction_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =====================================================
-- FUNCIÓN 2: GET_USER_LIKES (LISTA DE LIKES EN PERFIL)
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_likes(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    alias TEXT,
    profile_picture_url TEXT,
    is_verified BOOLEAN,
    is_vip BOOLEAN,
    liked_at TIMESTAMP WITH TIME ZONE
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
        p.is_verified,
        p.is_vip,
        ul.created_at as liked_at
    FROM user_likes ul
    JOIN profiles p ON ul.liked_user_id = p.id
    WHERE ul.user_id = user_uuid
    ORDER BY ul.created_at DESC;
END;
$$;

-- =====================================================
-- FUNCIÓN 3: UPDATE_USER_LOCATION (ACTUALIZAR UBICACIÓN)
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_location(
    user_lat DECIMAL,
    user_lng DECIMAL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Usuario no autenticado');
    END IF;
    
    UPDATE profiles 
    SET 
        ubicacion_lat = user_lat,
        ubicacion_lng = user_lng,
        updated_at = NOW()
    WHERE id = current_user_id;
    
    IF FOUND THEN
        RETURN json_build_object('success', true, 'message', 'Ubicación actualizada');
    ELSE
        RETURN json_build_object('success', false, 'error', 'No se pudo actualizar la ubicación');
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =====================================================
-- FUNCIÓN 4: CREATE_POST_WITH_VALIDATION
-- =====================================================

CREATE OR REPLACE FUNCTION create_post_with_validation(
    post_text TEXT DEFAULT NULL,
    image_url TEXT DEFAULT NULL,
    video_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    current_user_id UUID;
    new_post_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Usuario no autenticado');
    END IF;
    
    -- Validar que tenga al menos contenido
    IF (post_text IS NULL OR post_text = '') AND 
       (image_url IS NULL OR image_url = '') AND 
       (video_url IS NULL OR video_url = '') THEN
        RETURN json_build_object('success', false, 'error', 'El post debe tener contenido');
    END IF;
    
    -- Crear el post
    INSERT INTO posts (user_id, texto, imagen_url, video_url, created_at, updated_at)
    VALUES (current_user_id, post_text, image_url, video_url, NOW(), NOW())
    RETURNING id INTO new_post_id;
    
    RETURN json_build_object(
        'success', true, 
        'post_id', new_post_id,
        'message', 'Post creado exitosamente'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMIT;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT 'FUNCIONES CRÍTICAS CREADAS' as resultado;

SELECT 
    proname as function_name,
    'DISPONIBLE' as status
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN (
    'handle_user_interaction', 
    'get_user_likes', 
    'update_user_location', 
    'create_post_with_validation'
)
ORDER BY proname;

SELECT '🔧 FUNCIONES FALTANTES AGREGADAS - LISTO PARA PRUEBAS' as resultado_final;
