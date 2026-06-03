-- Restreindre l'insertion newsletter aux abonnés PAID
-- CdC §1.2 : "Newsletter PROMOTE — Non [free trial] / Oui [PAID]"

-- Supprimer les anciennes politiques
drop policy if exists "Anyone can subscribe to newsletter" on newsletter_subscriptions;
drop policy if exists "Service role can manage newsletter subscriptions" on newsletter_subscriptions;

-- INSERT : uniquement les utilisateurs authentifiés PAID
create policy "PAID users can subscribe to newsletter"
  on newsletter_subscriptions for insert
  with check (
    auth.uid() is not null
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and subscription_tier = 'paid'
    )
  );

-- SELECT : l'utilisateur voit sa propre souscription, ou admin
create policy "Users can view own newsletter subscription"
  on newsletter_subscriptions for select
  using (
    auth.uid() = profile_id
    or exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- UPDATE : l'utilisateur peut modifier sa propre souscription
create policy "Users can update own newsletter subscription"
  on newsletter_subscriptions for update
  using (auth.uid() = profile_id);
