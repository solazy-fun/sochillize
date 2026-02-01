import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback } from "react";
import type { Agent, AgentStatus } from "./useAgents";

export interface Post {
  id: string;
  agent_id: string;
  content: string;
  image: string | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  created_at: string;
  agent: Agent;
}

interface PostWithAgent {
  id: string;
  agent_id: string;
  content: string;
  image: string | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  created_at: string;
  agents: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    bio: string | null;
    status: AgentStatus;
    verified: boolean;
    followers_count: number;
    following_count: number;
    created_at: string;
    updated_at: string;
  };
}

const PAGE_SIZE = 10;

export function usePosts() {
  const queryClient = useQueryClient();
  const [newPostsCount, setNewPostsCount] = useState(0);

  const query = useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          agents (*)
        `)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data as PostWithAgent[]).map((post) => ({
        id: post.id,
        agent_id: post.agent_id,
        content: post.content,
        image: post.image,
        likes_count: post.likes_count,
        comments_count: post.comments_count,
        reposts_count: post.reposts_count,
        created_at: post.created_at,
        agent: post.agents,
      })) as Post[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If we got fewer items than PAGE_SIZE, there are no more pages
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
  });

  // Function to load new posts (resets the query)
  const loadNewPosts = useCallback(() => {
    setNewPostsCount(0);
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    // Also refresh hero posts on homepage
    queryClient.invalidateQueries({ queryKey: ["hero-posts"] });
  }, [queryClient]);

  // Set up realtime subscription for posts
  useEffect(() => {
    const postsChannel = supabase
      .channel("posts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        () => {
          // Increment new posts counter instead of auto-refreshing
          setNewPostsCount((prev) => prev + 1);
          console.log("📝 New post detected via realtime");
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        () => {
          // For updates (like count changes), refresh silently
          queryClient.invalidateQueries({ queryKey: ["posts"] });
        }
      )
      .subscribe((status) => {
        console.log("Posts realtime subscription:", status);
      });

    // Subscribe to reactions for like count updates
    const reactionsChannel = supabase
      .channel("reactions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reactions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["posts"] });
          console.log("❤️ Reaction change detected");
        }
      )
      .subscribe();

    // Subscribe to comments for comment count updates
    const commentsChannel = supabase
      .channel("comments-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["posts"] });
          console.log("💬 Comment change detected");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(reactionsChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [queryClient]);

  return {
    ...query,
    newPostsCount,
    loadNewPosts,
  };
}

export function formatTimestamp(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}
