"use client";

import classNames from "classnames";
import { useMemo } from "react";
import {
  ScrollRevealBar,
  TickerNumber,
} from "src/components/ScrollReveal/ScrollReveal.component";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { useScrollRevealInView } from "src/hooks/useScrollRevealInView.hook";
import scrollRevealStyles from "src/styles/modules/scroll-reveal.module.css";
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
  const { ref, inView } = useScrollRevealInView();

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
      <div
        ref={ref}
        className={classNames(
          scrollRevealStyles.root,
          styles.periodGrid,
          inView && scrollRevealStyles.revealed,
        )}
      >
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
                <TickerNumber active={inView} value={period.releaseCount} />{" "}
                {period.releaseCount === 1 ? "release" : "releases"}
              </p>
            </header>
            {period.styles.length > 0 ? (
              <ul className={styles.styleList}>
                {period.styles.map((style, styleIndex) => {
                  const fillColor =
                    styleColorMap.get(style.name) ?? getChartColor(colors, 0);

                  return (
                    <li className={styles.styleRow} key={style.name}>
                      <div className={styles.styleRowHeader}>
                        <span className={styles.styleName}>{style.name}</span>
                        <span className={styles.stylePercent}>
                          <TickerNumber
                            active={inView}
                            format={(value) => `${value}%`}
                            value={style.percentage}
                          />
                          <span aria-hidden="true">%</span>
                        </span>
                      </div>
                      <div
                        aria-label={`${style.name}: ${style.percentage}% of styles in this period`}
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={style.percentage}
                        className={styles.styleBarTrack}
                        role="progressbar"
                      >
                        <ScrollRevealBar
                          className={styles.styleBarFill}
                          delayMs={(periodIndex * 5 + styleIndex + 2) * 90}
                          style={{ backgroundColor: fillColor }}
                          width={`${style.percentage}%`}
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
