-- Support tickets table

create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  subject text not null,
  description text,
  status text default 'open',
  priority text default 'medium',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references support_tickets(id),
  sender_id uuid references profiles(id),
  content text not null,
  is_admin boolean default false,
  created_at timestamptz default now()
);

alter table support_tickets enable row level security;
alter table support_messages enable row level security;

create policy "Users can view own tickets"
  on support_tickets for select
  using (auth.uid() = profile_id);

create policy "Users can create tickets"
  on support_tickets for insert
  with check (auth.uid() = profile_id);

create policy "Users can view messages on own tickets"
  on support_messages for select
  using (
    ticket_id in (
      select id from support_tickets where profile_id = auth.uid()
    )
  );

create policy "Users can send messages on own tickets"
  on support_messages for insert
  with check (
    ticket_id in (
      select id from support_tickets where profile_id = auth.uid()
    )
  );
