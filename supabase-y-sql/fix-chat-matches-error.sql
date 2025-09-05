-- SOLUCION DEFINITIVA: ELIMINAR REFERENCIAS A TABLA MATCHES
-- El chat no necesita tabla matches, solo messages directos

BEGIN;

-- 1. VERIFICAR Y ELIMINAR POLITICAS QUE REFERENCIEN MATCHES
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Buscar políticas que mencionen 'matches' en su definición
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname, qual
        FROM pg_policies 
        WHERE qual ILIKE '%matches%' OR qual ILIKE '%match%'
    LOOP
        RAISE NOTICE 'Eliminando política problemática: %.% - %', 
            policy_record.schemaname, policy_record.tablename, policy_record.policyname;
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, policy_record.schemaname, policy_record.tablename);
    END LOOP;
END $$;

-- 2. RECREAR POLITICAS CORRECTAS PARA MESSAGES
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

-- 3. VERIFICAR ESTRUCTURA DE TABLA MESSAGES
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 4. HABILITAR RLS EN MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. ASEGURAR REALTIME
DO $$
BEGIN
    -- Intentar agregar a realtime si no existe
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION 
        WHEN duplicate_object THEN 
            RAISE NOTICE 'Table messages ya está en supabase_realtime';
    END;
END $$;

-- 6. CREAR INDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
    ON public.messages(sender_id, recipient_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_recipient_time 
    ON public.messages(recipient_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_time 
    ON public.messages(sender_id, sent_at DESC);

-- 7. VERIFICACION FINAL
SELECT 'POLITICAS MESSAGES' as tipo, COUNT(*) as cantidad
FROM pg_policies 
WHERE tablename = 'messages' AND schemaname = 'public';

SELECT 'POLITICAS CON MATCHES' as tipo, COUNT(*) as cantidad
FROM pg_policies 
WHERE qual ILIKE '%matches%';

SELECT 'TABLA MESSAGES EXISTE' as tipo, 
       CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables 
                       WHERE table_schema = 'public' AND table_name = 'messages') 
            THEN 'SI' ELSE 'NO' END as estado;

SELECT 'MESSAGES EN REALTIME' as tipo,
       CASE WHEN EXISTS(SELECT 1 FROM pg_publication_tables 
                       WHERE pubname = 'supabase_realtime' AND tablename = 'messages')
            THEN 'SI' ELSE 'NO' END as estado;

SELECT 'CHAT LISTO PARA USAR' as resultado;

COMMIT;
