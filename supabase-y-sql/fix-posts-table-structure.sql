-- SCRIPT PARA ARREGLAR LA ESTRUCTURA DE LA TABLA POSTS
-- Ejecutar en el Editor SQL de Supabase
-- Este script asegura que todas las columnas necesarias estén presentes

-- 1. VERIFICAR ESTRUCTURA ACTUAL DE LA TABLA POSTS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'posts'
ORDER BY ordinal_position;

-- 2. AÑADIR COLUMNAS FALTANTES A LA TABLA POSTS
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

-- 3. VERIFICAR ESTRUCTURA FINAL
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'posts'
ORDER BY ordinal_position;

-- 4. VERIFICAR POSTS EXISTENTES
SELECT 
    'POSTS EXISTENTES:' as info,
    COUNT(*) as total_posts
FROM public.posts
UNION ALL
SELECT 
    'POSTS CON CONTENIDO:' as info,
    COUNT(*) as posts_with_content
FROM public.posts
WHERE contenido IS NOT NULL AND contenido != '';

-- 5. MOSTRAR POSTS EXISTENTES
SELECT 
    id,
    user_id,
    contenido,
    imagen_url,
    ubicacion,
    created_at
FROM public.posts
ORDER BY created_at DESC
LIMIT 10;
