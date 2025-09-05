-- PASO 1: Ejecutar la función para ver qué scripts genera
SELECT * FROM generate_rls_refactor_scripts();

-- PASO 2: Verificar el estado actual de políticas después de crear la función
SELECT 
    'RESUMEN POLITICAS ACTUALES' as diagnostico;

SELECT 
    schemaname,
    tablename,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY total_policies DESC, tablename;

-- PASO 3: Identificar políticas duplicadas restantes
SELECT 
    'POLITICAS DUPLICADAS RESTANTES' as diagnostico;

SELECT 
    tablename,
    cmd,
    COUNT(*) as cantidad_politicas,
    string_agg(policyname, ', ') as nombres_politicas
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename, cmd, roles::text
HAVING COUNT(*) > 1
ORDER BY cantidad_politicas DESC, tablename;



