import { useEffect, useState, useCallback, useRef } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type PostRow = Database['public']['Tables']['posts']['Row'];
type PostInsert = Database['public']['Tables']['posts']['Insert'];
type PostCommentRow = Database['public']['Tables']['post_comments']['Row'];
type PostCommentInsert = Database['public']['Tables']['post_comments']['Insert'];
type PostLikeInsert = Database['public']['Tables']['post_likes']['Insert'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

type PostWithAuthor = PostRow & {
  author: Pick<ProfileRow, 'id' | 'full_name' | 'company' | 'avatar_url' | 'role'>;
};

type Post = PostWithAuthor & {
  is_liked: boolean;
};

type Comment = PostCommentRow & {
  author: Pick<ProfileRow, 'id' | 'full_name' | 'company' | 'avatar_url' | 'role'>;
};

export function useFeed(limit = 20) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const myUserIdRef = useRef<string | null>(null);

  const fetchPosts = useCallback(
    async (cursor?: string) => {
      try {
        const { data: session } = await supabaseClient.auth.getSession();
        const myId = session?.session?.user?.id;
        if (!myId) return;
        myUserIdRef.current = myId;

        let query = supabaseClient
          .from('posts')
          .select(`
            *,
            author:profiles!posts_author_id_fkey(id, full_name, company, avatar_url, role)
          `)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (cursor) {
          query = query.lt('created_at', cursor);
        }

        const { data, error } = await query;
        if (error) throw error;

        const likesQuery = supabaseClient
          .from('post_likes')
          .select('post_id')
          .in('post_id', (data || []).map((p: PostWithAuthor) => p.id))
          .eq('user_id', myId);

        const [{ data: likes }] = await Promise.all([likesQuery]);
        const likedPostIds = new Set((likes || []).map((l: { post_id: string }) => l.post_id));

        const enriched = (data || []).map((post: PostWithAuthor) => ({
          ...post,
          is_liked: likedPostIds.has(post.id),
        }));

        if (!cursor) {
          setPosts(enriched);
        } else {
          setPosts((prev) => [...prev, ...enriched]);
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
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        () => {
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_likes' },
        () => {
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_likes' },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    const lastPost = posts[posts.length - 1];
    if (lastPost) {
      fetchPosts(lastPost.created_at ?? undefined);
    }
  }, [hasMore, loading, posts, fetchPosts]);

  const createPost = useCallback(
    async (content: string, type = 'general', category?: string, imageUrl?: string) => {
      const { data: session } = await supabaseClient.auth.getSession();
      const myId = session?.session?.user?.id;
      if (!myId) return { error: new Error('Not authenticated') };

      const insertData: PostInsert = {
        author_id: myId,
        content: content.trim(),
        type,
        category: category || null,
        image_url: imageUrl || null,
      };

      const { error } = await supabaseClient.from('posts').insert(insertData);

      if (!error) {
        await fetchPosts();
      }

      return { error };
    },
    [fetchPosts]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      const { error } = await supabaseClient.from('posts').delete().eq('id', postId);
      if (!error) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
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

    if (isLiked) {
      await supabaseClient
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', myId);

      await supabaseClient
        .from('posts')
        .update({ likes_count: Math.max(0, post.likes_count - 1) })
        .eq('id', postId);

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, is_liked: false, likes_count: Math.max(0, p.likes_count - 1) }
            : p
        )
      );
    } else {
      const likeData: PostLikeInsert = {
        post_id: postId,
        user_id: myId,
      };

      await supabaseClient.from('post_likes').insert(likeData);

      await supabaseClient
        .from('posts')
        .update({ likes_count: post.likes_count + 1 })
        .eq('id', postId);

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, is_liked: true, likes_count: p.likes_count + 1 } : p
        )
      );
    }
  }, [posts]);

  const getComments = useCallback(async (postId: string): Promise<Comment[]> => {
    const { data, error } = await supabaseClient
      .from('post_comments')
      .select(`
        *,
        author:profiles!post_comments_author_id_fkey(id, full_name, company, avatar_url, role)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []) as Comment[];
  }, []);

  const addComment = useCallback(
    async (postId: string, content: string) => {
      const { data: session } = await supabaseClient.auth.getSession();
      const myId = session?.session?.user?.id;
      if (!myId) return { error: new Error('Not authenticated'), data: null };

      const insertData: PostCommentInsert = {
        post_id: postId,
        author_id: myId,
        content: content.trim(),
      };

      const { data, error } = await supabaseClient
        .from('post_comments')
        .insert(insertData)
        .select(`
          *,
          author:profiles!post_comments_author_id_fkey(id, full_name, company, avatar_url, role)
        `)
        .single();

      if (!error && data) {
        const currentPost = posts.find((p) => p.id === postId);
        const newCount = (currentPost?.comments_count || 0) + 1;

        await supabaseClient
          .from('posts')
          .update({ comments_count: newCount })
          .eq('id', postId);

        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, comments_count: newCount } : p))
        );
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
    deletePost,
    toggleLike,
    getComments,
    addComment,
    myUserId: myUserIdRef.current,
  };
}
