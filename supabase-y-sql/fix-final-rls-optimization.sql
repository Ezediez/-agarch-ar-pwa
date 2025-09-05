-- SCRIPT FINAL PARA OPTIMIZAR POLÍTICAS RLS
-- Ejecutar en el Editor SQL de Supabase
-- Este script optimiza las políticas para eliminar las 26 actuaciones restantes

-- 1. PRIMERO: Verificar las políticas actuales y sus condiciones
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('likes', 'posts', 'profiles', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
ORDER BY tablename, cmd;

-- 2. ELIMINAR TODAS LAS POLÍTICAS ACTUALES
-- Likes
DROP POLICY IF EXISTS "likes_insert_policy" ON public.likes;
DROP POLICY IF EXISTS "likes_select_policy" ON public.likes;
DROP POLICY IF EXISTS "likes_update_policy" ON public.likes;
DROP POLICY IF EXISTS "likes_delete_policy" ON public.likes;

-- Posts
DROP POLICY IF EXISTS "posts_insert_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_select_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_update_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_policy" ON public.posts;

-- Profiles
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Comentarios
DROP POLICY IF EXISTS "comentarios_insert_policy" ON public.comentarios;
DROP POLICY IF EXISTS "comentarios_select_policy" ON public.comentarios;
DROP POLICY IF EXISTS "comentarios_update_policy" ON public.comentarios;
DROP POLICY IF EXISTS "comentarios_delete_policy" ON public.comentarios;

-- Stories
DROP POLICY IF EXISTS "stories_insert_policy" ON public.stories;
DROP POLICY IF EXISTS "stories_select_policy" ON public.stories;
DROP POLICY IF EXISTS "stories_update_policy" ON public.stories;
DROP POLICY IF EXISTS "stories_delete_policy" ON public.stories;

-- Matches
DROP POLICY IF EXISTS "matches_insert_policy" ON public.matches;
DROP POLICY IF EXISTS "matches_select_policy" ON public.matches;
DROP POLICY IF EXISTS "matches_update_policy" ON public.matches;
DROP POLICY IF EXISTS "matches_delete_policy" ON public.matches;

-- Messages
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;

-- Notifications
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;

-- 3. CREAR POLÍTICAS ÚNICAS OPTIMIZADAS (UNA POR TABLA Y OPERACIÓN)

-- LIKES - Política única por operación
CREATE POLICY "likes_policy" ON public.likes FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- POSTS - Política única por operación
CREATE POLICY "posts_policy" ON public.posts FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- PROFILES - Política única por operación
CREATE POLICY "profiles_policy" ON public.profiles FOR ALL TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- COMENTARIOS - Política única por operación
CREATE POLICY "comentarios_policy" ON public.comentarios FOR ALL TO authenticated 
USING (auth.uid() = usuario_id) 
WITH CHECK (auth.uid() = usuario_id);

-- STORIES - Política única por operación
CREATE POLICY "stories_policy" ON public.stories FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- MATCHES - Política única por operación
CREATE POLICY "matches_policy" ON public.matches FOR ALL TO authenticated 
USING (auth.uid() IN (user1_id, user2_id)) 
WITH CHECK (auth.uid() IN (user1_id, user2_id));

-- MESSAGES - Política única por operación
CREATE POLICY "messages_policy" ON public.messages FOR ALL TO authenticated 
USING (
    match_id IN (
        SELECT matches.id 
        FROM matches 
        WHERE matches.user1_id = auth.uid() OR matches.user2_id = auth.uid()
    )
) 
WITH CHECK (
    match_id IN (
        SELECT matches.id 
        FROM matches 
        WHERE matches.user1_id = auth.uid() OR matches.user2_id = auth.uid()
    )
);

-- NOTIFICATIONS - Política única por operación
CREATE POLICY "notifications_policy" ON public.notifications FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 4. HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. VERIFICAR EL RESULTADO FINAL
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    permissive
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('likes', 'posts', 'profiles', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
ORDER BY tablename, cmd;

-- 6. CONTAR POLÍTICAS POR TABLA PARA VERIFICAR
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('likes', 'posts', 'profiles', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
GROUP BY tablename
ORDER BY tablename;
