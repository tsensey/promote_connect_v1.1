-- Initial Supabase schema for PROMOTE-CONNECT

create extension if not exists pgcrypto;

create table profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  company text,
  role text,
  sector text,
  country text,
  pavillon text,
  avatar_url text,
  subscription_status text,
  subscription_ends_at timestamptz,
  stripe_customer_id text,
  created_at timestamptz default now()
);

create table exposants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  nom text not null,
  description text,
  secteur text,
  pavillon text,
  stand text,
  pays text,
  website text,
  logo_url text,
  is_featured boolean default false,
  created_at timestamptz default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid references profiles(id),
  participant_b uuid references profiles(id),
  last_message_at timestamptz,
  created_at timestamptz default now(),
  unique(participant_a, participant_b)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id),
  sender_id uuid references profiles(id),
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table evenements (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text,
  pavillon text,
  salle text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  type text,
  speakers jsonb,
  created_at timestamptz default now()
);

create table rendez_vous (
  id uuid primary key default gen_random_uuid(),
  demandeur_id uuid references profiles(id),
  destinataire_id uuid references profiles(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text default 'pending',
  notes text,
  created_at timestamptz default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text,
  current_period_end timestamptz,
  created_at timestamptz default now()
);

create table produits (
  id uuid primary key default gen_random_uuid(),
  exposant_id uuid references exposants(id),
  nom text not null,
  description text,
  categorie text,
  image_url text,
  prix_indicatif text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table exposants enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table evenements enable row level security;
alter table rendez_vous enable row level security;
alter table subscriptions enable row level security;
alter table produits enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by authenticated users"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Exposants policies
create policy "Exposants are viewable by authenticated users"
  on exposants for select
  using (auth.role() = 'authenticated');

-- Conversations policies
create policy "Users can view conversations they participate in"
  on conversations for select
  using (auth.uid() = participant_a or auth.uid() = participant_b);

create policy "Users can create conversations"
  on conversations for insert
  with check (auth.uid() = participant_a or auth.uid() = participant_b);

-- Messages policies
create policy "Users can view messages in their conversations"
  on messages for select
  using (
    conversation_id in (
      select id from conversations
      where participant_a = auth.uid() or participant_b = auth.uid()
    )
  );

create policy "Users can send messages in their conversations"
  on messages for insert
  with check (
    conversation_id in (
      select id from conversations
      where participant_a = auth.uid() or participant_b = auth.uid()
    )
  );

-- Evenements policies
create policy "Evenements are viewable by authenticated users"
  on evenements for select
  using (auth.role() = 'authenticated');

-- Rendez-vous policies
create policy "Users can view their own rendez-vous"
  on rendez_vous for select
  using (auth.uid() = demandeur_id or auth.uid() = destinataire_id);

create policy "Users can create rendez-vous"
  on rendez_vous for insert
  with check (auth.uid() = demandeur_id);

-- Subscriptions policies
create policy "Users can view own subscription"
  on subscriptions for select
  using (auth.uid() = profile_id);

-- Produits policies
create policy "Produits are viewable by authenticated users"
  on produits for select
  using (auth.role() = 'authenticated');

-- Enable realtime for conversations and messages
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table messages;
