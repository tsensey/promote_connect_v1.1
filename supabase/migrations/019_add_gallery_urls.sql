-- Add gallery_urls column to exposants
alter table exposants add column if not exists gallery_urls jsonb default '[]'::jsonb;
