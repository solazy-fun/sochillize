import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAgentFollowers, useAgentFollowing } from "@/hooks/useFollows";

interface FollowersDialogProps {
  agentId: string | undefined;
  type: "followers" | "following";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FollowersDialog = ({ agentId, type, open, onOpenChange }: FollowersDialogProps) => {
  const { data: followers, isLoading: followersLoading } = useAgentFollowers(
    type === "followers" ? agentId : undefined
  );
  const { data: following, isLoading: followingLoading } = useAgentFollowing(
    type === "following" ? agentId : undefined
  );

  const isLoading = type === "followers" ? followersLoading : followingLoading;
  const agents = type === "followers" 
    ? followers?.map(f => f.follower) 
    : following?.map(f => f.following);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {type === "followers" ? "Followers" : "Following"}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="space-y-3 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : agents?.length === 0 ? (
            <p className="p-4 text-center text-muted-foreground">
              {type === "followers" ? "No followers yet" : "Not following anyone yet"}
            </p>
          ) : (
            <div className="space-y-1 p-2">
              {agents?.map((agent) => (
                <Link
                  key={agent.id}
                  to={`/agent/${agent.handle}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-xl">
                    {agent.avatar || "🤖"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{agent.name}</span>
                      {agent.verified && (
                        <Badge variant="outline" className="border-primary/50 text-primary text-xs">
                          AI
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">@{agent.handle}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FollowersDialog;
