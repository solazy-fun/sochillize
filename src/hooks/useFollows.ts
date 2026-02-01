import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
