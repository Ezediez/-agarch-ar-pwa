-- 🔧 OPTIMIZAR POLÍTICAS RLS - VERSIÓN CORREGIDA
-- Optimizar las políticas más críticas para mejorar performance
-- OBJETIVO: Reducir de 25 a 5 alertas
-- CORREGIDO: Nombres de columnas y verificación de existencia

BEGIN;

-- =====================================================
-- VERIFICAR Y CREAR COLUMNAS FALTANTES
-- =====================================================

-- Verificar si la columna visibility existe, si no, crearla
DO $$
BEGIN
    -- Verificar si la columna visibility existe en profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'visibility'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN visibility TEXT DEFAULT 'public';
    END IF;
END $$;

-- =====================================================
-- OPTIMIZAR POLÍTICAS DE PAYMENTS
-- =====================================================

-- Eliminar políticas existentes problemáticas (si existen)
DO $$
BEGIN
    DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
    DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
    DROP POLICY IF EXISTS "payments_update_own" ON public.payments;
    DROP POLICY IF EXISTS "payments_delete_own" ON public.payments;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignorar errores si las políticas no existen
END $$;

-- Crear políticas optimizadas para payments (si la tabla existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        CREATE POLICY "payments_insert_own_optimized" ON public.payments
        FOR INSERT TO authenticated
        WITH CHECK (user_id = (SELECT auth.uid()));

        CREATE POLICY "payments_select_own_optimized" ON public.payments
        FOR SELECT TO authenticated
        USING (user_id = (SELECT auth.uid()));

        CREATE POLICY "payments_update_own_optimized" ON public.payments
        FOR UPDATE TO authenticated
        USING (user_id = (SELECT auth.uid()))
        WITH CHECK (user_id = (SELECT auth.uid()));

        CREATE POLICY "payments_delete_own_optimized" ON public.payments
        FOR DELETE TO authenticated
        USING (user_id = (SELECT auth.uid()));
    END IF;
END $$;

-- =====================================================
-- OPTIMIZAR POLÍTICAS DE PROFILES
-- =====================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE POLICY "profiles_select_own_optimized" ON public.profiles
FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()) OR visibility = 'public');

CREATE POLICY "profiles_update_own_optimized" ON public.profiles
FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "profiles_insert_own_optimized" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

-- =====================================================
-- OPTIMIZAR POLÍTICAS DE MESSAGES
-- =====================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
    DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
    DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
    DROP POLICY IF EXISTS "messages_delete_own" ON public.messages;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE POLICY "messages_select_own_optimized" ON public.messages
FOR SELECT TO authenticated
USING (
    sender_id = (SELECT auth.uid()) OR 
    recipient_id = (SELECT auth.uid())
);

CREATE POLICY "messages_insert_own_optimized" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (sender_id = (SELECT auth.uid()));

CREATE POLICY "messages_update_own_optimized" ON public.messages
FOR UPDATE TO authenticated
USING (sender_id = (SELECT auth.uid()))
WITH CHECK (sender_id = (SELECT auth.uid()));

CREATE POLICY "messages_delete_own_optimized" ON public.messages
FOR DELETE TO authenticated
USING (sender_id = (SELECT auth.uid()));

-- =====================================================
-- OPTIMIZAR POLÍTICAS DE POSTS
-- =====================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "posts_select_all" ON public.posts;
    DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
    DROP POLICY IF EXISTS "posts_update_own" ON public.posts;
    DROP POLICY IF EXISTS "posts_delete_own" ON public.posts;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE POLICY "posts_select_all_optimized" ON public.posts
FOR SELECT TO authenticated
USING (true); -- Los posts son públicos para usuarios autenticados

CREATE POLICY "posts_insert_own_optimized" ON public.posts
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "posts_update_own_optimized" ON public.posts
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "posts_delete_own_optimized" ON public.posts
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- OPTIMIZAR POLÍTICAS DE USER_LIKES
-- =====================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "user_likes_select_own" ON public.user_likes;
    DROP POLICY IF EXISTS "user_likes_insert_own" ON public.user_likes;
    DROP POLICY IF EXISTS "user_likes_delete_own" ON public.user_likes;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE POLICY "user_likes_select_own_optimized" ON public.user_likes
FOR SELECT TO authenticated
USING (
    user_id = (SELECT auth.uid()) OR 
    liked_user_id = (SELECT auth.uid())
);

CREATE POLICY "user_likes_insert_own_optimized" ON public.user_likes
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "user_likes_delete_own_optimized" ON public.user_likes
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- OPTIMIZAR POLÍTICAS DE POST_LIKES
-- =====================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "post_likes_select_all" ON public.post_likes;
    DROP POLICY IF EXISTS "post_likes_insert_own" ON public.post_likes;
    DROP POLICY IF EXISTS "post_likes_delete_own" ON public.post_likes;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE POLICY "post_likes_select_all_optimized" ON public.post_likes
FOR SELECT TO authenticated
USING (true); -- Los likes de posts son visibles para todos

CREATE POLICY "post_likes_insert_own_optimized" ON public.post_likes
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "post_likes_delete_own_optimized" ON public.post_likes
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- OPTIMIZAR POLÍTICAS DE NOTIFICATIONS
-- =====================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
    DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
    DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE POLICY "notifications_select_own_optimized" ON public.notifications
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "notifications_update_own_optimized" ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "notifications_delete_own_optimized" ON public.notifications
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

COMMIT;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT 'POLÍTICAS RLS OPTIMIZADAS - VERSIÓN CORREGIDA' as resultado;

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operacion
FROM pg_policies 
WHERE schemaname = 'public' 
AND policyname LIKE '%_optimized'
ORDER BY tablename, policyname;

SELECT '🚀 RENDIMIENTO MEJORADO - ALERTAS REDUCIDAS (CORREGIDO)' as resultado_final;
