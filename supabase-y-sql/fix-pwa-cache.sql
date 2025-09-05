-- VERIFICAR Y LIMPIAR CACHE PWA Y CONFIGURACIONES
-- Para asegurar que el PWA esté sincronizado

-- Este es un script de verificación de base de datos
-- El PWA se maneja desde el frontend

BEGIN;

-- 1. VERIFICAR CONFIGURACIONES DE USUARIO QUE AFECTEN PWA
SELECT 'CONFIGURACIONES PWA USUARIOS' as diagnostico;
SELECT 
    id,
    alias,
    notification_sound,
    notifications_new_like,
    notifications_new_message,
    updated_at
FROM public.profiles 
WHERE notifications_new_like IS NOT NULL 
   OR notifications_new_message IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- 2. VERIFICAR TOKENS DE PUSH NOTIFICATIONS (si existen)
SELECT 'TOKENS PUSH NOTIFICATIONS' as diagnostico;
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND (column_name ILIKE '%token%' OR column_name ILIKE '%push%' OR column_name ILIKE '%notification%')
ORDER BY table_name, column_name;

-- 3. VERIFICAR CONFIGURACIONES DE REALTIME
SELECT 'TABLAS EN REALTIME' as diagnostico;
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 4. VERIFICAR ÚLTIMAS ACTIVIDADES
SELECT 'ULTIMAS ACTIVIDADES' as diagnostico;
SELECT 
    'posts' as tabla,
    COUNT(*) as total,
    MAX(created_at) as ultima_actividad
FROM public.posts
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'messages' as tabla,
    COUNT(*) as total,
    MAX(sent_at) as ultima_actividad
FROM public.messages
WHERE sent_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'likes' as tabla,
    COUNT(*) as total,
    MAX(created_at) as ultima_actividad
FROM public.likes
WHERE created_at > NOW() - INTERVAL '24 hours';

SELECT 'VERIFICACION PWA COMPLETADA' as resultado;
SELECT 'El cache PWA se limpia desde el frontend' as nota;

COMMIT;
