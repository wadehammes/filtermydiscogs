"use client";

import { useMemo } from "react";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { getChartColor, useChartColors } from "src/utils/chartColors";
import type { DashboardSectionCopy } from "src/utils/dashboardStory";
import { calculateStyleEvolution } from "src/utils/styleEvolution";
import styles from "./StyleEvolution.module.css";

interface StyleEvolutionProps {
  hideHeading?: boolean;
  sectionCopy?: DashboardSectionCopy;
}

export const StyleEvolution = ({
  hideHeading = false,
  sectionCopy,
}: StyleEvolutionProps) => {
  const releases = useAllReleases();
  const colors = useChartColors();

  const styleEvolution = useMemo(() => {
    return calculateStyleEvolution(releases || []);
  }, [releases]);

  const styleColorMap = useMemo(() => {
    const allStyles = new Set<string>();

    styleEvolution.forEach((period) => {
      period.styles.forEach((style) => {
        allStyles.add(style.name);
      });
    });

    const sortedStyles = Array.from(allStyles).sort();
    const colorMap = new Map<string, string>();

    sortedStyles.forEach((style, index) => {
      colorMap.set(style, getChartColor(colors, index));
    });

    return colorMap;
  }, [styleEvolution, colors]);

  const sectionTitle = sectionCopy?.title ?? "Taste over time";
  const sectionLede =
    sectionCopy?.lede ??
    "How your top styles shifted as you kept adding records.";

  if (styleEvolution.length === 0) {
    return (
      <div className={styles.container}>
        <header className={styles.sectionHeader}>
          {hideHeading ? (
            <h3 className={styles.sectionTitle}>{sectionTitle}</h3>
          ) : (
            <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
          )}
          <p className={styles.subtitle}>{sectionLede}</p>
        </header>
        <div className={styles.emptyState}>
          <p>Not enough records yet to show how taste shifted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.sectionHeader}>
        {hideHeading ? (
          <h3 className={styles.sectionTitle}>{sectionTitle}</h3>
        ) : (
          <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
        )}
        <p className={styles.subtitle}>{sectionLede}</p>
      </header>
      <div className={styles.periodGrid}>
        {styleEvolution.map((period, periodIndex) => (
          <article
            key={period.period}
            className={styles.periodCard}
            aria-labelledby={`style-period-${periodIndex}-title`}
          >
            <header className={styles.periodHeader}>
              <h3
                className={styles.periodTitle}
                id={`style-period-${periodIndex}-title`}
              >
                {period.dateRange}
              </h3>
              <p className={styles.periodMeta}>
                {period.releaseCount}{" "}
                {period.releaseCount === 1 ? "release" : "releases"}
              </p>
            </header>
            {period.styles.length > 0 ? (
              <ul className={styles.styleList}>
                {period.styles.map((style) => {
                  const fillColor =
                    styleColorMap.get(style.name) ?? getChartColor(colors, 0);

                  return (
                    <li className={styles.styleRow} key={style.name}>
                      <div className={styles.styleRowHeader}>
                        <span className={styles.styleName}>{style.name}</span>
                        <span className={styles.stylePercent}>
                          {style.percentage}%
                        </span>
                      </div>
                      <div className={styles.styleBarTrack}>
                        <div
                          aria-label={`${style.name}: ${style.percentage}% of styles in this period`}
                          aria-valuemax={100}
                          aria-valuemin={0}
                          aria-valuenow={style.percentage}
                          className={styles.styleBarFill}
                          role="progressbar"
                          style={{
                            width: `${style.percentage}%`,
                            backgroundColor: fillColor,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={styles.noStyles}>No styles recorded</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};
