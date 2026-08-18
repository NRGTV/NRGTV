/**
 * useForum.ts
 * -------------------------------------------------------
 * Supabase-backed forum data hooks, following the same
 * useQuery pattern as useMedia.ts.
 *
 * Requires forum-schema.sql to have been run in Supabase
 * (forum_categories / forum_threads / forum_posts tables).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const STALE = 60 * 1000;

// ─── Types ──────────────────────────────────────────────────

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  threadCount?: number;
  postCount?: number;
}

export interface ForumThreadSummary {
  id: string;
  title: string;
  category_id: string;
  author_name: string;
  views: number;
  pinned: boolean;
  locked: boolean;
  last_activity_at: string;
  replies?: number;
}

export interface ForumPost {
  id: string;
  thread_id: string;
  author_name: string;
  body: string;
  is_original: boolean;
  likes: number;
  created_at: string;
}

// ─── Categories (with thread/post counts) ────────────────────

export function useForumCategories() {
  return useQuery<ForumCategory[]>({
    queryKey: ["forum", "categories"],
    staleTime: STALE,
    queryFn: async () => {
      const { data: categories, error } = await supabase
        .from("forum_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;

      const { data: threads, error: threadsError } = await supabase
        .from("forum_threads")
        .select("id, category_id");
      if (threadsError) throw threadsError;

      const { data: posts, error: postsError } = await supabase
        .from("forum_posts")
        .select("id, thread_id, forum_threads!inner(category_id)");
      if (postsError) throw postsError;

      return (categories ?? []).map((c) => ({
        ...c,
        threadCount: threads?.filter((t) => t.category_id === c.id).length ?? 0,
        postCount: posts?.filter((p: any) => p.forum_threads?.category_id === c.id).length ?? 0,
      }));
    },
  });
}

// ─── Recent threads (optionally filtered by category) ────────

export function useForumThreads(categoryId?: string) {
  return useQuery<ForumThreadSummary[]>({
    queryKey: ["forum", "threads", categoryId ?? "all"],
    staleTime: STALE,
    queryFn: async () => {
      let query = supabase
        .from("forum_threads")
        .select("*, forum_posts(count)")
        .order("pinned", { ascending: false })
        .order("last_activity_at", { ascending: false })
        .limit(50);

      if (categoryId) query = query.eq("category_id", categoryId);

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((t: any) => ({
        ...t,
        replies: Math.max((t.forum_posts?.[0]?.count ?? 1) - 1, 0), // minus the OP
      }));
    },
  });
}

// ─── Single thread + its posts ────────────────────────────────

export function useForumThread(threadId: string | undefined) {
  const threadQuery = useQuery({
    queryKey: ["forum", "thread", threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_threads")
        .select("*")
        .eq("id", threadId)
        .single();
      if (error) throw error;
      return data as ForumThreadSummary;
    },
  });

  const postsQuery = useQuery<ForumPost[]>({
    queryKey: ["forum", "posts", threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_posts")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return { thread: threadQuery, posts: postsQuery };
}

// ─── Mutations ──────────────────────────────────────────────

export function useCreateThread() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      title,
      body,
    }: {
      categoryId: string;
      title: string;
      body: string;
    }) => {
      if (!user) throw new Error("Must be signed in to post");
      const authorName = user.email?.split("@")[0] ?? "user";

      const { data: thread, error: threadError } = await supabase
        .from("forum_threads")
        .insert({ category_id: categoryId, title, author_id: user.id, author_name: authorName })
        .select()
        .single();
      if (threadError) throw threadError;

      const { error: postError } = await supabase
        .from("forum_posts")
        .insert({
          thread_id: thread.id,
          author_id: user.id,
          author_name: authorName,
          body,
          is_original: true,
        });
      if (postError) throw postError;

      return thread;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum"] });
    },
  });
}

export function useCreateReply(threadId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) => {
      if (!user) throw new Error("Must be signed in to reply");
      const authorName = user.email?.split("@")[0] ?? "user";

      const { error } = await supabase.from("forum_posts").insert({
        thread_id: threadId,
        author_id: user.id,
        author_name: authorName,
        body,
        is_original: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum", "posts", threadId] });
      queryClient.invalidateQueries({ queryKey: ["forum", "threads"] });
    },
  });
}
