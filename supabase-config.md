# 🗄️ CONFIGURACIÓN SUPABASE PARA AGARCH-AR

## 🔐 **CREDENCIALES ACTUALES**

- **Usuario**: zequieldiez@hotmail.com
- **Clave**: Koi.2025
- **Proyecto**: RED SOCIAL AGARCHAR
- **URL**: https://agarch-ar.com

## 📱 **CONFIGURACIÓN PARA APP MÓVIL**

### **1. VARIABLES DE ENTORNO**

#### **A. Archivo .env**
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
VITE_APP_NAME=AGARCH-AR
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# API Endpoints
VITE_API_BASE_URL=https://agarch-ar.com/api
VITE_WS_URL=wss://agarch-ar.com/ws
```

#### **B. Archivo .env.local (desarrollo)**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENVIRONMENT=development
```

### **2. CONFIGURACIÓN SUPABASE CLIENT**

#### **A. src/lib/supabase.js**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Configuración para app móvil
export const mobileConfig = {
  // Cache local para offline
  storage: {
    getItem: (key) => {
      try {
        return localStorage.getItem(key)
      } catch (error) {
        console.error('Error getting item from storage:', error)
        return null
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value)
      } catch (error) {
        console.error('Error setting item in storage:', error)
      }
    },
    removeItem: (key) => {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.error('Error removing item from storage:', error)
      }
    }
  }
}
```

### **3. TABLAS SQL PRINCIPALES**

#### **A. Tabla de Usuarios**
```sql
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

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

#### **B. Tabla de Matches**
```sql
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

-- Trigger para updated_at
CREATE TRIGGER update_matches_updated_at 
    BEFORE UPDATE ON matches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

#### **C. Tabla de Mensajes**
```sql
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

-- Índices para mejor rendimiento
CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
```

### **4. POLÍTICAS DE SEGURIDAD RLS**

#### **A. Habilitar RLS**
```sql
-- Habilitar Row Level Security en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

#### **B. Políticas para Profiles**
```sql
-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Usuarios pueden ver perfiles públicos (para búsqueda)
CREATE POLICY "Users can view public profiles" ON profiles
  FOR SELECT USING (true);
```

#### **C. Políticas para Matches**
```sql
-- Usuarios pueden ver matches donde participan
CREATE POLICY "Users can view own matches" ON matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Usuarios pueden crear matches
CREATE POLICY "Users can create matches" ON matches
  FOR INSERT WITH CHECK (auth.uid() = user1_id);

-- Usuarios pueden actualizar matches donde participan
CREATE POLICY "Users can update own matches" ON matches
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);
```

#### **D. Políticas para Messages**
```sql
-- Usuarios pueden ver mensajes de sus matches
CREATE POLICY "Users can view match messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE id = messages.match_id 
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- Usuarios pueden enviar mensajes en sus matches
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE id = messages.match_id 
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );
```

### **5. FUNCIONES UTILITARIAS**

#### **A. Función para Búsqueda de Usuarios**
```sql
-- Función para buscar usuarios por ubicación e intereses
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
```

### **6. CONFIGURACIÓN PARA NOTIFICACIONES PUSH**

#### **A. Tabla de Tokens de Dispositivo**
```sql
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

-- Trigger para updated_at
CREATE TRIGGER update_push_tokens_updated_at 
    BEFORE UPDATE ON push_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### **7. BACKUP Y MIGRACIÓN**

#### **A. Script de Backup**
```bash
#!/bin/bash
# backup-supabase.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR

# Backup de la base de datos
pg_dump "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" \
  --clean --if-exists --quote-all-identifiers \
  --no-owner --no-privileges \
  > "$BACKUP_DIR/supabase_backup_$DATE.sql"

echo "Backup completado: supabase_backup_$DATE.sql"
```

## 🔒 **SEGURIDAD Y COMPLIANCE**

### **1. GDPR Compliance**
- Implementar borrado de datos
- Exportación de datos del usuario
- Consentimiento explícito

### **2. Encriptación**
- Datos sensibles encriptados
- Conexiones HTTPS obligatorias
- Tokens JWT seguros

### **3. Auditoría**
- Logs de acceso
- Historial de cambios
- Monitoreo de actividad sospechosa

## 📊 **MONITOREO Y ANALYTICS**

### **1. Métricas Clave**
- Usuarios activos diarios/mensuales
- Tasa de matches exitosos
- Tiempo promedio de respuesta
- Retención de usuarios

### **2. Alertas**
- Errores de base de datos
- Latencia alta
- Uso excesivo de recursos
- Intentos de acceso no autorizado
