import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const securityMigration = await readFile(new URL('../supabase/migrations/202611100002_agent_security.sql', import.meta.url), 'utf8');

test('migration habilita RLS nas novas tabelas e separa operações CRUD', () => {
  for (const table of ['academic_settings', 'agent_operations']) assert.match(securityMigration, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
  for (const operation of ['select', 'insert', 'update', 'delete']) assert.match(securityMigration, new RegExp(`tasks_${operation}_own`, 'i'));
});

test('operações do agente têm estados idempotentes e vínculo ao usuário', () => {
  assert.match(securityMigration, /user_id uuid not null references auth\.users/i);
  assert.match(securityMigration, /pending','executing','completed','failed','cancelled/i);
  assert.match(securityMigration, /revoke insert, update, delete on public\.agent_operations from authenticated/i);
});
