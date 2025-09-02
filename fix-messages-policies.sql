-- SCRIPT PEQUEÑO PARA CORREGIR POLÍTICAS DE MESSAGES
-- Ejecutar en el Editor SQL de Supabase

-- 1. PRIMERO: Verificar qué columnas existen en la tabla messages
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'messages'
ORDER BY ordinal_position;

-- 2. Verificar las políticas actuales de messages
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'messages';

-- 3. Eliminar políticas existentes de messages
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;
DROP POLICY IF EXISTS "Los usuarios pueden enviar mensajes" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Permitir que los usuarios autenticados envíen mensajes" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to send messages" ON public.messages;

-- 4. Crear políticas de messages con columnas correctas
-- (Esto se ejecutará después de verificar las columnas reales)
-- CREATE POLICY "messages_insert_policy" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
-- CREATE POLICY "messages_select_policy" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
-- CREATE POLICY "messages_update_policy" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);
-- CREATE POLICY "messages_delete_policy" ON public.messages FOR DELETE TO authenticated USING (auth.uid() = sender_id);
