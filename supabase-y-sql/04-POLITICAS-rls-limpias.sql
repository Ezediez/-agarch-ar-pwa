-- 🔐 POLÍTICAS RLS LIMPIAS Y OPTIMIZADAS - AGARCH-AR
-- Solo las políticas esenciales, claras y sin duplicados
-- EJECUTAR DESPUÉS DE LA RECREACIÓN DE TABLAS

BEGIN;

-- =====================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA PROFILES (4 políticas)
-- =====================================================

-- Ver todos los perfiles (público)
CREATE POLICY profiles_select_all ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Crear solo su propio perfil
CREATE POLICY profiles_insert_own ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Actualizar solo su propio perfil
CREATE POLICY profiles_update_own ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Eliminar solo su propio perfil
CREATE POLICY profiles_delete_own ON profiles
    FOR DELETE
    TO authenticated
    USING (auth.uid() = id);

-- =====================================================
-- POLÍTICAS PARA POSTS (4 políticas)
-- =====================================================

-- Ver posts públicos y propios
CREATE POLICY posts_select_all ON posts
    FOR SELECT
    TO authenticated
    USING (
        NOT es_privado OR 
        auth.uid() = user_id
    );

-- Crear solo propios posts
CREATE POLICY posts_insert_own ON posts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Actualizar solo propios posts
CREATE POLICY posts_update_own ON posts
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Eliminar solo propios posts
CREATE POLICY posts_delete_own ON posts
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA MESSAGES (3 políticas)
-- =====================================================

-- Ver mensajes donde soy participante
CREATE POLICY messages_select_participants ON messages
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = sender_id OR 
        auth.uid() = recipient_id
    );

-- Enviar mensajes como remitente
CREATE POLICY messages_insert_sender ON messages
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = sender_id);

-- Actualizar mensajes donde soy participante (marcar como leído)
CREATE POLICY messages_update_participants ON messages
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = sender_id OR 
        auth.uid() = recipient_id
    );

-- =====================================================
-- POLÍTICAS PARA COMENTARIOS (3 políticas)
-- =====================================================

-- Ver todos los comentarios
CREATE POLICY comentarios_select_all ON comentarios
    FOR SELECT
    TO authenticated
    USING (true);

-- Crear solo propios comentarios
CREATE POLICY comentarios_insert_own ON comentarios
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = usuario_id);

-- Eliminar solo propios comentarios
CREATE POLICY comentarios_delete_own ON comentarios
    FOR DELETE
    TO authenticated
    USING (auth.uid() = usuario_id);

-- =====================================================
-- POLÍTICAS PARA LIKES EN POSTS (3 políticas)
-- =====================================================

-- Ver todos los likes
CREATE POLICY likes_select_all ON likes
    FOR SELECT
    TO authenticated
    USING (true);

-- Crear solo propios likes
CREATE POLICY likes_insert_own ON likes
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Eliminar solo propios likes
CREATE POLICY likes_delete_own ON likes
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA USER_LIKES (3 políticas)
-- =====================================================

-- Ver solo propios likes a usuarios
CREATE POLICY user_likes_select_own ON user_likes
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Crear solo propios likes a usuarios
CREATE POLICY user_likes_insert_own ON user_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Eliminar solo propios likes a usuarios
CREATE POLICY user_likes_delete_own ON user_likes
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA STORIES (3 políticas)
-- =====================================================

-- Ver todas las stories (últimas 24h)
CREATE POLICY stories_select_all ON stories
    FOR SELECT
    TO authenticated
    USING (
        created_at > NOW() - INTERVAL '24 hours'
    );

-- Crear solo propias stories
CREATE POLICY stories_insert_own ON stories
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Eliminar solo propias stories
CREATE POLICY stories_delete_own ON stories
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA NOTIFICATIONS (3 políticas)
-- =====================================================

-- Ver solo propias notificaciones
CREATE POLICY notifications_select_own ON notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Crear notificaciones (sistema y usuarios)
CREATE POLICY notifications_insert_system ON notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Permite que cualquier usuario autenticado cree notificaciones

-- Actualizar solo propias notificaciones (marcar como leída)
CREATE POLICY notifications_update_own ON notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA REPORTS (2 políticas)
-- =====================================================

-- Ver solo propios reportes
CREATE POLICY reports_select_own ON reports
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Crear reportes
CREATE POLICY reports_insert_own ON reports
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA PAYMENTS (2 políticas)
-- =====================================================

-- Ver solo propios pagos
CREATE POLICY payments_select_own ON payments
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Crear solo propios pagos
CREATE POLICY payments_insert_own ON payments
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA STORAGE
-- =====================================================

-- Media bucket - Ver archivos públicos
CREATE POLICY media_select_public ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'media');

-- Media bucket - Subir propios archivos
CREATE POLICY media_insert_own ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'media' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Media bucket - Actualizar propios archivos
CREATE POLICY media_update_own ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'media' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Media bucket - Eliminar propios archivos
CREATE POLICY media_delete_own ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'media' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Report images bucket - Ver propios reportes
CREATE POLICY report_images_select_own ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'report_images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Report images bucket - Subir propias imágenes de reporte
CREATE POLICY report_images_insert_own ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'report_images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

COMMIT;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT 'POLÍTICAS RLS CREADAS EXITOSAMENTE' as resultado;

-- Contar políticas por tabla
SELECT 
    tablename,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY total_policies DESC, tablename;

SELECT 'TOTAL DE POLÍTICAS LIMPIAS: ~30 políticas esenciales' as resumen;
