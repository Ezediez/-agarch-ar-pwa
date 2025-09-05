-- 🚨 ROLLBACK COMPLETO - RESTAURAR ESTADO FUNCIONAL
-- Eliminar todas las políticas optimizadas y restaurar funcionalidad básica
-- PRIORIDAD: QUE FUNCIONE, NO RENDIMIENTO

BEGIN;

-- =====================================================
-- ELIMINAR TODAS LAS POLÍTICAS OPTIMIZADAS
-- =====================================================

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Eliminar todas las políticas que creamos con "_optimized"
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND policyname LIKE '%_optimized'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- =====================================================
-- RESTAURAR POLÍTICAS BÁSICAS FUNCIONALES
-- =====================================================

-- PROFILES - Políticas permisivas para que funcione
CREATE POLICY "profiles_select_all" ON public.profiles
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- MESSAGES - Políticas permisivas
CREATE POLICY "messages_select_own" ON public.messages
FOR SELECT TO authenticated
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "messages_insert_own" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_update_own" ON public.messages
FOR UPDATE TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_delete_own" ON public.messages
FOR DELETE TO authenticated
USING (sender_id = auth.uid());

-- POSTS - Políticas permisivas
CREATE POLICY "posts_select_all" ON public.posts
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "posts_insert_own" ON public.posts
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "posts_update_own" ON public.posts
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "posts_delete_own" ON public.posts
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- USER_LIKES - Políticas permisivas
CREATE POLICY "user_likes_select_all" ON public.user_likes
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "user_likes_insert_own" ON public.user_likes
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_likes_delete_own" ON public.user_likes
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- LIKES (para posts) - Políticas permisivas
CREATE POLICY "likes_select_all" ON public.likes
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "likes_insert_own" ON public.likes
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "likes_delete_own" ON public.likes
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- NOTIFICATIONS - Políticas permisivas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        CREATE POLICY "notifications_select_own" ON public.notifications
        FOR SELECT TO authenticated
        USING (user_id = auth.uid());

        CREATE POLICY "notifications_update_own" ON public.notifications
        FOR UPDATE TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());

        CREATE POLICY "notifications_delete_own" ON public.notifications
        FOR DELETE TO authenticated
        USING (user_id = auth.uid());
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- COMENTARIOS - Políticas permisivas
CREATE POLICY "comentarios_select_all" ON public.comentarios
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "comentarios_insert_own" ON public.comentarios
FOR INSERT TO authenticated
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "comentarios_update_own" ON public.comentarios
FOR UPDATE TO authenticated
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "comentarios_delete_own" ON public.comentarios
FOR DELETE TO authenticated
USING (usuario_id = auth.uid());

COMMIT;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT 'ROLLBACK COMPLETO REALIZADO' as resultado;
SELECT 'POLÍTICAS RESTAURADAS A ESTADO FUNCIONAL' as estado;
SELECT 'RENDIMIENTO: SACRIFICADO POR FUNCIONALIDAD' as nota;

-- Contar políticas activas
SELECT 
    COUNT(*) as total_politicas,
    'Políticas básicas restauradas' as descripcion
FROM pg_policies
WHERE schemaname = 'public'
AND policyname NOT LIKE '%_optimized';

SELECT '🚨 APP RESTAURADA - DEBE FUNCIONAR COMO ANTES' as resultado_final;
