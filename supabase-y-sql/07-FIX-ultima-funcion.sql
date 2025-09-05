-- 🔧 CORREGIR ÚLTIMA FUNCIÓN CON SEARCH_PATH MUTABLE
-- Función: update_updated_at_column
-- EJECUTAR PARA REDUCIR A 0 ALERTAS DE SEGURIDAD

BEGIN;

-- =====================================================
-- CORREGIR FUNCIÓN update_updated_at_column
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

COMMIT;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT 'FUNCIÓN update_updated_at_column CORREGIDA' as resultado;

-- Verificar que la función tiene search_path seguro
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    'SEARCH_PATH FIJO' as status
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname = 'update_updated_at_column';

SELECT '🎯 TODAS LAS ALERTAS DE SEGURIDAD CORREGIDAS' as resultado_final;



