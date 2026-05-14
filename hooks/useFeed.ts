import { useEffect, useState, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type PostRow = Database['public']['Tables']['posts']['Row'];
type PostInsert = Database['public']['Tables']['posts']['Insert'];
type PostCommentRow = Database['public']['Tables']['post_comments']['Row'];
type PostCommentInsert = Database['public']['Tables']['post_comments']['Insert'];
type PostLikeInsert = Database['public']['Tables']['post_likes']['Insert'];
type PostShareInsert = Database['public']['Tables']['post_shares']['Insert'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'] & {
  exposants?: { id: string }[];
};

type PostWithAuthor = PostRow & {
  author: Pick<ProfileRow, 'id' | 'full_name' | 'company' | 'avatar_url' | 'role'>;
};

type Post = PostWithAuthor & {
  is_liked: boolean;
  is_shared: boolean;
  is_reposted: boolean;
};

export type Comment = PostCommentRow & {
  author: Pick<ProfileRow, 'id' | 'full_name' | 'company' | 'avatar_url' | 'role'>;
  parent_comment_id: string | null;
  replies?: Comment[];
};

/** Fisher–Yates shuffle — randomise un tableau */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useFeed(limit = 20) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const fetchPosts = useCallback(
    async (cursor?: string) => {
      try {
        const { data: session } = await supabaseClient.auth.getSession();
        const myId = session?.session?.user?.id;
        if (!myId) return;
        setMyUserId(myId);

        let query = supabaseClient
          .from('posts')
          .select(`
            *,
            author:profiles!posts_author_id_fkey(id, full_name, company, avatar_url, role, exposants(id))
          `)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (cursor) {
          query = query.lt('created_at', cursor);
        }

        const { data, error } = await query;
        if (error) throw error;

        const postIds = (data || []).map((p: PostWithAuthor) => p.id);

        const [likesResult, sharesResult] = await Promise.all([
          supabaseClient.from('post_likes').select('post_id').in('post_id', postIds).eq('user_id', myId),
          supabaseClient.from('post_shares').select('post_id, type').in('post_id', postIds).eq('user_id', myId),
        ]);

        const likedPostIds = new Set((likesResult.data || []).map((l: { post_id: string }) => l.post_id));
        const sharedPostIds = new Set(
          (sharesResult.data || []).filter((s: { type: string }) => s.type === 'share').map((s: { post_id: string }) => s.post_id)
        );
        const repostedPostIds = new Set(
          (sharesResult.data || []).filter((s: { type: string }) => s.type === 'repost').map((s: { post_id: string }) => s.post_id)
        );

        const enriched = (data || []).map((post: PostWithAuthor) => ({
          ...post,
          is_liked: likedPostIds.has(post.id),
          is_shared: sharedPostIds.has(post.id),
          is_reposted: repostedPostIds.has(post.id),
        }));

        // Randomise le fil uniquement pour la première page
        const ordered = cursor ? enriched : shuffleArray(enriched);

        if (!cursor) {
          setPosts(ordered);
        } else {
          setPosts((prev) => [...prev, ...ordered]);
        }

        setHasMore((data || []).length === limit);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchPosts();

    const channel = supabaseClient
      .channel('feed-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => { fetchPosts(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_likes' }, () => { fetchPosts(); })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'post_likes' }, () => { fetchPosts(); })
      .subscribe();

    return () => { supabaseClient.removeChannel(channel); };
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    const lastPost = posts[posts.length - 1];
    if (lastPost) fetchPosts(lastPost.created_at ?? undefined);
  }, [hasMore, loading, posts, fetchPosts]);

  const uploadImage = useCallback(async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const res = await fetch('/api/feed/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur lors de l'upload");
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

      const { error } = await supabaseClient.from('posts').insert(insertData);
      if (!error) await fetchPosts();
      return { error };
    },
    [fetchPosts]
  );

  const deletePost = useCallback(async (postId: string) => {
    const { error } = await supabaseClient.from('posts').delete().eq('id', postId);
    if (!error) setPosts((prev) => prev.filter((p) => p.id !== postId));
    return { error };
  }, []);

  const toggleLike = useCallback(async (postId: string) => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const isLiked = post.is_liked;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, is_liked: !isLiked, likes_count: Math.max(0, p.likes_count + (isLiked ? -1 : 1)) } : p
      )
    );

    if (isLiked) {
      await supabaseClient.from('post_likes').delete().eq('post_id', postId).eq('user_id', myId);
      await supabaseClient.from('posts').update({ likes_count: Math.max(0, (post.likes_count || 0) - 1) }).eq('id', postId);
    } else {
      const likeData: PostLikeInsert = { post_id: postId, user_id: myId };
      await supabaseClient.from('post_likes').insert(likeData);
      await supabaseClient.from('posts').update({ likes_count: (post.likes_count || 0) + 1 }).eq('id', postId);
    }
  }, [posts]);

  const toggleShare = useCallback(async (postId: string) => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const isShared = post.is_shared;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, is_shared: !isShared, shares_count: Math.max(0, (p.shares_count ?? 0) + (isShared ? -1 : 1)) } : p
      )
    );

    if (isShared) {
      await supabaseClient.from('post_shares').delete().eq('post_id', postId).eq('user_id', myId).eq('type', 'share');
      await supabaseClient.from('posts').update({ shares_count: Math.max(0, (post.shares_count || 0) - 1) }).eq('id', postId);
    } else {
      const shareData: PostShareInsert = { post_id: postId, user_id: myId, type: 'share' };
      await supabaseClient.from('post_shares').insert(shareData);
      await supabaseClient.from('posts').update({ shares_count: (post.shares_count || 0) + 1 }).eq('id', postId);
    }
  }, [posts]);

  const toggleRepost = useCallback(async (postId: string) => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const isReposted = post.is_reposted;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, is_reposted: !isReposted, reposts_count: Math.max(0, (p.reposts_count ?? 0) + (isReposted ? -1 : 1)) } : p
      )
    );

    if (isReposted) {
      await supabaseClient.from('post_shares').delete().eq('post_id', postId).eq('user_id', myId).eq('type', 'repost');
      await supabaseClient.from('posts').update({ reposts_count: Math.max(0, (post.reposts_count || 0) - 1) }).eq('id', postId);
    } else {
      const repostData: PostShareInsert = { post_id: postId, user_id: myId, type: 'repost' };
      await supabaseClient.from('post_shares').insert(repostData);
      await supabaseClient.from('posts').update({ reposts_count: (post.reposts_count || 0) + 1 }).eq('id', postId);
    }
  }, [posts]);

  /** Charge les commentaires en arbre (commentaires racines + leurs réponses) */
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

    // Construire l'arbre : parent → replies[]
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
        // Incrémenter le compteur uniquement pour les commentaires racine
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
      if (!error) await fetchPosts();
      return { error };
    },
    [fetchPosts]
  );

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    toggleShare,
    toggleRepost,
    getComments,
    addComment,
    uploadImage,
    myUserId,
  };
}
