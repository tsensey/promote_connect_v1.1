-- Migration 021 : Table de configuration des espaces/pavillons PROMOTE

-- 1. Table de reference des espaces
CREATE TABLE public.espaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  nom text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'pavillon' CHECK (type IN ('pavillon', 'espace')),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.espaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Espaces read-only for authenticated"
  ON public.espaces FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Espaces admin full access"
  ON public.espaces FOR ALL
  USING (public.is_admin());

-- 2. Ajout de la FK espace_id sur exposants
ALTER TABLE public.exposants ADD COLUMN IF NOT EXISTS espace_id uuid REFERENCES public.espaces(id);
CREATE INDEX IF NOT EXISTS idx_exposants_espace_id ON public.exposants(espace_id);

-- 3. Seed des espaces PROMOTE
INSERT INTO public.espaces (code, nom, description, type, sort_order) VALUES
  ('1',  'BTP',                         'Pavillon 1 — Bâtiment et Travaux Publics', 'pavillon', 1),
  ('2',  'Finance & Assurance',         'Pavillon 2 — Finance, Banque et Assurance', 'pavillon', 2),
  ('3',  'Numérique',                   'Pavillon 3 — Technologies Numériques', 'pavillon', 3),
  ('4',  'EU & PAYS',                   'Pavillon 4 — Europe et Pays', 'pavillon', 4),
  ('5',  'Agriculture & Aquaculture',   'Pavillon 5 — Agriculture et Aquaculture', 'pavillon', 5),
  ('6',  'Eau & Énergie',               'Pavillon 6 — Eau et Énergie', 'pavillon', 6),
  ('7',  'Import & Substitution',       'Pavillon 7 — Import et Substitution', 'pavillon', 7),
  ('8',  'Automobile',                  'Pavillon 8 — Automobile', 'pavillon', 8),
  ('9',  'Santé',                       'Pavillon 9 — Santé', 'pavillon', 9),
  ('A',  'Commerce & Général',          'Espace A — Commerce, Général et Cosmétique', 'espace', 10),
  ('B',  'Agroalimentaire & Mode',      'Espace B — Agroalimentaire, Agroindustrielle et Mode', 'espace', 11),
  ('C',  'Mindef',                      'Espace C — Mindef', 'espace', 12),
  ('D',  'Bureaux Coordination',        'Espace D — Bureaux de coordination, Finance, Rencontre, Phalda', 'espace', 13),
  ('E',  'Artisan du Nord',             'Espace E — Artisan du Nord', 'espace', 14),
  ('F',  'PME',                         'Espace F — Petites et Moyennes Entreprises', 'espace', 15),
  ('G',  'Éducation & Formations',      'Espace G — Éducation et Formations', 'espace', 16),
  ('H',  'PAD',                         'Espace H — Palais des Arts et de la DÃ©couverte', 'espace', 17),
  ('I',  'Partenaires',                 'Espace I — Partenaires', 'espace', 18),
  ('J',  'Ameublement',                 'Espace J — Ameublement', 'espace', 19),
  ('K',  'Bois',                        'Espace K — Bois et Dérivés', 'espace', 20)
ON CONFLICT (code) DO UPDATE SET
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  sort_order = EXCLUDED.sort_order;
