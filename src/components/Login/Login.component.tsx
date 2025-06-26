import Image from "next/image";
import { useAuth } from "src/context/auth.context";
import styles from "./Login.module.css";

export const Login = () => {
  const { state, login } = useAuth();
  const { isLoading, error } = state;

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.appPreview}>
          <Image
            src="/images/app-preview.png"
            alt="App preview showing the main interface with release cards, filters, and crate functionality"
            className={styles.previewImage}
            width={800}
            height={400}
            priority
          />
        </div>

        <h1 className={styles.title}>Filter My Disco.gs</h1>
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

        <div className={styles.features}>
          <h3>What you can do:</h3>
          <ul>
            <li>Browse your complete vinyl collection</li>
            <li>Filter by music styles and genres</li>
            <li>Sort by various criteria</li>
            <li>Create a crate of releases while you browse</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
