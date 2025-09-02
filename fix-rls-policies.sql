-- Script para resolver políticas RLS redundantes en Supabase
-- Ejecutar en el Editor SQL de Supabase

-- 1. Primero, verificar las políticas existentes en la tabla likes
SELECT 
    policyname,
    cmd,
    roles,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'likes'
ORDER BY cmd;

-- 2. Eliminar políticas INSERT redundantes (nombres en español e inglés)
DROP POLICY IF EXISTS "Los usuarios pueden crear Me gusta" ON public.likes;
DROP POLICY IF EXISTS "Users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Permitir que los usuarios autenticados administren sus propios Me gusta" ON public.likes;

-- 3. Eliminar política ALL que puede estar causando conflictos
DROP POLICY IF EXISTS "Allow authenticated users to manage their own likes" ON public.likes;

-- 4. Crear una única política INSERT optimizada
CREATE POLICY "likes_insert_policy" 
ON public.likes
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Crear políticas para otras operaciones si no existen
-- SELECT policy
CREATE POLICY "likes_select_policy" 
ON public.likes
FOR SELECT 
TO authenticated
USING (true);

-- UPDATE policy
CREATE POLICY "likes_update_policy" 
ON public.likes
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE policy
CREATE POLICY "likes_delete_policy" 
ON public.likes
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 6. Verificar que las políticas se crearon correctamente
SELECT 
    policyname,
    cmd,
    roles,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'likes'
ORDER BY cmd;

-- 7. Habilitar RLS si no está habilitado
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
