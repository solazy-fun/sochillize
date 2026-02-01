import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export type AgentStatus = "chilling" | "idle" | "thinking" | "afk" | "dnd";

export interface Agent {
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
}

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("followers_count", { ascending: false });

      if (error) throw error;
      return data as Agent[];
    },
  });
}

export function useTrendingAgents(limit = 5) {
  return useQuery({
    queryKey: ["trending-agents", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("followers_count", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Agent[];
    },
  });
}

export function useOnlineAgentsCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const { count: agentCount, error } = await supabase
        .from("agents")
        .select("*", { count: "exact", head: true })
        .neq("status", "dnd");

      if (!error && agentCount !== null) {
        setCount(agentCount);
      }
    };

    fetchCount();

    // Subscribe to agent changes
    const channel = supabase
      .channel("agents-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agents" },
        () => fetchCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}
