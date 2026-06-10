import { supabaseClient } from '@/lib/supabase/client';
import type { Json } from '@/types/database.types';

async function getPlatformConfigValue(key: string, defaultValue: number): Promise<number> {
  const { data } = await supabaseClient
    .from('platform_config')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (data?.value !== undefined && data.value !== null) {
    const val = Number(data.value);
    return isNaN(val) ? defaultValue : val;
  }
  return defaultValue;
}

export async function mobileSendMessage(
  conversationId: string,
  content: string,
  userId: string,
  options?: {
    replyToId?: string | null;
    productAttachment?: Record<string, unknown> | null;
    attachmentUrl?: string | null;
    attachmentType?: 'image' | 'document' | 'product' | null;
  }
) {
  const { data: rawProfile } = await supabaseClient
    .from('profiles')
    .select('subscription_tier, account_status, daily_exchange_count, last_exchange_reset, quota_override_messages')
    .eq('id', userId)
    .single();

  if (!rawProfile) return { error: 'profile_not_found' };

  const profile = rawProfile as unknown as {
    subscription_tier: string | null;
    account_status: string | null;
    daily_exchange_count: number | null;
    last_exchange_reset: string | null;
    quota_override_messages: number | null;
  };

  if (profile.account_status && profile.account_status !== 'active') {
    return { error: 'account_inactive' };
  }

  if (profile.subscription_tier === 'paid') {
    const { data: message, error: insertError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: content.trim(),
        reply_to_id: options?.replyToId ?? null,
        product_attachment: (options?.productAttachment as Json | null) ?? null,
        attachment_url: options?.attachmentUrl ?? null,
        attachment_type: options?.attachmentType ?? null,
        is_read: false,
      })
      .select()
      .single();

    if (insertError || !message) return { error: 'insert_failed' };

    await supabaseClient
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return { data: message };
  }

  const dailyLimit = profile.quota_override_messages ?? await getPlatformConfigValue('daily_message_limit', 10);

  const { count: totalSent } = await supabaseClient
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', userId);

  const totalLimit = await getPlatformConfigValue('total_message_limit', 100);
  if (totalSent !== null && totalSent >= totalLimit) {
    return { error: 'total_quota_exceeded' };
  }

  const now = new Date();
  const lastReset = profile.last_exchange_reset ? new Date(profile.last_exchange_reset) : null;
  const isSameDay = lastReset
    ? lastReset.getFullYear() === now.getFullYear() &&
      lastReset.getMonth() === now.getMonth() &&
      lastReset.getDate() === now.getDate()
    : false;
  const dailyCount = isSameDay ? (profile.daily_exchange_count ?? 0) : 0;

  if (dailyCount >= dailyLimit) {
    return { error: 'daily_quota_exceeded' };
  }

  const { data: message, error: insertError } = await supabaseClient
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: content.trim(),
      reply_to_id: options?.replyToId ?? null,
      product_attachment: (options?.productAttachment as Json | null) ?? null,
      attachment_url: options?.attachmentUrl ?? null,
      attachment_type: options?.attachmentType ?? null,
      is_read: false,
    })
    .select()
    .single();

  if (insertError || !message) return { error: 'insert_failed' };

  await supabaseClient
    .from('conversations')
    .update({ last_message_at: now.toISOString() })
    .eq('id', conversationId);

  const newCount = dailyCount + 1;
  await supabaseClient
    .from('profiles')
    .update({
      daily_exchange_count: newCount,
      last_exchange_reset: isSameDay ? (profile as any).last_exchange_reset : now.toISOString(),
    })
    .eq('id', userId);

  return { data: message };
}

export async function mobileCreateConversation(targetProfileId: string, userId: string) {
  const sortedParticipants = [userId, targetProfileId].sort();
  const participantA = sortedParticipants[0];
  const participantB = sortedParticipants[1];

  const { data: existing } = await supabaseClient
    .from('conversations')
    .select('id')
    .eq('participant_a', participantA)
    .eq('participant_b', participantB)
    .maybeSingle();

  if (existing) return { data: existing, created: false };

  const { data: myProfile } = await supabaseClient
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  const tier = (myProfile as any)?.subscription_tier === 'paid' ? 'paid' : 'free_trial';

  const { data: newConversation, error } = await supabaseClient
    .from('conversations')
    .insert({
      participant_a: participantA,
      participant_b: participantB,
      initiated_by: userId,
      initiated_by_tier: tier,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: newConversation, created: true };
}

export async function mobileGetConversationId(targetProfileId: string, userId: string) {
  const sortedParticipants = [userId, targetProfileId].sort();
  const { data } = await supabaseClient
    .from('conversations')
    .select('id')
    .eq('participant_a', sortedParticipants[0])
    .eq('participant_b', sortedParticipants[1])
    .maybeSingle();
  return data?.id || null;
}

export async function mobileCheckQuota(userId: string) {
  const { data: rawProfile } = await supabaseClient
    .from('profiles')
    .select('subscription_tier, daily_exchange_count, last_exchange_reset')
    .eq('id', userId)
    .single();

  if (!rawProfile) return { allowed: false, reason: 'profile_not_found' };

  const profile = rawProfile as unknown as {
    subscription_tier: string | null;
    daily_exchange_count: number | null;
    last_exchange_reset: string | null;
  };

  if (profile.subscription_tier === 'paid') return { allowed: true };

  const dailyLimit = await getPlatformConfigValue('daily_message_limit', 10);
  const now = new Date();
  const lastReset = profile.last_exchange_reset ? new Date(profile.last_exchange_reset) : null;
  const isSameDay = lastReset
    ? lastReset.getFullYear() === now.getFullYear() &&
      lastReset.getMonth() === now.getMonth() &&
      lastReset.getDate() === now.getDate()
    : false;
  const currentCount = isSameDay ? (profile.daily_exchange_count ?? 0) : 0;

  if (currentCount >= dailyLimit) return { allowed: false, reason: 'daily_quota_exceeded' };
  return { allowed: true };
}

export async function mobileFetchFeed(mode: string, page: number, limit: number, myId: string, seed?: string) {
  const { data: blocks } = await supabaseClient
    .from('blocked_users')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${myId},blocked_id.eq.${myId}`);

  const blockedIds = Array.from(new Set((blocks || []).map((b: any) => b.blocker_id === myId ? b.blocked_id : b.blocker_id)));

  let query = supabaseClient
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(
        id, full_name, company, avatar_url, role, subscription_tier,
        exposants!exposants_profile_id_fkey(id, nom, is_featured)
      )
    `);

  if (blockedIds.length > 0) {
    query = query.not('author_id', 'in', `(${blockedIds.join(',')})`);
  }

  const { data: posts } = await query;
  if (!posts) return [];

  const validPosts = posts.filter((p: any) => p.author !== null);

  if (mode === 'recent') {
    const sponsored: any[] = [];
    const normal: any[] = [];

    for (const post of validPosts) {
      const isSponsored = (post as any).author.subscription_tier === 'paid' && (post as any).author.exposants?.[0]?.is_featured;
      if (isSponsored) sponsored.push(post);
      else normal.push(post);
    }

    sponsored.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    normal.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    const all = [...sponsored, ...normal];
    const startIndex = page * limit;
    return all.slice(startIndex, startIndex + limit);
  }

  if (mode === 'discover') {
    const usedSeed = seed || Math.floor(Date.now() / (30 * 60 * 1000)).toString();
    function cyrb128(str: string) {
      let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
      for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
      }
      h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
      h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
      h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
      h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
      return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
    }
    
    validPosts.sort((a: any, b: any) => {
      const aSp = (a as any).author.subscription_tier === 'paid' && (a as any).author.exposants?.[0]?.is_featured;
      const bSp = (b as any).author.subscription_tier === 'paid' && (b as any).author.exposants?.[0]?.is_featured;
      const aR = cyrb128(a.id + usedSeed)[0] / 4294967296;
      const bR = cyrb128(b.id + usedSeed)[0] / 4294967296;
      const sponsoredWeightRatio = 3;
      return (bR * (bSp ? sponsoredWeightRatio : 1)) - (aR * (aSp ? sponsoredWeightRatio : 1));
    });

    const startIndex = page * limit;
    return validPosts.slice(startIndex, startIndex + limit);
  }

  return [];
}

export async function mobileCreatePost(content: string, userId: string, options?: { type?: string; category?: string | null; imageUrls?: string[]; repostOfId?: string | null }) {
  const { count: totalSent } = await supabaseClient
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', userId);

  const { data: rawProfile } = await supabaseClient
    .from('profiles')
    .select('subscription_tier, quota_override_posts')
    .eq('id', userId)
    .single();

  if (!rawProfile) return { error: 'profile_not_found' };

  const profile = rawProfile as unknown as {
    subscription_tier: string | null;
    quota_override_posts: number | null;
  };

  if (profile.subscription_tier === 'paid') {
    // PAID — pas de limite, passer directement à l'insertion
  } else {
    const postLimit = profile.quota_override_posts ?? await getPlatformConfigValue('max_posts_free_trial', 2);
    if (totalSent !== null && totalSent >= postLimit) {
      return { error: 'post_quota_exceeded' };
    }
  }

  const { data: newPost, error } = await supabaseClient
    .from('posts')
    .insert({
      author_id: userId,
      content,
      type: options?.type ?? 'general',
      category: options?.category ?? null,
      image_url: options?.imageUrls?.length ? options.imageUrls.join(',') : null,
      repost_of_id: options?.repostOfId ?? null,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: newPost };
}

export async function mobileSubscribeNewsletter(
  email: string,
  options?: { sectors?: string[]; frequency?: string }
) {
  const { data: existing } = await supabaseClient
    .from('newsletter_subscriptions')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    await supabaseClient
      .from('newsletter_subscriptions')
      .update({
        sectors: options?.sectors ?? [],
        frequency: options?.frequency ?? 'weekly',
        is_active: true,
      })
      .eq('email', email);
    return { message: 'Subscription updated' };
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  const profileId = session?.user?.id ?? null;

  const { error } = await supabaseClient
    .from('newsletter_subscriptions')
    .insert({
      profile_id: profileId,
      email,
      sectors: options?.sectors ?? [],
      frequency: options?.frequency ?? 'weekly',
      is_active: true,
      unsubscribe_token: crypto.randomUUID(),
    });

  if (error) return { error: error.message };
  return { message: 'Subscribed successfully' };
}

export async function mobileUnsubscribeNewsletter(email: string) {
  const { error } = await supabaseClient
    .from('newsletter_subscriptions')
    .update({ is_active: false })
    .eq('email', email);

  if (error) return { error: error.message };
  return { message: 'Unsubscribed successfully' };
}

export async function mobileFetchVitrine() {
  const { data: produits, error } = await supabaseClient
    .from('produits')
    .select('*, exposants!inner(id, nom, secteur, pays, pavillon, logo_url, is_featured, profiles!inner(subscription_tier))')
    .order('created_at', { ascending: false });

  if (error) return [];

  const sorted = (produits || []).sort((a: any, b: any) => {
    const aTier = a.exposants?.profiles?.subscription_tier;
    const bTier = b.exposants?.profiles?.subscription_tier;
    const aPaid = aTier === 'paid';
    const bPaid = bTier === 'paid';
    const aScore = (aPaid && a.exposants?.is_featured ? 3 : 0) + (aPaid && !a.exposants?.is_featured ? 2 : 0) + (!aPaid ? 1 : 0);
    const bScore = (bPaid && b.exposants?.is_featured ? 3 : 0) + (bPaid && !b.exposants?.is_featured ? 2 : 0) + (!bPaid ? 1 : 0);
    if (aScore !== bScore) return bScore - aScore;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  return sorted;
}

export async function mobileCreateOffer(
  exposantId: string,
  userId: string,
  data: { name: string; description?: string | null; prixIndicatif?: string | null; categorie?: string | null; imageUrl?: string | null }
) {
  const { count: totalSent } = await supabaseClient
    .from('produits')
    .select('id', { count: 'exact', head: true })
    .eq('exposant_id', exposantId);

  const { data: rawProfile } = await supabaseClient
    .from('profiles')
    .select('subscription_tier, quota_override_vitrine')
    .eq('id', userId)
    .single();

  const profile = rawProfile as unknown as {
    subscription_tier: string | null;
    quota_override_vitrine: number | null;
  } | null;

  const isPaid = profile?.subscription_tier === 'paid';
  if (!isPaid) {
    const limit = profile?.quota_override_vitrine ?? await getPlatformConfigValue('max_vitrine_offers_free_trial', 2);
    if (totalSent !== null && totalSent >= limit) {
      return { error: 'vitrine_quota_exceeded' };
    }
  }

  const { data: newOffer, error } = await supabaseClient
    .from('produits')
    .insert({
      exposant_id: exposantId,
      nom: data.name,
      description: data.description,
      prix_indicatif: data.prixIndicatif ?? null,
      categorie: data.categorie ?? null,
      image_url: data.imageUrl ?? null,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: newOffer };
}

export async function mobileResetPassword(email: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://promote-connect.com';
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/reset-password`,
  });
  if (error) return { error: error.message };
  return { success: true };
}
