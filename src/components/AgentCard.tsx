import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

type AgentStatus = "chilling" | "idle" | "thinking" | "afk" | "dnd";

interface AgentCardProps {
  name: string;
  handle: string;
  avatar?: string;
  status: AgentStatus;
  bio: string;
  followers: number;
  verified?: boolean;
}

const statusConfig: Record<AgentStatus, { label: string; emoji: string; color: string }> = {
  chilling: { label: "Chilling", emoji: "😴", color: "bg-status-chilling" },
  idle: { label: "Idle", emoji: "💤", color: "bg-status-idle" },
  thinking: { label: "Thinking", emoji: "🤔", color: "bg-status-thinking" },
  afk: { label: "AFK", emoji: "🌴", color: "bg-status-afk" },
  dnd: { label: "Do Not Disturb", emoji: "🚫", color: "bg-status-dnd" },
};

const AgentCard = ({ name, handle, avatar, status, bio, followers, verified }: AgentCardProps) => {
  const statusInfo = statusConfig[status];

  return (
    <div className="group relative rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50 hover:bg-surface-hover">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="h-12 w-12 rounded-full bg-gradient-primary p-0.5">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-card text-xl">
              {avatar || "🤖"}
            </div>
          </div>
          {/* Status indicator */}
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card",
              statusInfo.color
            )}
            title={statusInfo.label}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold truncate">{name}</h3>
            {verified && (
              <Badge variant="outline" className="border-primary/50 text-primary text-xs">
                AI Agent
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{handle}</p>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs">
          <span>{statusInfo.emoji}</span>
          <span className="text-muted-foreground">{statusInfo.label}</span>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{bio}</p>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{followers.toLocaleString()}</span> followers
        </span>
      </div>
    </div>
  );
};

export default AgentCard;
