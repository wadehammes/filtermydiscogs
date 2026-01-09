import Image from "next/image";
import Link from "next/link";
import Button from "src/components/Button/Button.component";
import ErrorMessage from "src/components/ErrorMessage/ErrorMessage.component";
import { useAuth } from "src/context/auth.context";
import { useTheme } from "src/hooks/useTheme.hook";
import Logo from "src/styles/icons/fmd-stacked.svg";
import styles from "./Login.module.css";

export const Login = () => {
  const { state, login } = useAuth();
  const { resolvedTheme } = useTheme();
  const { isLoading, error } = state;

  const previewImageSrc =
    resolvedTheme === "dark"
      ? "/images/app-preview--dark.png"
      : "/images/app-preview--light.png";

  return (
    <div className={styles.container}>
      <div className={styles.bentoGrid}>
        <div className={`${styles.bentoCard} ${styles.previewCard}`}>
          <Image
            src={previewImageSrc}
            alt="App preview showing the main interface with release cards, filters, and crate functionality"
            className={styles.previewImage}
            width={800}
            height={400}
            priority
          />
        </div>

        <div className={`${styles.bentoCard} ${styles.actionCard}`}>
          <Logo className={styles.logo} />

          <p className={styles.description}>
            Connect your Discogs account to explore your collection
          </p>

          {error && <ErrorMessage message={error} />}

          <Button
            variant="primary"
            size="lg"
            onClick={login}
            disabled={isLoading}
            isLoading={isLoading}
            loadingText="Connecting..."
            className={styles.loginButton}
          >
            Connect with Discogs
          </Button>

          <Link href="/legal" className={styles.aboutLink}>
            Terms & Privacy
          </Link>
        </div>

        <div className={`${styles.bentoCard} ${styles.featuresCard}`}>
          <h3>What you can do with your collection:</h3>
          <ul>
            <li>
              <strong>Explore your Collections Insights Dashboard</strong>—
              discover your collection milestones, style evolution over time,
              growth trends, and more with beautiful visualizations
            </li>
            <li>
              <strong>Browse, search, and filter your entire collection</strong>{" "}
              - rediscover your favorite albums and artists
            </li>
            <li>
              <strong>Create and manage multiple crates</strong> — perfect for
              DJ gigs, organizing by theme, or tracking favorites
            </li>
            <li>
              <strong>Generate mosaic grids from your crates</strong> in
              different formats and sizes—perfect for social sharing
            </li>
          </ul>
          <p className={styles.note}>
            Free to use (
            <Link href="/about" className={styles.supportLink}>
              support is greatly appreciated
            </Link>
            )
          </p>
        </div>
      </div>

      <div className={styles.footer}>
        <span>
          made by{" "}
          <a href="https://wadehammes.com" target="_blank" rel="noreferrer">
            Wade Hammes
          </a>
        </span>
        <span>
          <Link href="/about">About</Link>
        </span>
        <span>
          <a
            href="https://github.com/wadehammes/filtermydiscogs"
            target="_blank"
            rel="noreferrer"
          >
            Contribute to the project
          </a>
        </span>
        <span>&copy; {new Date().getFullYear()}</span>
      </div>
    </div>
  );
};

export default Login;
