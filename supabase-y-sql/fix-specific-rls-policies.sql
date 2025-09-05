-- ARREGLAR POLÍTICAS RLS ESPECÍFICAS QUE CAUSAN PROBLEMAS
-- Script para solucionar las 2 políticas que necesitan atención

BEGIN;

-- =====================================================
-- 1. IDENTIFICAR POLÍTICAS PROBLEMÁTICAS
-- =====================================================

-- Mostrar todas las políticas que pueden tener problemas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual LIKE '%matches%' THEN 'PROBLEMA: Referencia tabla matches'
        WHEN with_check LIKE '%matches%' THEN 'PROBLEMA: Referencia tabla matches'
        WHEN qual IS NULL AND cmd = 'SELECT' THEN 'POSIBLE PROBLEMA: Sin condición USING'
        ELSE 'OK'
    END as status
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('posts', 'stories', 'messages', 'profiles')
ORDER BY tablename, policyname;

-- =====================================================
-- 2. ARREGLAR POLÍTICA DE POSTS
-- =====================================================

-- Eliminar políticas problemáticas de posts
DROP POLICY IF EXISTS "posts_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_select_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_update_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_policy" ON public.posts;

-- Crear políticas correctas para posts
CREATE POLICY "posts_select_policy" ON public.posts 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "posts_insert_policy" ON public.posts 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update_policy" ON public.posts 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_delete_policy" ON public.posts 
    FOR DELETE TO authenticated 
    USING (auth.uid() = user_id);

-- =====================================================
-- 3. ARREGLAR POLÍTICA DE STORIES
-- =====================================================

-- Eliminar políticas problemáticas de stories
DROP POLICY IF EXISTS "stories_policy" ON public.stories;
DROP POLICY IF EXISTS "stories_select_policy" ON public.stories;
DROP POLICY IF EXISTS "stories_insert_policy" ON public.stories;
DROP POLICY IF EXISTS "stories_update_policy" ON public.stories;
DROP POLICY IF EXISTS "stories_delete_policy" ON public.stories;

-- Crear políticas correctas para stories
CREATE POLICY "stories_select_policy" ON public.stories 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "stories_insert_policy" ON public.stories 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stories_update_policy" ON public.stories 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stories_delete_policy" ON public.stories 
    FOR DELETE TO authenticated 
    USING (auth.uid() = user_id);

-- =====================================================
-- 4. VERIFICAR STORAGE POLICIES (PARA SUBIDA DE FOTOS)
-- =====================================================

-- Verificar políticas de storage
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- Eliminar políticas problemáticas de storage si existen
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
            AND tablename = 'objects'
            AND (qual LIKE '%matches%' OR with_check LIKE '%matches%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
        RAISE NOTICE 'Eliminada política problemática: %', r.policyname;
    END LOOP;
END $$;

-- =====================================================
-- 5. CREAR/VERIFICAR POLÍTICAS DE STORAGE PARA FOTOS
-- =====================================================

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

-- =====================================================
-- 6. VERIFICACIÓN FINAL
-- =====================================================

-- Contar políticas por tabla
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname IN ('public', 'storage')
    AND tablename IN ('posts', 'stories', 'messages', 'objects')
GROUP BY schemaname, tablename
ORDER BY schemaname, tablename;

-- Verificar que no hay referencias a matches
SELECT 
    schemaname,
    tablename,
    policyname,
    'PROBLEMA: Aún referencia matches' as issue
FROM pg_policies 
WHERE schemaname IN ('public', 'storage')
    AND (qual LIKE '%matches%' OR with_check LIKE '%matches%');

-- Mostrar mensaje de éxito
SELECT 'Políticas RLS corregidas exitosamente' as status;

COMMIT;
