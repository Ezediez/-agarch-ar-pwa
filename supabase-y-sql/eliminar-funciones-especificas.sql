-- ELIMINAR FUNCIONES ESPECÍFICAS SIN SECURITY DEFINER
-- Ejecutar en el Editor SQL de Supabase

-- =====================================================
-- PASO 1: ELIMINAR TODAS LAS VERSIONES DE LAS FUNCIONES
-- =====================================================

-- Eliminar function_name (sin parámetros)
DROP FUNCTION IF EXISTS function_name() CASCADE;

-- Eliminar safe_update (sin parámetros)
DROP FUNCTION IF EXISTS safe_update() CASCADE;

-- Eliminar TODAS las versiones de update_user_data
DROP FUNCTION IF EXISTS update_user_data() CASCADE;
DROP FUNCTION IF EXISTS update_user_data(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_user_data(TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_user_data(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_user_data(TEXT, UUID) CASCADE;

-- =====================================================
-- PASO 2: VERIFICACIÓN FINAL
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

-- Listar todas las funciones para confirmar
SELECT 
    'FUNCIONES FINALES:' as info,
    p.proname as function_name,
    CASE 
        WHEN p.prosecdef = true THEN '✅ CON SECURITY DEFINER'
        ELSE '❌ SIN SECURITY DEFINER'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
ORDER BY p.prosecdef, p.proname;












