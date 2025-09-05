-- ELIMINACION COMPLETA DE REFERENCIAS A MATCHES
-- Script para desterrar completamente la palabra y concepto "matches"

BEGIN;

-- 1. VERIFICAR SI EXISTE LA TABLA MATCHES (NO DEBERIA)
SELECT 'VERIFICANDO TABLA MATCHES' as diagnostico;
SELECT EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'matches'
) as tabla_matches_existe;

-- 2. ELIMINAR CUALQUIER POLITICA QUE REFERENCIE MATCHES
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname, qual
        FROM pg_policies 
        WHERE qual ILIKE '%matches%' OR policyname ILIKE '%match%'
    LOOP
        RAISE NOTICE 'Eliminando política con referencia a matches: %.% - %', 
            policy_record.schemaname, policy_record.tablename, policy_record.policyname;
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, policy_record.schemaname, policy_record.tablename);
    END LOOP;
END $$;

-- 3. ELIMINAR CUALQUIER FUNCION QUE REFERENCIE MATCHES
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE prosrc ILIKE '%matches%' OR proname ILIKE '%match%'
    LOOP
        RAISE NOTICE 'Eliminando función con referencia a matches: % (%)', 
            func_record.proname, func_record.args;
        
        EXECUTE format('DROP FUNCTION IF EXISTS %I(%s)', 
            func_record.proname, func_record.args);
    END LOOP;
END $$;

-- 4. ELIMINAR TABLA MATCHES SI EXISTE
DROP TABLE IF EXISTS public.matches CASCADE;

-- 5. RECREAR SISTEMA DE MENSAJES SIN MATCHES
-- Asegurar que messages funciona sin match_id

-- Verificar estructura actual de messages
SELECT 'ESTRUCTURA MESSAGES ACTUAL' as diagnostico;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'messages'
ORDER BY ordinal_position;

-- Eliminar columna match_id si existe
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'messages' 
              AND column_name = 'match_id') THEN
        ALTER TABLE public.messages DROP COLUMN match_id;
        RAISE NOTICE 'Columna match_id eliminada de messages';
    ELSE
        RAISE NOTICE 'Columna match_id no existe en messages';
    END IF;
END $$;

-- 6. ASEGURAR ESTRUCTURA CORRECTA DE MESSAGES
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS media_urls TEXT[],
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 7. RECREAR POLITICAS MESSAGES SIN REFERENCIAS A MATCHES
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
CREATE POLICY "messages_select_policy" ON public.messages 
    FOR SELECT TO authenticated 
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
CREATE POLICY "messages_insert_policy" ON public.messages 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
CREATE POLICY "messages_update_policy" ON public.messages 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- 8. HABILITAR RLS EN MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 9. ASEGURAR REALTIME EN MESSAGES
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION 
        WHEN duplicate_object THEN 
            RAISE NOTICE 'Table messages ya está en supabase_realtime';
    END;
END $$;

-- 10. VERIFICAR POSTS (problema reportado)
SELECT 'VERIFICANDO POSTS' as diagnostico;
SELECT COUNT(*) as total_posts FROM public.posts;

-- Verificar políticas de posts
SELECT 'POLITICAS POSTS' as diagnostico;
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'posts';

-- Recrear política básica de posts si es necesario
DROP POLICY IF EXISTS "posts_select_policy" ON public.posts;
CREATE POLICY "posts_select_policy" ON public.posts 
    FOR SELECT TO authenticated 
    USING (true);

-- 11. VERIFICACION FINAL
SELECT 'VERIFICACION FINAL' as resultado;

SELECT 'TABLA MATCHES ELIMINADA' as check1, 
       NOT EXISTS(SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' AND table_name = 'matches') as resultado;

SELECT 'POLITICAS CON MATCHES' as check2, COUNT(*) as cantidad
FROM pg_policies 
WHERE qual ILIKE '%matches%';

SELECT 'FUNCIONES CON MATCHES' as check3, COUNT(*) as cantidad
FROM pg_proc 
WHERE prosrc ILIKE '%matches%';

SELECT 'MESSAGES SIN MATCH_ID' as check4,
       NOT EXISTS(SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'messages' 
                  AND column_name = 'match_id') as resultado;

SELECT 'POSTS DISPONIBLES' as check5, COUNT(*) as cantidad
FROM public.posts;

SELECT 'MATCHES COMPLETAMENTE ELIMINADO' as estado_final;

COMMIT;
