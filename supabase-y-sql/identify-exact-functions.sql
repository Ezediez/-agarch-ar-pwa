-- SCRIPT PARA IDENTIFICAR EXACTAMENTE LAS 8 FUNCIONES SIN SECURITY DEFINER
-- Ejecutar en el Editor SQL de Supabase
-- Este script identifica exactamente cuáles son las funciones problemáticas

-- =====================================================
-- PASO 1: LISTAR TODAS LAS FUNCIONES SIN SECURITY DEFINER
-- =====================================================

-- Listar todas las funciones sin SECURITY DEFINER con detalles completos
SELECT 
    'FUNCIONES SIN SECURITY DEFINER:' as info,
    n.nspname as schema_name,
    p.proname as function_name,
    p.prosecdef as security_definer,
    p.prokind as function_kind,
    p.prolang as language,
    p.proconfig as config,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prosecdef = false
    AND p.prokind = 'f'
ORDER BY p.proname;

-- =====================================================
-- PASO 2: VERIFICAR FUNCIONES ESPECÍFICAS
-- =====================================================

-- Verificar si existen las funciones que intentamos arreglar
SELECT 
    'VERIFICACIÓN DE FUNCIONES:' as info,
    'update_updated_at_column' as function_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND prosecdef = true) THEN 'CON SECURITY DEFINER'
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND prosecdef = false) THEN 'SIN SECURITY DEFINER'
        ELSE 'NO APLICA'
    END as security_status
UNION ALL
SELECT 
    'VERIFICACIÓN DE FUNCIONES:' as info,
    'search_users' as function_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_users') THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_users' AND prosecdef = true) THEN 'CON SECURITY DEFINER'
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_users' AND prosecdef = false) THEN 'SIN SECURITY DEFINER'
        ELSE 'NO APLICA'
    END as security_status
UNION ALL
SELECT 
    'VERIFICACIÓN DE FUNCIONES:' as info,
    'get_posts_with_counts' as function_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_posts_with_counts') THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_posts_with_counts' AND prosecdef = true) THEN 'CON SECURITY DEFINER'
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_posts_with_counts' AND prosecdef = false) THEN 'SIN SECURITY DEFINER'
        ELSE 'NO APLICA'
    END as security_status
UNION ALL
SELECT 
    'VERIFICACIÓN DE FUNCIONES:' as info,
    'get_nearby_profiles' as function_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_nearby_profiles') THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_nearby_profiles' AND prosecdef = true) THEN 'CON SECURITY DEFINER'
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_nearby_profiles' AND prosecdef = false) THEN 'SIN SECURITY DEFINER'
        ELSE 'NO APLICA'
    END as security_status;

-- =====================================================
-- PASO 3: BUSCAR FUNCIONES POR PATRONES
-- =====================================================

-- Buscar funciones que puedan ser las problemáticas
SELECT 
    'FUNCIONES POR PATRÓN:' as info,
    p.proname as function_name,
    p.prosecdef as security_definer,
    p.prokind as function_kind,
    p.prolang as language
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prosecdef = false
    AND p.prokind = 'f'
    AND (
        p.proname LIKE '%update%' OR
        p.proname LIKE '%search%' OR
        p.proname LIKE '%get%' OR
        p.proname LIKE '%nearby%' OR
        p.proname LIKE '%posts%' OR
        p.proname LIKE '%users%' OR
        p.proname LIKE '%profiles%' OR
        p.proname LIKE '%count%'
    )
ORDER BY p.proname;

-- =====================================================
-- PASO 4: VERIFICAR FUNCIONES DEL SISTEMA
-- =====================================================

-- Verificar si hay funciones del sistema que estén causando problemas
SELECT 
    'FUNCIONES DEL SISTEMA:' as info,
    p.proname as function_name,
    n.nspname as schema_name,
    p.prosecdef as security_definer,
    p.prokind as function_kind
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'information_schema', 'pg_catalog')
    AND p.prosecdef = false
    AND p.prokind = 'f'
    AND n.nspname = 'public'
ORDER BY p.proname;

-- =====================================================
-- PASO 5: RESUMEN DE FUNCIONES PROBLEMÁTICAS
-- =====================================================

-- Contar funciones por tipo
SELECT 
    'RESUMEN DE FUNCIONES:' as info,
    'Total funciones sin SECURITY DEFINER' as category,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prosecdef = false
    AND p.prokind = 'f'
UNION ALL
SELECT 
    'RESUMEN DE FUNCIONES:' as info,
    'Funciones con SECURITY DEFINER' as category,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.prokind = 'f'
UNION ALL
SELECT 
    'RESUMEN DE FUNCIONES:' as info,
    'Total funciones en public' as category,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f';

-- =====================================================
-- PASO 6: LISTAR TODAS LAS FUNCIONES PARA COMPARACIÓN
-- =====================================================

-- Listar todas las funciones para ver cuáles son las 8 problemáticas
SELECT 
    'TODAS LAS FUNCIONES:' as info,
    p.proname as function_name,
    p.prosecdef as security_definer,
    p.prokind as function_kind,
    p.prolang as language,
    CASE 
        WHEN p.prosecdef = false THEN '❌ SIN SECURITY DEFINER'
        ELSE '✅ CON SECURITY DEFINER'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
ORDER BY p.prosecdef, p.proname;
