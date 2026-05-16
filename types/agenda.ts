export interface Evenement {
  id: string;
  titre: string;
  description: string | null;
  pavillon: string | null;
  salle: string | null;
  starts_at: string;
  ends_at: string;
  type: string | null;
  speakers: Record<string, unknown> | null;
  created_at: string | null;
}

export interface RendezVous {
  id: string;
  demandeur_id: string;
  destinataire_id: string;
  starts_at: string;
  ends_at: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string | null;
  created_at: string | null;
}
