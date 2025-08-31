-- 🔧 CORREGIR FOREIGN KEY DE PROFILES
-- Ejecutar en Supabase SQL Editor

-- =====================================================
-- DIAGNOSTICAR EL PROBLEMA
-- =====================================================

-- Verificar la estructura actual de profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar constraints existentes en profiles
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
LEFT JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'profiles' 
AND tc.table_schema = 'public';

-- =====================================================
-- CORREGIR LA ESTRUCTURA DE PROFILES
-- =====================================================

-- Eliminar constraint problemático si existe
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Verificar si profiles.id es PRIMARY KEY
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey;

-- Recrear la tabla profiles con la estructura correcta
-- Primero hacer backup de datos existentes
CREATE TABLE IF NOT EXISTS profiles_backup AS 
SELECT * FROM profiles;

-- Eliminar tabla profiles
DROP TABLE IF EXISTS profiles CASCADE;

-- Recrear tabla profiles con estructura correcta
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  alias TEXT UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  birth_date DATE,
  gender TEXT,
  looking_for TEXT[],
  interests TEXT[],
  photos TEXT[],
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Campos adicionales que agregamos antes
  profile_picture_url TEXT,
  location TEXT,
  sexual_orientation TEXT,
  relationship_status TEXT,
  is_vip BOOLEAN DEFAULT FALSE,
  monthly_contacts INTEGER DEFAULT 10
);

-- =====================================================
-- RECREAR FOREIGN KEYS CORRECTAS
-- =====================================================

-- Posts -> Profiles (user_id debe ser UUID de auth.users)
ALTER TABLE posts 
DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

ALTER TABLE posts 
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Comentarios -> Profiles
ALTER TABLE comentarios 
DROP CONSTRAINT IF EXISTS comentarios_usuario_id_fkey;

ALTER TABLE comentarios 
ADD CONSTRAINT comentarios_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Likes -> Profiles
ALTER TABLE likes 
DROP CONSTRAINT IF EXISTS likes_user_id_fkey;

ALTER TABLE likes 
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Stories -> Profiles
ALTER TABLE stories 
DROP CONSTRAINT IF EXISTS stories_user_id_fkey;

ALTER TABLE stories 
ADD CONSTRAINT stories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- RECREAR ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_alias ON profiles(alias);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_sexual_orientation ON profiles(sexual_orientation);

-- =====================================================
-- RECREAR TRIGGERS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para profiles
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RECREAR POLÍTICAS RLS
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view public profiles" ON profiles
  FOR SELECT USING (true);

-- =====================================================
-- CREAR PERFIL DE PRUEBA
-- =====================================================

-- Crear un usuario de prueba en auth.users (esto se hace automáticamente al registrarse)
-- Por ahora, insertar un perfil de prueba con un UUID válido
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

-- Verificar estructura de profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar foreign keys
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
AND tc.table_name IN ('posts', 'comentarios', 'likes', 'stories', 'profiles')
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
