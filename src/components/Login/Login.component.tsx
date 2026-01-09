import Image from "next/image";
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

          <a href="/legal" className={styles.aboutLink}>
            Terms & Privacy
          </a>
        </div>

        <div className={`${styles.bentoCard} ${styles.featuresCard}`}>
          <h3>What you can do with your collection:</h3>
          <ul>
            <li>Browse and search your entire collection</li>
            <li>
              Filter by styles, genres, years, and formats; sort by label, year,
              date added, or rating
            </li>
            <li>Hit random and rediscover something from your collection</li>
            <li>
              <strong>Create and manage multiple crates</strong>—perfect for DJ
              gigs, organizing by theme, or tracking favorites
            </li>
            <li>
              Generate mosaic grids from your crates in different formats and
              sizes
            </li>
            <li>Works great on your phone, tablet, or desktop</li>
            <li>
              <strong>
                Free to use (although subscriptions may happen later)
              </strong>
            </li>
          </ul>
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
          <a href="/about">About</a>
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
