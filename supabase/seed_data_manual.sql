-- SEED DATA for PROMOTE-CONNECT
-- Test data for development and testing

-- Create test profiles (users)
INSERT INTO profiles (id, full_name, company, role, sector, country, pavillon, subscription_status, subscription_ends_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Alice Martin', 'TechCorp', 'exposant', 'Technology', 'France', 'A1', 'active', NOW() + INTERVAL '12 months'),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'Bob Johnson', 'GreenEnergy', 'exposant', 'Energy', 'Germany', 'B2', 'active', NOW() + INTERVAL '12 months'),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'Claire Dupont', 'Fashion Plus', 'exposant', 'Fashion', 'France', 'C3', 'active', NOW() + INTERVAL '12 months'),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, 'David Chen', 'MediCare', 'exposant', 'Healthcare', 'Belgium', 'D4', 'active', NOW() + INTERVAL '12 months'),
  ('550e8400-e29b-41d4-a716-446655440005'::uuid, 'Emma Wilson', 'BuildCo', 'exposant', 'Construction', 'Netherlands', 'E5', 'active', NOW() + INTERVAL '12 months'),
  ('550e8400-e29b-41d4-a716-446655440006'::uuid, 'Visitor User', 'Import Corp', 'visiteur', 'General', 'France', NULL, 'active', NOW() + INTERVAL '12 months');

-- Create exposants (exhibitors)
INSERT INTO exposants (id, profile_id, nom, description, secteur, pavillon, stand, pays, website, logo_url, is_featured) VALUES
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001'::uuid, 'TechCorp', 'Solutions logicielles innovantes pour entreprises', 'Technology', 'A1', 'A1-001', 'France', 'https://techcorp.example.com', NULL, true),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002'::uuid, 'GreenEnergy', 'Énergies renouvelables et durables', 'Energy', 'B2', 'B2-005', 'Germany', 'https://greenenergy.example.com', NULL, true),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003'::uuid, 'Fashion Plus', 'Vêtements et accessoires haut de gamme', 'Fashion', 'C3', 'C3-010', 'France', 'https://fashionplus.example.com', NULL, false),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004'::uuid, 'MediCare', 'Solutions de santé et dispositifs médicaux', 'Healthcare', 'D4', 'D4-015', 'Belgium', 'https://medicare.example.com', NULL, true),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440005'::uuid, 'BuildCo', 'Matériaux et équipements de construction', 'Construction', 'E5', 'E5-020', 'Netherlands', 'https://buildco.example.com', NULL, false);

-- Create products (vitrine)
INSERT INTO produits (id, exposant_id, nom, description, categorie, image_url, prix_indicatif) VALUES
  (gen_random_uuid(), (SELECT id FROM exposants WHERE nom = 'TechCorp' LIMIT 1), 'Cloud Suite Pro', 'Suite complète de gestion cloud', 'Logiciel', NULL, '2999€'),
  (gen_random_uuid(), (SELECT id FROM exposants WHERE nom = 'TechCorp' LIMIT 1), 'Security Plus', 'Solution de cybersécurité avancée', 'Services', NULL, '1500€/an'),
  (gen_random_uuid(), (SELECT id FROM exposants WHERE nom = 'GreenEnergy' LIMIT 1), 'Solar Panel 500W', 'Panneaux solaires haute performance', 'Hardware', NULL, '599€'),
  (gen_random_uuid(), (SELECT id FROM exposants WHERE nom = 'GreenEnergy' LIMIT 1), 'Wind Turbine Consultation', 'Audit et consultation éolienne', 'Services', NULL, '5000€'),
  (gen_random_uuid(), (SELECT id FROM exposants WHERE nom = 'Fashion Plus' LIMIT 1), 'Luxury Jacket', 'Veste en cuir premium', 'Vêtement', NULL, '399€'),
  (gen_random_uuid(), (SELECT id FROM exposants WHERE nom = 'Fashion Plus' LIMIT 1), 'Designer Bag', 'Sac à main collection limitée', 'Accessoire', NULL, '899€'),
  (gen_random_uuid(), (SELECT id FROM exposants WHERE nom = 'MediCare' LIMIT 1), 'Cardio Monitor', 'Moniteur cardiaque portable', 'Équipement', NULL, '1299€'),
  (gen_random_uuid(), (SELECT id FROM exposants WHERE nom = 'MediCare' LIMIT 1), 'Health Coaching', 'Service de coaching santé personnalisé', 'Services', NULL, '200€/session'),
  (gen_random_uuid(), (SELECT id FROM exposants WHERE nom = 'BuildCo' LIMIT 1), 'Smart Cement', 'Béton innovant auto-cicatrisant', 'Matériau', NULL, '180€/tonne'),
  (gen_random_uuid(), (SELECT id FROM exposants WHERE nom = 'BuildCo' LIMIT 1), 'Construction Site AI', 'IA pour supervision de chantier', 'Logiciel', NULL, '3500€/mois');

-- Create events (agenda)
INSERT INTO evenements (id, titre, description, pavillon, salle, starts_at, ends_at, type, speakers) VALUES
  (gen_random_uuid(), 'Keynote: Innovation Digitale', 'Présentation des tendances tech 2026', 'Main Hall', 'Auditorium 1', NOW() + INTERVAL '1 day' AT TIME ZONE 'UTC', NOW() + INTERVAL '1 day 2 hours' AT TIME ZONE 'UTC', 'conference', '["Alice Martin", "Tech Expert"]'::jsonb),
  (gen_random_uuid(), 'Atelier: Green Energy Solutions', 'Formation pratique sur énergies renouvelables', 'B2', 'Salle B', NOW() + INTERVAL '2 days' AT TIME ZONE 'UTC', NOW() + INTERVAL '2 days 3 hours' AT TIME ZONE 'UTC', 'atelier', '["Bob Johnson"]'::jsonb),
  (gen_random_uuid(), 'Networking Breakfast', 'Petit-déjeuner de réseautage professionnel', 'Main Hall', 'Restaurant', NOW() + INTERVAL '3 days 8 hours' AT TIME ZONE 'UTC', NOW() + INTERVAL '3 days 10 hours' AT TIME ZONE 'UTC', 'networking', '[]'::jsonb),
  (gen_random_uuid(), 'Panel Discussion: Fashion & Sustainability', 'Discussion sur la mode durable', 'C3', 'Salle C', NOW() + INTERVAL '4 days' AT TIME ZONE 'UTC', NOW() + INTERVAL '4 days 1 hour 30 minutes' AT TIME ZONE 'UTC', 'conference', '["Claire Dupont"]'::jsonb),
  (gen_random_uuid(), 'Medical Innovation Showcase', 'Présentation des innovations en santé', 'D4', 'Salle D', NOW() + INTERVAL '5 days' AT TIME ZONE 'UTC', NOW() + INTERVAL '5 days 2 hours' AT TIME ZONE 'UTC', 'conference', '["David Chen"]'::jsonb),
  (gen_random_uuid(), 'Construction Tech Workshop', 'Atelier: Technologies du bâtiment', 'E5', 'Salle E', NOW() + INTERVAL '6 days' AT TIME ZONE 'UTC', NOW() + INTERVAL '6 days 3 hours' AT TIME ZONE 'UTC', 'atelier', '["Emma Wilson"]'::jsonb),
  (gen_random_uuid(), 'Evening Gala Reception', 'Soirée de gala officielle', 'Main Hall', 'Grand Ballroom', NOW() + INTERVAL '7 days 19 hours' AT TIME ZONE 'UTC', NOW() + INTERVAL '7 days 23 hours' AT TIME ZONE 'UTC', 'networking', '[]'::jsonb);

-- Create a conversation between Alice and Bob
INSERT INTO conversations (id, participant_a, participant_b, last_message_at) VALUES
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, NOW());

-- Create sample messages
INSERT INTO messages (id, conversation_id, sender_id, content, is_read) VALUES
  (gen_random_uuid(), (SELECT id FROM conversations LIMIT 1), '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Bonjour ! Intéressé par une collaboration sur l''énergie verte ?', false),
  (gen_random_uuid(), (SELECT id FROM conversations LIMIT 1), '550e8400-e29b-41d4-a716-446655440002'::uuid, 'Oui, absolument ! On pourrait discuter de nos solutions cloud pour optimiser nos opérations.', true),
  (gen_random_uuid(), (SELECT id FROM conversations LIMIT 1), '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Parfait ! Je vous propose un RDV demain à 14h ?', true);

-- Create a subscription (Stripe)
INSERT INTO subscriptions (id, profile_id, stripe_customer_id, stripe_subscription_id, status, current_period_end) VALUES
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001'::uuid, 'cus_test_001', 'sub_test_001', 'active', NOW() + INTERVAL '12 months');
