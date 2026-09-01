import classNames from "classnames";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import { PageFooterStats } from "src/components/Page/PageFooterStats.server";
import { SupportProjectNavLink } from "src/components/SupportProjectNavLink/SupportProjectNavLink.component";
import Heart from "src/styles/icons/heart-thin.svg";
import styles from "./Page.module.css";

type PageFooterProps = {
  variant?: "default" | "gradient";
};

async function getCopyrightYear() {
  "use cache";
  cacheLife("max");

  return new Date().getFullYear();
}

export async function PageFooter({ variant = "default" }: PageFooterProps) {
  const currentYear = await getCopyrightYear();

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
            <SupportProjectNavLink>
              Contribute to the project
            </SupportProjectNavLink>
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
}
