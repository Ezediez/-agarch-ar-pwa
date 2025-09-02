-- SCRIPT COMPLETO PARA RESETEAR Y LIMPIAR SUPABASE
-- Ejecutar en el Editor SQL de Supabase
-- Este script elimina todas las alertas y recrea todo correctamente

-- =====================================================
-- PASO 1: LIMPIAR TODAS LAS FUNCIONES PROBLEMÁTICAS
-- =====================================================

-- Eliminar todas las funciones sin SECURITY DEFINER
DROP FUNCTION IF EXISTS function_name() CASCADE;
DROP FUNCTION IF EXISTS is_viewer_verified() CASCADE;
DROP FUNCTION IF EXISTS my_function() CASCADE;
DROP FUNCTION IF EXISTS safe_update() CASCADE;
DROP FUNCTION IF EXISTS sensitive_operation() CASCADE;
DROP FUNCTION IF EXISTS trigger_refresh_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS update_user_data() CASCADE;

-- =====================================================
-- PASO 2: ELIMINAR TODAS LAS POLÍTICAS RLS
-- =====================================================

-- Eliminar todas las políticas RLS existentes
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- =====================================================
-- PASO 3: DESHABILITAR RLS TEMPORALMENTE
-- =====================================================

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 4: CREAR FUNCIONES SEGURAS
-- =====================================================

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Función para búsqueda de usuarios
DROP FUNCTION IF EXISTS search_users(UUID, DECIMAL, DECIMAL, INTEGER, TEXT[], TEXT, TEXT[]) CASCADE;
CREATE OR REPLACE FUNCTION search_users(
    user_id UUID,
    lat DECIMAL,
    lng DECIMAL,
    radius_km INTEGER DEFAULT 50,
    interests TEXT[] DEFAULT NULL,
    gender TEXT DEFAULT NULL,
    looking_for TEXT[] DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    alias TEXT,
    bio TEXT,
    profile_picture_url TEXT,
    distance DECIMAL,
    interests TEXT[],
    gender TEXT,
    birth_date DATE,
    is_vip BOOLEAN,
    is_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.alias,
        p.bio,
        p.profile_picture_url,
        ST_Distance(
            ST_MakePoint(lat, lng)::geography,
            ST_MakePoint(p.lat, p.lng)::geography
        ) / 1000 as distance,
        p.interests,
        p.gender,
        p.birth_date,
        p.is_vip,
        p.is_verified
    FROM public.profiles p
    WHERE p.id != user_id
        AND p.lat IS NOT NULL 
        AND p.lng IS NOT NULL
        AND ST_Distance(
            ST_MakePoint(lat, lng)::geography,
            ST_MakePoint(p.lat, p.lng)::geography
        ) <= radius_km * 1000
        AND (interests IS NULL OR p.interests && interests)
        AND (gender IS NULL OR p.gender = gender)
        AND (looking_for IS NULL OR p.gender = ANY(looking_for))
    ORDER BY distance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Función para obtener posts con conteos
DROP FUNCTION IF EXISTS get_posts_with_counts() CASCADE;
CREATE OR REPLACE FUNCTION get_posts_with_counts()
RETURNS TABLE(
    id UUID,
    contenido TEXT,
    imagen_url TEXT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    likes_count BIGINT,
    comments_count BIGINT,
    user_alias TEXT,
    user_profile_picture TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.contenido,
        p.imagen_url,
        p.user_id,
        p.created_at,
        p.updated_at,
        COALESCE(l.likes_count, 0) as likes_count,
        COALESCE(c.comments_count, 0) as comments_count,
        pr.alias as user_alias,
        pr.profile_picture_url as user_profile_picture
    FROM public.posts p
    LEFT JOIN public.profiles pr ON p.user_id = pr.id
    LEFT JOIN (
        SELECT post_id, COUNT(*) as likes_count 
        FROM public.likes 
        GROUP BY post_id
    ) l ON p.id = l.post_id
    LEFT JOIN (
        SELECT post_id, COUNT(*) as comments_count 
        FROM public.comentarios 
        GROUP BY post_id
    ) c ON p.id = c.post_id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Función para perfiles cercanos
DROP FUNCTION IF EXISTS get_nearby_profiles(DECIMAL, DECIMAL, INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION get_nearby_profiles(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_km INTEGER DEFAULT 50
)
RETURNS TABLE(
    id UUID,
    alias TEXT,
    bio TEXT,
    profile_picture_url TEXT,
    distance DECIMAL,
    interests TEXT[],
    gender TEXT,
    birth_date DATE,
    is_vip BOOLEAN,
    is_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.alias,
        p.bio,
        p.profile_picture_url,
        ST_Distance(
            ST_MakePoint(user_lat, user_lng)::geography,
            ST_MakePoint(p.lat, p.lng)::geography
        ) / 1000 as distance,
        p.interests,
        p.gender,
        p.birth_date,
        p.is_vip,
        p.is_verified
    FROM public.profiles p
    WHERE p.lat IS NOT NULL 
        AND p.lng IS NOT NULL
        AND ST_Distance(
            ST_MakePoint(user_lat, user_lng)::geography,
            ST_MakePoint(p.lat, p.lng)::geography
        ) <= radius_km * 1000
    ORDER BY distance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- =====================================================
-- PASO 5: CREAR TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at en todas las tablas
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_likes_updated_at
    BEFORE UPDATE ON public.likes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comentarios_updated_at
    BEFORE UPDATE ON public.comentarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
    BEFORE UPDATE ON public.stories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PASO 6: HABILITAR RLS Y CREAR POLÍTICAS SEGURAS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "profiles_policy" ON public.profiles
    FOR ALL TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Políticas para posts
CREATE POLICY "posts_policy" ON public.posts
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para likes
CREATE POLICY "likes_policy" ON public.likes
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para comentarios
CREATE POLICY "comentarios_policy" ON public.comentarios
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para stories
CREATE POLICY "stories_policy" ON public.stories
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para matches
CREATE POLICY "matches_policy" ON public.matches
    FOR ALL TO authenticated
    USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
    WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Políticas para messages
CREATE POLICY "messages_policy" ON public.messages
    FOR ALL TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = sender_id);

-- Políticas para notifications
CREATE POLICY "notifications_policy" ON public.notifications
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PASO 7: CREAR ÍNDICES IMPORTANTES
-- =====================================================

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles USING GIST (ST_MakePoint(lat, lng));
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_interests ON public.profiles USING GIN(interests);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Índices para posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at);

-- Índices para likes
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

-- Índices para comentarios
CREATE INDEX IF NOT EXISTS idx_comentarios_post_id ON public.comentarios(post_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_user_id ON public.comentarios(user_id);

-- Índices para stories
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at);

-- Índices para matches
CREATE INDEX IF NOT EXISTS idx_matches_user_id_1 ON public.matches(user_id_1);
CREATE INDEX IF NOT EXISTS idx_matches_user_id_2 ON public.matches(user_id_2);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- =====================================================
-- PASO 8: VERIFICACIÓN FINAL
-- =====================================================

-- Verificar funciones con SECURITY DEFINER
SELECT 
    'VERIFICACIÓN FINAL:' as info,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Todas las funciones tienen SECURITY DEFINER'
        ELSE '❌ Aún hay funciones sin SECURITY DEFINER: ' || COUNT(*)::TEXT
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prosecdef = false
    AND p.prokind = 'f';

-- Verificar políticas RLS
SELECT 
    'POLÍTICAS RLS:' as info,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public';

-- Verificar índices
SELECT 
    'ÍNDICES CREADOS:' as info,
    COUNT(*) as total_indexes
FROM pg_indexes 
WHERE schemaname = 'public';

-- Resumen final
SELECT 
    'RESUMEN COMPLETO:' as info,
    'Funciones con SECURITY DEFINER' as category,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.prokind = 'f'
UNION ALL
SELECT 
    'RESUMEN COMPLETO:' as info,
    'Políticas RLS' as category,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'RESUMEN COMPLETO:' as info,
    'Índices creados' as category,
    COUNT(*) as count
FROM pg_indexes 
WHERE schemaname = 'public';
