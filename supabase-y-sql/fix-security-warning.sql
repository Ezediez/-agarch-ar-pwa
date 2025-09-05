-- CORREGIR ALERTA DE SEGURIDAD: search_path mutable
-- Eliminar función problemática y limpiar

BEGIN;

-- 1. Eliminar la función que causa la alerta de seguridad
DROP FUNCTION IF EXISTS public.refactor_duplicate_rls_policies();

-- 2. También eliminar cualquier otra función relacionada que pueda quedar
DROP FUNCTION IF EXISTS generate_rls_refactor_scripts();

-- 3. Verificar que no queden funciones problemáticas
SELECT 'FUNCIONES RESTANTES EN PUBLIC SCHEMA' as diagnostico;

SELECT 
    proname as function_name,
    pronargs as num_args,
    CASE 
        WHEN proname IN ('get_nearby_profiles', 'search_profiles') THEN 'NECESARIA'
        ELSE 'REVISAR'
    END as status
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname NOT LIKE 'pg_%'
ORDER BY proname;

COMMIT;

SELECT 'ALERTA DE SEGURIDAD CORREGIDA' as resultado;



