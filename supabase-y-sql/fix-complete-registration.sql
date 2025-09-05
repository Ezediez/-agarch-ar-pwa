-- SCRIPT COMPLETO PARA ARREGLAR EL FORMULARIO DE REGISTRO
-- Ejecutar en el Editor SQL de Supabase
-- Este script arregla todos los problemas del formulario de registro

-- =====================================================
-- PASO 1: ARREGLAR ESTRUCTURA DE LA TABLA PROFILES
-- =====================================================

-- Añadir columnas faltantes a profiles
DO $$
BEGIN
    -- Añadir columna birth_date si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'birth_date') THEN
        ALTER TABLE public.profiles ADD COLUMN birth_date DATE;
        RAISE NOTICE 'Columna "birth_date" añadida a profiles';
    END IF;
    
    -- Añadir columna gender si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'gender') THEN
        ALTER TABLE public.profiles ADD COLUMN gender TEXT;
        RAISE NOTICE 'Columna "gender" añadida a profiles';
    END IF;
    
    -- Añadir columna sexual_orientation si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'sexual_orientation') THEN
        ALTER TABLE public.profiles ADD COLUMN sexual_orientation TEXT;
        RAISE NOTICE 'Columna "sexual_orientation" añadida a profiles';
    END IF;
    
    -- Añadir columna relationship_status si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'relationship_status') THEN
        ALTER TABLE public.profiles ADD COLUMN relationship_status TEXT;
        RAISE NOTICE 'Columna "relationship_status" añadida a profiles';
    END IF;
    
    -- Añadir columna interests si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'interests') THEN
        ALTER TABLE public.profiles ADD COLUMN interests TEXT[];
        RAISE NOTICE 'Columna "interests" añadida a profiles';
    END IF;
    
    -- Añadir columna profile_picture_url si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'profile_picture_url') THEN
        ALTER TABLE public.profiles ADD COLUMN profile_picture_url TEXT;
        RAISE NOTICE 'Columna "profile_picture_url" añadida a profiles';
    END IF;
    
    -- Añadir columna is_vip si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_vip') THEN
        ALTER TABLE public.profiles ADD COLUMN is_vip BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Columna "is_vip" añadida a profiles';
    END IF;
    
    -- Añadir columna is_verified si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Columna "is_verified" añadida a profiles';
    END IF;
    
    -- Añadir columna monthly_contacts si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'monthly_contacts') THEN
        ALTER TABLE public.profiles ADD COLUMN monthly_contacts INTEGER DEFAULT 10;
        RAISE NOTICE 'Columna "monthly_contacts" añadida a profiles';
    END IF;
    
    -- Añadir columna created_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna "created_at" añadida a profiles';
    END IF;
    
    -- Añadir columna updated_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna "updated_at" añadida a profiles';
    END IF;
END $$;

-- =====================================================
-- PASO 2: ARREGLAR ESTRUCTURA DE LA TABLA POSTS
-- =====================================================

-- Añadir columnas faltantes a posts
DO $$
BEGIN
    -- Añadir columna contenido si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'contenido') THEN
        ALTER TABLE public.posts ADD COLUMN contenido TEXT;
        RAISE NOTICE 'Columna "contenido" añadida a posts';
    END IF;
    
    -- Añadir columna imagen_url si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'imagen_url') THEN
        ALTER TABLE public.posts ADD COLUMN imagen_url TEXT;
        RAISE NOTICE 'Columna "imagen_url" añadida a posts';
    END IF;
    
    -- Añadir columna ubicacion si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'ubicacion') THEN
        ALTER TABLE public.posts ADD COLUMN ubicacion TEXT;
        RAISE NOTICE 'Columna "ubicacion" añadida a posts';
    END IF;
    
    -- Añadir columna user_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'user_id') THEN
        ALTER TABLE public.posts ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Columna "user_id" añadida a posts';
    END IF;
    
    -- Añadir columna created_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'created_at') THEN
        ALTER TABLE public.posts ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna "created_at" añadida a posts';
    END IF;
    
    -- Añadir columna updated_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'updated_at') THEN
        ALTER TABLE public.posts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna "updated_at" añadida a posts';
    END IF;
    
    -- Añadir columna id si no existe (primary key)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'id') THEN
        ALTER TABLE public.posts ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
        RAISE NOTICE 'Columna "id" añadida a posts';
    END IF;
END $$;

-- =====================================================
-- PASO 3: CREAR PERFILES FALTANTES
-- =====================================================

-- Crear perfiles para usuarios que no los tengan
INSERT INTO public.profiles (
    id,
    alias,
    bio,
    birth_date,
    gender,
    sexual_orientation,
    relationship_status,
    interests,
    profile_picture_url,
    is_vip,
    is_verified,
    monthly_contacts,
    created_at,
    updated_at
)
SELECT 
    u.id,
    COALESCE(
        SPLIT_PART(u.email, '@', 1), 
        'usuario_' || SUBSTRING(u.id::text, 1, 8)
    ) as alias,
    'Usuario de AGARCH-AR 👋' as bio,
    NULL as birth_date,
    NULL as gender,
    NULL as sexual_orientation,
    NULL as relationship_status,
    ARRAY[]::TEXT[] as interests,
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400' as profile_picture_url,
    FALSE as is_vip,
    FALSE as is_verified,
    10 as monthly_contacts,
    u.created_at,
    NOW() as updated_at
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PASO 4: VERIFICAR CONFIGURACIÓN
-- =====================================================

-- Verificar estructura de profiles
SELECT 
    'ESTRUCTURA PROFILES:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar estructura de posts
SELECT 
    'ESTRUCTURA POSTS:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'posts'
ORDER BY ordinal_position;

-- Verificar perfiles creados
SELECT 
    'PERFILES CREADOS:' as info,
    COUNT(*) as total_profiles
FROM public.profiles
UNION ALL
SELECT 
    'USUARIOS SIN PERFILES:' as info,
    COUNT(*) as users_without_profiles
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Mostrar perfiles existentes
SELECT 
    'PERFILES EXISTENTES:' as info,
    id,
    alias,
    bio,
    gender,
    birth_date,
    created_at,
    is_vip,
    is_verified
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;












