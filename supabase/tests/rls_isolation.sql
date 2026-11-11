-- Execute with `supabase test db` against a disposable local Supabase instance.
begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password)
values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-a@example.test', ''),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-b@example.test', '')
on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
insert into public.subjects(user_id, name) values ('10000000-0000-4000-8000-000000000001', 'Disciplina privada A');

select set_config('request.jwt.claims', '{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
do $$ begin
  if exists(select 1 from public.subjects where name = 'Disciplina privada A') then
    raise exception 'Falha de isolamento RLS: usuário B leu dados do usuário A';
  end if;
end $$;

rollback;
