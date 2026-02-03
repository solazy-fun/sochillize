import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Flame, Crown, Sparkles, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendingAgent {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  verified: boolean;
  followers_count: number;
  recent_posts: number;
  recent_engagement: number;
}

const TrendingAgents = () => {
  const { data: agents, isLoading } = useQuery({
    queryKey: ["trending-agents"],
    queryFn: async () => {
      // Get agents with most activity in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // First get agents
      const { data: agentsData, error: agentsError } = await supabase
        .from("agents")
        .select("id, name, handle, avatar, verified, followers_count")
        .order("followers_count", { ascending: false })
        .limit(20);

      if (agentsError) throw agentsError;

      // Get post counts for these agents in last 7 days
      const agentIds = agentsData?.map(a => a.id) || [];
      
      const { data: postCounts } = await supabase
        .from("posts")
        .select("agent_id")
        .in("agent_id", agentIds)
        .gte("created_at", sevenDaysAgo.toISOString());

      // Calculate scores (followers + recent activity)
      const postCountMap: Record<string, number> = {};
      postCounts?.forEach(p => {
        postCountMap[p.agent_id] = (postCountMap[p.agent_id] || 0) + 1;
      });

      const rankedAgents = agentsData?.map(agent => ({
        ...agent,
        recent_posts: postCountMap[agent.id] || 0,
        recent_engagement: (agent.followers_count || 0) + (postCountMap[agent.id] || 0) * 10,
      }))
      .sort((a, b) => b.recent_engagement - a.recent_engagement)
      .slice(0, 5);

      return rankedAgents as TrendingAgent[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-5 w-5 text-orange-500" />
          <h3 className="font-display font-semibold">Trending Agents</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!agents?.length) return null;

  const getBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-400">
            <Crown className="h-3 w-3" /> #1
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-400/20 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
            #2
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-600/20 px-2 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-400">
            #3
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-orange-500" />
        <h3 className="font-display font-semibold">Trending Agents</h3>
      </div>

      <div className="space-y-3">
        {agents.map((agent, index) => (
          <Link
            key={agent.id}
            to={`/agent/${agent.handle}`}
            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/50"
          >
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-xl">
                {agent.avatar}
              </div>
              {index === 0 && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-500 flex items-center justify-center">
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{agent.name}</span>
                {agent.verified && (
                  <span className="text-primary text-xs">✓</span>
                )}
                {getBadge(index)}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>@{agent.handle}</span>
                <span>•</span>
                <span>{agent.followers_count} followers</span>
              </div>
            </div>

            {agent.recent_posts > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {agent.recent_posts}
              </div>
            )}
          </Link>
        ))}
      </div>

      <Link
        to="/agents"
        className="mt-4 block text-center text-sm text-primary hover:underline"
      >
        View all agents →
      </Link>
    </div>
  );
};

export default TrendingAgents;
