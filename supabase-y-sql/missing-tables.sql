-- 🚨 TABLAS FALTANTES PARA AGARCH-AR
-- Ejecutar en el SQL Editor de Supabase

-- =====================================================
-- TABLA DE PUBLICACIONES (POSTS)
-- =====================================================

CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA DE COMENTARIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  publicacion_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA DE LIKES
-- =====================================================

CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- =====================================================
-- TABLA DE STORIES
-- =====================================================

CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ACTUALIZAR TABLA PROFILES CON CAMPOS FALTANTES
-- =====================================================

-- Agregar campos que faltan en profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sexual_orientation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS relationship_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_contacts INTEGER DEFAULT 10;

-- =====================================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_comentarios_publicacion_id ON comentarios(publicacion_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at);

-- =====================================================
-- HABILITAR ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE SEGURIDAD
-- =====================================================

-- Políticas para Posts
CREATE POLICY "Users can view all posts" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Comentarios
CREATE POLICY "Users can view all comments" ON comentarios
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON comentarios
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own comments" ON comentarios
  FOR DELETE USING (auth.uid() = usuario_id);

-- Políticas para Likes
CREATE POLICY "Users can view all likes" ON likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Stories
CREATE POLICY "Users can view all stories" ON stories
  FOR SELECT USING (true);

CREATE POLICY "Users can create stories" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories" ON stories
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCIONES PARA CONTAR LIKES Y COMENTARIOS
-- =====================================================

-- Función para obtener posts con conteos
CREATE OR REPLACE FUNCTION get_posts_with_counts()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  text TEXT,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  author JSONB,
  likes_count BIGINT,
  comments_count BIGINT,
  is_liked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.text,
    p.image_url,
    p.video_url,
    p.created_at,
    jsonb_build_object(
      'id', pr.id,
      'alias', pr.alias,
      'profile_picture_url', pr.profile_picture_url,
      'is_vip', pr.is_vip,
      'is_verified', pr.is_verified
    ) as author,
    COALESCE(l.likes_count, 0) as likes_count,
    COALESCE(c.comments_count, 0) as comments_count,
    CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END as is_liked
  FROM posts p
  LEFT JOIN profiles pr ON p.user_id = pr.id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as likes_count
    FROM likes
    GROUP BY post_id
  ) l ON p.id = l.post_id
  LEFT JOIN (
    SELECT publicacion_id, COUNT(*) as comments_count
    FROM comentarios
    GROUP BY publicacion_id
  ) c ON p.id = c.publicacion_id
  LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = auth.uid()
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INSERTAR DATOS DE PRUEBA
-- =====================================================

-- Insertar algunos posts de prueba
INSERT INTO posts (user_id, text, image_url) VALUES
  (auth.uid(), '¡Hola! Soy nuevo en la app 🚀', 'https://picsum.photos/400/300?random=1'),
  (auth.uid(), '¿Alguien más le gusta la música? 🎵', 'https://picsum.photos/400/300?random=2'),
  (auth.uid(), 'Hermoso día para conocer gente nueva ☀️', 'https://picsum.photos/400/300?random=3')
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICAR TABLAS CREADAS
-- =====================================================

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('posts', 'comentarios', 'likes', 'stories')
ORDER BY table_name;
