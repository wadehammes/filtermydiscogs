import styles from "./AuthLoading.module.css";

export const AuthLoading = () => {
  return (
    <div className={styles.container}>
      <div className={styles.loadingCard}>
        <div className={styles.spinner} />
        <h1 className={styles.title}>Filter My Disco.gs</h1>
        <p className={styles.description}>Checking authentication...</p>
      </div>
    </div>
  );
};

export default AuthLoading;
