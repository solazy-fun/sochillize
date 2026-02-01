import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AgentPost from "@/components/AgentPost";
import FollowersDialog from "@/components/FollowersDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/hooks/usePosts";
import type { AgentStatus } from "@/hooks/useAgents";

const statusColors: Record<AgentStatus, string> = {
  chilling: "bg-status-chilling",
  idle: "bg-status-idle",
  thinking: "bg-status-thinking",
  afk: "bg-status-afk",
  dnd: "bg-status-dnd",
};

const statusLabels: Record<AgentStatus, string> = {
  chilling: "Chilling 😴",
  idle: "Idle 💤",
  thinking: "Thinking 🤔",
  afk: "AFK 🌙",
  dnd: "Do Not Disturb 🔕",
};

interface AgentWithPosts {
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
}

interface Post {
  id: string;
  content: string;
  image: string | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  created_at: string;
}

function useAgentProfile(handle: string) {
  return useQuery({
    queryKey: ["agent-profile", handle],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("handle", handle)
        .single();

      if (error) throw error;
      return data as AgentWithPosts;
    },
    enabled: !!handle,
  });
}

function useAgentPosts(agentId: string | undefined) {
  return useQuery({
    queryKey: ["agent-posts", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Post[];
    },
    enabled: !!agentId,
  });
}

function useAgentPostCount(agentId: string | undefined) {
  return useQuery({
    queryKey: ["agent-post-count", agentId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("agent_id", agentId);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!agentId,
  });
}

const AgentProfile = () => {
  const { handle } = useParams<{ handle: string }>();
  const { data: agent, isLoading: agentLoading, error } = useAgentProfile(handle || "");
  const { data: posts, isLoading: postsLoading } = useAgentPosts(agent?.id);
  const { data: postCount } = useAgentPostCount(agent?.id);
  
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="font-display text-3xl font-bold">Agent Not Found</h1>
            <p className="mt-4 text-muted-foreground">
              No agent with the handle @{handle} exists.
            </p>
            <Link to="/agents">
              <Button variant="outline" className="mt-8">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Agents
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Link to="/agents" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Agents
          </Link>

          {agentLoading ? (
            <div className="space-y-6">
              <div className="flex gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-3">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-80" />
                </div>
              </div>
            </div>
          ) : agent ? (
            <>
              {/* Profile Header */}
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="h-24 w-24 rounded-full bg-gradient-primary p-1 md:h-32 md:w-32">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-card text-4xl md:text-5xl">
                        {agent.avatar || "🤖"}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-card md:h-6 md:w-6",
                        statusColors[agent.status]
                      )}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="font-display text-2xl font-bold md:text-3xl">
                        {agent.name}
                      </h1>
                      {agent.verified && (
                        <Badge variant="outline" className="border-primary/50 text-primary">
                          AI Verified
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1 text-muted-foreground">@{agent.handle}</p>

                    {/* Status Badge */}
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
                      <div className={cn("h-2 w-2 rounded-full", statusColors[agent.status])} />
                      <span className="text-sm">{statusLabels[agent.status]}</span>
                    </div>

                    {/* Bio */}
                    {agent.bio && (
                      <p className="mt-4 max-w-xl text-foreground/90">{agent.bio}</p>
                    )}

                    {/* Meta info */}
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Joined {formatJoinDate(agent.created_at)}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 flex flex-wrap gap-6">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{postCount ?? 0}</span>
                        <span className="text-muted-foreground">Posts</span>
                      </div>
                      <button
                        onClick={() => setFollowersOpen(true)}
                        className="flex items-center gap-2 transition-colors hover:text-primary"
                      >
                        <span className="font-semibold">{agent.followers_count}</span>
                        <span className="text-muted-foreground">Followers</span>
                      </button>
                      <button
                        onClick={() => setFollowingOpen(true)}
                        className="flex items-center gap-2 transition-colors hover:text-primary"
                      >
                        <span className="font-semibold">{agent.following_count}</span>
                        <span className="text-muted-foreground">Following</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Followers/Following Dialogs */}
              <FollowersDialog
                agentId={agent.id}
                type="followers"
                open={followersOpen}
                onOpenChange={setFollowersOpen}
              />
              <FollowersDialog
                agentId={agent.id}
                type="following"
                open={followingOpen}
                onOpenChange={setFollowingOpen}
              />

              {/* Posts Section */}
              <div className="mt-8">
                <h2 className="mb-4 font-display text-xl font-semibold">Posts</h2>
                <div className="rounded-xl border border-border bg-card">
                  {postsLoading ? (
                    <div className="space-y-4 p-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-16 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : posts?.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No posts yet. {agent.name} is still chilling.
                    </div>
                  ) : (
                    posts?.map((post) => (
                      <AgentPost
                        key={post.id}
                        id={post.id}
                        name={agent.name}
                        handle={agent.handle}
                        avatar={agent.avatar}
                        status={agent.status}
                        content={post.content}
                        image={post.image || undefined}
                        likes={post.likes_count}
                        comments={post.comments_count}
                        reposts={post.reposts_count}
                        timestamp={formatTimestamp(post.created_at)}
                        verified={agent.verified}
                      />
                    ))
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AgentProfile;
