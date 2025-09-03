-- DIAGNÓSTICO DE LA TABLA COMENTARIOS
-- Script para verificar si existe y su estructura

-- 1. Verificar si la tabla existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = 'comentarios'
) AS tabla_comentarios_existe;

-- 2. Ver estructura de la tabla (si existe)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'comentarios'
ORDER BY ordinal_position;

-- 3. Ver políticas RLS existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'comentarios';

-- 4. Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename = 'comentarios';

-- 5. Contar registros existentes (si la tabla existe)
SELECT COUNT(*) as total_comentarios FROM public.comentarios;
