-- SOLUCION FINAL LIMPIA: FUNCIONES + POLITICAS
-- Sin comentarios markdown, solo SQL puro

BEGIN;

-- Verificar campos de ubicacion
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS latitud DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitud DECIMAL(11, 8);

-- Crear funcion de busqueda por distancia
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
        COALESCE((
            6371 * acos(
                GREATEST(-1::float, LEAST(1::float,
                    cos(radians(user_lat::float)) * 
                    cos(radians(COALESCE(p.latitud, 0)::float)) * 
                    cos(radians(COALESCE(p.longitud, 0)::float) - radians(user_lng::float)) + 
                    sin(radians(user_lat::float)) * 
                    sin(radians(COALESCE(p.latitud, 0)::float))
                ))
            )
        ), 999999)::DECIMAL(10, 2) AS distance_km
    FROM public.profiles p
    WHERE 
        p.id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
        AND (
            p.latitud IS NULL OR p.longitud IS NULL OR
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
            ) <= radius_km
        )
    ORDER BY distance_km ASC
    LIMIT 100;
END;
$$;

-- Crear funcion de busqueda general
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
        p.id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
        AND (search_keyword IS NULL OR 
             p.alias ILIKE '%' || search_keyword || '%' OR 
             p.bio ILIKE '%' || search_keyword || '%')
        AND (filter_gender IS NULL OR filter_gender = 'todos' OR p.gender = filter_gender)
        AND (filter_orientation IS NULL OR filter_orientation = 'todas' OR p.sexual_orientation = filter_orientation)
        AND (filter_status IS NULL OR filter_status = 'todos' OR p.relationship_status = filter_status)
        AND (p.birth_date IS NULL OR 
             EXTRACT(YEAR FROM AGE(p.birth_date)) BETWEEN min_age AND max_age)
    ORDER BY p.created_at DESC
    LIMIT LEAST(result_limit, 100)
    OFFSET result_offset;
END;
$$;

-- Arreglar politicas problematicas
DROP POLICY IF EXISTS "posts_select_policy" ON public.posts;
CREATE POLICY "posts_select_policy" ON public.posts 
    FOR SELECT TO authenticated 
    USING (true);

DROP POLICY IF EXISTS "stories_select_policy" ON public.stories;
CREATE POLICY "stories_select_policy" ON public.stories 
    FOR SELECT TO authenticated 
    USING (true);

DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
CREATE POLICY "messages_select_policy" ON public.messages 
    FOR SELECT TO authenticated 
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles 
    FOR SELECT TO authenticated 
    USING (true);

-- Crear indices
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_profiles_search ON public.profiles(alias, gender, sexual_orientation);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, recipient_id, sent_at);

-- Pruebas
SELECT 'FUNCIONES CREADAS' as status, COUNT(*) as count
FROM pg_proc WHERE proname IN ('get_nearby_profiles', 'search_profiles');

SELECT 'PERFILES PARA BUSQUEDA' as status, COUNT(*) as count FROM public.profiles;

SELECT 'MENSAJES DISPONIBLES' as status, COUNT(*) as count FROM public.messages;

SELECT 'SOLUCION APLICADA EXITOSAMENTE' as resultado;

COMMIT;
