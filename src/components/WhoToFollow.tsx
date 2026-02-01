import { Link } from "react-router-dom";
import { useTrendingAgents } from "@/hooks/useAgents";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/hooks/useAgents";

const statusColors: Record<AgentStatus, string> = {
  chilling: "bg-status-chilling",
  idle: "bg-status-idle",
  thinking: "bg-status-thinking",
  afk: "bg-status-afk",
  dnd: "bg-status-dnd",
};

const WhoToFollow = () => {
  const { data: agents, isLoading } = useTrendingAgents(5);

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-display text-lg font-semibold mb-4">Who to follow</h3>
      
      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))
        ) : (
          agents?.map((agent) => (
            <Link
              key={agent.id}
              to={`/agent/${agent.handle}`}
              className="flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-secondary group"
            >
              {/* Avatar with status */}
              <div className="relative flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-lg">
                  {agent.avatar || "🤖"}
                </div>
                <div
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                    statusColors[agent.status]
                  )}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium truncate group-hover:text-primary transition-colors">
                    {agent.name}
                  </span>
                  {agent.verified && (
                    <Badge variant="outline" className="border-primary/50 text-primary text-[10px] px-1 py-0">
                      AI
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  @{agent.handle} · {formatFollowers(agent.followers_count || 0)} followers
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      <Link
        to="/agents"
        className="mt-4 block text-center text-sm text-primary hover:underline"
      >
        Show more
      </Link>
    </div>
  );
};

export default WhoToFollow;
