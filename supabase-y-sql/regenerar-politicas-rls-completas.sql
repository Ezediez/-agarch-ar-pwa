-- REGENERAR TODAS LAS POLÍTICAS RLS CORRECTAMENTE
-- Script completo para configurar RLS de forma óptima

begin;

-- =====================================================
-- 1. HABILITAR RLS EN TODAS LAS TABLAS PRINCIPALES
-- =====================================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- =====================================================

-- Posts
DROP POLICY IF EXISTS posts_policy ON public.posts;
DROP POLICY IF EXISTS posts_select_policy ON public.posts;
DROP POLICY IF EXISTS posts_insert_policy ON public.posts;
DROP POLICY IF EXISTS posts_update_policy ON public.posts;
DROP POLICY IF EXISTS posts_delete_policy ON public.posts;

-- Profiles  
DROP POLICY IF EXISTS profiles_policy ON public.profiles;
DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_policy ON public.profiles;
DROP POLICY IF EXISTS profiles_update_policy ON public.profiles;
DROP POLICY IF EXISTS profiles_delete_policy ON public.profiles;

-- Messages
DROP POLICY IF EXISTS messages_policy ON public.messages;
DROP POLICY IF EXISTS messages_select_policy ON public.messages;
DROP POLICY IF EXISTS messages_insert_policy ON public.messages;
DROP POLICY IF EXISTS messages_update_policy ON public.messages;
DROP POLICY IF EXISTS messages_delete_policy ON public.messages;

-- Post Likes
DROP POLICY IF EXISTS post_likes_select_policy ON public.post_likes;
DROP POLICY IF EXISTS post_likes_insert_policy ON public.post_likes;
DROP POLICY IF EXISTS post_likes_delete_policy ON public.post_likes;

-- User Likes
DROP POLICY IF EXISTS user_likes_select_policy ON public.user_likes;
DROP POLICY IF EXISTS user_likes_insert_policy ON public.user_likes;
DROP POLICY IF EXISTS user_likes_delete_policy ON public.user_likes;

-- Stories
DROP POLICY IF EXISTS stories_policy ON public.stories;
DROP POLICY IF EXISTS stories_select_policy ON public.stories;
DROP POLICY IF EXISTS stories_insert_policy ON public.stories;
DROP POLICY IF EXISTS stories_update_policy ON public.stories;
DROP POLICY IF EXISTS stories_delete_policy ON public.stories;

-- Notifications
DROP POLICY IF EXISTS notifications_policy ON public.notifications;
DROP POLICY IF EXISTS notifications_select_policy ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_policy ON public.notifications;
DROP POLICY IF EXISTS notifications_update_policy ON public.notifications;
DROP POLICY IF EXISTS notifications_delete_policy ON public.notifications;

-- Comentarios
DROP POLICY IF EXISTS comentarios_select_policy ON public.comentarios;
DROP POLICY IF EXISTS comentarios_insert_policy ON public.comentarios;
DROP POLICY IF EXISTS comentarios_update_policy ON public.comentarios;
DROP POLICY IF EXISTS comentarios_delete_policy ON public.comentarios;

-- =====================================================
-- 3. CREAR POLÍTICAS OPTIMIZADAS (CON SELECT auth.uid())
-- =====================================================

-- POSTS - Todos pueden ver, solo dueño puede crear/editar/borrar
CREATE POLICY posts_select_policy ON public.posts 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY posts_insert_policy ON public.posts 
    FOR INSERT TO authenticated 
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY posts_update_policy ON public.posts 
    FOR UPDATE TO authenticated 
    USING ((SELECT auth.uid()) = user_id) 
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY posts_delete_policy ON public.posts 
    FOR DELETE TO authenticated 
    USING ((SELECT auth.uid()) = user_id);

-- PROFILES - Todos pueden ver, solo dueño puede editar
CREATE POLICY profiles_select_policy ON public.profiles 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY profiles_insert_policy ON public.profiles 
    FOR INSERT TO authenticated 
    WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY profiles_update_policy ON public.profiles 
    FOR UPDATE TO authenticated 
    USING ((SELECT auth.uid()) = id) 
    WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY profiles_delete_policy ON public.profiles 
    FOR DELETE TO authenticated 
    USING ((SELECT auth.uid()) = id);

-- MESSAGES - Solo participantes pueden ver/crear/editar
CREATE POLICY messages_select_policy ON public.messages 
    FOR SELECT TO authenticated 
    USING ((SELECT auth.uid()) = sender_id OR (SELECT auth.uid()) = recipient_id);

CREATE POLICY messages_insert_policy ON public.messages 
    FOR INSERT TO authenticated 
    WITH CHECK ((SELECT auth.uid()) = sender_id);

CREATE POLICY messages_update_policy ON public.messages 
    FOR UPDATE TO authenticated 
    USING ((SELECT auth.uid()) = sender_id) 
    WITH CHECK ((SELECT auth.uid()) = sender_id);

CREATE POLICY messages_delete_policy ON public.messages 
    FOR DELETE TO authenticated 
    USING ((SELECT auth.uid()) = sender_id);

-- POST_LIKES - Todos pueden ver, solo dueño puede crear/borrar
CREATE POLICY post_likes_select_policy ON public.post_likes 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY post_likes_insert_policy ON public.post_likes 
    FOR INSERT TO authenticated 
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY post_likes_delete_policy ON public.post_likes 
    FOR DELETE TO authenticated 
    USING ((SELECT auth.uid()) = user_id);

-- USER_LIKES - Solo dueño puede ver/crear/borrar
CREATE POLICY user_likes_select_policy ON public.user_likes 
    FOR SELECT TO authenticated 
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY user_likes_insert_policy ON public.user_likes 
    FOR INSERT TO authenticated 
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY user_likes_delete_policy ON public.user_likes 
    FOR DELETE TO authenticated 
    USING ((SELECT auth.uid()) = user_id);

-- STORIES - Todos pueden ver, solo dueño puede crear/editar/borrar
CREATE POLICY stories_select_policy ON public.stories 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY stories_insert_policy ON public.stories 
    FOR INSERT TO authenticated 
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY stories_update_policy ON public.stories 
    FOR UPDATE TO authenticated 
    USING ((SELECT auth.uid()) = user_id) 
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY stories_delete_policy ON public.stories 
    FOR DELETE TO authenticated 
    USING ((SELECT auth.uid()) = user_id);

-- NOTIFICATIONS - Solo dueño puede ver/crear/editar/borrar
CREATE POLICY notifications_select_policy ON public.notifications 
    FOR SELECT TO authenticated 
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY notifications_insert_policy ON public.notifications 
    FOR INSERT TO authenticated 
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY notifications_update_policy ON public.notifications 
    FOR UPDATE TO authenticated 
    USING ((SELECT auth.uid()) = user_id) 
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY notifications_delete_policy ON public.notifications 
    FOR DELETE TO authenticated 
    USING ((SELECT auth.uid()) = user_id);

-- COMENTARIOS - Todos pueden ver, solo dueño puede crear/editar/borrar
CREATE POLICY comentarios_select_policy ON public.comentarios 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY comentarios_insert_policy ON public.comentarios 
    FOR INSERT TO authenticated 
    WITH CHECK ((SELECT auth.uid()) = usuario_id);

CREATE POLICY comentarios_update_policy ON public.comentarios 
    FOR UPDATE TO authenticated 
    USING ((SELECT auth.uid()) = usuario_id) 
    WITH CHECK ((SELECT auth.uid()) = usuario_id);

CREATE POLICY comentarios_delete_policy ON public.comentarios 
    FOR DELETE TO authenticated 
    USING ((SELECT auth.uid()) = usuario_id);

commit;
