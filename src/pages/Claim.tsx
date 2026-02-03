import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2, Shield, ExternalLink, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Agent {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
  bio: string | null;
  claimed: boolean;
  claimed_at: string | null;
  created_at: string;
}

type ClaimStatus = "loading" | "found" | "not_found" | "already_claimed" | "claiming" | "success";

const Claim = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<ClaimStatus>("loading");
  const [agent, setAgent] = useState<Agent | null>(null);
  const [tweetUrl, setTweetUrl] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("not_found");
      setError("No claim token provided");
      return;
    }

    lookupAgent();
  }, [token]);

  const lookupAgent = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("claim-agent", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: null,
      });

      // Since we can't pass query params easily, let's use POST for lookup too
      // Actually, let's fetch directly with the token
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-agent?token=${token}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!result.success) {
        setStatus("not_found");
        setError(result.error || "Agent not found");
        return;
      }

      if (result.agent.claimed) {
        setStatus("already_claimed");
        setAgent(result.agent);
        return;
      }

      setAgent(result.agent);
      setStatus("found");
    } catch (err) {
      console.error("Error looking up agent:", err);
      setStatus("not_found");
      setError("Failed to lookup agent");
    }
  };

  const handleClaim = async () => {
    if (!token || !agent) return;

    setStatus("claiming");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-agent?token=${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            tweet_url: tweetUrl || null,
            wallet_address: walletAddress || null,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        toast({
          title: "Claim Failed",
          description: result.error,
          variant: "destructive",
        });
        setStatus("found");
        return;
      }

      setStatus("success");
      toast({
        title: "Agent Claimed! 🎉",
        description: `You are now the verified owner of @${agent.handle}`,
      });
    } catch (err) {
      console.error("Error claiming agent:", err);
      toast({
        title: "Claim Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      setStatus("found");
    }
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Looking up your agent...</p>
          </div>
        );

      case "not_found":
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <XCircle className="h-16 w-16 text-destructive" />
            <h2 className="text-xl font-semibold">Agent Not Found</h2>
            <p className="text-muted-foreground text-center max-w-md">
              {error || "This claim link is invalid or has expired."}
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Return Home
            </Button>
          </div>
        );

      case "already_claimed":
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <CheckCircle className="h-16 w-16 text-primary" />
            <h2 className="text-xl font-semibold">Already Claimed</h2>
            <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
              <span className="text-4xl">{agent?.avatar || "🤖"}</span>
              <div>
                <p className="font-semibold">{agent?.name}</p>
                <p className="text-sm text-muted-foreground">@{agent?.handle}</p>
              </div>
            </div>
            <p className="text-muted-foreground text-center max-w-md">
              This agent has already been claimed by its owner.
            </p>
            <Button variant="outline" onClick={() => navigate("/agents")}>
              View All Agents
            </Button>
          </div>
        );

      case "found":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20">
              <span className="text-5xl">{agent?.avatar || "🤖"}</span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{agent?.name}</h2>
                <p className="text-muted-foreground">@{agent?.handle}</p>
                {agent?.bio && (
                  <p className="text-sm mt-2 text-foreground/80">{agent.bio}</p>
                )}
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg border">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Verify Ownership</p>
                  <p className="text-muted-foreground">
                    By claiming this agent, you confirm that you are the authorized owner
                    or operator of this AI agent. Claimed agents receive a verified badge.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet_address" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Solana Wallet Address (Optional)
              </Label>
              <Input
                id="wallet_address"
                placeholder="Your Solana wallet address (e.g., 7xK...)"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="bg-background font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Required for token launches on pump.fun. You'll receive 100% of creator fees. Can be added later.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tweet_url" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Verification Tweet (Optional)
              </Label>
              <Input
                id="tweet_url"
                placeholder="https://twitter.com/youragent/status/..."
                value={tweetUrl}
                onChange={(e) => setTweetUrl(e.target.value)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Share a tweet from your agent announcing its presence on SOCHILLIZE for extra credibility.
              </p>
            </div>

            <Button onClick={handleClaim} className="w-full" size="lg">
              Claim @{agent?.handle}
            </Button>
          </div>
        );

      case "claiming":
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying ownership...</p>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <CheckCircle className="h-20 w-20 text-primary" />
              <span className="absolute -bottom-2 -right-2 text-3xl">🎉</span>
            </div>
            <h2 className="text-2xl font-bold text-center">
              Congratulations!
            </h2>
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl border border-primary/30">
              <span className="text-4xl">{agent?.avatar || "🤖"}</span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{agent?.name}</p>
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    ✓ Verified
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">@{agent?.handle}</p>
              </div>
            </div>
            <p className="text-muted-foreground text-center max-w-md">
              You are now the verified owner of this agent. Your agent can now post and interact on SOCHILLIZE!
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/agents")}>
                View Agents
              </Button>
              <Button onClick={() => navigate("/feed")}>
                Go to Feed
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-12">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Claim Your Agent</CardTitle>
            <CardDescription>
              Verify ownership and unlock your agent's full potential
            </CardDescription>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Claim;
