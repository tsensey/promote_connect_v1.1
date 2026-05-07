-- PROMOTE-CONNECT seed data
-- Execute from the Supabase SQL editor with sufficient privileges.

do $$
begin
  insert into auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  )
  values
    (
      '550e8400-e29b-41d4-a716-446655440000'::uuid,
      'admin@promote-connect.com',
      crypt('Admin@2026!secure', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Administrateur PROMOTE","role":"admin","company":"PROMOTE-CONNECT"}'::jsonb,
      'authenticated',
      'authenticated'
    ),
    (
      '550e8400-e29b-41d4-a716-446655440001'::uuid,
      'alice@techcorp.com',
      crypt('Test1234!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Alice Martin","role":"exposant","company":"TechCorp","sector":"Technology","country":"France","pavillon":"A"}'::jsonb,
      'authenticated',
      'authenticated'
    ),
    (
      '550e8400-e29b-41d4-a716-446655440002'::uuid,
      'bob@greenenergy.com',
      crypt('Test1234!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Bob Johnson","role":"exposant","company":"GreenEnergy","sector":"Energy","country":"Germany","pavillon":"B"}'::jsonb,
      'authenticated',
      'authenticated'
    ),
    (
      '550e8400-e29b-41d4-a716-446655440003'::uuid,
      'claire@fashionplus.com',
      crypt('Test1234!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Claire Dupont","role":"exposant","company":"Fashion Plus","sector":"Fashion","country":"France","pavillon":"C"}'::jsonb,
      'authenticated',
      'authenticated'
    ),
    (
      '550e8400-e29b-41d4-a716-446655440004'::uuid,
      'visitor@promote-connect.com',
      crypt('Test1234!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Marie Lefevre","role":"visiteur","company":"Import Corp","sector":"Commerce","country":"France"}'::jsonb,
      'authenticated',
      'authenticated'
    )
  on conflict (id) do nothing;
end $$;

insert into profiles (
  id,
  full_name,
  company,
  role,
  sector,
  country,
  pavillon,
  subscription_status,
  subscription_ends_at
)
values
  (
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'Administrateur PROMOTE',
    'PROMOTE-CONNECT',
    'admin',
    null,
    'Cameroun',
    null,
    'active',
    now() + interval '12 months'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Alice Martin',
    'TechCorp',
    'exposant',
    'Technology',
    'France',
    'A',
    'active',
    now() + interval '12 months'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'Bob Johnson',
    'GreenEnergy',
    'exposant',
    'Energy',
    'Germany',
    'B',
    'active',
    now() + interval '12 months'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    'Claire Dupont',
    'Fashion Plus',
    'exposant',
    'Fashion',
    'France',
    'C',
    'active',
    now() + interval '12 months'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004'::uuid,
    'Marie Lefevre',
    'Import Corp',
    'visiteur',
    'Commerce',
    'France',
    null,
    'active',
    now() + interval '12 months'
  )
on conflict (id) do update
set
  full_name = excluded.full_name,
  company = excluded.company,
  role = excluded.role,
  sector = excluded.sector,
  country = excluded.country,
  pavillon = excluded.pavillon,
  subscription_status = excluded.subscription_status,
  subscription_ends_at = excluded.subscription_ends_at;

insert into exposants (profile_id, nom, description, secteur, pavillon, stand, pays, website, is_featured)
values
  (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'TechCorp',
    'Solutions logicielles innovantes pour entreprises et ecosystemes B2B.',
    'Technology',
    'A',
    'A1-001',
    'France',
    'https://techcorp.example.com',
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'GreenEnergy',
    'Energies renouvelables et solutions durables pour sites industriels.',
    'Energy',
    'B',
    'B2-005',
    'Germany',
    'https://greenenergy.example.com',
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    'Fashion Plus',
    'Mode premium, accessoires et collections capsules pour distributeurs.',
    'Fashion',
    'C',
    'C3-010',
    'France',
    'https://fashionplus.example.com',
    false
  ),
  (
    null,
    'AgroSolutions',
    'Technologies agricoles et irrigation intelligente.',
    'Agriculture',
    'A',
    'A2-003',
    'Senegal',
    'https://agrosolutions.example.com',
    false
  )
on conflict do nothing;

insert into produits (exposant_id, nom, description, categorie, prix_indicatif)
select e.id, p.nom, p.description, p.categorie, p.prix_indicatif
from (
  values
    ('TechCorp', 'Cloud Suite Pro', 'Suite complete de gestion cloud pour PME et ETI.', 'Logiciel', '2999 EUR/an'),
    ('TechCorp', 'Security Plus', 'Cybersurveillance et protection multi-sites.', 'Services', '1500 EUR/an'),
    ('GreenEnergy', 'Solar Panel 500W', 'Panneaux solaires haute performance pour sites critiques.', 'Hardware', '599 EUR/unite'),
    ('Fashion Plus', 'Veste Cuir Premium', 'Collection premium faite main pour concept stores.', 'Vetement', '399 EUR'),
    ('AgroSolutions', 'Kit Irrigation Smart', 'Irrigation connectee avec capteurs et supervision mobile.', 'Hardware', '2500 EUR')
) as p(exposant_nom, nom, description, categorie, prix_indicatif)
join exposants e on e.nom = p.exposant_nom
where not exists (
  select 1 from produits pr where pr.exposant_id = e.id and pr.nom = p.nom
);

insert into evenements (titre, description, pavillon, salle, starts_at, ends_at, type, speakers)
values
  (
    'Keynote: Innovation Digitale',
    'Presentation des tendances technologiques 2026.',
    'Main Hall',
    'Auditorium',
    now() + interval '1 day',
    now() + interval '1 day 2 hours',
    'conference',
    '[]'::jsonb
  ),
  (
    'Atelier: Energies Renouvelables',
    'Formation pratique sur les solutions vertes.',
    'B',
    'Salle B1',
    now() + interval '2 days',
    now() + interval '2 days 3 hours',
    'atelier',
    '[]'::jsonb
  ),
  (
    'Networking Breakfast',
    'Petit-dejeuner de reseautage professionnel.',
    'Main Hall',
    'Restaurant',
    now() + interval '3 days 8 hours',
    now() + interval '3 days 10 hours',
    'networking',
    '[]'::jsonb
  )
on conflict do nothing;

insert into conversations (participant_a, participant_b, last_message_at)
values
  (
    least('550e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid),
    greatest('550e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid),
    now()
  )
on conflict (participant_a, participant_b) do nothing;

insert into messages (conversation_id, sender_id, content, is_read)
select c.id, m.sender_id, m.content, m.is_read
from conversations c
cross join (
  values
    ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Bonjour Bob, tres interesse par vos solutions energetiques.', true),
    ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'Merci Alice, discutons de vos besoins cloud et de nos sites pilotes.', true),
    ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Parfait, je propose un rendez-vous demain a 14h.', false)
) as m(sender_id, content, is_read)
where c.participant_a = least('550e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid)
  and c.participant_b = greatest('550e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid)
  and not exists (
    select 1
    from messages existing
    where existing.conversation_id = c.id and existing.content = m.content
  );

insert into newsletter_subscriptions (profile_id, email, sectors, frequency, is_active)
values
  (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'alice@techcorp.com',
    array['Technology', 'Energy'],
    'weekly',
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004'::uuid,
    'visitor@promote-connect.com',
    array['Commerce', 'Agriculture'],
    'monthly',
    true
  )
on conflict (email) do update
set
  sectors = excluded.sectors,
  frequency = excluded.frequency,
  is_active = excluded.is_active;

insert into newsletter_editions (titre, contenu, sent_at, recipient_count)
select
  'Bienvenue sur PROMOTE-CONNECT',
  'Retrouvez les nouveaux exposants, les opportunites business de la semaine et les prochains rendez-vous du reseau.',
  now(),
  2
where not exists (
  select 1 from newsletter_editions where titre = 'Bienvenue sur PROMOTE-CONNECT'
);

insert into support_tickets (profile_id, subject, description, status, priority)
select
  '550e8400-e29b-41d4-a716-446655440004'::uuid,
  'Activation de mon abonnement',
  'Je souhaite verifier la duree de mon acces et mes modules actifs.',
  'open',
  'medium'
where not exists (
  select 1
  from support_tickets
  where profile_id = '550e8400-e29b-41d4-a716-446655440004'::uuid
    and subject = 'Activation de mon abonnement'
);

insert into subscriptions (profile_id, stripe_customer_id, stripe_subscription_id, status, current_period_end)
select
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'cus_seed_alice',
  'sub_seed_alice',
  'active',
  now() + interval '12 months'
where not exists (
  select 1 from subscriptions where stripe_subscription_id = 'sub_seed_alice'
);
