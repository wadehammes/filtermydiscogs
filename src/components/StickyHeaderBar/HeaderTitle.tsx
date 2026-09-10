import Link from "next/link";
import { SITE_NAME } from "src/constants/siteMetadata";
import FMDIcon from "src/styles/icons/fmd-icon.svg";
import styles from "./HeaderTitle.module.css";

export const HeaderTitle = () => {
  return (
    <Link href="/releases" className={styles.titleLink} aria-label={SITE_NAME}>
      <FMDIcon aria-hidden className={styles.icon} />
    </Link>
  );
};
