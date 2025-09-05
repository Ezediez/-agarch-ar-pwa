-- PASO 1: Script para limpiar completamente el sistema de chat
-- Este script es idempotente y se puede ejecutar múltiples veces sin errores

begin;

-- 1) Eliminar de supabase_realtime (corregido sin IF EXISTS)
do $$
begin
    -- Remover matches de realtime si existe
    if exists (
        select 1 from pg_publication_tables 
        where pubname = 'supabase_realtime' 
        and schemaname = 'public' 
        and tablename = 'matches'
    ) then
        alter publication supabase_realtime drop table public.matches;
    end if;
    
    -- Remover messages de realtime si existe (para recrear limpio)
    if exists (
        select 1 from pg_publication_tables 
        where pubname = 'supabase_realtime' 
        and schemaname = 'public' 
        and tablename = 'messages'
    ) then
        alter publication supabase_realtime drop table public.messages;
    end if;
    
    -- Remover user_likes de realtime si existe
    if exists (
        select 1 from pg_publication_tables 
        where pubname = 'supabase_realtime' 
        and schemaname = 'public' 
        and tablename = 'user_likes'
    ) then
        alter publication supabase_realtime drop table public.user_likes;
    end if;
    
    -- Remover post_likes de realtime si existe
    if exists (
        select 1 from pg_publication_tables 
        where pubname = 'supabase_realtime' 
        and schemaname = 'public' 
        and tablename = 'post_likes'
    ) then
        alter publication supabase_realtime drop table public.post_likes;
    end if;
end $$;

-- 2) Eliminar todas las políticas de las tablas que vamos a recrear
drop policy if exists messages_select_policy on public.messages;
drop policy if exists messages_insert_policy on public.messages;
drop policy if exists messages_update_policy on public.messages;
drop policy if exists messages_delete_policy on public.messages;

drop policy if exists user_likes_select_policy on public.user_likes;
drop policy if exists user_likes_insert_policy on public.user_likes;
drop policy if exists user_likes_delete_policy on public.user_likes;

drop policy if exists post_likes_select_policy on public.post_likes;
drop policy if exists post_likes_insert_policy on public.post_likes;
drop policy if exists post_likes_delete_policy on public.post_likes;

-- 3) Eliminar índices existentes
drop index if exists idx_messages_sender_id;
drop index if exists idx_messages_recipient_id;
drop index if exists idx_messages_sent_at;
drop index if exists idx_user_likes_user_id;
drop index if exists idx_user_likes_liked_user_id;
drop index if exists idx_post_likes_user_id;
drop index if exists idx_post_likes_post_id;

-- 4) Eliminar tablas (CASCADE para dependencias)
drop table if exists public.user_likes cascade;
drop table if exists public.post_likes cascade;
drop table if exists public.messages cascade;
drop table if exists public.matches cascade;

commit;
