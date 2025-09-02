-- SCRIPT PARA RESOLVER LAS 8 ALERTAS DE RLS
-- Ejecutar en el Editor SQL de Supabase
-- Este script habilita RLS en todas las tablas públicas

-- 1. VERIFICAR TABLAS SIN RLS HABILITADO
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'posts', 'likes', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
ORDER BY tablename;

-- 2. HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. CREAR POLÍTICAS RLS BÁSICAS PARA CADA TABLA

-- PROFILES - Política única para todas las operaciones
CREATE POLICY "profiles_policy" ON public.profiles FOR ALL TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- POSTS - Política única para todas las operaciones
CREATE POLICY "posts_policy" ON public.posts FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- LIKES - Política única para todas las operaciones
CREATE POLICY "likes_policy" ON public.likes FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- COMENTARIOS - Política única para todas las operaciones
CREATE POLICY "comentarios_policy" ON public.comentarios FOR ALL TO authenticated 
USING (auth.uid() = usuario_id) 
WITH CHECK (auth.uid() = usuario_id);

-- STORIES - Política única para todas las operaciones
CREATE POLICY "stories_policy" ON public.stories FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- MATCHES - Política única para todas las operaciones
CREATE POLICY "matches_policy" ON public.matches FOR ALL TO authenticated 
USING (auth.uid() IN (user1_id, user2_id)) 
WITH CHECK (auth.uid() IN (user1_id, user2_id));

-- MESSAGES - Política única para todas las operaciones
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

-- NOTIFICATIONS - Política única para todas las operaciones
CREATE POLICY "notifications_policy" ON public.notifications FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 4. VERIFICAR QUE RLS ESTÁ HABILITADO
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'posts', 'likes', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
ORDER BY tablename;

-- 5. VERIFICAR POLÍTICAS CREADAS
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    permissive
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'posts', 'likes', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
ORDER BY tablename, cmd;

-- 6. CONTAR POLÍTICAS POR TABLA
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'posts', 'likes', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
GROUP BY tablename
ORDER BY tablename;







