-- DIAGNOSTICO COMPLETO DE TODAS LAS POLITICAS RLS
-- Para identificar exactamente qué alertas tenemos y cuáles son críticas

BEGIN;

-- 1. CONTAR TODAS LAS POLITICAS POR TABLA
SELECT 'RESUMEN POLITICAS POR TABLA' as diagnostico;
SELECT 
    schemaname,
    tablename,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY total_policies DESC, tablename;

-- 2. LISTAR TODAS LAS POLITICAS DETALLADAMENTE
SELECT 'DETALLE DE TODAS LAS POLITICAS' as diagnostico;
SELECT 
    ROW_NUMBER() OVER (ORDER BY tablename, policyname) as num,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN length(qual) > 50 THEN LEFT(qual, 50) || '...'
        ELSE qual 
    END as qual_resumido,
    CASE 
        WHEN length(with_check) > 50 THEN LEFT(with_check, 50) || '...'
        ELSE with_check 
    END as with_check_resumido
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. IDENTIFICAR POLITICAS PROBLEMATICAS
SELECT 'POLITICAS POTENCIALMENTE PROBLEMATICAS' as diagnostico;
SELECT 
    tablename,
    policyname,
    cmd,
    'QUAL contiene referencias complejas' as problema
FROM pg_policies 
WHERE schemaname = 'public'
  AND (
    qual ILIKE '%NOT IN%' OR
    qual ILIKE '%EXISTS%' OR
    qual ILIKE '%SELECT%' OR
    qual ILIKE '%JOIN%' OR
    length(qual) > 100
  )
ORDER BY tablename, policyname;

-- 4. IDENTIFICAR POLITICAS DUPLICADAS
SELECT 'POLITICAS DUPLICADAS O CONFLICTIVAS' as diagnostico;
SELECT 
    tablename,
    cmd,
    COUNT(*) as cantidad_politicas,
    STRING_AGG(policyname, ', ') as nombres_politicas
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1
ORDER BY tablename, cmd;

-- 5. VERIFICAR TABLAS SIN POLITICAS RLS
SELECT 'TABLAS SIN POLITICAS RLS' as diagnostico;
SELECT 
    t.table_name,
    'Tabla sin políticas RLS' as estado
FROM information_schema.tables t
LEFT JOIN pg_policies p ON p.tablename = t.table_name AND p.schemaname = 'public'
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
  AND p.policyname IS NULL
  AND t.table_name NOT LIKE 'pg_%'
  AND t.table_name NOT LIKE 'sql_%'
ORDER BY t.table_name;

-- 6. VERIFICAR TABLAS PRINCIPALES Y SUS POLITICAS
SELECT 'ESTADO TABLAS PRINCIPALES' as diagnostico;
SELECT 
    'posts' as tabla,
    COUNT(p.policyname) as total_politicas,
    COUNT(*) FILTER (WHERE p.cmd = 'SELECT') as select_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'INSERT') as insert_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'UPDATE') as update_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'DELETE') as delete_policies
FROM pg_policies p
WHERE p.schemaname = 'public' AND p.tablename = 'posts'

UNION ALL

SELECT 
    'profiles' as tabla,
    COUNT(p.policyname) as total_politicas,
    COUNT(*) FILTER (WHERE p.cmd = 'SELECT') as select_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'INSERT') as insert_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'UPDATE') as update_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'DELETE') as delete_policies
FROM pg_policies p
WHERE p.schemaname = 'public' AND p.tablename = 'profiles'

UNION ALL

SELECT 
    'messages' as tabla,
    COUNT(p.policyname) as total_politicas,
    COUNT(*) FILTER (WHERE p.cmd = 'SELECT') as select_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'INSERT') as insert_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'UPDATE') as update_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'DELETE') as delete_policies
FROM pg_policies p
WHERE p.schemaname = 'public' AND p.tablename = 'messages'

UNION ALL

SELECT 
    'likes' as tabla,
    COUNT(p.policyname) as total_politicas,
    COUNT(*) FILTER (WHERE p.cmd = 'SELECT') as select_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'INSERT') as insert_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'UPDATE') as update_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'DELETE') as delete_policies
FROM pg_policies p
WHERE p.schemaname = 'public' AND p.tablename = 'likes'

UNION ALL

SELECT 
    'stories' as tabla,
    COUNT(p.policyname) as total_politicas,
    COUNT(*) FILTER (WHERE p.cmd = 'SELECT') as select_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'INSERT') as insert_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'UPDATE') as update_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'DELETE') as delete_policies
FROM pg_policies p
WHERE p.schemaname = 'public' AND p.tablename = 'stories';

-- 7. IDENTIFICAR POLITICAS QUE PUEDEN CAUSAR ERRORES
SELECT 'POLITICAS CON POSIBLES ERRORES' as diagnostico;
SELECT 
    tablename,
    policyname,
    cmd,
    'Referencia a tabla inexistente o función' as posible_error,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND (
    qual ILIKE '%matches%' OR
    qual ILIKE '%undefined%' OR
    qual ILIKE '%null%' OR
    qual ~ '\b[a-z_]+\([^)]*\)' -- Funciones que podrían no existir
  )
ORDER BY tablename, policyname;

-- 8. TOTAL DE ALERTAS ESTIMADAS
SELECT 'TOTAL ALERTAS ESTIMADAS' as diagnostico;
SELECT COUNT(*) as total_politicas_activas
FROM pg_policies 
WHERE schemaname = 'public';

SELECT 'DIAGNOSTICO COMPLETO TERMINADO' as resultado;
SELECT 'Revisa los resultados para identificar políticas problemáticas' as instrucciones;

COMMIT;
