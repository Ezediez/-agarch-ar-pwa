-- TEMPORALMENTE DESHABILITAR RLS EN POSTS PARA PRUEBA
-- Solo para verificar que el problema es RLS

-- Deshabilitar RLS temporalmente
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
