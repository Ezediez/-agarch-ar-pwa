-- 🗑️ LIMPIEZA TOTAL DE SUPABASE - AGARCH-AR
-- ⚠️ SOLO EJECUTAR DESPUÉS DEL BACKUP
-- Este script elimina TODAS las tablas y políticas excepto auth.users

BEGIN;

-- =====================================================
-- DESHABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'backup_%'
    LOOP
        EXECUTE 'ALTER TABLE IF EXISTS public.' || quote_ident(table_record.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- =====================================================
-- ELIMINAR TODAS LAS POLÍTICAS RLS
-- =====================================================

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || 
                ' ON ' || quote_ident(policy_record.schemaname) || '.' || quote_ident(policy_record.tablename);
    END LOOP;
END $$;

-- =====================================================
-- ELIMINAR TODAS LAS FUNCIONES PERSONALIZADAS
-- =====================================================

DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as argtypes
        FROM pg_proc 
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND proname NOT LIKE 'pg_%'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(func_record.proname) || '(' || func_record.argtypes || ') CASCADE';
    END LOOP;
END $$;

-- =====================================================
-- ELIMINAR TODAS LAS TABLAS EXCEPTO BACKUPS
-- =====================================================

DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'backup_%'
        ORDER BY tablename
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(table_record.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- =====================================================
-- LIMPIAR STORAGE BUCKETS
-- =====================================================

-- Eliminar buckets existentes (si existen)
DELETE FROM storage.buckets WHERE id IN ('media', 'report_images', 'avatars', 'posts', 'stories');

-- =====================================================
-- VERIFICAR LIMPIEZA
-- =====================================================

SELECT 'LIMPIEZA TOTAL COMPLETADA' as resultado;

-- Verificar que no queden tablas (excepto backups y auth)
SELECT 
    'TABLAS RESTANTES' as diagnostico;

SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN tablename LIKE 'backup_%' THEN 'BACKUP - CONSERVAR'
        WHEN schemaname = 'auth' THEN 'AUTH - SISTEMA'
        ELSE 'REVISAR'
    END as status
FROM pg_tables 
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename;

-- Verificar que no queden políticas
SELECT 
    'POLÍTICAS RESTANTES (DEBE ESTAR VACÍO)' as diagnostico;

SELECT COUNT(*) as politicas_restantes
FROM pg_policies 
WHERE schemaname = 'public';

-- Verificar que no queden funciones personalizadas
SELECT 
    'FUNCIONES RESTANTES' as diagnostico;

SELECT 
    proname as function_name,
    CASE 
        WHEN proname LIKE 'pg_%' THEN 'SISTEMA'
        ELSE 'PERSONALIZADA'
    END as tipo
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

COMMIT;

SELECT 'BASE DE DATOS LIMPIA - LISTA PARA RECREACIÓN' as resultado_final;



