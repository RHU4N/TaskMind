-- Security hardening, academic settings and idempotent agent operations.
create table if not exists public.academic_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  passing_threshold numeric(4,2) not null default 7 check (passing_threshold between 0 and 10),
  honors_threshold numeric(4,2) not null default 8.5 check (honors_threshold between 0 and 10),
  semester_start date,
  semester_end date,
  weekly_availability jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.chat_conversations(id) on delete cascade,
  tool_name text not null check (tool_name in ('createTask','updateTask','deleteTask')),
  arguments jsonb not null,
  original_prompt text not null,
  function_call_id text,
  status text not null default 'pending' check (status in ('pending','executing','completed','failed','cancelled')),
  result jsonb,
  error text,
  confirmed_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists agent_operations_user_status_idx
  on public.agent_operations(user_id, status, created_at desc);

alter table public.academic_settings enable row level security;
alter table public.agent_operations enable row level security;

drop policy if exists "own profile" on public.profiles;
drop policy if exists "own subjects" on public.subjects;
drop policy if exists "own tasks" on public.tasks;
drop policy if exists "own conversations" on public.chat_conversations;
drop policy if exists "own plans" on public.study_plans;
drop policy if exists "own subtasks" on public.subtasks;
drop policy if exists "own assessments" on public.assessments;
drop policy if exists "own attendance" on public.attendance_records;
drop policy if exists "own messages" on public.chat_messages;

-- Separate policies make the intended permissions auditable per operation.
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_delete_own" on public.profiles for delete using (id = auth.uid());

create policy "subjects_select_own" on public.subjects for select using (user_id = auth.uid());
create policy "subjects_insert_own" on public.subjects for insert with check (user_id = auth.uid());
create policy "subjects_update_own" on public.subjects for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "subjects_delete_own" on public.subjects for delete using (user_id = auth.uid());

create policy "tasks_select_own" on public.tasks for select using (user_id = auth.uid());
create policy "tasks_insert_own" on public.tasks for insert with check (user_id = auth.uid());
create policy "tasks_update_own" on public.tasks for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tasks_delete_own" on public.tasks for delete using (user_id = auth.uid());

create policy "conversations_select_own" on public.chat_conversations for select using (user_id = auth.uid());
create policy "conversations_insert_own" on public.chat_conversations for insert with check (user_id = auth.uid());
create policy "conversations_update_own" on public.chat_conversations for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "conversations_delete_own" on public.chat_conversations for delete using (user_id = auth.uid());

create policy "plans_select_own" on public.study_plans for select using (user_id = auth.uid());
create policy "plans_insert_own" on public.study_plans for insert with check (user_id = auth.uid());
create policy "plans_update_own" on public.study_plans for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "plans_delete_own" on public.study_plans for delete using (user_id = auth.uid());

create policy "subtasks_select_own" on public.subtasks for select using (exists(select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));
create policy "subtasks_insert_own" on public.subtasks for insert with check (exists(select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));
create policy "subtasks_update_own" on public.subtasks for update using (exists(select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())) with check (exists(select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));
create policy "subtasks_delete_own" on public.subtasks for delete using (exists(select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));

create policy "assessments_select_own" on public.assessments for select using (exists(select 1 from public.subjects s where s.id = subject_id and s.user_id = auth.uid()));
create policy "assessments_insert_own" on public.assessments for insert with check (exists(select 1 from public.subjects s where s.id = subject_id and s.user_id = auth.uid()));
create policy "assessments_update_own" on public.assessments for update using (exists(select 1 from public.subjects s where s.id = subject_id and s.user_id = auth.uid())) with check (exists(select 1 from public.subjects s where s.id = subject_id and s.user_id = auth.uid()));
create policy "assessments_delete_own" on public.assessments for delete using (exists(select 1 from public.subjects s where s.id = subject_id and s.user_id = auth.uid()));

create policy "attendance_select_own" on public.attendance_records for select using (exists(select 1 from public.subjects s where s.id = subject_id and s.user_id = auth.uid()));
create policy "attendance_insert_own" on public.attendance_records for insert with check (exists(select 1 from public.subjects s where s.id = subject_id and s.user_id = auth.uid()));
create policy "attendance_update_own" on public.attendance_records for update using (exists(select 1 from public.subjects s where s.id = subject_id and s.user_id = auth.uid())) with check (exists(select 1 from public.subjects s where s.id = subject_id and s.user_id = auth.uid()));
create policy "attendance_delete_own" on public.attendance_records for delete using (exists(select 1 from public.subjects s where s.id = subject_id and s.user_id = auth.uid()));

create policy "messages_select_own" on public.chat_messages for select using (exists(select 1 from public.chat_conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "messages_insert_own" on public.chat_messages for insert with check (exists(select 1 from public.chat_conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "messages_update_own" on public.chat_messages for update using (exists(select 1 from public.chat_conversations c where c.id = conversation_id and c.user_id = auth.uid())) with check (exists(select 1 from public.chat_conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "messages_delete_own" on public.chat_messages for delete using (exists(select 1 from public.chat_conversations c where c.id = conversation_id and c.user_id = auth.uid()));

create policy "settings_select_own" on public.academic_settings for select using (user_id = auth.uid());
create policy "settings_insert_own" on public.academic_settings for insert with check (user_id = auth.uid());
create policy "settings_update_own" on public.academic_settings for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "settings_delete_own" on public.academic_settings for delete using (user_id = auth.uid());

create policy "agent_operations_select_own" on public.agent_operations for select using (user_id = auth.uid());
revoke insert, update, delete on public.agent_operations from authenticated;

