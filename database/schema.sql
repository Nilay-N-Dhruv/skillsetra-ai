create extension if not exists pgcrypto;

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 80),
  dob date, status text, experience text, country text,
  goal text check (char_length(goal) <= 160),
  target_role text, consent_at timestamptz,
  created_at timestamptz not null default now());

create table if not exists evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competency text not null,
  source_type text not null check (source_type in ('exam','claim','challenge','github','project','defense')),
  source_ref text,
  level smallint not null check (level between 0 and 3),
  confidence numeric(3,2) check (confidence between 0 and 1),
  summary text not null, details jsonb not null default '{}',
  created_at timestamptz not null default now());
create index if not exists evidence_user_comp on evidence (user_id, competency, created_at desc);

create table if not exists exam_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null, skill text, question_ids jsonb not null,
  created_at timestamptz not null default now());

create table if not exists exam_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null unique references exam_sessions(id) on delete cascade,
  role text not null, correct int not null, total int not null check (total > 0),
  per_dimension jsonb not null, per_skill jsonb not null, answers jsonb not null,
  created_at timestamptz not null default now());
create index if not exists exam_results_user on exam_results (user_id, role, created_at);

create table if not exists challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_key text not null, response text check (char_length(response) <= 8000),
  evaluation jsonb, created_at timestamptz not null default now());

create table if not exists github_repositories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null, analysis jsonb, analyzed_at timestamptz default now(),
  unique (user_id, full_name));

-- Row Level Security: a signed-in user can only ever see and change their OWN rows.
do $$ declare t text; begin
  foreach t in array array['profiles','evidence','exam_sessions','exam_results','challenge_attempts','github_repositories'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists owner_all on %I', t);
    execute format('create policy owner_all on %I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop; end $$;

-- A blank profile is created automatically when someone signs up.
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (user_id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', '')) on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();