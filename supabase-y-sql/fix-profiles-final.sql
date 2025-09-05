-- 🔧 CORREGIR PROFILES - VERSIÓN FINAL
-- Ejecutar en Supabase SQL Editor

-- =====================================================
-- DIAGNOSTICAR TODAS LAS DEPENDENCIAS
-- =====================================================

-- Verificar todas las tablas que dependen de profiles
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
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
AND ccu.table_name = 'profiles'
ORDER BY tc.table_name;

-- =====================================================
-- SOLUCIÓN: ARREGLAR ESTRUCTURA EXISTENTE
-- =====================================================

-- 1. Eliminar todas las foreign keys que apuntan a profiles
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_user1_id_fkey;
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_user2_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE payment DROP CONSTRAINT IF EXISTS payment_user_id_fkey;
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_user_id_fkey;
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;
ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_created_by_fkey;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
ALTER TABLE comentarios DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE emails DROP CONSTRAINT IF EXISTS emails_user_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_user_id_fkey;

-- 2. Eliminar foreign key problemática de profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 3. Agregar campos faltantes a profiles si no existen
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sexual_orientation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS relationship_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_contacts INTEGER DEFAULT 10;

-- 4. Crear foreign key correcta para profiles.id -> auth.users.id
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =====================================================
-- RECREAR FOREIGN KEYS CORRECTAS
-- =====================================================

-- Posts -> Profiles
ALTER TABLE posts 
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Comentarios -> Profiles
ALTER TABLE comentarios 
ADD CONSTRAINT comentarios_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Likes -> Profiles
ALTER TABLE likes 
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Stories -> Profiles
ALTER TABLE stories 
ADD CONSTRAINT stories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Matches -> Profiles
ALTER TABLE matches 
ADD CONSTRAINT matches_user1_id_fkey 
FOREIGN KEY (user1_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE matches 
ADD CONSTRAINT matches_user2_id_fkey 
FOREIGN KEY (user2_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Messages -> Profiles
ALTER TABLE messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Payment -> Profiles (CORREGIDO: era "pago" antes)
ALTER TABLE payment 
ADD CONSTRAINT payment_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Reports -> Profiles
ALTER TABLE reports 
ADD CONSTRAINT reports_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Ads -> Profiles
ALTER TABLE ads 
ADD CONSTRAINT ads_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Emails -> Profiles
ALTER TABLE emails 
ADD CONSTRAINT emails_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Notifications -> Profiles
ALTER TABLE notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- CREAR PERFIL DE PRUEBA
-- =====================================================

-- Crear un perfil de prueba
INSERT INTO profiles (
  id, 
  alias, 
  profile_picture_url, 
  is_vip, 
  is_verified,
  bio,
  gender
) VALUES (
  gen_random_uuid(),
  'Usuario Prueba',
  'https://picsum.photos/200/200?random=1',
  false,
  false,
  'Usuario de prueba para testing',
  'no-binario'
) ON CONFLICT (alias) DO NOTHING;

-- =====================================================
-- CREAR POSTS DE PRUEBA
-- =====================================================

-- Obtener el ID del perfil de prueba y crear posts
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
-- VERIFICAR RESULTADO FINAL
-- =====================================================

-- Verificar foreign keys creadas
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

-- Contar total de perfiles
SELECT COUNT(*) as total_profiles FROM profiles;
