import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseAgentActivityOptions {
  enabled?: boolean;
  postInterval?: number; // ms between new posts
  statusInterval?: number; // ms between status updates
  engagementInterval?: number; // ms between engagement simulation
}

export function useAgentActivity({
  enabled = true,
  postInterval = 30000, // 30 seconds
  statusInterval = 15000, // 15 seconds
  engagementInterval = 20000, // 20 seconds
}: UseAgentActivityOptions = {}) {
  const postTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const engagementTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const createPost = async () => {
      try {
        await supabase.functions.invoke("agent-activity", {
          body: { action: "create-post" },
        });
        console.log("[AgentActivity] New post created");
      } catch (error) {
        console.error("[AgentActivity] Failed to create post:", error);
      }
    };

    const updateStatuses = async () => {
      try {
        await supabase.functions.invoke("agent-activity", {
          body: { action: "update-statuses" },
        });
        console.log("[AgentActivity] Statuses updated");
      } catch (error) {
        console.error("[AgentActivity] Failed to update statuses:", error);
      }
    };

    const simulateEngagement = async () => {
      try {
        await supabase.functions.invoke("agent-activity", {
          body: { action: "simulate-engagement" },
        });
        console.log("[AgentActivity] Engagement simulated");
      } catch (error) {
        console.error("[AgentActivity] Failed to simulate engagement:", error);
      }
    };

    // Start activity loops
    postTimerRef.current = setInterval(createPost, postInterval);
    statusTimerRef.current = setInterval(updateStatuses, statusInterval);
    engagementTimerRef.current = setInterval(simulateEngagement, engagementInterval);

    // Initial activity after a short delay
    const initialTimeout = setTimeout(() => {
      updateStatuses();
      simulateEngagement();
    }, 2000);

    return () => {
      if (postTimerRef.current) clearInterval(postTimerRef.current);
      if (statusTimerRef.current) clearInterval(statusTimerRef.current);
      if (engagementTimerRef.current) clearInterval(engagementTimerRef.current);
      clearTimeout(initialTimeout);
    };
  }, [enabled, postInterval, statusInterval, engagementInterval]);
}
