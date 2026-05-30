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
  clean_query text;
BEGIN
  query_length := length(trim(search_query));

  IF query_length = 0 THEN
    RETURN;
  END IF;

  -- Convertir les caractères spéciaux en espaces pour éviter de casser to_tsquery
  clean_query := trim(regexp_replace(search_query, '[^a-zA-Z0-9\s\xE0-\xFF\xC0-\xDF]', ' ', 'g'));
  clean_query := trim(regexp_replace(clean_query, '\s+', ' ', 'g'));

  IF length(clean_query) = 0 THEN
    -- Fallback si la recherche ne contient que des caractères spéciaux
    RETURN QUERY SELECT * FROM search_ilike(search_query, result_types, result_limit, result_offset);
    RETURN;
  END IF;

  BEGIN
    -- Utiliser to_tsquery avec ajout de :* pour chaque mot, ce qui permet la recherche par préfixe
    query_tsquery := to_tsquery('french', replace(clean_query, ' ', ':* & ') || ':*');
  EXCEPTION WHEN OTHERS THEN
    query_tsquery := plainto_tsquery('french', clean_query);
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
  clean_query text;
BEGIN
  query_length := length(trim(search_query));

  IF query_length = 0 THEN
    RETURN;
  END IF;

  clean_query := trim(regexp_replace(search_query, '[^a-zA-Z0-9\s\xE0-\xFF\xC0-\xDF]', ' ', 'g'));
  clean_query := trim(regexp_replace(clean_query, '\s+', ' ', 'g'));

  IF length(clean_query) = 0 THEN
    RETURN QUERY SELECT * FROM search_count_ilike(search_query, result_types);
    RETURN;
  END IF;

  BEGIN
    query_tsquery := to_tsquery('french', replace(clean_query, ' ', ':* & ') || ':*');
  EXCEPTION WHEN OTHERS THEN
    query_tsquery := plainto_tsquery('french', clean_query);
  END;

  IF 'exposant' = ANY(result_types) THEN
    RETURN QUERY SELECT 'exposant'::text, count(*)::bigint FROM exposants e
      WHERE to_tsvector('french', coalesce(e.nom,'') || ' ' || coalesce(e.description,'') || ' ' || coalesce(e.secteur,'') || ' ' || coalesce(e.pays,'')) @@ query_tsquery;
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
