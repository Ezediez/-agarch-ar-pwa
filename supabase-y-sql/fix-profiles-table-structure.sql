-- SCRIPT PARA ARREGLAR LA ESTRUCTURA DE LA TABLA PROFILES
-- Ejecutar en el Editor SQL de Supabase
-- Este script asegura que todas las columnas necesarias estén presentes

-- 1. VERIFICAR ESTRUCTURA ACTUAL DE LA TABLA PROFILES
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. AÑADIR COLUMNAS FALTANTES A LA TABLA PROFILES
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
    
    -- Añadir columna edad si no existe (para compatibilidad)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'edad') THEN
        ALTER TABLE public.profiles ADD COLUMN edad INTEGER;
        RAISE NOTICE 'Columna "edad" añadida a profiles';
    END IF;
    
    -- Añadir columna genero si no existe (para compatibilidad)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'genero') THEN
        ALTER TABLE public.profiles ADD COLUMN genero TEXT;
        RAISE NOTICE 'Columna "genero" añadida a profiles';
    END IF;
    
    -- Añadir columna ubicacion si no existe (para compatibilidad)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ubicacion') THEN
        ALTER TABLE public.profiles ADD COLUMN ubicacion TEXT;
        RAISE NOTICE 'Columna "ubicacion" añadida a profiles';
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

-- 3. VERIFICAR ESTRUCTURA FINAL
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. VERIFICAR QUE LOS USUARIOS EXISTENTES TIENEN PERFILES
SELECT 
    'USUARIOS CON PERFILES:' as info,
    COUNT(*) as total_profiles
FROM public.profiles
UNION ALL
SELECT 
    'USUARIOS SIN PERFILES:' as info,
    COUNT(*) as total_users_without_profiles
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- 5. MOSTRAR PERFILES EXISTENTES
SELECT 
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
LIMIT 10;
