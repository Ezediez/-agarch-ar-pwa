-- DIAGNOSTICO COMPLETO DEL SISTEMA DE CHAT
-- Verificar todo lo relacionado con mensajes y notificaciones

BEGIN;

-- 1. VERIFICAR ESTRUCTURA DE TABLA MESSAGES
SELECT 'ESTRUCTURA TABLA MESSAGES' as diagnostico;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'messages'
ORDER BY ordinal_position;

-- 2. VERIFICAR POLITICAS RLS DE MESSAGES
SELECT 'POLITICAS RLS MESSAGES' as diagnostico;
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'messages';

-- 3. VERIFICAR SI HAY MENSAJES EN LA TABLA
SELECT 'MENSAJES EXISTENTES' as diagnostico;
SELECT COUNT(*) as total_mensajes FROM public.messages;

-- 4. VERIFICAR ULTIMOS MENSAJES (si existen)
SELECT 'ULTIMOS 5 MENSAJES' as diagnostico;
SELECT id, sender_id, recipient_id, content, message_type, sent_at
FROM public.messages 
ORDER BY sent_at DESC 
LIMIT 5;

-- 5. VERIFICAR PERFILES EXISTENTES
SELECT 'PERFILES PARA CHAT' as diagnostico;
SELECT COUNT(*) as total_perfiles FROM public.profiles;

-- 6. VERIFICAR REALTIME PUBLICATION
SELECT 'REALTIME MESSAGES' as diagnostico;
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'messages';

-- 7. VERIFICAR FUNCIONES RPC RELACIONADAS CON CHAT
SELECT 'FUNCIONES RPC CHAT' as diagnostico;
SELECT proname, proargnames, prosrc 
FROM pg_proc 
WHERE proname ILIKE '%message%' OR proname ILIKE '%chat%' OR proname ILIKE '%notification%';

-- 8. VERIFICAR INDICES EN MESSAGES
SELECT 'INDICES MESSAGES' as diagnostico;
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'messages';

-- 9. VERIFICAR FOREIGN KEYS DE MESSAGES
SELECT 'FOREIGN KEYS MESSAGES' as diagnostico;
SELECT conname, confrelid::regclass AS foreign_table, 
       pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'messages' AND c.contype = 'f';

-- 10. INTENTAR INSERTAR MENSAJE DE PRUEBA (para verificar permisos)
DO $$
DECLARE
    test_user_id UUID;
    test_recipient_id UUID;
BEGIN
    -- Obtener dos perfiles para prueba
    SELECT id INTO test_user_id FROM public.profiles LIMIT 1;
    SELECT id INTO test_recipient_id FROM public.profiles WHERE id != test_user_id LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_recipient_id IS NOT NULL THEN
        -- Intentar insertar mensaje de prueba
        INSERT INTO public.messages (sender_id, recipient_id, content, message_type)
        VALUES (test_user_id, test_recipient_id, 'Mensaje de prueba', 'text');
        
        RAISE NOTICE 'PRUEBA INSERCION: EXITOSA';
        
        -- Eliminar mensaje de prueba
        DELETE FROM public.messages WHERE content = 'Mensaje de prueba';
    ELSE
        RAISE NOTICE 'PRUEBA INSERCION: NO HAY SUFICIENTES PERFILES';
    END IF;
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'PRUEBA INSERCION: ERROR - %', SQLERRM;
END $$;

SELECT 'DIAGNOSTICO CHAT COMPLETO' as resultado;

COMMIT;
