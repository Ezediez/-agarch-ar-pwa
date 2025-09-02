-- ELIMINAR LAS 4 FUNCIONES RESTANTES SIN SECURITY DEFINER
-- Ejecutar en el Editor SQL de Supabase

-- =====================================================
-- PASO 1: ELIMINAR FUNCIONES RESTANTES
-- =====================================================

DROP FUNCTION IF EXISTS function_name() CASCADE;
DROP FUNCTION IF EXISTS safe_update() CASCADE;
DROP FUNCTION IF EXISTS update_user_data() CASCADE;

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







