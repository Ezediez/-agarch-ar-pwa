-- 💾 BACKUP DE DATOS CRÍTICOS - AGARCH-AR
-- EJECUTAR ANTES DE LA LIMPIEZA TOTAL
-- Este script crea tablas temporales con los datos importantes

BEGIN;

-- =====================================================
-- CREAR TABLAS DE BACKUP
-- =====================================================

-- BACKUP: Perfiles de usuario
CREATE TABLE IF NOT EXISTS backup_profiles AS 
SELECT * FROM profiles WHERE id IS NOT NULL;

-- BACKUP: Posts/publicaciones  
CREATE TABLE IF NOT EXISTS backup_posts AS
SELECT * FROM posts WHERE id IS NOT NULL;

-- BACKUP: Mensajes de chat
CREATE TABLE IF NOT EXISTS backup_messages AS
SELECT * FROM messages WHERE id IS NOT NULL;

-- BACKUP: Comentarios
CREATE TABLE IF NOT EXISTS backup_comentarios AS
SELECT * FROM comentarios WHERE id IS NOT NULL;

-- BACKUP: Likes en posts
CREATE TABLE IF NOT EXISTS backup_likes AS
SELECT * FROM likes WHERE id IS NOT NULL;

-- BACKUP: Likes entre usuarios
CREATE TABLE IF NOT EXISTS backup_user_likes AS
SELECT * FROM user_likes WHERE id IS NOT NULL;

-- BACKUP: Historias
CREATE TABLE IF NOT EXISTS backup_stories AS
SELECT * FROM stories WHERE id IS NOT NULL;

-- BACKUP: Notificaciones
CREATE TABLE IF NOT EXISTS backup_notifications AS
SELECT * FROM notifications WHERE id IS NOT NULL;

-- =====================================================
-- VERIFICAR BACKUP
-- =====================================================

SELECT 'BACKUP COMPLETADO - DATOS GUARDADOS' as resultado;

-- Mostrar cantidad de registros respaldados
SELECT 
    'backup_profiles' as tabla,
    COUNT(*) as registros_respaldados
FROM backup_profiles
UNION ALL
SELECT 
    'backup_posts' as tabla,
    COUNT(*) as registros_respaldados  
FROM backup_posts
UNION ALL
SELECT 
    'backup_messages' as tabla,
    COUNT(*) as registros_respaldados
FROM backup_messages
UNION ALL
SELECT 
    'backup_comentarios' as tabla,
    COUNT(*) as registros_respaldados
FROM backup_comentarios
UNION ALL
SELECT 
    'backup_likes' as tabla,
    COUNT(*) as registros_respaldados
FROM backup_likes
UNION ALL
SELECT 
    'backup_user_likes' as tabla,
    COUNT(*) as registros_respaldados
FROM backup_user_likes
UNION ALL
SELECT 
    'backup_stories' as tabla,
    COUNT(*) as registros_respaldados
FROM backup_stories
UNION ALL
SELECT 
    'backup_notifications' as tabla,
    COUNT(*) as registros_respaldados
FROM backup_notifications;

COMMIT;

-- ⚠️ IMPORTANTE: 
-- Las tablas backup_* contienen tus datos seguros
-- NO ejecutes el script de limpieza hasta verificar este backup
