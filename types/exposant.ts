export interface Exposant {
  id: string;
  profile_id: string | null;
  nom: string;
  description: string | null;
  secteur: string | null;
  pavillon: string | null;
  stand: string | null;
  pays: string | null;
  website: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_featured: boolean;
  email_contact: string | null;
  phone_contact: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  brochure_url: string | null;
  video_url: string | null;
  chiffre_affaires: string | null;
  annee_creation: string | null;
  nombre_employes: string | null;
  long_description: string | null;
  gallery_urls: string[] | null;
  espace_id: string | null;
  created_at: string | null;
}

export interface Produit {
  id: string;
  exposant_id: string;
  nom: string;
  description: string | null;
  categorie: string | null;
  type: string | null;
  image_url: string | null;
  prix_indicatif: string | null;
  created_at: string | null;
}
