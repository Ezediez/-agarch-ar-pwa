-- 🗑️ LIMPIEZA TOTAL CORREGIDA - AGARCH-AR
-- ⚠️ SOLO EJECUTAR DESPUÉS DEL BACKUP
-- Versión corregida que maneja storage y tablas existentes

BEGIN;

-- =====================================================
-- LIMPIAR STORAGE OBJECTS PRIMERO
-- =====================================================

-- Eliminar todos los objetos de storage antes de eliminar buckets
DELETE FROM storage.objects WHERE bucket_id IN ('media', 'report_images', 'avatars', 'posts', 'stories');

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
-- ELIMINAR POLÍTICAS DE STORAGE
-- =====================================================

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'storage'
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
-- ELIMINAR TRIGGERS PERSONALIZADOS
-- =====================================================

DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND trigger_name LIKE '%update_%'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_record.trigger_name) || 
                ' ON public.' || quote_ident(trigger_record.event_object_table);
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
-- LIMPIAR STORAGE BUCKETS (AHORA SIN REFERENCIAS)
-- =====================================================

-- Eliminar buckets existentes
DELETE FROM storage.buckets WHERE id IN ('media', 'report_images', 'avatars', 'posts', 'stories');

-- =====================================================
-- LIMPIAR REALTIME SUBSCRIPTIONS
-- =====================================================

-- Remover tablas de realtime publication
DO $$
BEGIN
    -- Intentar remover tablas comunes de realtime
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS messages';
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS notifications';
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS posts';
EXCEPTION
    WHEN OTHERS THEN
        -- Ignorar errores si las tablas no existen en la publicación
        NULL;
END $$;

COMMIT;

-- =====================================================
-- VERIFICAR LIMPIEZA
-- =====================================================

SELECT 'LIMPIEZA TOTAL COMPLETADA CORRECTAMENTE' as resultado;

-- Verificar que no queden tablas (excepto backups y auth)
SELECT 
    'TABLAS RESTANTES' as diagnostico;

SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN tablename LIKE 'backup_%' THEN 'BACKUP - CONSERVAR'
        WHEN schemaname = 'auth' THEN 'AUTH - SISTEMA'
        WHEN schemaname = 'storage' THEN 'STORAGE - SISTEMA'
        ELSE 'REVISAR'
    END as status
FROM pg_tables 
WHERE schemaname IN ('public', 'auth', 'storage')
ORDER BY schemaname, tablename;

-- Verificar que no queden políticas
SELECT 
    'POLÍTICAS RESTANTES (DEBE ESTAR VACÍO)' as diagnostico;

SELECT COUNT(*) as politicas_restantes
FROM pg_policies 
WHERE schemaname = 'public';

SELECT 'BASE DE DATOS LIMPIA - LISTA PARA RECREACIÓN' as resultado_final;



