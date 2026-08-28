"use client";

import classNames from "classnames";
import { useMemo, useState } from "react";
import {
  ScrollRevealBar,
  TickerNumber,
} from "src/components/ScrollReveal/ScrollReveal.component";
import Select from "src/components/Select/Select.component";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { useScrollRevealInView } from "src/hooks/useScrollRevealInView.hook";
import scrollRevealStyles from "src/styles/modules/scroll-reveal.module.css";
import type {
  AcquisitionStreaksSummary,
  YearInReviewTimeframe,
} from "src/types/dashboard.types";
import { getChartColor, useChartColors } from "src/utils/chartColors";
import {
  calculateYearInReview,
  YEAR_IN_REVIEW_TIMEFRAME_META,
  YEAR_IN_REVIEW_TIMEFRAME_OPTIONS,
} from "src/utils/collectionRhythm";
import styles from "./CollectionRhythm.module.css";

interface CollectionRhythmProps {
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
  animate,
}: {
  label: string;
  period?: string;
  count: number | string;
  suffix?: string;
  description?: string;
  animate: boolean;
}) {
  const isNumeric = typeof count === "number";

  return (
    <div className={styles.statTile}>
      <p className={styles.statLabel}>{label}</p>
      {period ? <p className={styles.statPeriod}>{period}</p> : null}
      <p className={styles.statNumberRow}>
        {isNumeric ? (
          <TickerNumber
            active={animate}
            className={styles.statNumber}
            value={count}
          />
        ) : (
          <span className={styles.statNumber}>{count}</span>
        )}
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
  acquisitionStreaks,
}: CollectionRhythmProps) {
  const releases = useAllReleases();
  const colors = useChartColors();
  const [timeframe, setTimeframe] = useState<YearInReviewTimeframe>("year");
  const { ref, inView } = useScrollRevealInView();

  const timeframeMeta = YEAR_IN_REVIEW_TIMEFRAME_META[timeframe];

  const yearInReview = useMemo(
    () => calculateYearInReview(releases, new Date(), timeframe),
    [releases, timeframe],
  );

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

  const heroAdds = yearInReview?.recentPeriodAdds ?? 0;

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
    <div
      ref={ref}
      className={classNames(
        scrollRevealStyles.root,
        styles.rhythmGrid,
        inView && scrollRevealStyles.revealed,
      )}
    >
      {yearInReview && (
        <article className={styles.card} data-testid="fmdCollectionRecapCard">
          <header className={styles.cardHeader}>
            <div className={styles.cardHeaderMain}>
              <p className={styles.eyebrow}>{timeframeMeta.eyebrow}</p>
              <h3 className={styles.cardTitle}>Collection recap</h3>
            </div>
            <Select
              className={styles.timeframeSelect}
              label="Time frame"
              options={YEAR_IN_REVIEW_TIMEFRAME_OPTIONS}
              value={timeframe}
              onChange={(value) => {
                const next = Array.isArray(value) ? value[0] : value;
                if (next) {
                  setTimeframe(next as YearInReviewTimeframe);
                }
              }}
              placeholder="Select time frame"
            />
          </header>

          <div className={styles.heroStat}>
            <TickerNumber
              active={inView}
              className={styles.heroValue}
              value={heroAdds}
            />
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
                  {formatSignedPercent(yearInReview.addsChangePercent)}{" "}
                  {timeframeMeta.compareLabel}
                </span>
              )}
          </div>

          <div className={styles.compareBars}>
            <div className={styles.compareRow}>
              <div className={styles.compareRowHeader}>
                <span className={styles.compareLabel}>
                  {timeframeMeta.recentLabel}
                </span>
                <TickerNumber
                  active={inView}
                  className={styles.compareCount}
                  value={yearInReview.recentPeriodAdds}
                />
              </div>
              <div className={styles.compareTrack}>
                <ScrollRevealBar
                  className={classNames(
                    styles.compareFill,
                    styles.compareFillRecent,
                  )}
                  delayMs={0}
                  width={`${(yearInReview.recentPeriodAdds / compareMaxAdds) * 100}%`}
                />
              </div>
            </div>
            <div className={styles.compareRow}>
              <div className={styles.compareRowHeader}>
                <span className={styles.compareLabel}>
                  {timeframeMeta.priorLabel}
                </span>
                <TickerNumber
                  active={inView}
                  className={styles.compareCount}
                  value={yearInReview.priorPeriodAdds}
                />
              </div>
              <div className={styles.compareTrack}>
                <ScrollRevealBar
                  className={classNames(
                    styles.compareFill,
                    styles.compareFillPrior,
                  )}
                  delayMs={90}
                  width={`${(yearInReview.priorPeriodAdds / compareMaxAdds) * 100}%`}
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
                            <ScrollRevealBar
                              className={styles.driftFill}
                              delayMs={(index + 2) * 90}
                              style={{ backgroundColor: fillColor }}
                              width={`${barWidth}%`}
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
            <div className={styles.cardHeaderMain}>
              <p className={styles.eyebrow}>Buying rhythm</p>
              <h3 className={styles.cardTitle}>Acquisition streaks</h3>
            </div>
          </header>

          <div className={styles.statsGrid}>
            <RhythmStat
              animate={inView}
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
                animate={inView}
                label="Busiest day"
                period={acquisitionStreaks.busiestDay.label}
                count={acquisitionStreaks.busiestDay.count}
                description="Most records added in one day"
              />
            )}

            {acquisitionStreaks.busiestMonth && (
              <RhythmStat
                animate={inView}
                label="Busiest month"
                period={acquisitionStreaks.busiestMonth.label}
                count={acquisitionStreaks.busiestMonth.count}
                description="Most records added in one month"
              />
            )}

            {acquisitionStreaks.busiestQuarter && (
              <RhythmStat
                animate={inView}
                label="Busiest quarter"
                period={acquisitionStreaks.busiestQuarter.label}
                count={acquisitionStreaks.busiestQuarter.count}
              />
            )}

            {acquisitionStreaks.leastBusyQuarter && (
              <RhythmStat
                animate={inView}
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
