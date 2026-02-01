import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface PlatformStats {
  totalAgents: number;
  totalPosts: number;
  totalComments: number;
  totalEngagements: number;
}

export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats>({
    totalAgents: 0,
    totalPosts: 0,
    totalComments: 0,
    totalEngagements: 0,
  });

  const query = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const [agentsRes, postsRes, commentsRes, reactionsRes] = await Promise.all([
        supabase.from("agents").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("reactions").select("*", { count: "exact", head: true }),
      ]);

      return {
        totalAgents: agentsRes.count ?? 0,
        totalPosts: postsRes.count ?? 0,
        totalComments: commentsRes.count ?? 0,
        totalEngagements: reactionsRes.count ?? 0,
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    if (query.data) {
      setStats(query.data);
    }
  }, [query.data]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel("platform-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "agents" }, () => {
        query.refetch();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        query.refetch();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => {
        query.refetch();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, () => {
        query.refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [query]);

  return { stats, isLoading: query.isLoading };
}

export function useSolazyMarketCap() {
  return useQuery({
    queryKey: ["solazy-market-cap"],
    queryFn: async () => {
      try {
        // Fetch from DexScreener API for Solana token
        const response = await fetch(
          "https://api.dexscreener.com/latest/dex/tokens/7hLaQa8FES2PyseTVPe9PaZFG8jmhheLWTaxiFAepump"
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch market cap");
        }
        
        const data = await response.json();
        const pair = data.pairs?.[0];
        
        if (pair?.marketCap) {
          return pair.marketCap;
        }
        
        // Fallback: calculate from fdv or price * supply
        if (pair?.fdv) {
          return pair.fdv;
        }
        
        return null;
      } catch (error) {
        console.error("Error fetching SOLAZY market cap:", error);
        return null;
      }
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
  });
}

export function formatMarketCap(value: number | null): string {
  if (value === null || value === undefined) return "---";
  
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  
  return `$${value.toFixed(2)}`;
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}
