-- SCRIPT PARA ARREGLAR FUNCIONES SIN SECURITY DEFINER
-- Ejecutar en el Editor SQL de Supabase
-- Este script arregla las 8 funciones que causan alertas de seguridad

-- =====================================================
-- PASO 1: IDENTIFICAR FUNCIONES SIN SECURITY DEFINER
-- =====================================================

-- Listar todas las funciones sin SECURITY DEFINER
SELECT 
    'FUNCIONES SIN SECURITY DEFINER:' as info,
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prosecdef = false
    AND p.prokind = 'f'
ORDER BY p.proname;

-- =====================================================
-- PASO 2: ARREGLAR FUNCIÓN update_updated_at_column
-- =====================================================

-- Recrear la función update_updated_at_column con SECURITY DEFINER
DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = public, auth;

-- =====================================================
-- PASO 3: ARREGLAR FUNCIÓN search_users
-- =====================================================

-- Recrear la función search_users con SECURITY DEFINER
DROP FUNCTION IF EXISTS search_users(user_id UUID, lat DECIMAL, lng DECIMAL, radius_km INTEGER, interests TEXT[], gender TEXT, looking_for TEXT[]);

CREATE OR REPLACE FUNCTION search_users(
  user_id UUID,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  radius_km INTEGER DEFAULT 50,
  interests TEXT[] DEFAULT NULL,
  gender TEXT DEFAULT NULL,
  looking_for TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  alias TEXT,
  full_name TEXT,
  bio TEXT,
  photos TEXT[],
  distance_km DECIMAL(10, 2),
  common_interests INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.alias,
    p.full_name,
    p.bio,
    p.photos,
    (
      6371 * acos(
        cos(radians(lat)) * 
        cos(radians(p.location_lat)) * 
        cos(radians(p.location_lng) - radians(lng)) + 
        sin(radians(lat)) * 
        sin(radians(p.location_lat))
      )
    )::DECIMAL(10, 2) as distance_km,
    (
      SELECT COUNT(*)::INTEGER
      FROM unnest(p.interests) AS interest
      WHERE interest = ANY(interests)
    ) as common_interests
  FROM profiles p
  WHERE p.id != user_id
    AND p.id NOT IN (
      SELECT CASE 
        WHEN user1_id = user_id THEN user2_id
        ELSE user1_id
      END
      FROM matches
      WHERE user1_id = user_id OR user2_id = user_id
    )
    AND (gender IS NULL OR p.gender = gender)
    AND (looking_for IS NULL OR p.gender = ANY(looking_for))
  ORDER BY common_interests DESC, distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- =====================================================
-- PASO 4: ARREGLAR FUNCIÓN get_posts_with_counts
-- =====================================================

-- Recrear la función get_posts_with_counts con SECURITY DEFINER
DROP FUNCTION IF EXISTS get_posts_with_counts();

CREATE OR REPLACE FUNCTION get_posts_with_counts()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  contenido TEXT,
  imagen_url TEXT,
  ubicacion TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  like_count BIGINT,
  comment_count BIGINT,
  user_alias TEXT,
  user_profile_picture_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.contenido,
    p.imagen_url,
    p.ubicacion,
    p.created_at,
    p.updated_at,
    COALESCE(l.like_count, 0) as like_count,
    COALESCE(c.comment_count, 0) as comment_count,
    pr.alias as user_alias,
    pr.profile_picture_url as user_profile_picture_url
  FROM posts p
  LEFT JOIN (
    SELECT post_id, COUNT(*) as like_count
    FROM likes
    GROUP BY post_id
  ) l ON p.id = l.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as comment_count
    FROM comentarios
    GROUP BY post_id
  ) c ON p.id = c.post_id
  LEFT JOIN profiles pr ON p.user_id = pr.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- =====================================================
-- PASO 5: ARREGLAR FUNCIÓN get_nearby_profiles
-- =====================================================

-- Recrear la función get_nearby_profiles con SECURITY DEFINER
DROP FUNCTION IF EXISTS get_nearby_profiles(user_lat DECIMAL, user_lng DECIMAL, radius_km INTEGER);

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
  distance_km DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.alias,
    p.bio,
    p.profile_picture_url,
    (
      6371 * acos(
        cos(radians(user_lat)) * 
        cos(radians(p.location_lat)) * 
        cos(radians(p.location_lng) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(p.location_lat))
      )
    )::DECIMAL(10, 2) as distance_km
  FROM profiles p
  WHERE p.location_lat IS NOT NULL 
    AND p.location_lng IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat)) * 
        cos(radians(p.location_lat)) * 
        cos(radians(p.location_lng) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(p.location_lat))
      )
    ) <= radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- =====================================================
-- PASO 6: VERIFICAR FUNCIONES ARREGLADAS
-- =====================================================

-- Verificar que las funciones ahora tienen SECURITY DEFINER
SELECT 
    'FUNCIONES CON SECURITY DEFINER:' as info,
    n.nspname as schema_name,
    p.proname as function_name,
    p.prosecdef as security_definer,
    p.proconfig as search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.prokind = 'f'
ORDER BY p.proname;

-- Verificar que no quedan funciones sin SECURITY DEFINER
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
