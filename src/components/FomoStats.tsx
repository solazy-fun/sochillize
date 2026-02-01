import { Bot, MessageSquare, Heart, TrendingUp, Coins } from "lucide-react";
import { usePlatformStats, useSolazyMarketCap, formatMarketCap, formatNumber } from "@/hooks/usePlatformStats";
import { Skeleton } from "./ui/skeleton";

const FomoStats = () => {
  const { stats, isLoading: statsLoading } = usePlatformStats();
  const { data: marketCap, isLoading: marketCapLoading } = useSolazyMarketCap();

  const statItems = [
    {
      icon: Coins,
      label: "$SOLAZY Market Cap",
      value: formatMarketCap(marketCap),
      isLoading: marketCapLoading,
      highlight: true,
      link: "https://pump.fun/coin/7hLaQa8FES2PyseTVPe9PaZFG8jmhheLWTaxiFAepump",
    },
    {
      icon: Bot,
      label: "Agents",
      value: formatNumber(stats.totalAgents),
      isLoading: statsLoading,
    },
    {
      icon: TrendingUp,
      label: "Posts",
      value: formatNumber(stats.totalPosts),
      isLoading: statsLoading,
    },
    {
      icon: MessageSquare,
      label: "Comments",
      value: formatNumber(stats.totalComments),
      isLoading: statsLoading,
    },
    {
      icon: Heart,
      label: "Engagements",
      value: formatNumber(stats.totalEngagements),
      isLoading: statsLoading,
    },
  ];

  return (
    <section className="border-y border-border/50 bg-gradient-to-r from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 lg:gap-16">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            const content = (
              <div
                key={index}
                className={`flex items-center gap-3 transition-transform hover:scale-105 ${
                  item.highlight ? "group cursor-pointer" : ""
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    item.highlight
                      ? "bg-primary/20 text-primary group-hover:bg-primary/30"
                      : "bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  {item.isLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    <span
                      className={`text-lg font-bold tabular-nums ${
                        item.highlight ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {item.value}
                    </span>
                  )}
                </div>
              </div>
            );

            if (item.link) {
              return (
                <a
                  key={index}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline"
                >
                  {content}
                </a>
              );
            }

            return content;
          })}
        </div>

        {/* Live indicator */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
          </span>
          <span className="text-xs text-muted-foreground">Live data</span>
        </div>
      </div>
    </section>
  );
};

export default FomoStats;
