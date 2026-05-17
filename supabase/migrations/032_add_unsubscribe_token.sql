-- Add unsubscribe_token for one-click secure unsubscribe
alter table newsletter_subscriptions add column if not exists unsubscribe_token text;
create index if not exists idx_newsletter_unsubscribe_token on newsletter_subscriptions(unsubscribe_token);

-- Admin policy for newsletter_subscriptions (needed for server-side operations)
create policy "Admin can manage all subscriptions"
  on newsletter_subscriptions for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
