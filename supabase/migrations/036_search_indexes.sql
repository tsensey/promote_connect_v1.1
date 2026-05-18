-- 036: Full-Text Search indexes and unified search function

-- 1. GIN indexes for full-text search on each entity table

CREATE INDEX IF NOT EXISTS idx_exposants_search
  ON exposants
  USING GIN (to_tsvector('french',
    coalesce(nom, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(secteur, '') || ' ' ||
    coalesce(pays, '')
  ));

CREATE INDEX IF NOT EXISTS idx_produits_search
  ON produits
  USING GIN (to_tsvector('french',
    coalesce(nom, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(categorie, '')
  ));

CREATE INDEX IF NOT EXISTS idx_evenements_search
  ON evenements
  USING GIN (to_tsvector('french',
    coalesce(titre, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(type, '')
  ));

CREATE INDEX IF NOT EXISTS idx_posts_search
  ON posts
  USING GIN (to_tsvector('french',
    coalesce(content, '')
  ));

CREATE INDEX IF NOT EXISTS idx_espaces_search
  ON espaces
  USING GIN (to_tsvector('french',
    coalesce(nom, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(code, '')
  ));

-- 2. Unified search function (full-text via tsquery)

CREATE OR REPLACE FUNCTION search_all(
  search_query text,
  result_types text[] DEFAULT ARRAY['exposant', 'produit', 'evenement', 'post', 'espace'],
  result_limit int DEFAULT 10,
  result_offset int DEFAULT 0
)
RETURNS TABLE(
  entity_type text,
  entity_id uuid,
  title text,
  description text,
  url text,
  metadata jsonb,
  rank real
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  query_tsquery tsquery;
  query_length int;
BEGIN
  query_length := length(trim(search_query));

  IF query_length = 0 THEN
    RETURN;
  ELSIF query_length = 1 THEN
    RETURN QUERY
    SELECT * FROM search_ilike(search_query, result_types, result_limit, result_offset);
    RETURN;
  END IF;

  BEGIN
    query_tsquery := websearch_to_tsquery('french', search_query);
  EXCEPTION WHEN OTHERS THEN
    query_tsquery := plainto_tsquery('french', search_query);
  END;

  RETURN QUERY
  SELECT * FROM (
    SELECT
      'exposant'::text,
      e.id,
      e.nom,
      e.description,
      '/annuaire/' || e.id,
      jsonb_build_object(
        'secteur', e.secteur,
        'pavillon', e.pavillon,
        'pays', e.pays,
        'stand', e.stand,
        'logo_url', e.logo_url,
        'is_featured', e.is_featured
      ),
      ts_rank(
        to_tsvector('french', coalesce(e.nom, '') || ' ' || coalesce(e.description, '') || ' ' || coalesce(e.secteur, '') || ' ' || coalesce(e.pays, '')),
        query_tsquery
      )
    FROM exposants e
    WHERE 'exposant' = ANY(result_types)
      AND to_tsvector('french', coalesce(e.nom, '') || ' ' || coalesce(e.description, '') || ' ' || coalesce(e.secteur, '') || ' ' || coalesce(e.pays, '')) @@ query_tsquery
      AND e.is_active = true

    UNION ALL

    SELECT
      'produit'::text,
      p.id,
      p.nom,
      p.description,
      '/vitrine/' || p.exposant_id,
      jsonb_build_object(
        'categorie', p.categorie,
        'type', p.type,
        'prix_indicatif', p.prix_indicatif,
        'image_url', p.image_url,
        'exposant_id', p.exposant_id
      ),
      ts_rank(
        to_tsvector('french', coalesce(p.nom, '') || ' ' || coalesce(p.description, '') || ' ' || coalesce(p.categorie, '')),
        query_tsquery
      )
    FROM produits p
    WHERE 'produit' = ANY(result_types)
      AND to_tsvector('french', coalesce(p.nom, '') || ' ' || coalesce(p.description, '') || ' ' || coalesce(p.categorie, '')) @@ query_tsquery

    UNION ALL

    SELECT
      'evenement'::text,
      e.id,
      e.titre,
      e.description,
      '/agenda/' || e.id,
      jsonb_build_object(
        'type', e.type,
        'pavillon', e.pavillon,
        'salle', e.salle,
        'starts_at', e.starts_at,
        'ends_at', e.ends_at,
        'speakers', e.speakers
      ),
      ts_rank(
        to_tsvector('french', coalesce(e.titre, '') || ' ' || coalesce(e.description, '') || ' ' || coalesce(e.type, '')),
        query_tsquery
      )
    FROM evenements e
    WHERE 'evenement' = ANY(result_types)
      AND to_tsvector('french', coalesce(e.titre, '') || ' ' || coalesce(e.description, '') || ' ' || coalesce(e.type, '')) @@ query_tsquery

    UNION ALL

    SELECT
      'post'::text,
      p.id,
      left(p.content, 120),
      p.content,
      '/feed#' || p.id,
      jsonb_build_object(
        'type', p.type,
        'category', p.category,
        'author_id', p.author_id,
        'created_at', p.created_at,
        'image_url', p.image_url
      ),
      ts_rank(
        to_tsvector('french', coalesce(p.content, '')),
        query_tsquery
      )
    FROM posts p
    WHERE 'post' = ANY(result_types)
      AND to_tsvector('french', coalesce(p.content, '')) @@ query_tsquery

    UNION ALL

    SELECT
      'espace'::text,
      e.id,
      e.nom,
      e.description,
      CASE
        WHEN e.type = 'pavillon' THEN '/annuaire?pavillon=' || e.code
        ELSE '/annuaire?espace=' || e.code
      END,
      jsonb_build_object(
        'code', e.code,
        'type', e.type
      ),
      ts_rank(
        to_tsvector('french', coalesce(e.nom, '') || ' ' || coalesce(e.description, '') || ' ' || coalesce(e.code, '')),
        query_tsquery
      )
    FROM espaces e
    WHERE 'espace' = ANY(result_types)
      AND to_tsvector('french', coalesce(e.nom, '') || ' ' || coalesce(e.description, '') || ' ' || coalesce(e.code, '')) @@ query_tsquery
  ) sub
  ORDER BY rank DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;

-- 3. ILIKE fallback for short queries (1 character)

CREATE OR REPLACE FUNCTION search_ilike(
  search_query text,
  result_types text[] DEFAULT ARRAY['exposant', 'produit', 'evenement', 'post', 'espace'],
  result_limit int DEFAULT 10,
  result_offset int DEFAULT 0
)
RETURNS TABLE(
  entity_type text,
  entity_id uuid,
  title text,
  description text,
  url text,
  metadata jsonb,
  rank real
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  pattern text;
BEGIN
  pattern := '%' || search_query || '%';

  RETURN QUERY
  SELECT * FROM (
    SELECT
      'exposant'::text,
      e.id, e.nom, e.description,
      '/annuaire/' || e.id,
      jsonb_build_object('secteur', e.secteur, 'pavillon', e.pavillon, 'pays', e.pays, 'logo_url', e.logo_url, 'is_featured', e.is_featured),
      0.5::real
    FROM exposants e
    WHERE 'exposant' = ANY(result_types)
      AND (e.nom ILIKE pattern OR e.description ILIKE pattern OR e.secteur ILIKE pattern OR e.pays ILIKE pattern)
      AND e.is_active = true

    UNION ALL

    SELECT
      'produit'::text,
      p.id, p.nom, p.description,
      '/vitrine/' || p.exposant_id,
      jsonb_build_object('categorie', p.categorie, 'type', p.type, 'prix_indicatif', p.prix_indicatif, 'image_url', p.image_url, 'exposant_id', p.exposant_id),
      0.3::real
    FROM produits p
    WHERE 'produit' = ANY(result_types)
      AND (p.nom ILIKE pattern OR p.description ILIKE pattern OR p.categorie ILIKE pattern)

    UNION ALL

    SELECT
      'evenement'::text,
      e.id, e.titre, e.description,
      '/agenda/' || e.id,
      jsonb_build_object('type', e.type, 'pavillon', e.pavillon, 'salle', e.salle, 'starts_at', e.starts_at, 'ends_at', e.ends_at),
      0.3::real
    FROM evenements e
    WHERE 'evenement' = ANY(result_types)
      AND (e.titre ILIKE pattern OR e.description ILIKE pattern OR e.type ILIKE pattern)

    UNION ALL

    SELECT
      'post'::text,
      p.id, left(p.content, 120), p.content,
      '/feed#' || p.id,
      jsonb_build_object('type', p.type, 'author_id', p.author_id, 'created_at', p.created_at),
      0.2::real
    FROM posts p
    WHERE 'post' = ANY(result_types)
      AND p.content ILIKE pattern

    UNION ALL

    SELECT
      'espace'::text,
      e.id, e.nom, e.description,
      '/annuaire?pavillon=' || e.code,
      jsonb_build_object('code', e.code, 'type', e.type),
      0.2::real
    FROM espaces e
    WHERE 'espace' = ANY(result_types)
      AND (e.nom ILIKE pattern OR e.description ILIKE pattern OR e.code ILIKE pattern)
  ) sub
  ORDER BY rank DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;

-- 4. Count function for faceted search

CREATE OR REPLACE FUNCTION search_count(
  search_query text,
  result_types text[] DEFAULT ARRAY['exposant', 'produit', 'evenement', 'post', 'espace']
)
RETURNS TABLE(entity_type text, count bigint)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  query_tsquery tsquery;
  query_length int;
BEGIN
  query_length := length(trim(search_query));

  IF query_length = 0 THEN
    RETURN;
  END IF;

  IF query_length = 1 THEN
    RETURN QUERY SELECT * FROM search_count_ilike(search_query, result_types);
    RETURN;
  END IF;

  BEGIN
    query_tsquery := websearch_to_tsquery('french', search_query);
  EXCEPTION WHEN OTHERS THEN
    query_tsquery := plainto_tsquery('french', search_query);
  END;

  IF 'exposant' = ANY(result_types) THEN
    RETURN QUERY SELECT 'exposant'::text, count(*)::bigint FROM exposants e
      WHERE to_tsvector('french', coalesce(e.nom,'') || ' ' || coalesce(e.description,'') || ' ' || coalesce(e.secteur,'') || ' ' || coalesce(e.pays,'')) @@ query_tsquery
        AND e.is_active = true;
  END IF;

  IF 'produit' = ANY(result_types) THEN
    RETURN QUERY SELECT 'produit'::text, count(*)::bigint FROM produits p
      WHERE to_tsvector('french', coalesce(p.nom,'') || ' ' || coalesce(p.description,'') || ' ' || coalesce(p.categorie,'')) @@ query_tsquery;
  END IF;

  IF 'evenement' = ANY(result_types) THEN
    RETURN QUERY SELECT 'evenement'::text, count(*)::bigint FROM evenements e
      WHERE to_tsvector('french', coalesce(e.titre,'') || ' ' || coalesce(e.description,'') || ' ' || coalesce(e.type,'')) @@ query_tsquery;
  END IF;

  IF 'post' = ANY(result_types) THEN
    RETURN QUERY SELECT 'post'::text, count(*)::bigint FROM posts p
      WHERE to_tsvector('french', coalesce(p.content,'')) @@ query_tsquery;
  END IF;

  IF 'espace' = ANY(result_types) THEN
    RETURN QUERY SELECT 'espace'::text, count(*)::bigint FROM espaces e
      WHERE to_tsvector('french', coalesce(e.nom,'') || ' ' || coalesce(e.description,'') || ' ' || coalesce(e.code,'')) @@ query_tsquery;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION search_count_ilike(
  search_query text,
  result_types text[] DEFAULT ARRAY['exposant', 'produit', 'evenement', 'post', 'espace']
)
RETURNS TABLE(entity_type text, count bigint)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  pattern text;
BEGIN
  pattern := '%' || search_query || '%';

  IF 'exposant' = ANY(result_types) THEN
    RETURN QUERY SELECT 'exposant'::text, count(*)::bigint FROM exposants e
      WHERE (e.nom ILIKE pattern OR e.description ILIKE pattern OR e.secteur ILIKE pattern OR e.pays ILIKE pattern)
        AND e.is_active = true;
  END IF;

  IF 'produit' = ANY(result_types) THEN
    RETURN QUERY SELECT 'produit'::text, count(*)::bigint FROM produits p
      WHERE p.nom ILIKE pattern OR p.description ILIKE pattern OR p.categorie ILIKE pattern;
  END IF;

  IF 'evenement' = ANY(result_types) THEN
    RETURN QUERY SELECT 'evenement'::text, count(*)::bigint FROM evenements e
      WHERE e.titre ILIKE pattern OR e.description ILIKE pattern OR e.type ILIKE pattern;
  END IF;

  IF 'post' = ANY(result_types) THEN
    RETURN QUERY SELECT 'post'::text, count(*)::bigint FROM posts p
      WHERE p.content ILIKE pattern;
  END IF;

  IF 'espace' = ANY(result_types) THEN
    RETURN QUERY SELECT 'espace'::text, count(*)::bigint FROM espaces e
      WHERE e.nom ILIKE pattern OR e.description ILIKE pattern OR e.code ILIKE pattern;
  END IF;
END;
$$;

-- 5. Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION search_all(text, text[], int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION search_ilike(text, text[], int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION search_count(text, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION search_count_ilike(text, text[]) TO authenticated;
