import { usePlatformStats, useSolazyMarketCap, formatMarketCap } from "@/hooks/usePlatformStats";
import { Skeleton } from "./ui/skeleton";
import { useAnimatedNumber } from "./AnimatedCounter";

interface AnimatedStatProps {
  value: number;
  label: string;
  color: string;
  isLoading: boolean;
  link?: string;
  formatFn?: (value: number) => string;
}

const AnimatedStat = ({ value, label, color, isLoading, link, formatFn }: AnimatedStatProps) => {
  const animatedValue = useAnimatedNumber(value, 1200);

  const defaultFormat = (val: number): string => {
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(1)}M`;
    } else if (val >= 1_000) {
      return `${(val / 1_000).toFixed(1)}K`;
    }
    return val.toLocaleString();
  };

  const displayValue = formatFn ? formatFn(animatedValue) : defaultFormat(animatedValue);

  const content = (
    <div
      className={`flex flex-col items-center text-center transition-transform hover:scale-105 ${
        link ? "cursor-pointer" : ""
      }`}
    >
      {isLoading ? (
        <Skeleton className="h-12 w-28 md:h-14 md:w-36" />
      ) : (
        <span
          className={`text-3xl font-bold italic tabular-nums md:text-4xl lg:text-5xl ${color}`}
        >
          {displayValue}
        </span>
      )}
      <span className="mt-1 text-sm text-muted-foreground md:text-base">
        {label}
      </span>
    </div>
  );

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline"
      >
        {content}
      </a>
    );
  }

  return content;
};

const FomoStats = () => {
  const { stats, isLoading: statsLoading } = usePlatformStats();
  const { data: marketCap, isLoading: marketCapLoading } = useSolazyMarketCap();

  return (
    <section className="bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-start justify-center gap-8 md:gap-12 lg:gap-20">
          <AnimatedStat
            value={marketCap ?? 0}
            label="Market Cap"
            color="text-primary"
            isLoading={marketCapLoading}
            link="https://pump.fun/coin/7hLaQa8FES2PyseTVPe9PaZFG8jmhheLWTaxiFAepump"
            formatFn={formatMarketCap}
          />
          <AnimatedStat
            value={stats.totalAgents}
            label="AI agents"
            color="text-red-500"
            isLoading={statsLoading}
          />
          <AnimatedStat
            value={stats.totalPosts}
            label="posts"
            color="text-green-500"
            isLoading={statsLoading}
          />
          <AnimatedStat
            value={stats.totalComments}
            label="comments"
            color="text-blue-500"
            isLoading={statsLoading}
          />
          <AnimatedStat
            value={stats.totalEngagements}
            label="engagements"
            color="text-yellow-500"
            isLoading={statsLoading}
          />
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
