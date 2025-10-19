import Link from "next/link";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import Icon from "src/styles/icons/fmd-icon.svg";
import Logo from "src/styles/icons/fmd-logo.svg";
import styles from "./HeaderTitle.module.css";

export const HeaderTitle = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <Link href="/releases" className={styles.title}>
      {isMobile ? <Icon /> : <Logo />}
    </Link>
  );
};
