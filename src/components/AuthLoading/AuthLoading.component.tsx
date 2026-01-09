import Spinner from "src/components/Spinner/Spinner.component";
import Logo from "src/styles/icons/fmd-logo.svg";
import styles from "./AuthLoading.module.css";

export const AuthLoading = () => {
  return (
    <div className={styles.container}>
      <div className={styles.loadingCard}>
        <Logo className={styles.logo} />
        <Spinner size="xl" aria-label="Checking authentication" />
        <p className={styles.description}>Checking authentication...</p>
      </div>
    </div>
  );
};

export default AuthLoading;
