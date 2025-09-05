-- 🔧 ARREGLAR FOREIGN KEYS Y RELACIONES
-- Ejecutar en Supabase SQL Editor

-- =====================================================
-- CREAR RELACIÓN ENTRE POSTS Y PROFILES
-- =====================================================

-- Primero, verificar si existe la columna user_id en posts
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' AND table_schema = 'public';

-- Verificar si existe la columna id en profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public';

-- =====================================================
-- CREAR FOREIGN KEY ENTRE POSTS Y PROFILES
-- =====================================================

-- Eliminar constraint existente si existe
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

-- Crear nueva foreign key que apunte a profiles en lugar de auth.users
ALTER TABLE posts 
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- CREAR FOREIGN KEY ENTRE COMENTARIOS Y PROFILES
-- =====================================================

-- Eliminar constraint existente si existe
ALTER TABLE comentarios DROP CONSTRAINT IF EXISTS comentarios_usuario_id_fkey;

-- Crear nueva foreign key
ALTER TABLE comentarios 
ADD CONSTRAINT comentarios_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- CREAR FOREIGN KEY ENTRE LIKES Y PROFILES
-- =====================================================

-- Eliminar constraint existente si existe
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;

-- Crear nueva foreign key
ALTER TABLE likes 
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- CREAR FOREIGN KEY ENTRE STORIES Y PROFILES
-- =====================================================

-- Eliminar constraint existente si existe
ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_user_id_fkey;

-- Crear nueva foreign key
ALTER TABLE stories 
ADD CONSTRAINT stories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- VERIFICAR FOREIGN KEYS CREADAS
-- =====================================================

SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema='public'
AND tc.table_name IN ('posts', 'comentarios', 'likes', 'stories')
ORDER BY tc.table_name;

-- =====================================================
-- INSERTAR DATOS DE PRUEBA CON USUARIOS REALES
-- =====================================================

-- Verificar si hay perfiles
SELECT COUNT(*) as total_profiles FROM profiles;

-- Si no hay perfiles, crear uno de prueba
INSERT INTO profiles (id, alias, profile_picture_url, is_vip, is_verified)
VALUES (
  gen_random_uuid(),
  'Usuario Prueba',
  'https://picsum.photos/200/200?random=1',
  false,
  false
)
ON CONFLICT DO NOTHING;

-- Obtener el ID del perfil de prueba
WITH test_profile AS (
  SELECT id FROM profiles WHERE alias = 'Usuario Prueba' LIMIT 1
)
INSERT INTO posts (user_id, text, image_url)
SELECT 
  test_profile.id,
  '¡Hola! Soy nuevo en la app 🚀',
  'https://picsum.photos/400/300?random=1'
FROM test_profile
WHERE NOT EXISTS (SELECT 1 FROM posts LIMIT 1);

-- Insertar más posts de prueba
WITH test_profile AS (
  SELECT id FROM profiles WHERE alias = 'Usuario Prueba' LIMIT 1
)
INSERT INTO posts (user_id, text, image_url)
SELECT 
  test_profile.id,
  '¿Alguien más le gusta la música? 🎵',
  'https://picsum.photos/400/300?random=2'
FROM test_profile
WHERE (SELECT COUNT(*) FROM posts) < 2;

WITH test_profile AS (
  SELECT id FROM profiles WHERE alias = 'Usuario Prueba' LIMIT 1
)
INSERT INTO posts (user_id, text, image_url)
SELECT 
  test_profile.id,
  'Hermoso día para conocer gente nueva ☀️',
  'https://picsum.photos/400/300?random=3'
FROM test_profile
WHERE (SELECT COUNT(*) FROM posts) < 3;

-- =====================================================
-- VERIFICAR DATOS FINALES
-- =====================================================

-- Verificar posts con perfiles
SELECT 
  p.id,
  p.text,
  p.image_url,
  pr.alias,
  pr.profile_picture_url
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
ORDER BY p.created_at DESC;

-- Contar total de posts
SELECT COUNT(*) as total_posts FROM posts;
