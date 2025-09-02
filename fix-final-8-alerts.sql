-- SCRIPT PARA RESOLVER LAS 8 ALERTAS FINALES
-- Ejecutar en el Editor SQL de Supabase
-- Este script resuelve las alertas de RLS pendientes

-- =====================================================
-- PASO 1: VERIFICAR ALERTAS ACTUALES
-- =====================================================

-- Verificar tablas con RLS habilitado
SELECT 
    'TABLAS CON RLS:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'posts', 'likes', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
ORDER BY tablename;

-- Verificar políticas existentes
SELECT 
    'POLÍTICAS EXISTENTES:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'posts', 'likes', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
ORDER BY tablename, policyname;

-- =====================================================
-- PASO 2: HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

-- Habilitar RLS en todas las tablas principales
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 3: ELIMINAR POLÍTICAS DUPLICADAS O CONFLICTIVAS
-- =====================================================

-- Eliminar todas las políticas existentes para recrearlas limpiamente
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
            AND tablename IN ('profiles', 'posts', 'likes', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- =====================================================
-- PASO 4: CREAR POLÍTICAS RLS OPTIMIZADAS
-- =====================================================

-- PROFILES - Política única para todas las operaciones
CREATE POLICY "profiles_policy" ON public.profiles FOR ALL TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- POSTS - Política única para todas las operaciones
CREATE POLICY "posts_policy" ON public.posts FOR ALL TO authenticated 
USING (true) 
WITH CHECK (auth.uid() = user_id);

-- LIKES - Política única para todas las operaciones
CREATE POLICY "likes_policy" ON public.likes FOR ALL TO authenticated 
USING (true) 
WITH CHECK (auth.uid() = user_id);

-- COMENTARIOS - Política única para todas las operaciones
CREATE POLICY "comentarios_policy" ON public.comentarios FOR ALL TO authenticated 
USING (true) 
WITH CHECK (auth.uid() = usuario_id);

-- STORIES - Política única para todas las operaciones
CREATE POLICY "stories_policy" ON public.stories FOR ALL TO authenticated 
USING (true) 
WITH CHECK (auth.uid() = user_id);

-- MATCHES - Política única para todas las operaciones
CREATE POLICY "matches_policy" ON public.matches FOR ALL TO authenticated 
USING (auth.uid() = user1_id OR auth.uid() = user2_id) 
WITH CHECK (auth.uid() = user1_id);

-- MESSAGES - Política única para todas las operaciones
CREATE POLICY "messages_policy" ON public.messages FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.matches 
        WHERE id = messages.match_id 
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
) 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.matches 
        WHERE id = messages.match_id 
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
);

-- NOTIFICATIONS - Política única para todas las operaciones
CREATE POLICY "notifications_policy" ON public.notifications FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PASO 5: VERIFICAR CONFIGURACIÓN FINAL
-- =====================================================

-- Verificar RLS habilitado
SELECT 
    'RLS HABILITADO:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'posts', 'likes', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
ORDER BY tablename;

-- Verificar políticas creadas
SELECT 
    'POLÍTICAS FINALES:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'posts', 'likes', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
ORDER BY tablename, policyname;

-- Contar políticas por tabla
SELECT 
    'RESUMEN DE POLÍTICAS:' as info,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'posts', 'likes', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
GROUP BY tablename
ORDER BY tablename;

-- Verificar que no hay alertas pendientes
SELECT 
    'VERIFICACIÓN FINAL:' as info,
    CASE 
        WHEN COUNT(*) = 8 THEN '✅ Todas las tablas tienen RLS habilitado'
        ELSE '❌ Faltan tablas con RLS: ' || (8 - COUNT(*))::TEXT
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'posts', 'likes', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
    AND rowsecurity = true;
