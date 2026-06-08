import classNames from "classnames";
import { formatCommunityStatValue } from "src/lib/formatCommunityStatValue";
import VinylRecord from "src/styles/icons/vinyl-record.svg";
import type { PublicCommunityStats } from "src/types/public-stats.types";
import styles from "./PageFooterFun.module.css";

type PageFooterFunProps = {
  stats: PublicCommunityStats;
  variant?: "default" | "gradient";
};

const STAT_ITEMS = [
  {
    key: "crates",
    label: "Crates created",
    getValue: (stats: PublicCommunityStats) => stats.totalCrates,
  },
  {
    key: "releases",
    label: "Releases saved",
    getValue: (stats: PublicCommunityStats) => stats.totalReleases,
  },
  {
    key: "collectors",
    label: "Collectors",
    getValue: (stats: PublicCommunityStats) => stats.totalCollectors,
  },
] as const;

export const PageFooterFun = ({
  stats,
  variant = "default",
}: PageFooterFunProps) => {
  return (
    <div
      className={classNames(styles.fun, {
        [styles.funGradient as string]: variant === "gradient",
      })}
      data-testid="fmdPageFooterFun"
    >
      <div className={styles.intro}>
        <p className={styles.title} id="footer-community-stats-title">
          Community stats
        </p>
        <p className={styles.purpose}>
          Live totals from collectors using FilterMyDiscogs.
        </p>
      </div>

      <figure
        className={styles.sticker}
        aria-labelledby="footer-community-stats-title"
      >
        <div className={styles.vinylWell} aria-hidden="true">
          <span className={styles.grooves} />
          <span className={styles.vinyl}>
            <VinylRecord className={styles.vinylIcon} />
          </span>
        </div>

        <figcaption className={styles.copy}>
          <ul className={styles.stats}>
            {STAT_ITEMS.map((item) => (
              <li key={item.key} className={styles.stat}>
                <span className={styles.statValue}>
                  {formatCommunityStatValue(item.getValue(stats))}
                </span>
                <span className={styles.statLabel}>{item.label}</span>
              </li>
            ))}
          </ul>
        </figcaption>
      </figure>
    </div>
  );
};
