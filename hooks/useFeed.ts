/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { compressImages, compressImage } from '@/lib/compress-image';
import { isNativePlatform } from '@/lib/capacitor';
import { mobileFetchFeed, mobileCreatePost } from '@/lib/mobile-fallback';
import { getQuotaMessage, dispatchConversionModal } from '@/lib/quota-messages';
import type { Database } from '@/types/database.types';

type PostRow = Database['public']['Tables']['posts']['Row'];
type PostInsert = Database['public']['Tables']['posts']['Insert'];
type PostCommentRow = Database['public']['Tables']['post_comments']['Row'];
type PostCommentInsert = Database['public']['Tables']['post_comments']['Insert'];
type PostShareInsert = Database['public']['Tables']['post_shares']['Insert'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

type PostWithAuthor = PostRow & {
  author: Pick<ProfileRow, 'id' | 'full_name' | 'company' | 'avatar_url' | 'role' | 'subscription_tier'> & { exposants?: { id: string; nom?: string; logo_url?: string; is_featured?: boolean | null }[] };
};

export type Post = PostWithAuthor & {
  is_liked: boolean;
  is_shared: boolean;
  is_reposted: boolean;
  is_saved: boolean;
  reaction_type: string | null;
  author: PostWithAuthor['author'] & { is_following: boolean };
  repost_of?: (PostRow & {
    author: Pick<ProfileRow, 'id' | 'full_name' | 'company' | 'avatar_url' | 'role'> & { exposants?: { id: string; nom?: string; logo_url?: string; is_featured?: boolean | null }[] };
  }) | null;
};

export type Comment = PostCommentRow & {
  author: Pick<ProfileRow, 'id' | 'full_name' | 'company' | 'avatar_url' | 'role'> & { exposants?: { id: string; nom?: string; logo_url?: string }[] };
  parent_comment_id: string | null;
  replies?: Comment[];
};

export function useFeed(limit = 20, initialMode: 'recent' | 'discover' = 'discover') {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const pageRef = useRef(0);
  const [mode, setMode] = useState<'recent' | 'discover'>(initialMode);
  const [feedSeed, setFeedSeed] = useState<string>('');
  const seenPostIds = useRef<Set<string>>(new Set());

  const fetchPosts = useCallback(
    async (reset = false) => {
      try {
        const { data: session } = await supabaseClient.auth.getSession();
        const myId = session?.session?.user?.id;
        if (!myId) return;
        setMyUserId(myId);

        let currentSeed = feedSeed;
        if (reset) {
          seenPostIds.current.clear();
          pageRef.current = 0;
          currentSeed = Math.random().toString(36).substring(2, 15);
          setFeedSeed(currentSeed);
        }

        const currentPage = reset ? 0 : pageRef.current;
        
        // Fetch posts from API
        if (isNativePlatform()) {
          const posts = await mobileFetchFeed(mode, currentPage, limit, myId, currentSeed);
          if (reset) {
            seenPostIds.current.clear();
            posts.forEach((p: any) => seenPostIds.current.add(p.id));
          }
          if (reset) {
            setPosts(posts as any);
          } else {
            setPosts((prev) => {
              const existingIds = new Set(prev.map(p => p.id));
              const distinct = (posts as any[]).filter((p: any) => !existingIds.has(p.id));
              return [...prev, ...distinct as any];
            });
          }
          setHasMore(posts.length >= limit);
          setLoading(false);
          return;
        }

        // La route API retourne les posts déjà enrichis (is_liked, is_shared, is_saved, etc.)
        // Plus besoin de faire 5 requêtes Supabase supplémentaires côté client
        const response = await fetch(`/api/feed/sorted?mode=${mode}&page=${currentPage}&limit=${limit}&seed=${currentSeed}`);
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        const { data } = await response.json();

        const newPosts: Post[] = data || [];
        newPosts.forEach((p) => seenPostIds.current.add(p.id));

        if (reset) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => {
            const existingIds = new Set(prev.map(p => p.id));
            const distinct = newPosts.filter(p => !existingIds.has(p.id));
            return [...prev, ...distinct];
          });
        }

        if (newPosts.length > 0) {
          pageRef.current = currentPage + 1;
        }
        setHasMore(newPosts.length === limit);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    },
    [limit, mode]
  );



  useEffect(() => {
    setLoading(true);
    setPosts([]);
    setHasMore(true);
    fetchPosts(true);
  }, [fetchPosts]);

  useEffect(() => {
    const channel = supabaseClient
      .channel('feed-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload: unknown) => {
          try {
            const row = (payload as { new: { id: string; author_id: string } }).new;
            const { data: session } = await supabaseClient.auth.getSession();
            const myId = session?.session?.user?.id;
            if (!myId || row.author_id === myId) return;

            const { data } = await supabaseClient
              .from('posts')
              .select(`
                *,
                author:profiles!posts_author_id_fkey(id, full_name, company, avatar_url, role, exposants!exposants_profile_id_fkey(id, nom, logo_url, is_featured))
              `)
              .eq('id', row.id)
              .single();

            if (data) {
              let repostOfData = undefined;
              const d = data as PostWithAuthor & { repost_of_id?: string };
              if (d.repost_of_id) {
                const { data: rData } = await supabaseClient
                  .from('posts')
                  .select(`
                    *,
                    author:profiles!posts_author_id_fkey(id, full_name, company, avatar_url, role, exposants!exposants_profile_id_fkey(id, nom, logo_url, is_featured))
                  `)
                  .eq('id', d.repost_of_id)
                  .single();
                if (rData) repostOfData = rData as unknown as PostWithAuthor;
              }

              const [likesRes, sharesRes, savesRes, reactionsRes] = await Promise.all([
                supabaseClient.from('post_likes').select('post_id').eq('post_id', data.id).eq('user_id', myId),
                supabaseClient.from('post_shares').select('post_id, type').eq('post_id', data.id).eq('user_id', myId),
                (supabaseClient as any).from('post_saves').select('post_id').eq('post_id', data.id).eq('user_id', myId),
                (supabaseClient as any).from('post_reactions').select('post_id, type').eq('post_id', data.id).eq('user_id', myId),
              ]);

              const enriched: Post = {
                ...(data as PostWithAuthor),
                is_liked: (likesRes.data?.length ?? 0) > 0,
                is_shared: (sharesRes.data || []).some((s: { type: string }) => s.type === 'share'),
                is_reposted: (sharesRes.data || []).some((s: { type: string }) => s.type === 'repost'),
                is_saved: (savesRes.data?.length ?? 0) > 0,
                reaction_type: ((reactionsRes.data as { type: string }[] | null)?.[0]?.type) || null,
                author: {
                  ...(data as PostWithAuthor).author,
                  is_following: false,
                },
                repost_of: repostOfData ?? null,
              };

              setPosts((prev) => [enriched, ...prev]);
            }
          } catch { /* ignore */ }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload: unknown) => {
          const { new: newRec, old: oldRec } = payload as {
            new: { id: string; likes_count?: number; comments_count?: number; shares_count?: number; reposts_count?: number };
            old: { likes_count?: number; comments_count?: number; shares_count?: number; reposts_count?: number };
          };
          const countersChanged =
            newRec.likes_count !== oldRec.likes_count ||
            newRec.comments_count !== oldRec.comments_count ||
            newRec.shares_count !== oldRec.shares_count ||
            newRec.reposts_count !== oldRec.reposts_count;
          if (!countersChanged) return;
          setPosts((prev) =>
            prev.map((p) =>
              p.id === newRec.id ? {
                ...p,
                likes_count: newRec.likes_count ?? p.likes_count,
                comments_count: newRec.comments_count ?? p.comments_count,
                shares_count: newRec.shares_count ?? p.shares_count,
                reposts_count: newRec.reposts_count ?? p.reposts_count,
              } : p
            )
          );
        }
      )
      .subscribe();

    return () => { supabaseClient.removeChannel(channel); };
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    fetchPosts(false);
  }, [hasMore, loading, fetchPosts]);

  const refreshFeed = useCallback(async () => {
    await fetchPosts(true);
  }, [fetchPosts]);

  const uploadImage = useCallback(async (files: File[]): Promise<string[]> => {
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const uploadWithTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Upload timeout')), ms)
        ),
      ]);

    const uploadPromises = files.map(async (file) => {
      const compressedFile = await compressImage(file);

      const mimeType = compressedFile.type;
      let ext = 'jpg';
      if (mimeType === 'image/gif') ext = 'gif';
      else if (mimeType === 'image/png') ext = 'png';
      else if (mimeType === 'image/webp') ext = 'webp';

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const filePath = `posts/${fileName}`;

      const { data, error } = await uploadWithTimeout(
        supabaseClient.storage.from('feed-images').upload(filePath, compressedFile, {
          contentType: mimeType,
          cacheControl: '31536000',
          upsert: false,
        }),
        30_000
      );

      if (error) throw new Error(`Upload error: ${error.message}`);

      const { data: urlData } = supabaseClient.storage
        .from('feed-images')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    });

    return Promise.all(uploadPromises);
  }, []);

  const enrichPost = useCallback((fullPost: PostWithAuthor, likedPostIds: string[]): Post => ({
    ...(fullPost as unknown as PostWithAuthor),
    is_liked: likedPostIds.includes(fullPost.id),
    is_shared: false,
    is_reposted: false,
    is_saved: false,
    reaction_type: null,
    author: {
      ...(fullPost as unknown as PostWithAuthor).author,
      is_following: false,
    },
    repost_of: undefined,
  }), []);

  const createPost = useCallback(
    async (content: string, type = 'general', category?: string, imageUrls?: string[]) => {
      const { data: session } = await supabaseClient.auth.getSession();
      const myId = session?.session?.user?.id;
      if (!myId) return { error: new Error('Not authenticated') };

      if (isNativePlatform()) {
        const result = await mobileCreatePost(content, myId, { type, category, imageUrls });
        if (result.error === 'post_quota_exceeded') {
          dispatchConversionModal();
          return { error: new Error(getQuotaMessage('post_quota_exceeded').description) };
        }
        if (result.error) return { error: new Error(result.error) };
        if (result.data) {
          const { data: fullPost } = await supabaseClient
            .from('posts')
            .select(`
              *,
              author:profiles!posts_author_id_fkey(id, full_name, company, avatar_url, role, exposants!exposants_profile_id_fkey(id, nom, logo_url, is_featured))
            `)
            .eq('id', result.data.id)
            .single();
          if (fullPost) {
            setPosts((prev) => [enrichPost(fullPost as any, []), ...prev]);
          }
        }
        return { error: null };
      }

      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type, category, imageUrls }),
      });

      let responseBody: Record<string, unknown> = {};
      try {
        responseBody = await res.json();
      } catch {
        // réponse non-JSON
      }

      if (!res.ok) {
        const message = (responseBody.message as string)
          || (responseBody.title as string)
          || (responseBody.error as string)
          || 'Erreur lors de la création';
        if (responseBody.showConversion || responseBody.reason === 'post_quota_exceeded') {
          dispatchConversionModal();
        }
        return { error: new Error(message) };
      }

      if (responseBody.allowed === false) {
        dispatchConversionModal();
        return { error: new Error(getQuotaMessage('post_quota_exceeded').description) };
      }

      const newPost = responseBody.data as { id: string } | undefined;
      if (newPost) {
        const { data: fullPost } = await supabaseClient
          .from('posts')
          .select(`
            *,
            author:profiles!posts_author_id_fkey(id, full_name, company, avatar_url, role, exposants!exposants_profile_id_fkey(id, nom, logo_url, is_featured))
          `)
          .eq('id', newPost.id)
          .single();

        if (fullPost) {
          setPosts((prev) => [enrichPost(fullPost as any, []), ...prev]);
        }
      }

      return { error: null };
    },
    []
  );

  const repostPost = useCallback(async (content: string, originalPostId: string) => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return { error: new Error('Not authenticated') };

    if (isNativePlatform()) {
      const result = await mobileCreatePost(content, myId, { type: 'repost', repostOfId: originalPostId });
      if (result.error === 'post_quota_exceeded') {
        return { error: new Error('Quota de publications atteint pour le mode Free Trial.') };
      }
      if (result.error) return { error: new Error(result.error) };
      if (result.data) {
        const { data: fullPost } = await supabaseClient
          .from('posts')
          .select(`
            *,
            author:profiles!posts_author_id_fkey(id, full_name, company, avatar_url, role, exposants!exposants_profile_id_fkey(id, nom, logo_url, is_featured))
          `)
          .eq('id', result.data.id)
          .single();
        if (fullPost) {
          setPosts((prev) => [enrichPost(fullPost as any, []), ...prev]);
        }
      }
      return { error: null };
    }

    const res = await fetch('/api/posts/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, type: 'repost', repostOfId: originalPostId }),
    });

    const responseBody = await res.json();
    if (!res.ok) {
      return { error: new Error(responseBody.error || 'Erreur lors du repost') };
    }

    if (responseBody.allowed === false) {
      return { error: new Error('Quota de publications atteint pour le mode Free Trial.') };
    }

    const newPost = responseBody.data;
    if (newPost) {
      const { data: fullPost } = await supabaseClient
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(id, full_name, company, avatar_url, role, exposants!exposants_profile_id_fkey(id, nom, logo_url, is_featured))
        `)
        .eq('id', newPost.id)
        .single();

      if (fullPost) {
        let repostOfData = undefined;
        const d = fullPost as PostWithAuthor & { repost_of_id?: string };
        if (d.repost_of_id) {
          const { data: rData } = await supabaseClient
            .from('posts')
            .select(`
              *,
              author:profiles!posts_author_id_fkey(id, full_name, company, avatar_url, role, exposants!exposants_profile_id_fkey(id, nom, logo_url, is_featured))
            `)
            .eq('id', d.repost_of_id)
            .single();
          if (rData) repostOfData = rData as unknown as PostWithAuthor;
        }

        const enriched: Post = {
          ...(fullPost as PostWithAuthor),
          is_liked: false,
          is_shared: false,
          is_reposted: false,
          is_saved: false,
          reaction_type: null,
          author: {
            ...(fullPost as PostWithAuthor).author,
            is_following: false,
          },
          repost_of: repostOfData ?? null,
        };
        setPosts((prev) => [enriched, ...prev]);

        await supabaseClient.from('post_shares').insert({ post_id: originalPostId, user_id: myId, type: 'repost' });
        await (supabaseClient as any).rpc('increment_post_counter', { p_post_id: originalPostId, p_column: 'reposts_count', p_amount: 1 });
        setPosts((prev) =>
          prev.map((p) =>
            p.id === originalPostId ? { ...p, is_reposted: true } : p
          )
        );
      }
    }

    return { error: null };
  }, [posts]);

  const deletePost = useCallback(async (postId: string) => {
    const { error } = await supabaseClient.from('posts').delete().eq('id', postId);
    if (!error) setPosts((prev) => prev.filter((p) => p.id !== postId));
    return { error };
  }, []);

  const updatePost = useCallback(
    async (postId: string, content: string, type: string, category?: string, imageUrl?: string | null) => {
      const { data: session } = await supabaseClient.auth.getSession();
      const myId = session?.session?.user?.id;
      if (!myId) return { error: new Error('Not authenticated') };

      const updateData: Partial<PostInsert> = {
        content: content.trim(),
        type,
        category: category || null,
        ...(imageUrl !== undefined ? { image_url: imageUrl } : {}),
      };

      const { error } = await supabaseClient.from('posts').update(updateData).eq('id', postId).eq('author_id', myId);
      if (!error) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, ...updateData } as unknown as Post : p
          )
        );
      }
      return { error };
    },
    []
  );

  const toggleLike = useCallback(async (postId: string) => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const isLiked = post.is_liked;
    const prevLikesCount = post.likes_count;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, is_liked: !isLiked, likes_count: Math.max(0, (p.likes_count ?? 0) + (isLiked ? -1 : 1)), reaction_type: isLiked ? null : 'like' } : p
      )
    );

    try {
      if (isLiked) {
        await Promise.all([
          supabaseClient.from('post_likes').delete().eq('post_id', postId).eq('user_id', myId),
          (supabaseClient as any).from('post_reactions').delete().eq('post_id', postId).eq('user_id', myId),
          (supabaseClient as any).rpc('increment_post_counter', { p_post_id: postId, p_column: 'likes_count', p_amount: -1 }),
        ]);
      } else {
        await Promise.all([
          (supabaseClient as any).from('post_reactions').upsert(
            { post_id: postId, user_id: myId, type: 'like' },
            { onConflict: 'post_id,user_id' }
          ),
          (supabaseClient as any).from('post_likes').upsert(
            { post_id: postId, user_id: myId },
            { onConflict: 'post_id,user_id' }
          ),
          (supabaseClient as any).rpc('increment_post_counter', { p_post_id: postId, p_column: 'likes_count', p_amount: 1 }),
        ]);
      }
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, is_liked: isLiked, likes_count: prevLikesCount, reaction_type: isLiked ? 'like' : null } : p
        )
      );
    }
  }, [posts]);

  const sharePost = useCallback(async (postId: string) => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    if (post.is_shared) return;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, is_shared: true, shares_count: (p.shares_count ?? 0) + 1 } : p
      )
    );

    const shareData: PostShareInsert = { post_id: postId, user_id: myId, type: 'share' };
    const { error } = await supabaseClient.from('post_shares').insert(shareData);
    if (!error) {
      await (supabaseClient as any).rpc('increment_post_counter', { p_post_id: postId, p_column: 'shares_count', p_amount: 1 });
    } else {
      if (error.code === '23505') {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, is_shared: true } : p
          )
        );
      } else {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, is_shared: false, shares_count: Math.max(0, (p.shares_count ?? 0) - 1) } : p
          )
        );
      }
    }
  }, [posts]);

  const toggleSave = useCallback(async (postId: string) => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const isSaved = post.is_saved;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, is_saved: !isSaved } : p
      )
    );

    if (isSaved) {
      await (supabaseClient as any).from('post_saves').delete().eq('post_id', postId).eq('user_id', myId);
    } else {
      await (supabaseClient as any).from('post_saves').insert({ post_id: postId, user_id: myId });
    }
  }, [posts]);

  const toggleReaction = useCallback(async (postId: string, reactionType: string) => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const currentReaction = post.reaction_type;
    const wasLiked = post.is_liked;
    const prevLikesCount = post.likes_count;

    if (currentReaction === reactionType) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, is_liked: false, reaction_type: null, likes_count: Math.max(0, (p.likes_count ?? 0) - 1) } : p
        )
      );
      try {
        await Promise.all([
          (supabaseClient as any).from('post_reactions').delete().eq('post_id', postId).eq('user_id', myId),
          (supabaseClient as any).rpc('increment_post_counter', { p_post_id: postId, p_column: 'likes_count', p_amount: -1 }),
        ]);
      } catch {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, is_liked: wasLiked, reaction_type: currentReaction, likes_count: prevLikesCount } : p
          )
        );
      }
    } else {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, is_liked: true, reaction_type: reactionType, likes_count: wasLiked ? (p.likes_count ?? 0) : ((p.likes_count ?? 0) + 1) } : p
        )
      );
      try {
        await (supabaseClient as any).from('post_reactions').upsert(
          { post_id: postId, user_id: myId, type: reactionType },
          { onConflict: 'post_id,user_id' }
        );
        if (!wasLiked) {
          await (supabaseClient as any).rpc('increment_post_counter', { p_post_id: postId, p_column: 'likes_count', p_amount: 1 });
        }
      } catch {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, is_liked: wasLiked, reaction_type: currentReaction, likes_count: prevLikesCount } : p
          )
        );
      }
    }
  }, [posts]);

  const toggleFollow = useCallback(async (targetUserId: string) => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId || myId === targetUserId) return;

    const post = posts.find((p) => p.author_id === targetUserId);
    const currentlyFollowing = post?.author.is_following ?? followingIds.includes(targetUserId);

    setPosts((prev) =>
      prev.map((p) =>
        p.author_id === targetUserId ? { ...p, author: { ...p.author, is_following: !currentlyFollowing } } : p
      )
    );

    if (currentlyFollowing) {
      await (supabaseClient as any).from('user_follows').delete().eq('follower_id', myId).eq('following_id', targetUserId);
      setFollowingIds((prev) => prev.filter((id) => id !== targetUserId));
    } else {
      await (supabaseClient as any).from('user_follows').insert({ follower_id: myId, following_id: targetUserId });
      setFollowingIds((prev) => [...prev, targetUserId]);
    }
  }, [posts, followingIds]);

  const getComments = useCallback(async (postId: string): Promise<Comment[]> => {
    const { data, error } = await supabaseClient
      .from('post_comments')
      .select(`
        *,
        author:profiles!post_comments_author_id_fkey(id, full_name, company, avatar_url, role, exposants!exposants_profile_id_fkey(id, nom, logo_url))
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const allComments = (data || []) as Comment[];

    const map = new Map<string, Comment>();
    allComments.forEach((c) => map.set(c.id, { ...c, replies: [] }));

    const roots: Comment[] = [];
    map.forEach((c) => {
      if (c.parent_comment_id && map.has(c.parent_comment_id)) {
        map.get(c.parent_comment_id)!.replies!.push(c);
      } else {
        roots.push(c);
      }
    });

    return roots;
  }, []);

  const addComment = useCallback(
    async (postId: string, content: string, parentCommentId?: string) => {
      const { data: session } = await supabaseClient.auth.getSession();
      const myId = session?.session?.user?.id;
      if (!myId) return { error: new Error('Not authenticated'), data: null };

      const insertData: PostCommentInsert & { parent_comment_id?: string } = {
        post_id: postId,
        author_id: myId,
        content: content.trim(),
        ...(parentCommentId ? { parent_comment_id: parentCommentId } : {}),
      };

      const { data, error } = await supabaseClient
        .from('post_comments')
        .insert(insertData)
        .select(`
          *,
          author:profiles!post_comments_author_id_fkey(id, full_name, company, avatar_url, role, exposants!exposants_profile_id_fkey(id, nom, logo_url))
        `)
        .single();

      if (!error && data) {
        if (!parentCommentId) {
          await (supabaseClient as any).rpc('increment_post_counter', { p_post_id: postId, p_column: 'comments_count', p_amount: 1 });
        }
      }

      return { data: data as Comment | null, error };
    },
    []
  );

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    createPost,
    repostPost,
    updatePost,
    deletePost,
    toggleLike,
    sharePost,
    toggleSave,
    toggleReaction,
    toggleFollow,
    followingIds,
    getComments,
    addComment,
    uploadImage,
    myUserId,
    mode,
    setMode,
    refreshFeed,
  };
}
