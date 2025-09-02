-- PASO 2: Script para crear sistema de chat limpio y simple (IDEMPOTENTE)
-- Este script se puede ejecutar múltiples veces sin errores

begin;

-- Tabla para mensajes directos (sin matches) - IDEMPOTENTE
create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    sender_id uuid references public.profiles(id) on delete cascade not null,
    recipient_id uuid references public.profiles(id) on delete cascade not null,
    content text,
    message_type varchar(20) default 'text',
    media_urls text[],
    audio_duration_seconds integer,
    sent_at timestamp with time zone default now() not null,
    is_read boolean default false
);

-- Tabla para likes de usuarios (perfil a perfil) - IDEMPOTENTE
create table if not exists public.user_likes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    liked_user_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamp with time zone default now() not null,
    unique(user_id, liked_user_id)
);

-- Tabla para likes de posts - IDEMPOTENTE
create table if not exists public.post_likes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    post_id uuid references public.posts(id) on delete cascade not null,
    created_at timestamp with time zone default now() not null,
    unique(user_id, post_id)
);

-- Índices para rendimiento (solo si no existen)
do $$
begin
    if not exists (select 1 from pg_indexes where indexname = 'idx_messages_sender_id') then
        create index idx_messages_sender_id on public.messages(sender_id);
    end if;
    
    if not exists (select 1 from pg_indexes where indexname = 'idx_messages_recipient_id') then
        create index idx_messages_recipient_id on public.messages(recipient_id);
    end if;
    
    if not exists (select 1 from pg_indexes where indexname = 'idx_messages_sent_at') then
        create index idx_messages_sent_at on public.messages(sent_at);
    end if;
    
    if not exists (select 1 from pg_indexes where indexname = 'idx_user_likes_user_id') then
        create index idx_user_likes_user_id on public.user_likes(user_id);
    end if;
    
    if not exists (select 1 from pg_indexes where indexname = 'idx_user_likes_liked_user_id') then
        create index idx_user_likes_liked_user_id on public.user_likes(liked_user_id);
    end if;
    
    if not exists (select 1 from pg_indexes where indexname = 'idx_post_likes_user_id') then
        create index idx_post_likes_user_id on public.post_likes(user_id);
    end if;
    
    if not exists (select 1 from pg_indexes where indexname = 'idx_post_likes_post_id') then
        create index idx_post_likes_post_id on public.post_likes(post_id);
    end if;
end $$;

-- Habilitar RLS
alter table public.messages enable row level security;
alter table public.user_likes enable row level security;
alter table public.post_likes enable row level security;

-- Eliminar políticas existentes antes de crear nuevas
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

-- Políticas para messages (optimizadas con SELECT auth.uid())
create policy messages_select_policy on public.messages 
    for select to authenticated 
    using ((SELECT auth.uid()) = sender_id or (SELECT auth.uid()) = recipient_id);

create policy messages_insert_policy on public.messages 
    for insert to authenticated 
    with check ((SELECT auth.uid()) = sender_id);

create policy messages_update_policy on public.messages 
    for update to authenticated 
    using ((SELECT auth.uid()) = sender_id) 
    with check ((SELECT auth.uid()) = sender_id);

create policy messages_delete_policy on public.messages 
    for delete to authenticated 
    using ((SELECT auth.uid()) = sender_id);

-- Políticas para user_likes (optimizadas)
create policy user_likes_select_policy on public.user_likes 
    for select to authenticated 
    using ((SELECT auth.uid()) = user_id);

create policy user_likes_insert_policy on public.user_likes 
    for insert to authenticated 
    with check ((SELECT auth.uid()) = user_id);

create policy user_likes_delete_policy on public.user_likes 
    for delete to authenticated 
    using ((SELECT auth.uid()) = user_id);

-- Políticas para post_likes (optimizadas)
create policy post_likes_select_policy on public.post_likes 
    for select to authenticated 
    using (true);

create policy post_likes_insert_policy on public.post_likes 
    for insert to authenticated 
    with check ((SELECT auth.uid()) = user_id);

create policy post_likes_delete_policy on public.post_likes 
    for delete to authenticated 
    using ((SELECT auth.uid()) = user_id);

-- Añadir a supabase_realtime (solo si no están ya)
do $$
begin
    if not exists (
        select 1 from pg_publication_tables 
        where pubname = 'supabase_realtime' 
        and schemaname = 'public' 
        and tablename = 'messages'
    ) then
        alter publication supabase_realtime add table public.messages;
    end if;
    
    if not exists (
        select 1 from pg_publication_tables 
        where pubname = 'supabase_realtime' 
        and schemaname = 'public' 
        and tablename = 'user_likes'
    ) then
        alter publication supabase_realtime add table public.user_likes;
    end if;
    
    if not exists (
        select 1 from pg_publication_tables 
        where pubname = 'supabase_realtime' 
        and schemaname = 'public' 
        and tablename = 'post_likes'
    ) then
        alter publication supabase_realtime add table public.post_likes;
    end if;
end $$;

commit;
