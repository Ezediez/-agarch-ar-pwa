-- 🗄️ SCRIPTS SQL PARA CONFIGURAR SUPABASE AGARCH-AR
-- Ejecutar en el SQL Editor de Supabase

-- =====================================================
-- 1. CREAR TABLAS PRINCIPALES
-- =====================================================

-- Tabla de perfiles de usuario
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
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
  PRIMARY KEY (id)
);

-- Tabla de matches entre usuarios
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Tabla de mensajes de chat
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'location')),
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para almacenar tokens de notificación push
CREATE TABLE push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('android', 'ios', 'web')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- =====================================================
-- 2. CREAR FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at 
    BEFORE UPDATE ON matches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_tokens_updated_at 
    BEFORE UPDATE ON push_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. CREAR ÍNDICES PARA MEJOR RENDIMIENTO
-- =====================================================

CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_profiles_location ON profiles(location_lat, location_lng);
CREATE INDEX idx_profiles_last_active ON profiles(last_active);
CREATE INDEX idx_matches_users ON matches(user1_id, user2_id);

-- =====================================================
-- 4. FUNCIÓN PARA BÚSQUEDA DE USUARIOS
-- =====================================================

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
    AND (
      6371 * acos(
        cos(radians(lat)) * 
        cos(radians(p.location_lat)) * 
        cos(radians(p.location_lng) - radians(lng)) + 
        sin(radians(lat)) * 
        sin(radians(p.location_lat))
      )
    ) <= radius_km
    AND (gender IS NULL OR p.gender = gender)
    AND (looking_for IS NULL OR p.gender = ANY(looking_for))
  ORDER BY common_interests DESC, distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREAR POLÍTICAS DE SEGURIDAD
-- =====================================================

-- Políticas para Profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view public profiles" ON profiles
  FOR SELECT USING (true);

-- Políticas para Matches
CREATE POLICY "Users can view own matches" ON matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create matches" ON matches
  FOR INSERT WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Users can update own matches" ON matches
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Políticas para Messages
CREATE POLICY "Users can view match messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE id = messages.match_id 
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE id = messages.match_id 
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- Políticas para Push Tokens
CREATE POLICY "Users can manage own push tokens" ON push_tokens
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 7. INSERTAR DATOS DE PRUEBA (OPCIONAL)
-- =====================================================

-- Comentar estas líneas si no quieres datos de prueba
/*
INSERT INTO profiles (id, alias, full_name, bio, gender, interests) VALUES
  (gen_random_uuid(), 'test_user1', 'Usuario Prueba 1', 'Usuario de prueba para testing', 'male', ARRAY['música', 'deportes']),
  (gen_random_uuid(), 'test_user2', 'Usuario Prueba 2', 'Usuario de prueba para testing', 'female', ARRAY['arte', 'viajes']);
*/

-- =====================================================
-- 8. VERIFICAR CONFIGURACIÓN
-- =====================================================

-- Verificar que las tablas se crearon
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'matches', 'messages', 'push_tokens');

-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'matches', 'messages', 'push_tokens');

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- =====================================================
-- ✅ CONFIGURACIÓN COMPLETADA
-- =====================================================

-- Ahora puedes:
-- 1. Configurar las variables de entorno en tu app
-- 2. Probar la conexión con Supabase
-- 3. Crear usuarios de prueba
-- 4. Probar las funcionalidades de búsqueda y matching
