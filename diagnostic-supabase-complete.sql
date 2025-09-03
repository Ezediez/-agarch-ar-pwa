-- DIAGNÓSTICO COMPLETO DE SUPABASE
-- Ejecuta este script y pégame todos los resultados

-- 1) VERIFICAR POSTS CREADOS
SELECT 
    'POSTS EXISTENTES' as diagnostico,
    count(*) as total_posts,
    max(created_at) as ultimo_post
FROM public.posts;

-- 2) VER ÚLTIMOS 5 POSTS CON DETALLES
SELECT 
    'ÚLTIMOS 5 POSTS' as diagnostico,
    p.id,
    p.user_id,
    p.text,
    p.image_url,
    p.video_url,
    p.created_at,
    pr.alias as autor
FROM public.posts p
LEFT JOIN public.profiles pr ON p.user_id = pr.id
ORDER BY p.created_at DESC
LIMIT 5;

-- 3) VERIFICAR POLÍTICAS RLS EN POSTS
SELECT 
    'POLÍTICAS RLS POSTS' as diagnostico,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'posts';

-- 4) VERIFICAR SI RLS ESTÁ HABILITADO
SELECT 
    'RLS HABILITADO' as diagnostico,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('posts', 'profiles', 'post_likes', 'comentarios');

-- 5) VERIFICAR REALTIME EN POSTS
SELECT 
    'REALTIME POSTS' as diagnostico,
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('posts', 'post_likes', 'comentarios');

-- 6) VERIFICAR STORAGE BUCKETS
SELECT 
    'STORAGE BUCKETS' as diagnostico,
    name as bucket_name,
    public,
    created_at
FROM storage.buckets;

-- 7) VERIFICAR POLÍTICAS DE STORAGE
SELECT 
    'POLÍTICAS STORAGE' as diagnostico,
    bucket_id,
    name as policy_name,
    definition
FROM storage.policies;

-- 8) VERIFICAR ARCHIVOS EN STORAGE (últimos 10)
SELECT 
    'ARCHIVOS STORAGE' as diagnostico,
    bucket_id,
    name as file_path,
    metadata->>'size' as file_size,
    created_at
FROM storage.objects 
ORDER BY created_at DESC 
LIMIT 10;
