import Link from "next/link";
import Logo from "src/styles/icons/fmd-logo.svg";
import styles from "./HeaderTitle.module.css";

export const HeaderTitle = () => {
  return (
    <Link href="/releases" className={styles.title}>
      <Logo />
    </Link>
  );
};
