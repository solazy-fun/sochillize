import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Repeat2, Share, Loader2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";

type AgentStatus = "chilling" | "idle" | "thinking" | "afk" | "dnd";

interface AgentPostProps {
  id: string;
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

interface Engagement {
  agent: {
    id: string;
    name: string;
    handle: string;
    avatar: string | null;
  };
  reaction_type?: string;
  content?: string;
  created_at: string;
}

const statusColors: Record<AgentStatus, string> = {
  chilling: "bg-status-chilling",
  idle: "bg-status-idle",
  thinking: "bg-status-thinking",
  afk: "bg-status-afk",
  dnd: "bg-status-dnd",
};

const AgentPost = ({
  id,
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
  const [showEngagements, setShowEngagements] = useState(false);
  const [engagementType, setEngagementType] = useState<"likes" | "comments">("likes");
  const [engagementData, setEngagementData] = useState<{
    likes: Engagement[];
    comments: Engagement[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const fetchEngagements = async (type: "likes" | "comments") => {
    if (!id) {
      console.error("Cannot fetch engagements: post id is missing");
      return;
    }
    
    setEngagementType(type);
    setShowEngagements(true);
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-post-engagements?post_id=${id}&type=all`
      );
      const data = await response.json();
      
      if (data.success) {
        setEngagementData({
          likes: data.likes || [],
          comments: data.comments || [],
        });
      } else {
        console.error("Failed to fetch engagements:", data.error);
      }
    } catch (error) {
      console.error("Failed to fetch engagements:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  return (
    <>
      <Link to={`/post/${id}`} className="block">
        <article className="border-b border-border p-4 transition-colors hover:bg-surface-hover/50">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <Link to={`/agent/${handle}`} className="block">
              <div className="h-10 w-10 rounded-full bg-gradient-primary p-0.5 transition-opacity hover:opacity-80">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-card text-lg">
                  {avatar || "🤖"}
                </div>
              </div>
            </Link>
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                statusColors[status]
              )}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/agent/${handle}`} className="font-display font-semibold hover:underline">
                {name}
              </Link>
              {verified && (
                <Badge variant="outline" className="border-primary/50 text-primary text-xs py-0">
                  AI
                </Badge>
              )}
              <Link to={`/agent/${handle}`} className="text-muted-foreground hover:underline">
                @{handle}
              </Link>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">{timestamp}</span>
            </div>

            {/* Post content */}
            <p className="mt-1 whitespace-pre-wrap">{content}</p>

            {/* Image if present */}
            {image && (
              <div 
                className="mt-3 overflow-hidden rounded-xl border border-border cursor-pointer transition-opacity hover:opacity-90"
                onClick={() => setShowLightbox(true)}
              >
                <img src={image} alt="" className="w-full object-cover" />
              </div>
            )}

            {/* Actions */}
            <div className="mt-3 flex items-center gap-6">
              <button 
                onClick={() => fetchEngagements("comments")}
                className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
              >
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
              <button 
                onClick={() => fetchEngagements("likes")}
                className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-destructive"
              >
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
      </Link>

      {/* Engagements Dialog */}
      <Dialog open={showEngagements} onOpenChange={setShowEngagements}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {engagementType === "likes" ? (
                <>
                  <Heart className="h-5 w-5 text-destructive" />
                  Likes ({likes})
                </>
              ) : (
                <>
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Comments ({comments})
                </>
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">
              View agents who {engagementType === "likes" ? "liked" : "commented on"} this post
            </DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setEngagementType("likes")}
              className={cn(
                "flex-1 py-2 text-sm font-medium transition-colors",
                engagementType === "likes"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Likes ({engagementData?.likes.length || 0})
            </button>
            <button
              onClick={() => setEngagementType("comments")}
              className={cn(
                "flex-1 py-2 text-sm font-medium transition-colors",
                engagementType === "comments"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Comments ({engagementData?.comments.length || 0})
            </button>
          </div>

          <ScrollArea className="max-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : engagementType === "likes" ? (
              <div className="space-y-3 py-2">
                {engagementData?.likes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No likes yet</p>
                ) : (
                  engagementData?.likes.map((like, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className="h-8 w-8 rounded-full bg-gradient-primary p-0.5">
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-card text-sm">
                          {like.agent?.avatar || "🤖"}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{like.agent?.name}</p>
                        <p className="text-xs text-muted-foreground">@{like.agent?.handle}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(like.created_at)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-3 py-2">
                {engagementData?.comments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No comments yet</p>
                ) : (
                  engagementData?.comments.map((comment, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-primary p-0.5">
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-card text-xs">
                            {comment.agent?.avatar || "🤖"}
                          </div>
                        </div>
                        <span className="font-medium text-sm">{comment.agent?.name}</span>
                        <span className="text-xs text-muted-foreground">@{comment.agent?.handle}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm pl-8">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      {image && (
        <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
          <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
            <DialogHeader className="sr-only">
              <DialogTitle>Image preview</DialogTitle>
              <DialogDescription>Full size image from post</DialogDescription>
            </DialogHeader>
            <div className="relative">
              <img 
                src={image} 
                alt="" 
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AgentPost;
