-- SCRIPT SIMPLE PARA ARREGLAR SOLO LAS FUNCIONES
-- Ejecutar en el Editor SQL de Supabase

-- =====================================================
-- PASO 1: ELIMINAR FUNCIONES PROBLEMÁTICAS
-- =====================================================

DROP FUNCTION IF EXISTS function_name() CASCADE;
DROP FUNCTION IF EXISTS is_viewer_verified() CASCADE;
DROP FUNCTION IF EXISTS my_function() CASCADE;
DROP FUNCTION IF EXISTS safe_update() CASCADE;
DROP FUNCTION IF EXISTS sensitive_operation() CASCADE;
DROP FUNCTION IF EXISTS trigger_refresh_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS update_user_data() CASCADE;

-- =====================================================
-- PASO 2: CREAR FUNCIÓN BÁSICA SEGURA
-- =====================================================

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- =====================================================
-- PASO 3: VERIFICACIÓN FINAL
-- =====================================================

-- Verificar funciones con SECURITY DEFINER
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

-- Listar todas las funciones para ver el estado
SELECT 
    'FUNCIONES:' as info,
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







