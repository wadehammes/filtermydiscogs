import Image from "next/image";
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
            Connect your Discogs account to filter and explore your vinyl
            collection
          </p>

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          <button
            className={styles.loginButton}
            onClick={login}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                Connecting...
              </>
            ) : (
              "Connect with Discogs"
            )}
          </button>
        </div>

        <div className={`${styles.bentoCard} ${styles.featuresCard}`}>
          <h3>What you can do with your Discogs collection:</h3>
          <ul>
            <li>Browse, search and filter by styles, years, and formats</li>
            <li>Sort by label, year, date added, or rating</li>
            <li>View a random release</li>
            <li>View release details in card or table view</li>
            <li>Save releases to a crate as you browse</li>
            <li>Create and download mosaic grids in different formats/sizes</li>
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
