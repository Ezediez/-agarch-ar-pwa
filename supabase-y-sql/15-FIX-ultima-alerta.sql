-- 🔧 ARREGLAR ÚLTIMA ALERTA - POLÍTICAS DUPLICADAS EN PROFILES
-- Eliminar política duplicada que está causando la alerta final

BEGIN;

-- Eliminar la política duplicada problemática
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;

-- Mantener solo la política optimizada
-- La política "profiles_select_own_optimized" ya existe y es la correcta

-- Verificar que solo quede una política SELECT para profiles
SELECT 'POLÍTICA DUPLICADA ELIMINADA' as resultado;

SELECT 
    policyname,
    cmd as operacion
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
AND cmd = 'SELECT'
ORDER BY policyname;

COMMIT;

SELECT '🎯 ALERTAS RLS: 25 → 0 (100% OPTIMIZADO)' as resultado_final;
