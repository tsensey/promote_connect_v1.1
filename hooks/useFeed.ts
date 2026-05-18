/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { compressImages } from '@/lib/compress-image';
import type { Database } from '@/types/database.types';

type PostRow = Database['public']['Tables']['posts']['Row'];
type PostInsert = Database['public']['Tables']['posts']['Insert'];
type PostCommentRow = Database['public']['Tables']['post_comments']['Row'];
type PostCommentInsert = Database['public']['Tables']['post_comments']['Insert'];
type PostShareInsert = Database['public']['Tables']['post_shares']['Insert'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

type PostWithAuthor = PostRow & {
  author: Pick<ProfileRow, 'id' | 'full_name' | 'company' | 'avatar_url' | 'role'> & { exposants?: { id: string; nom?: string; logo_url?: string }[] };
};

export type Post = PostWithAuthor & {
  is_liked: boolean;
  is_shared: boolean;
  is_reposted: boolean;
  is_saved: boolean;
  reaction_type: string | null;
  author: PostWithAuthor['author'] & { is_following: boolean };
  repost_of?: (PostRow & {
    author: Pick<ProfileRow, 'id' | 'full_name' | 'company' | 'avatar_url' | 'role'> & { exposants?: { id: string; nom?: string; logo_url?: string }[] };
  }) | null;
};

export type Comment = PostCommentRow & {
  author: Pick<ProfileRow, 'id' | 'full_name' | 'company' | 'avatar_url' | 'role'> & { exposants?: { id: string; nom?: string; logo_url?: string }[] };
  parent_comment_id: string | null;
  replies?: Comment[];
};

export function useFeed(limit = 20) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const seenPostIds = useRef<Set<string>>(new Set());

  const fetchPosts = useCallback(
    async (reset = false) => {
      try {
        const { data: session } = await supabaseClient.auth.getSession();
        const myId = session?.session?.user?.id;
        if (!myId) return;
        setMyUserId(myId);

        if (reset) seenPostIds.current.clear();

        let query = supabaseClient
          .from('posts')
          .select(`
            *,
            author:profiles!posts_author_id_fkey(id, full_name, company, avatar_url, role, exposants(id))
          `)
          .limit(limit);

        if (seenPostIds.current.size > 0) {
          query = query.not('id', 'in', `(${Array.from(seenPostIds.current).join(',')})`);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;

        const newPosts = data || [];
        newPosts.forEach((p: PostWithAuthor) => seenPostIds.current.add(p.id));

        const postIds = newPosts.map((p: PostWithAuthor) => p.id);
        const repostOfIds = ((data || []) as any[]).filter((p: any) => p.repost_of_id).map((p: any) => p.repost_of_id);
        const authorIds = [...new Set((data || []).map((p: PostWithAuthor) => p.author_id))];

        const [likesResult, sharesResult, savesResult, reactionsResult, followsResult] = await Promise.all([
          supabaseClient.from('post_likes').select('post_id').in('post_id', postIds).eq('user_id', myId),
          supabaseClient.from('post_shares').select('post_id, type').in('post_id', postIds).eq('user_id', myId),
          supabaseClient.from('post_saves').select('post_id').in('post_id', postIds).eq('user_id', myId),
          supabaseClient.from('post_reactions').select('post_id, type').in('post_id', postIds).eq('user_id', myId),
          supabaseClient.from('user_follows').select('following_id').in('following_id', authorIds).eq('follower_id', myId),
        ]);

        let repostOfMap = new Map<string, PostWithAuthor>();
        if (repostOfIds.length > 0) {
          const { data: repostData } = await supabaseClient
            .from('posts')
            .select(`
              *,
              author:profiles!posts_author_id_fkey(id, full_name, company, avatar_url, role, exposants(id))
            `)
            .in('id', repostOfIds);
          if (repostData) {
            repostOfMap = new Map(repostData.map((r) => [r.id, r as unknown as PostWithAuthor]));
          }
        }

        const likedPostIds = new Set((likesResult.data || []).map((l: { post_id: string }) => l.post_id));
        const sharedPostIds = new Set(
          (sharesResult.data || []).filter((s: { type: string }) => s.type === 'share').map((s: { post_id: string }) => s.post_id)
        );
        const repostedPostIds = new Set(
          (sharesResult.data || []).filter((s: { type: string }) => s.type === 'repost').map((s: { post_id: string }) => s.post_id)
        );
        const savedPostIds = new Set((savesResult.data || []).map((s: { post_id: string }) => s.post_id));
        const reactionMap = new Map((reactionsResult.data || []).map((r: { post_id: string; type: string }) => [r.post_id, r.type]));
        const followingSet = new Set((followsResult.data || []).map((f: { following_id: string }) => f.following_id));

        const enriched: Post[] = (data || []).map((post: PostWithAuthor & { repost_of_id?: string | null }) => ({
          ...post,
          is_liked: likedPostIds.has(post.id) || reactionMap.has(post.id),
          is_shared: sharedPostIds.has(post.id),
          is_reposted: repostedPostIds.has(post.id),
          is_saved: savedPostIds.has(post.id),
          reaction_type: reactionMap.get(post.id) || null,
          author: {
            ...post.author,
            is_following: followingSet.has(post.author_id),
          },
          repost_of: post.repost_of_id ? (repostOfMap.get(post.repost_of_id) ?? null) : undefined,
        }));

        const shuffled = enriched.sort(() => Math.random() - 0.5);

        if (reset) {
          setPosts(shuffled);
        } else {
          setPosts((prev) => [...prev, ...shuffled]);
        }

        setHasMore(newPosts.length === limit);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    },
    [limit]
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
                author:profiles!posts_author_id_fkey(id, full_name, company, avatar_url, role, exposants(id))
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
                    author:profiles!posts_author_id_fkey(id, full_name, company, avatar_url, role, exposants(id))
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
      .subscribe();

    return () => { supabaseClient.removeChannel(channel); };
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    fetchPosts(false);
  }, [hasMore, loading, fetchPosts]);

  const uploadImage = useCallback(async (files: File[]): Promise<string[]> => {
    const compressed = await compressImages(files);
    const { data: session } = await supabaseClient.auth.getSession();
    const token = session?.session?.access_token;
    const formData = new FormData();
    compressed.forEach(file => formData.append('files', file));
    const res = await fetch('/api/feed/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload error");
    return data.urls || (data.url ? [data.url] : []);
  }, []);

  const createPost = useCallback(
    async (content: string, type = 'general', category?: string, imageUrls?: string[]) => {
      const { data: session } = await supabaseClient.auth.getSession();
      const myId = session?.session?.user?.id;
      if (!myId) return { error: new Error('Not authenticated') };

      const insertData: PostInsert = {
        author_id: myId,
        content: content.trim(),
        type,
        category: category || null,
        image_url: imageUrls?.length ? imageUrls.join(',') : null,
      };

      const { data: newPost, error } = await supabaseClient
        .from('posts')
        .insert(insertData)
        .select(`
          *,
          author:profiles!posts_author_id_fkey(id, full_name, company, avatar_url, role, exposants(id))
        `)
        .single();

      if (!error && newPost) {
        const enriched: Post = {
          ...(newPost as unknown as PostWithAuthor),
          is_liked: false,
          is_shared: false,
          is_reposted: false,
          is_saved: false,
          reaction_type: null,
          author: {
            ...(newPost as unknown as PostWithAuthor).author,
            is_following: false,
          },
          repost_of: undefined,
        };
        setPosts((prev) => [enriched, ...prev]);
      }

      return { error };
    },
    []
  );

  const repostPost = useCallback(async (content: string, originalPostId: string) => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return { error: new Error('Not authenticated') };

    const insertData = {
      author_id: myId,
      content: content.trim(),
      type: 'repost',
      repost_of_id: originalPostId,
    };

    const { data: newPost, error } = await (supabaseClient as any)
      .from('posts')
      .insert(insertData)
      .select(`
        *,
        author:profiles!posts_author_id_fkey(id, full_name, company, avatar_url, role, exposants(id))
      `)
      .single();

    if (!error && newPost) {
      let repostOfData = undefined;
      const d = newPost as PostWithAuthor & { repost_of_id?: string };
      if (d.repost_of_id) {
        const { data: rData } = await supabaseClient
          .from('posts')
          .select(`
            *,
            author:profiles!posts_author_id_fkey(id, full_name, company, avatar_url, role, exposants(id))
          `)
          .eq('id', d.repost_of_id)
          .single();
        if (rData) repostOfData = rData as unknown as PostWithAuthor;
      }

      const enriched: Post = {
        ...(newPost as PostWithAuthor),
        is_liked: false,
        is_shared: false,
        is_reposted: false,
        is_saved: false,
        reaction_type: null,
        author: {
          ...(newPost as PostWithAuthor).author,
          is_following: false,
        },
        repost_of: repostOfData ?? null,
      };
      setPosts((prev) => [enriched, ...prev]);

      await supabaseClient.from('post_shares').insert({ post_id: originalPostId, user_id: myId, type: 'repost' });
      const originalPost = posts.find((p) => p.id === originalPostId);
      const newCount = (originalPost?.reposts_count || 0) + 1;
      await supabaseClient.from('posts').update({ reposts_count: newCount }).eq('id', originalPostId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === originalPostId ? { ...p, is_reposted: true, reposts_count: newCount } : p
        )
      );
    }

    return { error };
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
          supabaseClient.from('posts').update({ likes_count: Math.max(0, (post.likes_count || 0) - 1) }).eq('id', postId),
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
          supabaseClient.from('posts').update({ likes_count: (post.likes_count || 0) + 1 }).eq('id', postId),
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
      await supabaseClient.from('posts').update({ shares_count: (post.shares_count ?? 0) + 1 }).eq('id', postId);
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
          supabaseClient.from('posts').update({ likes_count: Math.max(0, (post.likes_count || 0) - 1) }).eq('id', postId),
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
          await supabaseClient.from('posts').update({ likes_count: (post.likes_count || 0) + 1 }).eq('id', postId);
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
        author:profiles!post_comments_author_id_fkey(id, full_name, company, avatar_url, role, exposants(id))
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
          author:profiles!post_comments_author_id_fkey(id, full_name, company, avatar_url, role, exposants(id))
        `)
        .single();

      if (!error && data) {
        if (!parentCommentId) {
          const currentPost = posts.find((p) => p.id === postId);
          const newCount = (currentPost?.comments_count || 0) + 1;
          await supabaseClient.from('posts').update({ comments_count: newCount }).eq('id', postId);
          setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments_count: newCount } : p)));
        }
      }

      return { data: data as Comment | null, error };
    },
    [posts]
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
  };
}
