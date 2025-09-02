-- ========================================
-- CREAR TABLA LIKES (REEMPLAZA MATCHES)
-- ========================================

begin;

-- Crear tabla likes si no existe
create table if not exists public.likes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    liked_user_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamp with time zone default now() not null,
    unique(user_id, liked_user_id)
);

-- Crear índices para rendimiento
create index if not exists idx_likes_user_id on public.likes(user_id);
create index if not exists idx_likes_liked_user_id on public.likes(liked_user_id);
create index if not exists idx_likes_created_at on public.likes(created_at);

-- Habilitar RLS
alter table public.likes enable row level security;

-- Eliminar políticas existentes si las hay
drop policy if exists likes_policy on public.likes;
drop policy if exists likes_select_policy on public.likes;
drop policy if exists likes_insert_policy on public.likes;
drop policy if exists likes_update_policy on public.likes;
drop policy if exists likes_delete_policy on public.likes;

-- Crear políticas específicas
create policy likes_select_policy on public.likes for select to authenticated using ((SELECT auth.uid()) = user_id);
create policy likes_insert_policy on public.likes for insert to authenticated with check ((SELECT auth.uid()) = user_id);
create policy likes_update_policy on public.likes for update to authenticated using ((SELECT auth.uid()) = user_id) with check ((SELECT auth.uid()) = user_id);
create policy likes_delete_policy on public.likes for delete to authenticated using ((SELECT auth.uid()) = user_id);

-- Añadir a supabase_realtime
alter publication supabase_realtime add table public.likes;

commit;
