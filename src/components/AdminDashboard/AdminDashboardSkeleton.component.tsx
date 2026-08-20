"use client";

import dashboardStyles from "src/components/Dashboard/DashboardClient.module.css";
import heroStyles from "src/components/Dashboard/DashboardHero.module.css";
import styles from "./AdminDashboardSkeleton.module.css";

export function AdminDashboardSkeleton() {
  return (
    <div className={dashboardStyles.content}>
      <div className={heroStyles.hero}>
        <div className={heroStyles.intro}>
          <div className={styles.heroEyebrow} />
          <div className={styles.heroTitle} />
          <div className={styles.heroCountBlock}>
            <div className={styles.heroCount} />
            <div className={styles.heroLine} />
          </div>
        </div>

        <aside aria-hidden="true" className={heroStyles.metricsPanel}>
          <dl className={heroStyles.metricsList}>
            {[0, 1].map((index) => (
              <div className={heroStyles.metricItem} key={index}>
                <div className={styles.metricLabel} />
                <div className={styles.metricValue} />
              </div>
            ))}
          </dl>
        </aside>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle} />
          <div className={styles.sectionLede} />
        </div>
        <div className={styles.statGrid}>
          {[0, 1, 2, 3].map((index) => (
            <div className={styles.statCard} key={index} />
          ))}
        </div>
        <div className={styles.cardGrid}>
          {[0, 1].map((index) => (
            <div className={styles.card} key={`pref-${index}`} />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle} />
          <div className={styles.sectionLede} />
        </div>
        <div className={styles.statGridWide}>
          {[0, 1, 2, 3].map((index) => (
            <div className={styles.statCard} key={index} />
          ))}
        </div>
        <div className={styles.featureChartCard} />
        <div className={styles.statGrid}>
          {[0, 1, 2].map((index) => (
            <div className={styles.statCard} key={`avg-${index}`} />
          ))}
        </div>
        <div className={styles.cardGrid}>
          <div className={styles.card} />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle} />
          <div className={styles.sectionLede} />
        </div>
        <div className={styles.statGrid}>
          {[0, 1, 2, 3, 4].map((index) => (
            <div className={styles.statCard} key={index} />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle} />
          <div className={styles.sectionLede} />
        </div>
        <div className={styles.cardGrid}>
          {[0, 1].map((index) => (
            <div className={styles.card} key={index} />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle} />
          <div className={styles.sectionLede} />
        </div>
        <div className={styles.chartGrid}>
          {[0, 1, 2, 3, 4].map((index) => (
            <div className={styles.chartCard} key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
