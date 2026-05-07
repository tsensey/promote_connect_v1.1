/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  realtime: {
    transport: WebSocket,
  },
});

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@promote-connect.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@2026!secure';
const ADMIN_NAME = 'Administrateur PROMOTE';

const USERS = [
  {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    full_name: ADMIN_NAME,
    role: 'admin',
    company: 'PROMOTE-CONNECT',
    sector: null,
    country: 'Cameroun',
    pavillon: null,
    subscription_status: 'active',
  },
  {
    email: 'alice@techcorp.com',
    password: 'Test1234!',
    full_name: 'Alice Martin',
    role: 'exposant',
    company: 'TechCorp',
    sector: 'Technology',
    country: 'France',
    pavillon: 'A',
    subscription_status: 'active',
  },
  {
    email: 'bob@greenenergy.com',
    password: 'Test1234!',
    full_name: 'Bob Johnson',
    role: 'exposant',
    company: 'GreenEnergy',
    sector: 'Energy',
    country: 'Germany',
    pavillon: 'B',
    subscription_status: 'active',
  },
  {
    email: 'claire@fashionplus.com',
    password: 'Test1234!',
    full_name: 'Claire Dupont',
    role: 'exposant',
    company: 'Fashion Plus',
    sector: 'Fashion',
    country: 'France',
    pavillon: 'C',
    subscription_status: 'active',
  },
  {
    email: 'david@medicare.com',
    password: 'Test1234!',
    full_name: 'David Chen',
    role: 'exposant',
    company: 'MediCare',
    sector: 'Healthcare',
    country: 'Belgium',
    pavillon: 'D',
    subscription_status: 'active',
  },
  {
    email: 'emma@buildco.com',
    password: 'Test1234!',
    full_name: 'Emma Wilson',
    role: 'exposant',
    company: 'BuildCo',
    sector: 'Construction',
    country: 'Netherlands',
    pavillon: 'E',
    subscription_status: 'active',
  },
  {
    email: 'visitor@promote-connect.com',
    password: 'Test1234!',
    full_name: 'Marie Lefevre',
    role: 'visiteur',
    company: 'Import Corp',
    sector: 'Commerce',
    country: 'France',
    pavillon: null,
    subscription_status: 'active',
  },
  {
    email: 'sophie@import-export.com',
    password: 'Test1234!',
    full_name: 'Sophie Bernard',
    role: 'visiteur',
    company: 'Import Export',
    sector: 'Logistique & Transport',
    country: 'Cameroun',
    pavillon: null,
    subscription_status: 'trial',
  },
];

const SHOWCASES = [
  {
    email: 'alice@techcorp.com',
    nom: 'TechCorp',
    description: 'Solutions logicielles innovantes pour entreprises et ecosystemes B2B.',
    secteur: 'Technology',
    pavillon: 'A',
    stand: 'A1-001',
    pays: 'France',
    website: 'https://techcorp.example.com',
    is_featured: true,
  },
  {
    email: 'bob@greenenergy.com',
    nom: 'GreenEnergy',
    description: 'Energies renouvelables et solutions durables pour sites industriels.',
    secteur: 'Energy',
    pavillon: 'B',
    stand: 'B2-005',
    pays: 'Germany',
    website: 'https://greenenergy.example.com',
    is_featured: true,
  },
  {
    email: 'claire@fashionplus.com',
    nom: 'Fashion Plus',
    description: 'Mode premium, accessoires et collections capsules pour distributeurs.',
    secteur: 'Fashion',
    pavillon: 'C',
    stand: 'C3-010',
    pays: 'France',
    website: 'https://fashionplus.example.com',
    is_featured: false,
  },
  {
    email: 'david@medicare.com',
    nom: 'MediCare',
    description: 'Solutions de sante digitale et dispositifs medicaux connectes.',
    secteur: 'Healthcare',
    pavillon: 'D',
    stand: 'D4-015',
    pays: 'Belgium',
    website: 'https://medicare.example.com',
    is_featured: true,
  },
  {
    email: 'emma@buildco.com',
    nom: 'BuildCo',
    description: 'Materiaux innovants et outils de supervision de chantier.',
    secteur: 'Construction',
    pavillon: 'E',
    stand: 'E5-020',
    pays: 'Netherlands',
    website: 'https://buildco.example.com',
    is_featured: false,
  },
  {
    email: null,
    nom: 'AgroSolutions',
    description: 'Technologies agricoles et irrigation intelligente.',
    secteur: 'Agriculture',
    pavillon: 'A',
    stand: 'A2-003',
    pays: 'Senegal',
    website: 'https://agrosolutions.example.com',
    is_featured: false,
  },
  {
    email: null,
    nom: 'AfriBank',
    description: 'Services bancaires et solutions de paiement panafricaines.',
    secteur: 'Banque & Finance',
    pavillon: 'D',
    stand: 'D1-018',
    pays: 'Cameroun',
    website: 'https://afribank.example.com',
    is_featured: true,
  },
];

const PRODUCTS = {
  TechCorp: [
    {
      nom: 'Cloud Suite Pro',
      description: 'Suite complete de gestion cloud pour PME et ETI.',
      categorie: 'Logiciel',
      prix_indicatif: '2999 EUR/an',
    },
    {
      nom: 'Security Plus',
      description: 'Cybersurveillance et protection multi-sites.',
      categorie: 'Services',
      prix_indicatif: '1500 EUR/an',
    },
  ],
  GreenEnergy: [
    {
      nom: 'Solar Panel 500W',
      description: 'Panneaux solaires haute performance pour sites critiques.',
      categorie: 'Hardware',
      prix_indicatif: '599 EUR/unite',
    },
    {
      nom: 'Audit Energetique',
      description: 'Consultation et audit complet pour industries et batiments.',
      categorie: 'Services',
      prix_indicatif: '5000 EUR',
    },
  ],
  'Fashion Plus': [
    {
      nom: 'Veste Cuir Premium',
      description: 'Collection premium faite main pour concept stores.',
      categorie: 'Vetement',
      prix_indicatif: '399 EUR',
    },
  ],
  MediCare: [
    {
      nom: 'Moniteur Cardiaque',
      description: 'Moniteur portable pour suivi clinique et a distance.',
      categorie: 'Equipement',
      prix_indicatif: '1299 EUR',
    },
  ],
  BuildCo: [
    {
      nom: 'Beton Auto-cicatrisant',
      description: 'Materiau intelligent pour ouvrages durables.',
      categorie: 'Materiau',
      prix_indicatif: '180 EUR/tonne',
    },
  ],
  AgroSolutions: [
    {
      nom: 'Kit Irrigation Smart',
      description: 'Irrigation connectee avec capteurs et supervision mobile.',
      categorie: 'Hardware',
      prix_indicatif: '2500 EUR',
    },
  ],
};

const EVENTS = [
  {
    titre: 'Keynote: Innovation Digitale',
    description: 'Presentation des tendances technologiques 2026.',
    pavillon: 'Main Hall',
    salle: 'Auditorium',
    type: 'conference',
    offsetDays: 1,
    offsetHours: 9,
    durationHours: 2,
  },
  {
    titre: 'Atelier: Energies Renouvelables',
    description: 'Formation pratique sur les solutions vertes.',
    pavillon: 'B',
    salle: 'Salle B1',
    type: 'atelier',
    offsetDays: 2,
    offsetHours: 14,
    durationHours: 3,
  },
  {
    titre: 'Networking Breakfast',
    description: 'Petit-dejeuner de reseautage professionnel.',
    pavillon: 'Main Hall',
    salle: 'Restaurant',
    type: 'networking',
    offsetDays: 3,
    offsetHours: 8,
    durationHours: 2,
  },
  {
    titre: 'Finance & Fintech Forum',
    description: 'Forum sur l innovation financiere en Afrique.',
    pavillon: 'D',
    salle: 'Auditorium',
    type: 'conference',
    offsetDays: 4,
    offsetHours: 11,
    durationHours: 2,
  },
];

async function listAllUsers() {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    throw error;
  }
  return data.users || [];
}

async function findUserByEmail(email) {
  const users = await listAllUsers();
  return users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null;
}

async function ensureAuthUser(userConfig) {
  const existingUser = await findUserByEmail(userConfig.email);

  if (existingUser) {
    await supabase.auth.admin.updateUserById(existingUser.id, {
      password: userConfig.password,
      user_metadata: {
        full_name: userConfig.full_name,
        role: userConfig.role,
        company: userConfig.company,
        sector: userConfig.sector,
        country: userConfig.country,
        pavillon: userConfig.pavillon,
      },
      email_confirm: true,
    });
    return existingUser;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: userConfig.email,
    password: userConfig.password,
    email_confirm: true,
    user_metadata: {
      full_name: userConfig.full_name,
      role: userConfig.role,
      company: userConfig.company,
      sector: userConfig.sector,
      country: userConfig.country,
      pavillon: userConfig.pavillon,
    },
  });

  if (error) {
    throw error;
  }

  return data.user;
}

async function upsertProfile(userId, userConfig) {
  const accessEndsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: userConfig.full_name,
    company: userConfig.company,
    role: userConfig.role,
    sector: userConfig.sector,
    country: userConfig.country,
    pavillon: userConfig.pavillon,
    subscription_status: userConfig.subscription_status,
    subscription_ends_at: accessEndsAt,
  });

  if (error) {
    throw error;
  }
}

async function ensureShowcase(showcase, usersByEmail) {
  const profileId = showcase.email ? usersByEmail.get(showcase.email)?.id || null : null;
  const { data: existing } = await supabase
    .from('exposants')
    .select('id')
    .eq('nom', showcase.nom)
    .maybeSingle();

  const payload = {
    profile_id: profileId,
    nom: showcase.nom,
    description: showcase.description,
    secteur: showcase.secteur,
    pavillon: showcase.pavillon,
    stand: showcase.stand,
    pays: showcase.pays,
    website: showcase.website,
    is_featured: showcase.is_featured,
  };

  if (existing?.id) {
    const { error } = await supabase.from('exposants').update(payload).eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await supabase.from('exposants').insert(payload).select('id').single();
  if (error) throw error;
  return data.id;
}

async function ensureProducts(showcaseId, showcaseName) {
  const products = PRODUCTS[showcaseName] || [];

  for (const product of products) {
    const { data: existing } = await supabase
      .from('produits')
      .select('id')
      .eq('exposant_id', showcaseId)
      .eq('nom', product.nom)
      .maybeSingle();

    const payload = {
      exposant_id: showcaseId,
      nom: product.nom,
      description: product.description,
      categorie: product.categorie,
      prix_indicatif: product.prix_indicatif,
    };

    if (existing?.id) {
      const { error } = await supabase.from('produits').update(payload).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('produits').insert(payload);
      if (error) throw error;
    }
  }
}

async function ensureEvent(eventConfig) {
  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + eventConfig.offsetDays);
  startsAt.setHours(eventConfig.offsetHours, 0, 0, 0);

  const endsAt = new Date(startsAt.getTime() + eventConfig.durationHours * 60 * 60 * 1000);

  const { data: existing } = await supabase
    .from('evenements')
    .select('id')
    .eq('titre', eventConfig.titre)
    .maybeSingle();

  const payload = {
    titre: eventConfig.titre,
    description: eventConfig.description,
    pavillon: eventConfig.pavillon,
    salle: eventConfig.salle,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    type: eventConfig.type,
    speakers: [],
  };

  if (existing?.id) {
    const { error } = await supabase.from('evenements').update(payload).eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('evenements').insert(payload);
    if (error) throw error;
  }
}

async function ensureConversation(usersByEmail) {
  const alice = usersByEmail.get('alice@techcorp.com');
  const bob = usersByEmail.get('bob@greenenergy.com');

  if (!alice || !bob) {
    return;
  }

  const participants = [alice.id, bob.id].sort();
  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .upsert({
      participant_a: participants[0],
      participant_b: participants[1],
      last_message_at: new Date().toISOString(),
    }, { onConflict: 'participant_a,participant_b' })
    .select()
    .single();

  if (conversationError) {
    throw conversationError;
  }

  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversation.id);

  if ((count || 0) === 0) {
    const { error } = await supabase.from('messages').insert([
      {
        conversation_id: conversation.id,
        sender_id: alice.id,
        content: 'Bonjour Bob, tres interesse par vos solutions energetiques.',
        is_read: true,
      },
      {
        conversation_id: conversation.id,
        sender_id: bob.id,
        content: 'Merci Alice, discutons de vos besoins cloud et de nos sites pilotes.',
        is_read: true,
      },
      {
        conversation_id: conversation.id,
        sender_id: alice.id,
        content: 'Parfait, je propose un rendez-vous demain a 14h.',
        is_read: false,
      },
    ]);

    if (error) {
      throw error;
    }
  }
}

async function ensureSubscription(usersByEmail) {
  const alice = usersByEmail.get('alice@techcorp.com');
  if (!alice) {
    return;
  }

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('profile_id', alice.id)
    .maybeSingle();

  const payload = {
    profile_id: alice.id,
    stripe_customer_id: 'cus_seed_alice',
    stripe_subscription_id: 'sub_seed_alice',
    status: 'active',
    current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase.from('subscriptions').update(payload).eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('subscriptions').insert(payload);
    if (error) throw error;
  }
}

async function ensureNewsletterData(usersByEmail) {
  const alice = usersByEmail.get('alice@techcorp.com');
  const visitor = usersByEmail.get('visitor@promote-connect.com');

  const subscriptions = [
    {
      profile_id: alice?.id || null,
      email: 'alice@techcorp.com',
      sectors: ['Technology', 'Energy'],
      frequency: 'weekly',
    },
    {
      profile_id: visitor?.id || null,
      email: 'visitor@promote-connect.com',
      sectors: ['Commerce', 'Agriculture'],
      frequency: 'monthly',
    },
  ];

  for (const subscription of subscriptions) {
    const { data: existing } = await supabase
      .from('newsletter_subscriptions')
      .select('id')
      .eq('email', subscription.email)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .update({
          profile_id: subscription.profile_id,
          sectors: subscription.sectors,
          frequency: subscription.frequency,
          is_active: true,
        })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('newsletter_subscriptions').insert({
        profile_id: subscription.profile_id,
        email: subscription.email,
        sectors: subscription.sectors,
        frequency: subscription.frequency,
        is_active: true,
      });
      if (error) throw error;
    }
  }

  const { data: existingEdition } = await supabase
    .from('newsletter_editions')
    .select('id')
    .eq('titre', 'Bienvenue sur PROMOTE-CONNECT')
    .maybeSingle();

  if (!existingEdition?.id) {
    const { error } = await supabase.from('newsletter_editions').insert({
      titre: 'Bienvenue sur PROMOTE-CONNECT',
      contenu:
        'Retrouvez les nouveaux exposants, les opportunites business de la semaine et les prochains rendez-vous du reseau.',
      sent_at: new Date().toISOString(),
      recipient_count: subscriptions.length,
    });
    if (error) throw error;
  }
}

async function ensureSupportData(usersByEmail) {
  const visitor = usersByEmail.get('visitor@promote-connect.com');
  const admin = usersByEmail.get(ADMIN_EMAIL);

  if (!visitor || !admin) {
    return;
  }

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id')
    .eq('profile_id', visitor.id)
    .eq('subject', 'Activation de mon abonnement')
    .maybeSingle();

  let ticketId = ticket?.id;

  if (!ticketId) {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        profile_id: visitor.id,
        subject: 'Activation de mon abonnement',
        description: 'Je souhaite verifier la duree de mon acces et mes modules actifs.',
        status: 'open',
        priority: 'medium',
      })
      .select('id')
      .single();

    if (error) throw error;
    ticketId = data.id;
  }

  const { count } = await supabase
    .from('support_messages')
    .select('id', { count: 'exact', head: true })
    .eq('ticket_id', ticketId);

  if ((count || 0) === 0) {
    const { error } = await supabase.from('support_messages').insert([
      {
        ticket_id: ticketId,
        sender_id: visitor.id,
        content: 'Bonjour, pouvez-vous confirmer la date de fin de mon acces ?',
        is_admin: false,
      },
      {
        ticket_id: ticketId,
        sender_id: admin.id,
        content: 'Bonjour, votre acces est bien provisionne pour une duree de 12 mois.',
        is_admin: true,
      },
    ]);

    if (error) throw error;
  }
}

async function seed() {
  console.log('========================================');
  console.log('  PROMOTE-CONNECT Seed');
  console.log('========================================');

  const usersByEmail = new Map();

  for (const userConfig of USERS) {
    const user = await ensureAuthUser(userConfig);
    await upsertProfile(user.id, userConfig);
    usersByEmail.set(userConfig.email, user);
    console.log(`  user ok: ${userConfig.email}`);
  }

  for (const showcase of SHOWCASES) {
    const showcaseId = await ensureShowcase(showcase, usersByEmail);
    await ensureProducts(showcaseId, showcase.nom);
    console.log(`  showcase ok: ${showcase.nom}`);
  }

  for (const eventConfig of EVENTS) {
    await ensureEvent(eventConfig);
    console.log(`  event ok: ${eventConfig.titre}`);
  }

  await ensureConversation(usersByEmail);
  await ensureSubscription(usersByEmail);
  await ensureNewsletterData(usersByEmail);
  await ensureSupportData(usersByEmail);

  console.log('');
  console.log('Admin credentials:');
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log('');
  console.log('Test users password: Test1234!');
  console.log('========================================');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
