import Link from "next/link";
import { ABOUT_GITHUB_LINKS } from "src/constants/about.constants";
import styles from "./CrateLayoutBetaBanner.module.css";

export const CrateLayoutBetaBanner = () => (
  <div
    className={styles.banner}
    role="status"
    data-testid="fmdCrateLayoutBetaBanner"
  >
    <p className={styles.text}>
      Crate layout and sections are in{" "}
      <span className={styles.betaLabel}>beta</span>. Something off?{" "}
      <Link
        href={ABOUT_GITHUB_LINKS.issues}
        className={styles.link}
        target="_blank"
        rel="noopener noreferrer"
      >
        Report an issue on GitHub
      </Link>
      .
    </p>
  </div>
);
