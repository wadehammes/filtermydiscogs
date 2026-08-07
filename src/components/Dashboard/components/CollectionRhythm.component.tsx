"use client";

import classNames from "classnames";
import { useMemo } from "react";
import type {
  AcquisitionStreaksSummary,
  YearInReviewSummary,
} from "src/types/dashboard.types";
import { getChartColor, useChartColors } from "src/utils/chartColors";
import styles from "./CollectionRhythm.module.css";

interface CollectionRhythmProps {
  yearInReview: YearInReviewSummary | null;
  acquisitionStreaks: AcquisitionStreaksSummary | null;
}

const formatCount = (value: number): string =>
  new Intl.NumberFormat("en-US").format(value);

const formatSignedPercent = (value: number): string => {
  const rounded = Math.abs(value).toFixed(Math.abs(value) >= 10 ? 0 : 1);
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${rounded}%`;
};

const formatShareDelta = (changePoints: number): string => {
  if (Math.abs(changePoints) < 0.5) {
    return "steady";
  }

  return formatSignedPercent(changePoints);
};

function RhythmStat({
  label,
  period,
  count,
  suffix,
  description,
}: {
  label: string;
  period?: string;
  count: number | string;
  suffix?: string;
  description?: string;
}) {
  const formattedCount = typeof count === "number" ? formatCount(count) : count;

  return (
    <div className={styles.statTile}>
      <p className={styles.statLabel}>{label}</p>
      {period ? <p className={styles.statPeriod}>{period}</p> : null}
      <p className={styles.statNumberRow}>
        <span className={styles.statNumber}>{formattedCount}</span>
        {suffix ? (
          <span className={styles.statNumberSuffix}>{suffix}</span>
        ) : null}
      </p>
      {description ? (
        <p className={styles.statDescription}>{description}</p>
      ) : null}
    </div>
  );
}

export function CollectionRhythm({
  yearInReview,
  acquisitionStreaks,
}: CollectionRhythmProps) {
  const colors = useChartColors();

  const compareMaxAdds = useMemo(() => {
    if (!yearInReview) {
      return 1;
    }

    return Math.max(
      yearInReview.recentPeriodAdds,
      yearInReview.priorPeriodAdds,
      1,
    );
  }, [yearInReview]);

  if (!(yearInReview || acquisitionStreaks)) {
    return null;
  }

  const longestGapDescription =
    acquisitionStreaks &&
    acquisitionStreaks.longestGapDays > 0 &&
    acquisitionStreaks.longestGapStart &&
    acquisitionStreaks.longestGapEnd
      ? `${acquisitionStreaks.longestGapStart} to ${acquisitionStreaks.longestGapEnd}`
      : "Adds have stayed steady so far.";

  return (
    <div className={styles.rhythmGrid}>
      {yearInReview && (
        <article className={styles.card} data-testid="fmdYearInReviewCard">
          <header className={styles.cardHeader}>
            <p className={styles.eyebrow}>Rolling 12 months</p>
            <h3 className={styles.cardTitle}>Year in review</h3>
          </header>

          <div className={styles.heroStat}>
            <span className={styles.heroValue}>
              {formatCount(yearInReview.recentPeriodAdds)}
            </span>
            <span className={styles.heroLabel}>records added</span>
            {yearInReview.addsChangePercent !== null &&
              yearInReview.priorPeriodAdds > 0 && (
                <span
                  className={classNames(styles.changePill, {
                    [styles.changePillPositive]:
                      yearInReview.addsChangePercent >= 0,
                    [styles.changePillNegative]:
                      yearInReview.addsChangePercent < 0,
                  })}
                >
                  {formatSignedPercent(yearInReview.addsChangePercent)} vs prior
                  year
                </span>
              )}
          </div>

          <div className={styles.compareBars}>
            <div className={styles.compareRow}>
              <div className={styles.compareRowHeader}>
                <span className={styles.compareLabel}>This year</span>
                <span className={styles.compareCount}>
                  {formatCount(yearInReview.recentPeriodAdds)}
                </span>
              </div>
              <div className={styles.compareTrack}>
                <div
                  aria-hidden="true"
                  className={classNames(
                    styles.compareFill,
                    styles.compareFillRecent,
                  )}
                  style={{
                    width: `${(yearInReview.recentPeriodAdds / compareMaxAdds) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className={styles.compareRow}>
              <div className={styles.compareRowHeader}>
                <span className={styles.compareLabel}>Prior year</span>
                <span className={styles.compareCount}>
                  {formatCount(yearInReview.priorPeriodAdds)}
                </span>
              </div>
              <div className={styles.compareTrack}>
                <div
                  aria-hidden="true"
                  className={classNames(
                    styles.compareFill,
                    styles.compareFillPrior,
                  )}
                  style={{
                    width: `${(yearInReview.priorPeriodAdds / compareMaxAdds) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {(yearInReview.topNewArtists.length > 0 ||
            yearInReview.genreDrift.length > 0) && (
            <div className={styles.detailsPanel}>
              {yearInReview.topNewArtists.length > 0 && (
                <div className={styles.detailBlock}>
                  <p className={styles.detailLabel}>Top new artists</p>
                  <ul className={styles.artistList}>
                    {yearInReview.topNewArtists.map((artist) => (
                      <li className={styles.artistChip} key={artist.label}>
                        <span className={styles.artistName}>
                          {artist.label}
                        </span>
                        <span className={styles.artistCount}>
                          {formatCount(artist.count)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {yearInReview.genreDrift.length > 0 && (
                <div className={styles.detailBlock}>
                  <p className={styles.detailLabel}>Genre drift</p>
                  <ul className={styles.driftList}>
                    {yearInReview.genreDrift.map((genre, index) => {
                      const fillColor = getChartColor(colors, index);
                      const barWidth = Math.min(
                        100,
                        Math.max(genre.recentShare, genre.priorShare, 4),
                      );

                      return (
                        <li className={styles.driftRow} key={genre.label}>
                          <div className={styles.driftRowHeader}>
                            <span className={styles.driftGenre}>
                              {genre.label}
                            </span>
                            <span
                              className={classNames(styles.driftDelta, {
                                [styles.driftDeltaPositive]:
                                  genre.changePoints >= 0,
                                [styles.driftDeltaNegative]:
                                  genre.changePoints < 0,
                              })}
                            >
                              {formatShareDelta(genre.changePoints)}
                            </span>
                          </div>
                          <div className={styles.driftTrack}>
                            <div
                              aria-hidden="true"
                              className={styles.driftFill}
                              style={{
                                width: `${barWidth}%`,
                                backgroundColor: fillColor,
                              }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </article>
      )}

      {acquisitionStreaks && (
        <article
          className={styles.card}
          data-testid="fmdAcquisitionStreaksCard"
        >
          <header className={styles.cardHeader}>
            <p className={styles.eyebrow}>Buying rhythm</p>
            <h3 className={styles.cardTitle}>Acquisition streaks</h3>
          </header>

          <div className={styles.statsGrid}>
            <RhythmStat
              label="Longest dry spell"
              count={
                acquisitionStreaks.longestGapDays > 0
                  ? acquisitionStreaks.longestGapDays
                  : "None yet"
              }
              {...(acquisitionStreaks.longestGapDays > 0
                ? { suffix: "days" }
                : {})}
              description={longestGapDescription}
            />

            {acquisitionStreaks.busiestDay && (
              <RhythmStat
                label="Busiest day"
                period={acquisitionStreaks.busiestDay.label}
                count={acquisitionStreaks.busiestDay.count}
                description="Most records added in one day"
              />
            )}

            {acquisitionStreaks.busiestMonth && (
              <RhythmStat
                label="Busiest month"
                period={acquisitionStreaks.busiestMonth.label}
                count={acquisitionStreaks.busiestMonth.count}
                description="Most records added in one month"
              />
            )}

            {acquisitionStreaks.busiestQuarter && (
              <RhythmStat
                label="Busiest quarter"
                period={acquisitionStreaks.busiestQuarter.label}
                count={acquisitionStreaks.busiestQuarter.count}
              />
            )}

            {acquisitionStreaks.leastBusyQuarter && (
              <RhythmStat
                label="Quietest quarter"
                period={acquisitionStreaks.leastBusyQuarter.label}
                count={acquisitionStreaks.leastBusyQuarter.count}
              />
            )}
          </div>
        </article>
      )}
    </div>
  );
}
