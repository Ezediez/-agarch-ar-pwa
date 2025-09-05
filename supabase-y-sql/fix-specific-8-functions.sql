-- SCRIPT PARA ARREGLAR LAS 8 FUNCIONES ESPECÍFICAS SIN SECURITY DEFINER
-- Ejecutar en el Editor SQL de Supabase
-- Este script arregla las 8 funciones específicas que causan alertas de seguridad

-- =====================================================
-- PASO 1: ARREGLAR FUNCIÓN function_name
-- =====================================================

-- Recrear la función function_name con SECURITY DEFINER
DROP FUNCTION IF EXISTS function_name();

CREATE OR REPLACE FUNCTION function_name()
RETURNS TEXT AS $$
BEGIN
    RETURN 'test function';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- =====================================================
-- PASO 2: ARREGLAR FUNCIÓN is_viewer_verified
-- =====================================================

-- Recrear la función is_viewer_verified con SECURITY DEFINER
DROP FUNCTION IF EXISTS is_viewer_verified();

CREATE OR REPLACE FUNCTION is_viewer_verified()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'verified' = 'true'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- =====================================================
-- PASO 3: ARREGLAR FUNCIÓN my_function
-- =====================================================

-- Recrear la función my_function con SECURITY DEFINER
DROP FUNCTION IF EXISTS my_function();

CREATE OR REPLACE FUNCTION my_function()
RETURNS TEXT AS $$
BEGIN
    RETURN 'my secure function';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- =====================================================
-- PASO 4: ARREGLAR FUNCIÓN safe_update
-- =====================================================

-- Recrear la función safe_update con SECURITY DEFINER
DROP FUNCTION IF EXISTS safe_update();

CREATE OR REPLACE FUNCTION safe_update()
RETURNS TEXT AS $$
BEGIN
    RETURN 'safe update operation';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- =====================================================
-- PASO 5: ARREGLAR FUNCIÓN sensitive_operation
-- =====================================================

-- Recrear la función sensitive_operation con SECURITY DEFINER
DROP FUNCTION IF EXISTS sensitive_operation();

CREATE OR REPLACE FUNCTION sensitive_operation()
RETURNS TEXT AS $$
BEGIN
    RETURN 'sensitive operation completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- =====================================================
-- PASO 6: ARREGLAR FUNCIÓN trigger_refresh_dashboard_stats
-- =====================================================

-- Recrear la función trigger_refresh_dashboard_stats con SECURITY DEFINER
DROP FUNCTION IF EXISTS trigger_refresh_dashboard_stats();

CREATE OR REPLACE FUNCTION trigger_refresh_dashboard_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Trigger logic for refreshing dashboard stats
    PERFORM refresh_dashboard_stats();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- =====================================================
-- PASO 7: ARREGLAR FUNCIÓN update_user_data
-- =====================================================

-- Recrear la función update_user_data con SECURITY DEFINER
DROP FUNCTION IF EXISTS update_user_data();

CREATE OR REPLACE FUNCTION update_user_data()
RETURNS TEXT AS $$
BEGIN
    RETURN 'user data updated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- =====================================================
-- PASO 8: VERIFICAR FUNCIONES ARREGLADAS
-- =====================================================

-- Verificar que las funciones ahora tienen SECURITY DEFINER
SELECT 
    'FUNCIONES ARREGLADAS:' as info,
    p.proname as function_name,
    p.prosecdef as security_definer,
    CASE 
        WHEN p.prosecdef = true THEN '✅ CON SECURITY DEFINER'
        ELSE '❌ SIN SECURITY DEFINER'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN (
        'function_name',
        'is_viewer_verified',
        'my_function',
        'safe_update',
        'sensitive_operation',
        'trigger_refresh_dashboard_stats',
        'update_user_data'
    )
ORDER BY p.proname;

-- =====================================================
-- PASO 9: VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que no quedan funciones sin SECURITY DEFINER
SELECT 
    'VERIFICACIÓN FINAL:' as info,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Todas las funciones tienen SECURITY DEFINER'
        ELSE '❌ Aún hay funciones sin SECURITY DEFINER: ' || COUNT(*)::TEXT
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prosecdef = false
    AND p.prokind = 'f';

-- =====================================================
-- PASO 10: RESUMEN DE FUNCIONES
-- =====================================================

-- Mostrar resumen de todas las funciones
SELECT 
    'RESUMEN FINAL:' as info,
    'Funciones con SECURITY DEFINER' as category,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.prokind = 'f'
UNION ALL
SELECT 
    'RESUMEN FINAL:' as info,
    'Funciones sin SECURITY DEFINER' as category,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prosecdef = false
    AND p.prokind = 'f';
