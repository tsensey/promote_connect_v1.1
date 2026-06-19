-- Ajout des colonnes description_html et document_url à la table evenements
-- Permet le formatage riche de la description et l'attachement de documents PDF

alter table evenements
  add column if not exists description_html text,
  add column if not exists document_url text;

-- Mise à jour de l'index de recherche pour inclure description_html converti en texte
drop index if exists idx_evenements_search;

create index if not exists idx_evenements_search
  on evenements
  using gin (to_tsvector('french',
    coalesce(titre, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(type, '')
  ));

-- Politique de stockage pour le bucket event-documents (créé via l'interface ou seed)
-- Seuls les admins peuvent uploader, lecture authentifiée
