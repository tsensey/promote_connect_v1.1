export type SearchEntity = 'exposant' | 'produit' | 'evenement' | 'post' | 'espace';

export interface SearchResult {
  entity_type: SearchEntity;
  entity_id: string;
  title: string;
  description: string | null;
  url: string;
  metadata: Record<string, unknown>;
  rank: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  facets: {
    types: Record<SearchEntity, number>;
  };
}

export interface SearchFilters {
  types?: SearchEntity[];
  secteur?: string;
  pavillon?: string;
  pays?: string;
}

export const SEARCH_ENTITY_LABELS: Record<SearchEntity, { icon: string; labelKey: string }> = {
  exposant: { icon: 'Store', labelKey: 'search.exposants' },
  produit: { icon: 'Package', labelKey: 'search.produits' },
  evenement: { icon: 'CalendarDays', labelKey: 'search.evenements' },
  post: { icon: 'Rss', labelKey: 'search.posts' },
  espace: { icon: 'Building2', labelKey: 'search.espaces' },
};

export const SEARCH_ENTITY_ORDER: SearchEntity[] = ['exposant', 'produit', 'evenement', 'post', 'espace'];
