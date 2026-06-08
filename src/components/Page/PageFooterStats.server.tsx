import { PageFooterFun } from "src/components/Page/PageFooterFun.component";
import { getPublicCommunityStats } from "src/lib/public-stats.server";

type PageFooterStatsProps = {
  variant?: "default" | "gradient";
};

export const PageFooterStats = async ({
  variant = "default",
}: PageFooterStatsProps) => {
  const stats = await getPublicCommunityStats();

  if (!stats) {
    return null;
  }

  return <PageFooterFun stats={stats} variant={variant} />;
};
