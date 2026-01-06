import Link from "next/link";
import { useEffect, useState } from "react";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import Icon from "src/styles/icons/fmd-icon.svg";
import Logo from "src/styles/icons/fmd-logo.svg";
import styles from "./HeaderTitle.module.css";

export const HeaderTitle = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to Icon (mobile) during SSR and initial render to prevent hydration mismatch
  const showLogo = mounted && !isMobile;

  return (
    <Link href="/releases" className={styles.title}>
      {showLogo ? <Logo /> : <Icon />}
    </Link>
  );
};
