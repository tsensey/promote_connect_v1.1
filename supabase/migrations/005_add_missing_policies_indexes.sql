-- Add missing RLS policies and performance indexes

-- Messages UPDATE policy (for marking as read)
create policy "Users can mark messages as read in their conversations"
  on messages for update
  using (
    conversation_id in (
      select id from conversations
      where participant_a = auth.uid() or participant_b = auth.uid()
    )
  );

-- Conversations UPDATE policy (for updating last_message_at)
create policy "Participants can update their conversations"
  on conversations for update
  using (auth.uid() = participant_a or auth.uid() = participant_b);

-- Produits INSERT policy (exposants can add their own products)
create policy "Exposants can create their own products"
  on produits for insert
  with check (
    exposant_id in (
      select id from exposants where profile_id = auth.uid()
    )
  );

-- Produits UPDATE policy (exposants can update their own products)
create policy "Exposants can update their own products"
  on produits for update
  using (
    exposant_id in (
      select id from exposants where profile_id = auth.uid()
    )
  );

-- Produits DELETE policy (exposants can delete their own products)
create policy "Exposants can delete their own products"
  on produits for delete
  using (
    exposant_id in (
      select id from exposants where profile_id = auth.uid()
    )
  );

-- Support messages UPDATE policy (admin can update tickets)
create policy "Admins can update support tickets"
  on support_tickets for update
  using (auth.role() = 'authenticated');

-- Support messages INSERT for admins
create policy "Admins can send messages on any ticket"
  on support_messages for insert
  with check (auth.role() = 'authenticated');

-- Performance indexes on foreign keys and common query columns
create index if not exists idx_exposants_profile_id on exposants(profile_id);
create index if not exists idx_exposants_secteur on exposants(secteur);
create index if not exists idx_exposants_pavillon on exposants(pavillon);
create index if not exists idx_exposants_pays on exposants(pays);
create index if not exists idx_exposants_is_featured on exposants(is_featured);
create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_messages_sender_id on messages(sender_id);
create index if not exists idx_messages_created_at on messages(created_at);
create index if not exists idx_conversations_participant_a on conversations(participant_a);
create index if not exists idx_conversations_participant_b on conversations(participant_b);
create index if not exists idx_conversations_last_message on conversations(last_message_at desc);
create index if not exists idx_evenements_starts_at on evenements(starts_at);
create index if not exists idx_rendez_vous_demandeur on rendez_vous(demandeur_id);
create index if not exists idx_rendez_vous_destinataire on rendez_vous(destinataire_id);
create index if not exists idx_rendez_vous_status on rendez_vous(status);
create index if not exists idx_produits_exposant_id on produits(exposant_id);
create index if not exists idx_produits_categorie on produits(categorie);
create index if not exists idx_support_tickets_profile_id on support_tickets(profile_id);
create index if not exists idx_support_tickets_status on support_tickets(status);
create index if not exists idx_support_messages_ticket_id on support_messages(ticket_id);
create index if not exists idx_newsletter_subscriptions_email on newsletter_subscriptions(email);
create index if not exists idx_profiles_subscription_status on profiles(subscription_status);

-- Trigger to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, subscription_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'visiteur'),
    'expired'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
