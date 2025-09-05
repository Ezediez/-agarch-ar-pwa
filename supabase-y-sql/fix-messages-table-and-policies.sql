-- ARREGLAR TABLA MESSAGES Y POLÍTICAS RLS
-- Este script soluciona el error "relation matches does not exist"
-- El sistema actual usa mensajes directos SIN matches

BEGIN;

-- =====================================================
-- 1. VERIFICAR ESTADO ACTUAL DE LA TABLA MESSAGES
-- =====================================================

-- Ver si la tabla messages existe
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'messages';

-- Ver políticas actuales de messages
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'messages';

-- =====================================================
-- 2. ELIMINAR POLÍTICAS PROBLEMÁTICAS DE MESSAGES
-- =====================================================

-- Eliminar todas las políticas existentes de messages que referencien matches
DROP POLICY IF EXISTS "messages_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;

-- =====================================================
-- 3. CREAR/RECREAR TABLA MESSAGES CORRECTA
-- =====================================================

-- Crear tabla messages si no existe (sistema de mensajes directos)
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
-- 4. HABILITAR RLS EN MESSAGES
-- =====================================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREAR POLÍTICAS RLS CORRECTAS (SIN MATCHES)
-- =====================================================

-- MESSAGES - Solo participantes pueden ver mensajes
CREATE POLICY "messages_select_policy" ON public.messages 
    FOR SELECT TO authenticated 
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- MESSAGES - Solo sender puede insertar mensajes
CREATE POLICY "messages_insert_policy" ON public.messages 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = sender_id);

-- MESSAGES - Solo sender puede actualizar mensajes
CREATE POLICY "messages_update_policy" ON public.messages 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = sender_id) 
    WITH CHECK (auth.uid() = sender_id);

-- MESSAGES - Solo sender puede eliminar mensajes
CREATE POLICY "messages_delete_policy" ON public.messages 
    FOR DELETE TO authenticated 
    USING (auth.uid() = sender_id);

-- =====================================================
-- 6. CREAR ÍNDICES PARA RENDIMIENTO
-- =====================================================

-- Índices para mensajes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON public.messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, recipient_id, sent_at);

-- =====================================================
-- 7. CREAR TRIGGER PARA UPDATE_AT
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para messages
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. HABILITAR REALTIME PARA MESSAGES
-- =====================================================

-- Agregar messages a realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- =====================================================
-- 9. VERIFICAR CONFIGURACIÓN FINAL
-- =====================================================

-- Verificar tabla
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'messages';

-- Verificar políticas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'messages'
ORDER BY policyname;

-- Verificar índices
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'messages'
ORDER BY indexname;

COMMIT;

-- =====================================================
-- INSTRUCCIONES DE USO:
-- =====================================================
-- 1. Ejecutar este script completo en el Editor SQL de Supabase
-- 2. Verificar que no hay errores
-- 3. Probar envío de mensajes en la aplicación
-- 4. El error "relation matches does not exist" debería desaparecer
