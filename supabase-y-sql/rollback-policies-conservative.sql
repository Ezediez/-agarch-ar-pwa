-- ROLLBACK CONSERVADOR: VOLVER A ESTADO ESTABLE
-- Eliminar políticas problemáticas y crear solo las esenciales

BEGIN;

-- 1. BACKUP DE POLÍTICAS ACTUALES (para referencia)
SELECT 'BACKUP POLITICAS ANTES DEL ROLLBACK' as info;
SELECT 
    'DROP POLICY IF EXISTS "' || policyname || '" ON public.' || tablename || ';' as rollback_commands
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 2. ELIMINAR TODAS LAS POLÍTICAS PROBLEMÁTICAS
-- Esto puede parecer drástico, pero es la forma más segura de limpiar

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, policy_record.schemaname, policy_record.tablename);
        RAISE NOTICE 'Eliminada política: %.%', policy_record.tablename, policy_record.policyname;
    END LOOP;
END $$;

-- 3. CREAR POLÍTICAS ESENCIALES Y SIMPLES

-- POSTS: Lectura pública, escritura propia
CREATE POLICY "posts_select_public" ON public.posts 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "posts_insert_own" ON public.posts 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update_own" ON public.posts 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = user_id);

CREATE POLICY "posts_delete_own" ON public.posts 
    FOR DELETE TO authenticated 
    USING (auth.uid() = user_id);

-- PROFILES: Lectura pública, escritura propia
CREATE POLICY "profiles_select_public" ON public.profiles 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = id);

-- MESSAGES: Solo conversaciones propias
CREATE POLICY "messages_select_own" ON public.messages 
    FOR SELECT TO authenticated 
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "messages_insert_own" ON public.messages 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "messages_update_own" ON public.messages 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- LIKES: Ver propios y recibidos, crear propios
CREATE POLICY "likes_select_relevant" ON public.likes 
    FOR SELECT TO authenticated 
    USING (auth.uid() = user_id OR auth.uid() = liked_user_id);

CREATE POLICY "likes_insert_own" ON public.likes 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete_own" ON public.likes 
    FOR DELETE TO authenticated 
    USING (auth.uid() = user_id);

-- STORIES: Lectura pública, escritura propia
CREATE POLICY "stories_select_public" ON public.stories 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "stories_insert_own" ON public.stories 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stories_delete_own" ON public.stories 
    FOR DELETE TO authenticated 
    USING (auth.uid() = user_id);

-- COMMENTS: Ver públicos, escribir propios
CREATE POLICY "comments_select_public" ON public.comments 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "comments_insert_own" ON public.comments 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_update_own" ON public.comments 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = user_id);

CREATE POLICY "comments_delete_own" ON public.comments 
    FOR DELETE TO authenticated 
    USING (auth.uid() = user_id);

-- 4. ASEGURAR RLS HABILITADO EN TABLAS PRINCIPALES
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 5. VERIFICACIÓN POST-ROLLBACK
SELECT 'POLITICAS DESPUÉS DEL ROLLBACK' as resultado;
SELECT 
    tablename,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 6. CONTAR TOTAL DE POLÍTICAS
SELECT 'TOTAL POLITICAS ACTIVAS' as resultado, COUNT(*) as cantidad
FROM pg_policies 
WHERE schemaname = 'public';

SELECT 'ROLLBACK CONSERVADOR COMPLETADO' as estado;
SELECT 'Deberían quedar aproximadamente 18-20 políticas simples' as expectativa;

COMMIT;
