-- VERIFICACIÓN FINAL DEL ESTADO DE LAS POLÍTICAS RLS
-- Después de eliminar duplicadas

-- 1. CONTAR POLÍTICAS TOTALES POR TABLA
SELECT 'RESUMEN FINAL DE POLÍTICAS' as diagnostico;

SELECT 
    schemaname,
    tablename,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY total_policies DESC, tablename;

-- 2. VERIFICAR QUE NO QUEDEN DUPLICADAS
SELECT 'VERIFICACIÓN: NO DEBERÍAN QUEDAR DUPLICADAS' as diagnostico;

SELECT 
    tablename,
    cmd,
    COUNT(*) as cantidad_politicas,
    string_agg(policyname, ', ') as nombres_politicas
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1
ORDER BY cantidad_politicas DESC, tablename;

-- 3. LISTAR TODAS LAS POLÍTICAS RESTANTES
SELECT 'LISTADO COMPLETO DE POLÍTICAS RESTANTES' as diagnostico;

SELECT 
    ROW_NUMBER() OVER (ORDER BY tablename, policyname) as num,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN length(qual) > 60 THEN LEFT(qual, 60) || '...'
        ELSE qual 
    END as condition_summary
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. VERIFICAR FUNCIONES RPC CRÍTICAS
SELECT 'VERIFICACIÓN DE FUNCIONES RPC' as diagnostico;

SELECT 
    proname as function_name,
    pronargs as num_args,
    proargnames as arg_names
FROM pg_proc 
WHERE proname IN ('get_nearby_profiles', 'search_profiles')
ORDER BY proname;

-- 5. VERIFICAR TABLAS CRÍTICAS
SELECT 'VERIFICACIÓN DE TABLAS CRÍTICAS' as diagnostico;

SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status
FROM (
    VALUES 
        ('messages'),
        ('posts'), 
        ('profiles'),
        ('stories'),
        ('comentarios'),
        ('notifications'),
        ('likes'),
        ('post_likes'),
        ('user_likes')
) AS t(table_name)
ORDER BY table_name;



