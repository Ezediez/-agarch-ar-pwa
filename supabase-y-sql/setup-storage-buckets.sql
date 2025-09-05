-- SCRIPT PARA CONFIGURAR STORAGE BUCKETS
-- Ejecutar en el Editor SQL de Supabase
-- Este script crea los buckets necesarios y sus políticas RLS

-- 1. CREAR BUCKETS PRINCIPALES
-- Bucket para medios generales (fotos, videos, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('media', 'media', true, 52428800, ARRAY['image/*', 'video/*']), -- 50MB limit
  ('report_images', 'report_images', true, 10485760, ARRAY['image/*']); -- 10MB limit

-- 2. CONFIGURAR POLÍTICAS RLS PARA BUCKET 'media'
-- Política para INSERT (subir archivos)
CREATE POLICY "media_insert_policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para SELECT (ver archivos)
CREATE POLICY "media_select_policy" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'media');

-- Política para UPDATE (actualizar archivos)
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

-- Política para DELETE (eliminar archivos)
CREATE POLICY "media_delete_policy" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. CONFIGURAR POLÍTICAS RLS PARA BUCKET 'report_images'
-- Política para INSERT (subir imágenes de reporte)
CREATE POLICY "report_images_insert_policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'report_images');

-- Política para SELECT (ver imágenes de reporte)
CREATE POLICY "report_images_select_policy" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'report_images');

-- Política para UPDATE (actualizar imágenes de reporte)
CREATE POLICY "report_images_update_policy" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'report_images')
WITH CHECK (bucket_id = 'report_images');

-- Política para DELETE (eliminar imágenes de reporte)
CREATE POLICY "report_images_delete_policy" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'report_images');

-- 4. VERIFICAR BUCKETS CREADOS
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE id IN ('media', 'report_images');

-- 5. VERIFICAR POLÍTICAS CREADAS
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%media%' OR policyname LIKE '%report_images%'
ORDER BY policyname;
