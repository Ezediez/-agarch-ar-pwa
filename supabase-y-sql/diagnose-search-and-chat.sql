-- DIAGNÓSTICO: BUSCADOR Y CHAT
-- Script para identificar problemas específicos

BEGIN;

-- =====================================================
-- 1. DIAGNÓSTICO DEL BUSCADOR
-- =====================================================

-- Verificar que las funciones de búsqueda existen
SELECT 
    'FUNCIONES DE BÚSQUEDA:' as check_type,
    proname as function_name,
    CASE 
        WHEN proname IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as status
FROM pg_proc 
WHERE proname IN ('get_nearby_profiles', 'search_profiles')
UNION ALL
SELECT 
    'TOTAL FUNCIONES BÚSQUEDA:' as check_type,
    COUNT(*)::text as function_name,
    CASE 
        WHEN COUNT(*) = 2 THEN '✅ COMPLETO'
        ELSE '⚠️ INCOMPLETO'
    END as status
FROM pg_proc 
WHERE proname IN ('get_nearby_profiles', 'search_profiles');

-- Verificar perfiles disponibles para búsqueda
SELECT 
    'PERFILES PARA BÚSQUEDA:' as check_type,
    COUNT(*) as total_profiles,
    COUNT(latitud) as with_location,
    COUNT(alias) as with_alias
FROM public.profiles;

-- Probar búsqueda general (sin filtros)
SELECT 'PRUEBA BÚSQUEDA GENERAL:' as test_name;
SELECT 
    id,
    alias,
    gender,
    created_at
FROM search_profiles(NULL, NULL, NULL, NULL, 18, 99, 10, 0);

-- Probar búsqueda por ubicación (Buenos Aires)
SELECT 'PRUEBA BÚSQUEDA POR UBICACIÓN:' as test_name;
SELECT 
    id,
    alias,
    distance_km
FROM get_nearby_profiles(-34.6118, -58.3960, 1000);

-- =====================================================
-- 2. DIAGNÓSTICO DEL CHAT
-- =====================================================

-- Verificar tabla de mensajes
SELECT 
    'TABLA MESSAGES:' as check_type,
    COUNT(*) as total_messages,
    COUNT(DISTINCT sender_id) as unique_senders,
    COUNT(DISTINCT recipient_id) as unique_recipients
FROM public.messages;

-- Verificar mensajes específicos por usuario
SELECT 
    'MENSAJES POR USUARIO:' as check_type,
    sender_id,
    recipient_id,
    content,
    sent_at
FROM public.messages
ORDER BY sent_at DESC
LIMIT 10;

-- Verificar políticas RLS de messages
SELECT 
    'POLÍTICAS MESSAGES:' as check_type,
    policyname,
    cmd as action,
    CASE 
        WHEN policyname IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as status
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'messages'
ORDER BY cmd;

-- Verificar realtime en messages
SELECT 
    'MESSAGES EN REALTIME:' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
                AND schemaname = 'public' 
                AND tablename = 'messages'
        ) THEN '✅ HABILITADO'
        ELSE '❌ DESHABILITADO'
    END as status;

-- =====================================================
-- 3. VERIFICAR POLÍTICAS RLS ESPECÍFICAS
-- =====================================================

-- Verificar que profiles permite SELECT
SELECT 
    'PROFILES SELECT:' as check_type,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PERMITIDO'
        ELSE '❌ BLOQUEADO'
    END as status
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND cmd = 'SELECT';

-- Verificar que messages permite SELECT
SELECT 
    'MESSAGES SELECT:' as check_type,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PERMITIDO'
        ELSE '❌ BLOQUEADO'
    END as status
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'messages' 
    AND cmd = 'SELECT';

-- =====================================================
-- 4. DATOS DE PRUEBA
-- =====================================================

-- Mostrar todos los perfiles (para ver si el buscador debería encontrarlos)
SELECT 
    'TODOS LOS PERFILES:' as info,
    id,
    alias,
    gender,
    sexual_orientation,
    latitud,
    longitud,
    created_at
FROM public.profiles
ORDER BY created_at;

-- =====================================================
-- 5. RESUMEN DE PROBLEMAS POTENCIALES
-- =====================================================

SELECT '📊 DIAGNÓSTICO COMPLETADO' as status;
SELECT 'Revisar resultados arriba para identificar problemas específicos' as next_step;

ROLLBACK; -- No hacer cambios, solo diagnóstico
