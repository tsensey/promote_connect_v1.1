-- Newsletter system tables

create table newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  email text not null,
  sectors text[],
  frequency text default 'weekly',
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(email)
);

create table newsletter_editions (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  contenu text,
  sent_at timestamptz default now(),
  recipient_count integer,
  created_at timestamptz default now()
);

alter table newsletter_subscriptions enable row level security;
alter table newsletter_editions enable row level security;

create policy "Newsletter subscriptions are viewable by owner"
  on newsletter_subscriptions for select
  using (auth.uid() = profile_id);

create policy "Users can manage own newsletter subscription"
  on newsletter_subscriptions for all
  using (auth.uid() = profile_id);

create policy "Newsletter editions are viewable by authenticated users"
  on newsletter_editions for select
  using (auth.role() = 'authenticated');
