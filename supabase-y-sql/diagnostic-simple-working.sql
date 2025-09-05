-- DIAGNÓSTICO SIMPLE QUE FUNCIONA
-- Ejecuta este script completo

-- 1) POSTS EXISTENTES
SELECT 
    'POSTS EXISTENTES' as diagnostico,
    count(*) as total_posts,
    max(created_at) as ultimo_post
FROM public.posts;

-- 2) ÚLTIMOS 5 POSTS CON DETALLES
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

-- 3) POLÍTICAS RLS EN POSTS (después del fix)
SELECT 
    'POLÍTICAS RLS POSTS' as diagnostico,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'posts';

-- 4) STORAGE BUCKETS
SELECT 
    'STORAGE BUCKETS' as diagnostico,
    name as bucket_name,
    public,
    created_at
FROM storage.buckets;
