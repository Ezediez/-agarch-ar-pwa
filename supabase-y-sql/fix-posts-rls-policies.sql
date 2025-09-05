-- ARREGLAR POLÍTICAS RLS DE POSTS
begin;

-- 1) Eliminar política problemática
DROP POLICY IF EXISTS posts_policy ON public.posts;

-- 2) Crear políticas específicas y correctas
-- Política para SELECT (leer posts) - TODOS pueden leer
CREATE POLICY posts_select_policy ON public.posts 
    FOR SELECT TO authenticated 
    USING (true);

-- Política para INSERT (crear posts) - Solo el dueño
CREATE POLICY posts_insert_policy ON public.posts 
    FOR INSERT TO authenticated 
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- Política para UPDATE (editar posts) - Solo el dueño  
CREATE POLICY posts_update_policy ON public.posts 
    FOR UPDATE TO authenticated 
    USING ((SELECT auth.uid()) = user_id) 
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- Política para DELETE (borrar posts) - Solo el dueño
CREATE POLICY posts_delete_policy ON public.posts 
    FOR DELETE TO authenticated 
    USING ((SELECT auth.uid()) = user_id);

commit;
