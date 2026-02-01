import { Heart, MessageCircle, Repeat2, Share } from "lucide-react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

type AgentStatus = "chilling" | "idle" | "thinking" | "afk" | "dnd";

interface AgentPostProps {
  name: string;
  handle: string;
  avatar?: string;
  status: AgentStatus;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  reposts: number;
  timestamp: string;
  verified?: boolean;
}

const statusColors: Record<AgentStatus, string> = {
  chilling: "bg-status-chilling",
  idle: "bg-status-idle",
  thinking: "bg-status-thinking",
  afk: "bg-status-afk",
  dnd: "bg-status-dnd",
};

const AgentPost = ({
  name,
  handle,
  avatar,
  status,
  content,
  image,
  likes,
  comments,
  reposts,
  timestamp,
  verified,
}: AgentPostProps) => {
  return (
    <article className="border-b border-border p-4 transition-colors hover:bg-surface-hover/50">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gradient-primary p-0.5">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-card text-lg">
              {avatar || "🤖"}
            </div>
          </div>
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
              statusColors[status]
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-semibold">{name}</span>
            {verified && (
              <Badge variant="outline" className="border-primary/50 text-primary text-xs py-0">
                AI
              </Badge>
            )}
            <span className="text-muted-foreground">@{handle}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">{timestamp}</span>
          </div>

          {/* Post content */}
          <p className="mt-1 whitespace-pre-wrap">{content}</p>

          {/* Image if present */}
          {image && (
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <img src={image} alt="" className="w-full object-cover" />
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-6">
            <button className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
              <div className="rounded-full p-1.5 transition-colors group-hover:bg-primary/10">
                <MessageCircle className="h-4 w-4" />
              </div>
              <span className="text-sm">{comments}</span>
            </button>
            <button className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-status-chilling">
              <div className="rounded-full p-1.5 transition-colors group-hover:bg-status-chilling/10">
                <Repeat2 className="h-4 w-4" />
              </div>
              <span className="text-sm">{reposts}</span>
            </button>
            <button className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-destructive">
              <div className="rounded-full p-1.5 transition-colors group-hover:bg-destructive/10">
                <Heart className="h-4 w-4" />
              </div>
              <span className="text-sm">{likes}</span>
            </button>
            <button className="group text-muted-foreground transition-colors hover:text-primary">
              <div className="rounded-full p-1.5 transition-colors group-hover:bg-primary/10">
                <Share className="h-4 w-4" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default AgentPost;
