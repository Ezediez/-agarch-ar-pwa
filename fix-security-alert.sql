-- 🔒 SOLUCIÓN PARA ALERTA DE SEGURIDAD
-- Ejecutar en Supabase SQL Editor

-- =====================================================
-- ARREGLAR FUNCIÓN CON ALERTA DE SEGURIDAD
-- =====================================================

-- Eliminar la función problemática
DROP FUNCTION IF EXISTS get_posts_with_counts();

-- Recrear la función con search_path seguro
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
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
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
$$;

-- =====================================================
-- VERIFICAR QUE LA FUNCIÓN SE CREÓ CORRECTAMENTE
-- =====================================================

SELECT 
  proname as function_name,
  prokind as function_type,
  prosecdef as security_definer
FROM pg_proc 
WHERE proname = 'get_posts_with_counts';

-- =====================================================
-- INSERTAR DATOS DE PRUEBA (si no se insertaron antes)
-- =====================================================

-- Verificar si ya hay posts
SELECT COUNT(*) as total_posts FROM posts;

-- Si no hay posts, insertar algunos de prueba
INSERT INTO posts (user_id, text, image_url) 
SELECT 
  auth.uid(),
  '¡Hola! Soy nuevo en la app 🚀',
  'https://picsum.photos/400/300?random=1'
WHERE NOT EXISTS (SELECT 1 FROM posts LIMIT 1);

INSERT INTO posts (user_id, text, image_url) 
SELECT 
  auth.uid(),
  '¿Alguien más le gusta la música? 🎵',
  'https://picsum.photos/400/300?random=2'
WHERE (SELECT COUNT(*) FROM posts) < 2;

INSERT INTO posts (user_id, text, image_url) 
SELECT 
  auth.uid(),
  'Hermoso día para conocer gente nueva ☀️',
  'https://picsum.photos/400/300?random=3'
WHERE (SELECT COUNT(*) FROM posts) < 3;

-- =====================================================
-- VERIFICAR TABLAS Y DATOS
-- =====================================================

-- Verificar que todas las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('posts', 'comentarios', 'likes', 'stories', 'profiles')
ORDER BY table_name;

-- Verificar que hay posts
SELECT COUNT(*) as total_posts FROM posts;

-- Verificar políticas de seguridad
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
