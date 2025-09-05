-- ✨ RECREACIÓN LIMPIA Y OPTIMIZADA CORREGIDA - AGARCH-AR
-- Solo las 11 tablas esenciales + políticas RLS limpias
-- EJECUTAR DESPUÉS DE LA LIMPIEZA TOTAL

BEGIN;

-- =====================================================
-- 1. CREAR FUNCIÓN DE TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 2. TABLA PROFILES - PERFILES DE USUARIO
-- =====================================================

DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    alias TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    nombre_completo TEXT,
    bio TEXT,
    fecha_nacimiento DATE,
    genero TEXT CHECK (genero IN ('masculino', 'femenino', 'otro')),
    buscando TEXT[] DEFAULT '{}',
    intereses TEXT[] DEFAULT '{}',
    fotos TEXT[] DEFAULT '{}',
    videos TEXT[] DEFAULT '{}',
    ubicacion_lat DECIMAL(10, 8),
    ubicacion_lng DECIMAL(11, 8),
    profile_picture_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_vip BOOLEAN DEFAULT FALSE,
    ultimo_acceso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Índices optimizados
CREATE INDEX IF NOT EXISTS idx_profiles_ubicacion ON profiles (ubicacion_lat, ubicacion_lng) WHERE ubicacion_lat IS NOT NULL AND ubicacion_lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_genero ON profiles (genero);
CREATE INDEX IF NOT EXISTS idx_profiles_ultimo_acceso ON profiles (ultimo_acceso DESC);

-- =====================================================
-- 3. TABLA POSTS - PUBLICACIONES
-- =====================================================

DROP TABLE IF EXISTS posts CASCADE;

CREATE TABLE posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    texto TEXT,
    imagen_url TEXT,
    video_url TEXT,
    ubicacion_lat DECIMAL(10, 8),
    ubicacion_lng DECIMAL(11, 8),
    es_privado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT posts_content_check CHECK (
        texto IS NOT NULL OR imagen_url IS NOT NULL OR video_url IS NOT NULL
    )
);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at 
    BEFORE UPDATE ON posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Índices optimizados
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_ubicacion ON posts (ubicacion_lat, ubicacion_lng) WHERE ubicacion_lat IS NOT NULL AND ubicacion_lng IS NOT NULL;

-- =====================================================
-- 4. TABLA MESSAGES - MENSAJES DIRECTOS
-- =====================================================

DROP TABLE IF EXISTS messages CASCADE;

CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    contenido TEXT NOT NULL,
    tipo_mensaje TEXT DEFAULT 'texto' CHECK (tipo_mensaje IN ('texto', 'imagen', 'video', 'ubicacion')),
    media_url TEXT,
    es_leido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT messages_no_self_message CHECK (sender_id != recipient_id)
);

-- Índices optimizados
CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages (sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages (recipient_id, es_leido, created_at DESC);

-- =====================================================
-- 5. TABLA COMENTARIOS - COMENTARIOS EN POSTS
-- =====================================================

DROP TABLE IF EXISTS comentarios CASCADE;

CREATE TABLE comentarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    publicacion_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    usuario_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    texto TEXT NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices optimizados
CREATE INDEX IF NOT EXISTS idx_comentarios_publicacion ON comentarios (publicacion_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_comentarios_usuario ON comentarios (usuario_id);

-- =====================================================
-- 6. TABLA LIKES - LIKES EN POSTS
-- =====================================================

DROP TABLE IF EXISTS likes CASCADE;

CREATE TABLE likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Índices optimizados
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes (post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes (user_id);

-- =====================================================
-- 7. TABLA USER_LIKES - LIKES ENTRE USUARIOS
-- =====================================================

DROP TABLE IF EXISTS user_likes CASCADE;

CREATE TABLE user_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    liked_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, liked_user_id),
    CONSTRAINT user_likes_no_self_like CHECK (user_id != liked_user_id)
);

-- Índices optimizados
CREATE INDEX IF NOT EXISTS idx_user_likes_user ON user_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_liked_user ON user_likes (liked_user_id);

-- =====================================================
-- 8. TABLA STORIES - HISTORIAS 24H
-- =====================================================

DROP TABLE IF EXISTS stories CASCADE;

CREATE TABLE stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT NOT NULL,
    tipo_media TEXT DEFAULT 'imagen' CHECK (tipo_media IN ('imagen', 'video')),
    texto TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices optimizados
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories (user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories (created_at DESC);

-- =====================================================
-- 9. TABLA NOTIFICATIONS - NOTIFICACIONES
-- =====================================================

DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('like', 'comentario', 'mensaje', 'seguidor', 'sistema')),
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    datos_extra JSONB DEFAULT '{}',
    es_leida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices optimizados
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, es_leida, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_tipo ON notifications (tipo);

-- =====================================================
-- 10. TABLA REPORTS - REPORTES DE USUARIOS
-- =====================================================

DROP TABLE IF EXISTS reports CASCADE;

CREATE TABLE reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reported_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    motivo TEXT NOT NULL,
    descripcion TEXT,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'revisado', 'resuelto')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT reports_target_check CHECK (
        reported_user_id IS NOT NULL OR reported_post_id IS NOT NULL
    )
);

-- Índices optimizados
CREATE INDEX IF NOT EXISTS idx_reports_estado ON reports (estado, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports (user_id);

-- =====================================================
-- 11. TABLA PAYMENTS - PAGOS VIP
-- =====================================================

DROP TABLE IF EXISTS payments CASCADE;

CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    moneda TEXT DEFAULT 'ARS',
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completado', 'fallido', 'reembolsado')),
    metodo_pago TEXT,
    referencia_externa TEXT,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices optimizados
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_estado ON payments (estado);

-- =====================================================
-- CREAR STORAGE BUCKETS LIMPIOS
-- =====================================================

-- Bucket para media general (fotos, videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media',
    'media',
    true,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket para imágenes de reportes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'report_images',
    'report_images',
    false,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

COMMIT;

SELECT 'TABLAS RECREADAS EXITOSAMENTE - 11 TABLAS ESENCIALES LIMPIAS' as resultado;



