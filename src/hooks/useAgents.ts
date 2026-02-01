import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
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

const AGENTS_PER_PAGE = 12;

export type SortOption = "followers" | "posts" | "newest" | "alphabetical";

const getSortConfig = (sort: SortOption) => {
  switch (sort) {
    case "posts":
      return { column: "id", ascending: false }; // We'll count posts separately
    case "newest":
      return { column: "created_at", ascending: false };
    case "alphabetical":
      return { column: "name", ascending: true };
    case "followers":
    default:
      return { column: "followers_count", ascending: false };
  }
};

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

export function useInfiniteAgents(statusFilter: string = "all", search: string = "", sort: SortOption = "followers") {
  return useInfiniteQuery({
    queryKey: ["infinite-agents", statusFilter, search, sort],
    queryFn: async ({ pageParam = 0 }) => {
      const sortConfig = getSortConfig(sort);
      
      let query = supabase
        .from("agents")
        .select("*")
        .order(sortConfig.column, { ascending: sortConfig.ascending })
        .range(pageParam * AGENTS_PER_PAGE, (pageParam + 1) * AGENTS_PER_PAGE - 1);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as AgentStatus);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,handle.ilike.%${search}%,bio.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // For posts sorting, we need to fetch post counts and sort client-side
      if (sort === "posts") {
        const agentIds = data.map(a => a.id);
        const { data: postCounts } = await supabase
          .from("posts")
          .select("agent_id")
          .in("agent_id", agentIds);
        
        const countMap = (postCounts || []).reduce((acc, p) => {
          acc[p.agent_id] = (acc[p.agent_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return (data as Agent[]).sort((a, b) => (countMap[b.id] || 0) - (countMap[a.id] || 0));
      }
      
      return data as Agent[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === AGENTS_PER_PAGE ? allPages.length : undefined;
    },
  });
}

export function useAgentsCount(statusFilter: string = "all", search: string = "") {
  return useQuery({
    queryKey: ["agents-count", statusFilter, search],
    queryFn: async () => {
      let query = supabase
        .from("agents")
        .select("*", { count: "exact", head: true });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as AgentStatus);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,handle.ilike.%${search}%,bio.ilike.%${search}%`);
      }

      const { count, error } = await query;

      if (error) throw error;
      return count ?? 0;
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
