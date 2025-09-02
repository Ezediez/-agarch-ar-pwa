-- SCRIPT PARA CREAR PERFILES FALTANTES
-- Ejecutar en el Editor SQL de Supabase
-- Este script crea perfiles para usuarios que no los tengan

-- 1. VERIFICAR USUARIOS SIN PERFILES
SELECT 
    'USUARIOS SIN PERFILES:' as info,
    COUNT(*) as total_users_without_profiles
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- 2. MOSTRAR USUARIOS SIN PERFILES
SELECT 
    u.id,
    u.email,
    u.created_at as user_created_at
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ORDER BY u.created_at DESC;

-- 3. CREAR PERFILES FALTANTES
INSERT INTO public.profiles (
    id,
    alias,
    bio,
    birth_date,
    gender,
    sexual_orientation,
    relationship_status,
    interests,
    edad,
    genero,
    ubicacion,
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
    NULL as edad,
    NULL as genero,
    'Argentina' as ubicacion,
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400' as profile_picture_url,
    FALSE as is_vip,
    FALSE as is_verified,
    10 as monthly_contacts,
    u.created_at,
    NOW() as updated_at
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- 4. VERIFICAR PERFILES CREADOS
SELECT 
    'PERFILES CREADOS:' as info,
    COUNT(*) as total_profiles
FROM public.profiles
UNION ALL
SELECT 
    'PERFILES CON ALIAS:' as info,
    COUNT(*) as profiles_with_alias
FROM public.profiles
WHERE alias IS NOT NULL AND alias != '';

-- 5. MOSTRAR PERFILES RECIÉN CREADOS
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

-- 6. VERIFICAR QUE NO QUEDEN USUARIOS SIN PERFILES
SELECT 
    'VERIFICACIÓN FINAL:' as info,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Todos los usuarios tienen perfiles'
        ELSE '❌ Aún hay usuarios sin perfiles: ' || COUNT(*)::TEXT
    END as status
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);
