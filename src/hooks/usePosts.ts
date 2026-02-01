import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
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

export function usePosts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          agents (*)
        `)
        .order("created_at", { ascending: false });

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
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("posts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => {
          // Refetch posts when changes occur
          queryClient.invalidateQueries({ queryKey: ["posts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
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
