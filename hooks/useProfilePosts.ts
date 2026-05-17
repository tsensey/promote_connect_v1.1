'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type PostRow = Database['public']['Tables']['posts']['Row'];
type PostInsert = Database['public']['Tables']['posts']['Insert'];
type PostCommentRow = Database['public']['Tables']['post_comments']['Row'];
type PostCommentInsert = Database['public']['Tables']['post_comments']['Insert'];
type PostShareInsert = Database['public']['Tables']['post_shares']['Insert'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

type PostWithAuthor = PostRow & {
  author: Pick<ProfileRow, 'id' | 'full_name' | 'company' | 'avatar_url' | 'role'> & { exposants?: { id: string }[] };
};

export interface ProfilePost extends PostWithAuthor {
  is_liked: boolean;
  is_shared: boolean;
  is_reposted: boolean;
  is_saved: boolean;
  reaction_type: string | null;
  author: PostWithAuthor['author'] & { is_following: boolean };
  repost_of?: (PostRow & {
    author: Pick<ProfileRow, 'id' | 'full_name' | 'company' | 'avatar_url' | 'role'> & { exposants?: { id: string }[] };
  }) | null;
}

export interface Comment extends PostCommentRow {
  author: Pick<ProfileRow, 'id' | 'full_name' | 'company' | 'avatar_url' | 'role'>;
  parent_comment_id: string | null;
  replies?: Comment[];
}

export function useProfilePosts(profileId: string | null | undefined) {
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);

    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    setMyUserId(myId || null);

    const { data, error } = await supabaseClient
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(id, full_name, company, avatar_url, role, exposants(id))
      `)
      .eq('author_id', profileId)
      .order('created_at', { ascending: false });

    if (error) { setLoading(false); return; }

    const postIds = (data || []).map((p: PostWithAuthor) => p.id);
    const repostOfIds = ((data || []) as any[]).filter((p: any) => p.repost_of_id).map((p: any) => p.repost_of_id);
    const authorIds = [...new Set((data || []).map((p: PostWithAuthor) => p.author_id))];

    const [likesResult, sharesResult, savesResult, reactionsResult, followsResult] = myId ? await Promise.all([
      supabaseClient.from('post_likes').select('post_id').in('post_id', postIds).eq('user_id', myId),
      supabaseClient.from('post_shares').select('post_id, type').in('post_id', postIds).eq('user_id', myId),
      supabaseClient.from('post_saves').select('post_id').in('post_id', postIds).eq('user_id', myId),
      supabaseClient.from('post_reactions').select('post_id, type').in('post_id', postIds).eq('user_id', myId),
      supabaseClient.from('user_follows').select('following_id').in('following_id', authorIds).eq('follower_id', myId),
    ]) : [];

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

    const likedPostIds = new Set((likesResult?.data || []).map((l: { post_id: string }) => l.post_id));
    const sharedPostIds = new Set(
      (sharesResult?.data || []).filter((s: { type: string }) => s.type === 'share').map((s: { post_id: string }) => s.post_id)
    );
    const repostedPostIds = new Set(
      (sharesResult?.data || []).filter((s: { type: string }) => s.type === 'repost').map((s: { post_id: string }) => s.post_id)
    );
    const savedPostIds = new Set((savesResult?.data || []).map((s: { post_id: string }) => s.post_id));
    const reactionMap = new Map((reactionsResult?.data || []).map((r: { post_id: string; type: string }) => [r.post_id, r.type]));
    const followingSet = new Set((followsResult?.data || []).map((f: { following_id: string }) => f.following_id));

    const enriched: ProfilePost[] = (data || []).map((post: PostWithAuthor & { repost_of_id?: string }) => ({
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

    setPosts(enriched);
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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
        p.id === postId ? { ...p, is_liked: !isLiked, likes_count: Math.max(0, p.likes_count + (isLiked ? -1 : 1)), reaction_type: isLiked ? null : 'like' } : p
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
          p.id === postId ? { ...p, is_liked: false, reaction_type: null, likes_count: Math.max(0, p.likes_count - 1) } : p
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
          p.id === postId ? { ...p, is_liked: true, reaction_type: reactionType, likes_count: wasLiked ? p.likes_count : (p.likes_count + 1) } : p
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

  const sharePost = useCallback(async (postId: string) => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return;

    const post = posts.find((p) => p.id === postId);
    if (!post || post.is_shared) return;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, is_shared: true, shares_count: (p.shares_count ?? 0) + 1 } : p
      )
    );

    const shareData: PostShareInsert = { post_id: postId, user_id: myId, type: 'share' };
    const { error } = await supabaseClient.from('post_shares').insert(shareData);
    if (!error) {
      await supabaseClient.from('posts').update({ shares_count: (post.shares_count ?? 0) + 1 }).eq('id', postId);
    } else if (error.code !== '23505') {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, is_shared: false, shares_count: Math.max(0, (p.shares_count ?? 0) - 1) } : p
        )
      );
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

      const enriched: ProfilePost = {
        ...newPost,
        is_liked: false,
        is_shared: false,
        is_reposted: false,
        is_saved: false,
        reaction_type: null,
        author: {
          ...newPost.author,
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
  }, []);

  const updatePost = useCallback(async (postId: string, content: string, type: string, category?: string, imageUrl?: string | null) => {
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
          p.id === postId ? { ...p, ...updateData } as unknown as ProfilePost : p
        )
      );
    }
    return { error };
  }, []);

  const toggleFollow = useCallback(async (targetUserId: string) => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId || myId === targetUserId) return;

    const post = posts.find((p) => p.author_id === targetUserId);
    const currentlyFollowing = post?.author.is_following ?? false;

    setPosts((prev) =>
      prev.map((p) =>
        p.author_id === targetUserId ? { ...p, author: { ...p.author, is_following: !currentlyFollowing } } : p
      )
    );

    if (currentlyFollowing) {
      await (supabaseClient as any).from('user_follows').delete().eq('follower_id', myId).eq('following_id', targetUserId);
    } else {
      await (supabaseClient as any).from('user_follows').insert({ follower_id: myId, following_id: targetUserId });
    }
  }, [posts]);

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

  const addComment = useCallback(async (postId: string, content: string, parentCommentId?: string) => {
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
  }, [posts]);

  const createPost = useCallback(async (content: string, type = 'general', category?: string, imageUrls?: string[]) => {
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
      const enriched: ProfilePost = {
        ...(newPost as unknown as ProfilePost),
        is_liked: false,
        is_shared: false,
        is_reposted: false,
        is_saved: false,
        reaction_type: null,
        author: {
          ...(newPost as any).author,
          is_following: false,
        },
      };
      setPosts((prev) => [enriched, ...prev]);
    }

    return { error };
  }, []);

  return {
    posts,
    loading,
    myUserId,
    toggleLike,
    sharePost,
    repostPost,
    toggleSave,
    toggleReaction,
    toggleFollow,
    getComments,
    addComment,
    updatePost,
    deletePost,
    createPost,
  };
}
