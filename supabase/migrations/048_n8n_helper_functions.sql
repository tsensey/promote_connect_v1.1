-- Vues sécurisées pour permettre à n8n (avec SERVICE_ROLE_KEY) d'accéder aux données via API REST

-- 1. Vue pour résoudre les emails depuis auth.users
create or replace view n8n_user_emails as
select
  id as profile_id,
  email
from auth.users;

-- Sécurité n8n_user_emails
revoke all on n8n_user_emails from public, authenticated, anon;
grant select on n8n_user_emails to service_role;


-- 2. Vue pour la newsletter (croise les abonnés actifs avec la dernière édition)
create or replace view v_newsletter_ready_to_send as
select 
  ns.email, 
  ne.titre, 
  ne.contenu 
from newsletter_subscriptions ns 
cross join (
  select titre, contenu from newsletter_editions order by created_at desc limit 1
) ne 
where ns.is_active = true;

-- Sécurité v_newsletter_ready_to_send
revoke all on v_newsletter_ready_to_send from public, authenticated, anon;
grant select on v_newsletter_ready_to_send to service_role;


-- 3. Vue pour les rappels de rendez-vous (J-1)
create or replace view v_rdv_reminders as
select 
  r.id, 
  r.starts_at, 
  em_dem.email as demandeur_email, 
  em_dest.email as destinataire_email 
from rendez_vous r 
join n8n_user_emails em_dem on r.demandeur_id = em_dem.profile_id 
join n8n_user_emails em_dest on r.destinataire_id = em_dest.profile_id 
where r.status = 'confirmed' 
  and r.starts_at >= now() 
  and r.starts_at <= now() + interval '24 hours';

-- Sécurité v_rdv_reminders
revoke all on v_rdv_reminders from public, authenticated, anon;
grant select on v_rdv_reminders to service_role;


-- 4. Vue pour les relances d'abonnements expirant dans 7 jours
create or replace view v_expiring_subscriptions as
select 
  p.id, 
  p.full_name, 
  p.subscription_ends_at, 
  em.email 
from profiles p 
join n8n_user_emails em on p.id = em.profile_id 
where p.account_status = 'active' 
  and p.subscription_ends_at >= now() 
  and p.subscription_ends_at <= now() + interval '7 days';

-- Sécurité v_expiring_subscriptions
revoke all on v_expiring_subscriptions from public, authenticated, anon;
grant select on v_expiring_subscriptions to service_role;
