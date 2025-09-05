-- TEST SIMPLE: Ver posts existentes
SELECT count(*) as total_posts FROM public.posts;

-- Ver últimos 3 posts
SELECT id, user_id, text, created_at FROM public.posts ORDER BY created_at DESC LIMIT 3;
