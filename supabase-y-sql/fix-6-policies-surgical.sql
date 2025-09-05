-- ARREGLO QUIRURGICO DE 6 POLITICAS ESPECIFICAS
-- Solo tocar lo necesario, sin romper nada

BEGIN;

-- 1. IDENTIFICAR LAS 6 POLITICAS PROBLEMATICAS
SELECT 'POLITICAS ACTUALES PROBLEMATICAS' as diagnostico;
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND (
    -- Buscar patrones comunes de problemas
    qual ILIKE '%auth.uid()%' 
    OR qual ILIKE '%user_id%'
    OR qual ILIKE '%sender_id%'
    OR qual ILIKE '%recipient_id%'
  )
ORDER BY tablename, policyname;

-- 2. ARREGLOS ESPECIFICOS CONSERVADORES

-- Posts: Asegurar politica SELECT simple
DROP POLICY IF EXISTS "posts_select_policy" ON public.posts;
CREATE POLICY "posts_select_policy" ON public.posts 
    FOR SELECT TO authenticated 
    USING (true);

-- Messages: Politicas para chat
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
CREATE POLICY "messages_select_policy" ON public.messages 
    FOR SELECT TO authenticated 
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
CREATE POLICY "messages_insert_policy" ON public.messages 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = sender_id);

-- Profiles: Lectura publica, edicion propia
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles 
    FOR SELECT TO authenticated 
    USING (true);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = id);

-- Stories: Lectura publica
DROP POLICY IF EXISTS "stories_select_policy" ON public.stories;
CREATE POLICY "stories_select_policy" ON public.stories 
    FOR SELECT TO authenticated 
    USING (true);

-- 3. VERIFICACION FINAL
SELECT 'POLITICAS DESPUES DEL ARREGLO' as resultado;
SELECT schemaname, tablename, COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

SELECT 'ARREGLO QUIRURGICO COMPLETADO' as estado;

COMMIT;
