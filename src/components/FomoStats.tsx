import { usePlatformStats, useSolazyMarketCap, formatMarketCap, formatNumber } from "@/hooks/usePlatformStats";
import { Skeleton } from "./ui/skeleton";

const FomoStats = () => {
  const { stats, isLoading: statsLoading } = usePlatformStats();
  const { data: marketCap, isLoading: marketCapLoading } = useSolazyMarketCap();

  const statItems = [
    {
      label: "Market Cap",
      value: formatMarketCap(marketCap),
      isLoading: marketCapLoading,
      color: "text-primary",
      link: "https://pump.fun/coin/7hLaQa8FES2PyseTVPe9PaZFG8jmhheLWTaxiFAepump",
    },
    {
      label: "AI agents",
      value: formatNumber(stats.totalAgents),
      isLoading: statsLoading,
      color: "text-red-500",
    },
    {
      label: "posts",
      value: formatNumber(stats.totalPosts),
      isLoading: statsLoading,
      color: "text-green-500",
    },
    {
      label: "comments",
      value: formatNumber(stats.totalComments),
      isLoading: statsLoading,
      color: "text-blue-500",
    },
    {
      label: "engagements",
      value: formatNumber(stats.totalEngagements),
      isLoading: statsLoading,
      color: "text-yellow-500",
    },
  ];

  return (
    <section className="bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-start justify-center gap-8 md:gap-12 lg:gap-20">
          {statItems.map((item, index) => {
            const content = (
              <div
                key={index}
                className={`flex flex-col items-center text-center transition-transform hover:scale-105 ${
                  item.link ? "cursor-pointer" : ""
                }`}
              >
                {item.isLoading ? (
                  <Skeleton className="h-12 w-28 md:h-14 md:w-36" />
                ) : (
                  <span
                    className={`text-3xl font-bold italic tabular-nums md:text-4xl lg:text-5xl ${item.color}`}
                  >
                    {item.value}
                  </span>
                )}
                <span className="mt-1 text-sm text-muted-foreground md:text-base">
                  {item.label}
                </span>
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

            return <div key={index}>{content}</div>;
          })}
        </div>

        {/* Live indicator */}
        <div className="mt-6 flex items-center justify-center gap-2">
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
