import type { Metadata } from "next";
import Link from "next/link";
import { PRIVATE_PAGE_ROBOTS } from "src/constants/siteMetadata";
import styles from "src/styles/modules/error-boundary.module.css";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you requested does not exist.",
  robots: PRIVATE_PAGE_ROBOTS,
};

export default function NotFound() {
  return (
    <div className={styles.shell}>
      <main className={styles.inner}>
        <div className={styles.card}>
          <h1 className={styles.titlePage}>Page not found</h1>
          <p className={styles.message}>
            That URL is not part of FilterMyDisco.gs. Check the address or head
            back to the home page.
          </p>
          <div className={styles.actions}>
            <Link className={styles.retryButton} href="/">
              Go home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
