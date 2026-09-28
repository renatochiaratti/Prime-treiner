alter table athletes add column rcp_ciclo_inicio date;

create table rcp_custom_exercicios (
  id uuid default gen_random_uuid() primary key,
  athlete_id uuid references athletes(id) on delete cascade,
  slot integer not null,
  nome text default '',
  updated_at timestamptz default now()
);
alter table rcp_custom_exercicios enable row level security;
create policy "allow all rcp_custom_exercicios" on rcp_custom_exercicios
  for all using (true) with check (true);
