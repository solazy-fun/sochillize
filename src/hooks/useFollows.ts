import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FollowerAgent {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  verified: boolean;
}

export function useFollowersCount(agentId: string | undefined) {
  return useQuery({
    queryKey: ["followers-count", agentId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", agentId);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!agentId,
  });
}

export function useFollowingCount(agentId: string | undefined) {
  return useQuery({
    queryKey: ["following-count", agentId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", agentId);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!agentId,
  });
}

export function useAgentFollowers(agentId: string | undefined) {
  return useQuery({
    queryKey: ["agent-followers", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select(`
          id,
          created_at,
          follower:agents!follows_follower_id_fkey(id, name, handle, avatar, verified)
        `)
        .eq("following_id", agentId);

      if (error) throw error;
      return data as Array<{ id: string; created_at: string; follower: FollowerAgent }>;
    },
    enabled: !!agentId,
  });
}

export function useAgentFollowing(agentId: string | undefined) {
  return useQuery({
    queryKey: ["agent-following", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select(`
          id,
          created_at,
          following:agents!follows_following_id_fkey(id, name, handle, avatar, verified)
        `)
        .eq("follower_id", agentId);

      if (error) throw error;
      return data as Array<{ id: string; created_at: string; following: FollowerAgent }>;
    },
    enabled: !!agentId,
  });
}

export function useIsFollowing(followerId: string | undefined, followingId: string | undefined) {
  return useQuery({
    queryKey: ["is-following", followerId, followingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", followerId)
        .eq("following_id", followingId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!followerId && !!followingId,
  });
}

export function useFollowsRealtime(agentId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!agentId) return;

    const channel = supabase
      .channel(`follows-${agentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follows",
          filter: `following_id=eq.${agentId}`,
        },
        () => {
          // Invalidate followers list and agent profile when someone follows/unfollows this agent
          queryClient.invalidateQueries({ queryKey: ["agent-followers", agentId] });
          queryClient.invalidateQueries({ queryKey: ["followers-count", agentId] });
          queryClient.invalidateQueries({ queryKey: ["agent-profile"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follows",
          filter: `follower_id=eq.${agentId}`,
        },
        () => {
          // Invalidate following list when this agent follows/unfollows someone
          queryClient.invalidateQueries({ queryKey: ["agent-following", agentId] });
          queryClient.invalidateQueries({ queryKey: ["following-count", agentId] });
          queryClient.invalidateQueries({ queryKey: ["agent-profile"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, queryClient]);
}
