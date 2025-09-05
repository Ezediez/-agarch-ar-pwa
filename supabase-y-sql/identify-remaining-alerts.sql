-- SCRIPT PARA IDENTIFICAR LAS 8 ALERTAS PENDIENTES
-- Ejecutar en el Editor SQL de Supabase
-- Este script identifica qué tipo de alertas son las que quedan

-- =====================================================
-- PASO 1: VERIFICAR ALERTAS DE SEGURIDAD
-- =====================================================

-- Verificar funciones sin SECURITY DEFINER
SELECT 
    'FUNCIONES SIN SECURITY DEFINER:' as info,
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prosecdef = false
    AND p.prokind = 'f'
ORDER BY p.proname;

-- Verificar funciones con search_path mutable
SELECT 
    'FUNCIONES CON SEARCH_PATH MUTABLE:' as info,
    n.nspname as schema_name,
    p.proname as function_name,
    p.proconfig as search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proconfig IS NOT NULL
    AND p.proconfig::text LIKE '%search_path%'
ORDER BY p.proname;

-- =====================================================
-- PASO 2: VERIFICAR TRIGGERS
-- =====================================================

-- Verificar triggers sin SECURITY DEFINER
SELECT 
    'TRIGGERS SIN SECURITY DEFINER:' as info,
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'public'
    AND t.tgisinternal = false
    AND p.prosecdef = false
ORDER BY c.relname, t.tgname;

-- =====================================================
-- PASO 3: VERIFICAR VISTAS
-- =====================================================

-- Verificar vistas sin SECURITY DEFINER
SELECT 
    'VISTAS SIN SECURITY DEFINER:' as info,
    n.nspname as schema_name,
    c.relname as view_name,
    pg_get_viewdef(c.oid) as view_definition
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
    AND c.relkind = 'v'
ORDER BY c.relname;

-- =====================================================
-- PASO 4: VERIFICAR POLÍTICAS PERMISIVAS
-- =====================================================

-- Verificar políticas demasiado permisivas
SELECT 
    'POLÍTICAS PERMISIVAS:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_clause,
    with_check as check_clause
FROM pg_policies 
WHERE schemaname = 'public'
    AND (qual = 'true' OR with_check = 'true')
ORDER BY tablename, policyname;

-- =====================================================
-- PASO 5: VERIFICAR ÍNDICES FALTANTES
-- =====================================================

-- Verificar tablas sin índices en columnas importantes
SELECT 
    'TABLAS SIN ÍNDICES:' as info,
    t.table_name,
    c.column_name,
    c.data_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND c.column_name IN ('id', 'user_id', 'created_at', 'updated_at')
    AND NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = t.table_name 
        AND indexdef LIKE '%' || c.column_name || '%'
    )
ORDER BY t.table_name, c.column_name;

-- =====================================================
-- PASO 6: VERIFICAR RESTRICCIONES DE CLAVE EXTERNA
-- =====================================================

-- Verificar tablas sin restricciones de clave externa
SELECT 
    'TABLAS SIN FK:' as info,
    t.table_name,
    c.column_name,
    c.data_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND c.column_name LIKE '%_id'
    AND c.column_name != 'id'
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = t.table_name
        AND kcu.column_name = c.column_name
        AND tc.constraint_type = 'FOREIGN KEY'
    )
ORDER BY t.table_name, c.column_name;

-- =====================================================
-- PASO 7: VERIFICAR CONFIGURACIÓN DE AUTENTICACIÓN
-- =====================================================

-- Verificar configuración de auth
SELECT 
    'CONFIGURACIÓN AUTH:' as info,
    'RLS habilitado en tablas principales' as check_item,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'posts', 'likes', 'comentarios', 'stories', 'matches', 'messages', 'notifications')
    AND rowsecurity = true
UNION ALL
SELECT 
    'CONFIGURACIÓN AUTH:' as info,
    'Políticas RLS creadas' as check_item,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'posts', 'likes', 'comentarios', 'stories', 'matches', 'messages', 'notifications');

-- =====================================================
-- PASO 8: RESUMEN GENERAL
-- =====================================================

SELECT 
    'RESUMEN DE ALERTAS:' as info,
    'Funciones sin SECURITY DEFINER' as alert_type,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prosecdef = false
    AND p.prokind = 'f'
UNION ALL
SELECT 
    'RESUMEN DE ALERTAS:' as info,
    'Políticas permisivas' as alert_type,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'
    AND (qual = 'true' OR with_check = 'true')
UNION ALL
SELECT 
    'RESUMEN DE ALERTAS:' as info,
    'Tablas sin índices importantes' as alert_type,
    COUNT(DISTINCT t.table_name) as count
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND c.column_name IN ('id', 'user_id', 'created_at', 'updated_at')
    AND NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = t.table_name 
        AND indexdef LIKE '%' || c.column_name || '%'
    );












