-- SCRIPT AGRESIVO PARA LIMPIAR TODAS LAS POLÍTICAS RLS
-- Ejecutar en el Editor SQL de Supabase
-- Este script ELIMINA TODAS las políticas existentes y las recrea

-- 1. PRIMERO: Verificar todas las políticas problemáticas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    permissive,
    COUNT(*) OVER (PARTITION BY schemaname, tablename, cmd, roles) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, cmd, policy_count DESC;

-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES (sin importar el nombre)
-- Likes
DROP POLICY IF EXISTS "likes_insert_policy" ON public.likes;
DROP POLICY IF EXISTS "likes_select_policy" ON public.likes;
DROP POLICY IF EXISTS "likes_update_policy" ON public.likes;
DROP POLICY IF EXISTS "likes_delete_policy" ON public.likes;
DROP POLICY IF EXISTS "Los usuarios pueden crear Me gusta" ON public.likes;
DROP POLICY IF EXISTS "Users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Permitir que los usuarios autenticados administren sus propios Me gusta" ON public.likes;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own likes" ON public.likes;

-- Posts
DROP POLICY IF EXISTS "posts_insert_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_select_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_update_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_policy" ON public.posts;
DROP POLICY IF EXISTS "Los usuarios pueden crear publicaciones" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Permitir que los usuarios autenticados administren sus propias publicaciones" ON public.posts;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own posts" ON public.posts;

-- Profiles
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "Los usuarios pueden gestionar su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Permitir que los usuarios autenticados gestionen su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own profile" ON public.profiles;

-- Comentarios
DROP POLICY IF EXISTS "comentarios_insert_policy" ON public.comentarios;
DROP POLICY IF EXISTS "comentarios_select_policy" ON public.comentarios;
DROP POLICY IF EXISTS "comentarios_update_policy" ON public.comentarios;
DROP POLICY IF EXISTS "comentarios_delete_policy" ON public.comentarios;
DROP POLICY IF EXISTS "Los usuarios pueden crear comentarios" ON public.comentarios;
DROP POLICY IF EXISTS "Users can create comments" ON public.comentarios;
DROP POLICY IF EXISTS "Permitir que los usuarios autenticados administren sus propios comentarios" ON public.comentarios;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own comments" ON public.comentarios;

-- Stories
DROP POLICY IF EXISTS "stories_insert_policy" ON public.stories;
DROP POLICY IF EXISTS "stories_select_policy" ON public.stories;
DROP POLICY IF EXISTS "stories_update_policy" ON public.stories;
DROP POLICY IF EXISTS "stories_delete_policy" ON public.stories;
DROP POLICY IF EXISTS "Los usuarios pueden crear historias" ON public.stories;
DROP POLICY IF EXISTS "Users can create stories" ON public.stories;
DROP POLICY IF EXISTS "Permitir que los usuarios autenticados administren sus propias historias" ON public.stories;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own stories" ON public.stories;

-- Matches
DROP POLICY IF EXISTS "matches_insert_policy" ON public.matches;
DROP POLICY IF EXISTS "matches_select_policy" ON public.matches;
DROP POLICY IF EXISTS "matches_update_policy" ON public.matches;
DROP POLICY IF EXISTS "matches_delete_policy" ON public.matches;
DROP POLICY IF EXISTS "Los usuarios pueden gestionar sus coincidencias" ON public.matches;
DROP POLICY IF EXISTS "Users can manage their matches" ON public.matches;
DROP POLICY IF EXISTS "Permitir que los usuarios autenticados gestionen sus coincidencias" ON public.matches;
DROP POLICY IF EXISTS "Allow authenticated users to manage their matches" ON public.matches;

-- Messages
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;
DROP POLICY IF EXISTS "Los usuarios pueden enviar mensajes" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Permitir que los usuarios autenticados envíen mensajes" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to send messages" ON public.messages;

-- Notifications
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;
DROP POLICY IF EXISTS "Los usuarios pueden gestionar sus notificaciones" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Permitir que los usuarios autenticados gestionen sus notificaciones" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated users to manage their notifications" ON public.notifications;

-- 3. ELIMINAR CUALQUIER POLÍTICA RESTANTE CON NOMBRES GENÉRICOS
-- Usar una consulta dinámica para eliminar todas las políticas restantes
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('likes', 'posts', 'profiles', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- 4. CREAR POLÍTICAS OPTIMIZADAS PARA CADA TABLA

-- LIKES
CREATE POLICY "likes_insert_policy" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_select_policy" ON public.likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "likes_update_policy" ON public.likes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_policy" ON public.likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- POSTS
CREATE POLICY "posts_insert_policy" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_select_policy" ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "posts_update_policy" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_delete_policy" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PROFILES
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- COMENTARIOS
CREATE POLICY "comentarios_insert_policy" ON public.comentarios FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "comentarios_select_policy" ON public.comentarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "comentarios_update_policy" ON public.comentarios FOR UPDATE TO authenticated USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "comentarios_delete_policy" ON public.comentarios FOR DELETE TO authenticated USING (auth.uid() = usuario_id);

-- STORIES
CREATE POLICY "stories_insert_policy" ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stories_select_policy" ON public.stories FOR SELECT TO authenticated USING (true);
CREATE POLICY "stories_update_policy" ON public.stories FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stories_delete_policy" ON public.stories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- MATCHES
CREATE POLICY "matches_insert_policy" ON public.matches FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (user1_id, user2_id));
CREATE POLICY "matches_select_policy" ON public.matches FOR SELECT TO authenticated USING (auth.uid() IN (user1_id, user2_id));
CREATE POLICY "matches_update_policy" ON public.matches FOR UPDATE TO authenticated USING (auth.uid() IN (user1_id, user2_id)) WITH CHECK (auth.uid() IN (user1_id, user2_id));
CREATE POLICY "matches_delete_policy" ON public.matches FOR DELETE TO authenticated USING (auth.uid() IN (user1_id, user2_id));

-- MESSAGES
CREATE POLICY "messages_insert_policy" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (sender_id, receiver_id));
CREATE POLICY "messages_select_policy" ON public.messages FOR SELECT TO authenticated USING (auth.uid() IN (sender_id, receiver_id));
CREATE POLICY "messages_update_policy" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_delete_policy" ON public.messages FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- NOTIFICATIONS
CREATE POLICY "notifications_insert_policy" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_select_policy" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_policy" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_delete_policy" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6. VERIFICAR EL RESULTADO FINAL
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    permissive
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, cmd;
