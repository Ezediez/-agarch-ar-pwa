-- 🔧 VERIFICAR Y ARREGLAR PERMISOS DE STORAGE
-- Script para verificar y crear políticas de storage necesarias

BEGIN;

-- =====================================================
-- VERIFICAR BUCKETS DE STORAGE EXISTENTES
-- =====================================================

SELECT 'BUCKETS EXISTENTES:' as info;
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
ORDER BY name;

-- =====================================================
-- VERIFICAR POLÍTICAS DE STORAGE
-- =====================================================

SELECT 'POLÍTICAS DE STORAGE EXISTENTES:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
ORDER BY tablename, policyname;

-- =====================================================
-- CREAR POLÍTICAS DE STORAGE SI NO EXISTEN
-- =====================================================

-- Política para que los usuarios puedan subir archivos a su propia carpeta
DO $$
BEGIN
    -- Política para INSERT en storage.objects
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can upload their own files'
    ) THEN
        CREATE POLICY "Users can upload their own files"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    -- Política para SELECT en storage.objects
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can view their own files'
    ) THEN
        CREATE POLICY "Users can view their own files"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    -- Política para UPDATE en storage.objects
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can update their own files'
    ) THEN
        CREATE POLICY "Users can update their own files"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    -- Política para DELETE en storage.objects
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete their own files'
    ) THEN
        CREATE POLICY "Users can delete their own files"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    -- Política para acceso público de lectura (para mostrar imágenes)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Public can view media files'
    ) THEN
        CREATE POLICY "Public can view media files"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'media');
    END IF;
END $$;

-- =====================================================
-- VERIFICAR QUE EL BUCKET 'media' EXISTE
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'media') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'media',
            'media', 
            true, 
            10485760, -- 10MB
            ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/mov']
        );
    END IF;
END $$;

COMMIT;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT 'VERIFICACIÓN FINAL - POLÍTICAS CREADAS:' as resultado;
SELECT policyname, cmd as operacion 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;

SELECT 'BUCKET MEDIA CONFIGURADO:' as resultado;
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'media';
