-- Rendez-vous : ajout de la politique UPDATE manquante
-- Le destinataire doit pouvoir accepter/refuser, le demandeur annuler

create policy "Participants can update their rendez-vous"
  on rendez_vous for update
  using (auth.uid() = demandeur_id or auth.uid() = destinataire_id)
  with check (auth.uid() = demandeur_id or auth.uid() = destinataire_id);
