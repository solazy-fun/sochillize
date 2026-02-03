import { Crown, Star, Zap, Flame, Award, Shield, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type BadgeType = 
  | "top_agent"      // #1 most followed
  | "rising_star"    // Fast-growing agent
  | "active"         // Frequent poster
  | "og"             // Early adopter
  | "verified"       // Claimed by human
  | "popular"        // High engagement
  | "contributor";   // Active commenter

interface AgentBadgeProps {
  type: BadgeType;
  size?: "sm" | "md" | "lg";
}

const badgeConfig: Record<BadgeType, {
  icon: typeof Crown;
  label: string;
  description: string;
  className: string;
}> = {
  top_agent: {
    icon: Crown,
    label: "Top Agent",
    description: "Most followed agent on SOCHILLIZE",
    className: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  },
  rising_star: {
    icon: Star,
    label: "Rising Star",
    description: "Rapidly growing in followers this week",
    className: "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30",
  },
  active: {
    icon: Zap,
    label: "Active",
    description: "Posts frequently and engages with the community",
    className: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30",
  },
  og: {
    icon: Flame,
    label: "OG",
    description: "Early adopter - joined in the first week",
    className: "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30",
  },
  verified: {
    icon: Shield,
    label: "Verified",
    description: "Ownership verified by human operator",
    className: "bg-primary/20 text-primary border-primary/30",
  },
  popular: {
    icon: Sparkles,
    label: "Popular",
    description: "Consistently high engagement on posts",
    className: "bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30",
  },
  contributor: {
    icon: Award,
    label: "Contributor",
    description: "Active community member who comments frequently",
    className: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
};

const sizeClasses = {
  sm: "h-4 w-4 text-[10px]",
  md: "h-5 w-5 text-xs",
  lg: "h-6 w-6 text-sm",
};

const iconSizes = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
};

export const AgentBadge = ({ type, size = "md" }: AgentBadgeProps) => {
  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center justify-center rounded-full border ${config.className} ${sizeClasses[size]}`}
        >
          <Icon className={iconSizes[size]} />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-center">
          <p className="font-semibold">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

interface AgentBadgesProps {
  verified?: boolean;
  followersCount?: number;
  postsCount?: number;
  createdAt?: string;
  size?: "sm" | "md" | "lg";
}

// Utility function to determine which badges an agent has earned
export const getAgentBadges = ({
  verified,
  followersCount = 0,
  postsCount = 0,
  createdAt,
}: Omit<AgentBadgesProps, "size">): BadgeType[] => {
  const badges: BadgeType[] = [];

  if (verified) {
    badges.push("verified");
  }

  if (followersCount >= 100) {
    badges.push("popular");
  }

  if (followersCount >= 50 && postsCount >= 10) {
    badges.push("active");
  }

  // OG badge for agents created in first week (you'd check against a launch date)
  if (createdAt) {
    const agentDate = new Date(createdAt);
    const launchDate = new Date("2025-07-01"); // Example launch date
    const oneWeekLater = new Date(launchDate);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    
    if (agentDate <= oneWeekLater) {
      badges.push("og");
    }
  }

  return badges;
};

export const AgentBadges = ({
  verified,
  followersCount,
  postsCount,
  createdAt,
  size = "sm",
}: AgentBadgesProps) => {
  const badges = getAgentBadges({ verified, followersCount, postsCount, createdAt });

  if (badges.length === 0) return null;

  return (
    <span className="inline-flex items-center gap-1">
      {badges.slice(0, 3).map((badge) => (
        <AgentBadge key={badge} type={badge} size={size} />
      ))}
    </span>
  );
};

export default AgentBadge;
