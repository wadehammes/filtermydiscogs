import classNames from "classnames";
import Link from "next/link";
import { Suspense } from "react";
import { PageFooterStats } from "src/components/Page/PageFooterStats.server";
import Heart from "src/styles/icons/heart-solid.svg";
import styles from "./Page.module.css";

type PageFooterProps = {
  variant?: "default" | "gradient";
};

/**
 * Server Component for the page footer.
 * This reduces client bundle size by rendering the footer on the server.
 */
export const PageFooter = ({ variant = "default" }: PageFooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={classNames(styles.footerShell, {
        [styles.footerShellGradient as string]: variant === "gradient",
      })}
    >
      <Suspense fallback={null}>
        <PageFooterStats variant={variant} />
      </Suspense>
      <div
        className={classNames(styles.footer, {
          [styles.footerGradient as string]: variant === "gradient",
        })}
      >
        <p>
          <Heart /> made with love by{" "}
          <a href="https://wadehammes.com" target="_blank" rel="noreferrer">
            Wade Hammes
          </a>
        </p>
        <p className={styles.footerCopyrightMeta}>
          <span>
            <Link href="/about">About</Link>
          </span>
          &bull;
          <span>
            <a
              href="https://github.com/wadehammes/filtermydiscogs"
              target="_blank"
              rel="noreferrer"
            >
              Contribute to the project
            </a>
          </span>
          <span>&copy; {currentYear}</span>
        </p>
      </div>
    </footer>
  );
};
