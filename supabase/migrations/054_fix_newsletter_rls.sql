-- Fix RLS policy to allow anyone to subscribe to the newsletter

create policy "Anyone can subscribe to newsletter"
  on newsletter_subscriptions for insert
  with check (true);
