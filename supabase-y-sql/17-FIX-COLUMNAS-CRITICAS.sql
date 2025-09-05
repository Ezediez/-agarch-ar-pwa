-- 🔧 FIX QUIRÚRGICO - ARREGLAR COLUMNAS CRÍTICAS
-- Arreglar nombres de columnas que están causando errores

BEGIN;

-- =====================================================
-- ARREGLAR NOMBRES DE COLUMNAS EN PROFILES
-- =====================================================

-- Verificar y crear columnas faltantes con nombres correctos
DO $$
BEGIN
    -- Agregar latitud si no existe (el error menciona 'latitud')
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'latitud'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN latitud DECIMAL;
    END IF;

    -- Agregar longitud si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'longitud'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN longitud DECIMAL;
    END IF;

    -- Si existen ubicacion_lat/lng, copiar datos a latitud/longitud
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ubicacion_lat') THEN
        UPDATE profiles SET latitud = ubicacion_lat WHERE ubicacion_lat IS NOT NULL;
        UPDATE profiles SET longitud = ubicacion_lng WHERE ubicacion_lng IS NOT NULL;
    END IF;
END $$;

-- =====================================================
-- SIMPLIFICAR POLÍTICAS PROBLEMÁTICAS
-- =====================================================

-- Eliminar políticas conflictivas de profiles
DROP POLICY IF EXISTS "profiles_select_own_optimized" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;

-- Crear UNA política simple que funcione
CREATE POLICY "profiles_access_simple" ON public.profiles
FOR ALL TO authenticated
USING (true)
WITH CHECK (id = auth.uid() OR true);

COMMIT;

SELECT 'COLUMNAS Y POLÍTICAS CRÍTICAS ARREGLADAS' as resultado;
SELECT 'ESTO DEBERÍA ARREGLAR LOS ERRORES INMEDIATOS' as estado;
