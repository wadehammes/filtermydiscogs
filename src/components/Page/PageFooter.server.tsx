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
        [styles.footerShellGradient]: variant === "gradient",
      })}
    >
      <Suspense fallback={null}>
        <PageFooterStats variant={variant} />
      </Suspense>
      <div
        className={classNames(styles.footer, {
          [styles.footerGradient]: variant === "gradient",
        })}
      >
        <p>
          <Heart /> made with love by{" "}
          <a
            href="https://wadehammes.com"
            target="_blank"
            rel="noreferrer"
            className={classNames({
              [styles.onGradientMuted]: variant === "gradient",
            })}
          >
            Wade Hammes
          </a>
        </p>
        <p className={styles.footerCopyrightMeta}>
          <span
            className={classNames({
              [styles.onGradientMuted]: variant === "gradient",
            })}
          >
            <Link href="/about">About</Link>
          </span>
          &bull;
          <span
            className={classNames({
              [styles.onGradientMuted]: variant === "gradient",
            })}
          >
            <a
              href="https://github.com/wadehammes/filtermydiscogs"
              target="_blank"
              rel="noreferrer"
            >
              Contribute to the project
            </a>
          </span>
          <span
            className={classNames({
              [styles.onGradientMuted]: variant === "gradient",
            })}
          >
            &copy; {currentYear}
          </span>
        </p>
      </div>
    </footer>
  );
};
