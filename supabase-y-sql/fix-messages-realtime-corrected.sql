-- ARREGLAR MENSAJES Y REALTIME - VERSIÓN CORREGIDA
-- Soluciona el error de publicación realtime duplicada

BEGIN;

-- =====================================================
-- 1. VERIFICAR ESTADO ACTUAL
-- =====================================================

-- Verificar si messages está en realtime
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'messages';

-- =====================================================
-- 2. ELIMINAR POLÍTICAS PROBLEMÁTICAS DE MESSAGES
-- =====================================================

DROP POLICY IF EXISTS "messages_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;

-- =====================================================
-- 3. CREAR/RECREAR TABLA MESSAGES SI ES NECESARIO
-- =====================================================

-- Solo crear si no existe
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content text,
    message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio')),
    media_urls text[],
    sent_at timestamptz DEFAULT now() NOT NULL,
    read_at timestamptz,
    temp_id text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- =====================================================
-- 4. HABILITAR RLS
-- =====================================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREAR POLÍTICAS RLS CORRECTAS (SIN MATCHES)
-- =====================================================

CREATE POLICY "messages_select_policy" ON public.messages 
    FOR SELECT TO authenticated 
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "messages_insert_policy" ON public.messages 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "messages_update_policy" ON public.messages 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = sender_id) 
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "messages_delete_policy" ON public.messages 
    FOR DELETE TO authenticated 
    USING (auth.uid() = sender_id);

-- =====================================================
-- 6. AGREGAR A REALTIME SOLO SI NO ESTÁ
-- =====================================================

-- Función para agregar a realtime de forma segura
DO $$
BEGIN
    -- Solo agregar si no está ya en la publicación
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
        RAISE NOTICE 'Tabla messages agregada a supabase_realtime';
    ELSE
        RAISE NOTICE 'Tabla messages ya está en supabase_realtime';
    END IF;
END $$;

-- =====================================================
-- 7. CREAR ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON public.messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, recipient_id, sent_at);

-- =====================================================
-- 8. TRIGGER PARA UPDATE_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. VERIFICACIÓN FINAL
-- =====================================================

-- Verificar políticas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'messages'
ORDER BY policyname;

-- Verificar realtime
SELECT 
    'messages en realtime:' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
                AND schemaname = 'public' 
                AND tablename = 'messages'
        ) THEN 'SÍ' 
        ELSE 'NO' 
    END as resultado;

COMMIT;
