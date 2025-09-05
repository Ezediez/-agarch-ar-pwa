-- SCRIPT PARA CONFIGURAR STORAGE BUCKETS (VERSIÓN CORREGIDA)
-- Ejecutar en el Editor SQL de Supabase
-- Este script verifica y crea los buckets necesarios

-- 1. VERIFICAR BUCKETS EXISTENTES
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE id IN ('media', 'report_images');

-- 2. CREAR BUCKET 'media' SI NO EXISTE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'media') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES ('media', 'media', true, 52428800, ARRAY['image/*', 'video/*']);
        RAISE NOTICE 'Bucket "media" creado exitosamente';
    ELSE
        RAISE NOTICE 'Bucket "media" ya existe';
    END IF;
END $$;

-- 3. CREAR BUCKET 'report_images' SI NO EXISTE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'report_images') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES ('report_images', 'report_images', true, 10485760, ARRAY['image/*']);
        RAISE NOTICE 'Bucket "report_images" creado exitosamente';
    ELSE
        RAISE NOTICE 'Bucket "report_images" ya existe';
    END IF;
END $$;

-- 4. ELIMINAR POLÍTICAS EXISTENTES PARA EVITAR CONFLICTOS
DROP POLICY IF EXISTS "media_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "media_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "media_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "media_delete_policy" ON storage.objects;

DROP POLICY IF EXISTS "report_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "report_images_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "report_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "report_images_delete_policy" ON storage.objects;

-- 5. CREAR POLÍTICAS RLS PARA BUCKET 'media'
CREATE POLICY "media_insert_policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "media_select_policy" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'media');

CREATE POLICY "media_update_policy" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "media_delete_policy" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. CREAR POLÍTICAS RLS PARA BUCKET 'report_images'
CREATE POLICY "report_images_insert_policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'report_images');

CREATE POLICY "report_images_select_policy" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'report_images');

CREATE POLICY "report_images_update_policy" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'report_images')
WITH CHECK (bucket_id = 'report_images');

CREATE POLICY "report_images_delete_policy" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'report_images');

-- 7. VERIFICAR CONFIGURACIÓN FINAL - BUCKETS
SELECT 
    'BUCKETS CREADOS:' as info,
    id,
    name,
    public::text as public_status,
    file_size_limit::text as size_limit,
    allowed_mime_types::text as mime_types
FROM storage.buckets
WHERE id IN ('media', 'report_images');

-- 8. VERIFICAR CONFIGURACIÓN FINAL - POLÍTICAS
SELECT 
    'POLÍTICAS CREADAS:' as info,
    policyname as policy_name,
    cmd as operation,
    roles::text as roles,
    'storage.objects' as table_name
FROM pg_policies 
WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND (policyname LIKE '%media%' OR policyname LIKE '%report_images%')
ORDER BY policyname;
