"use client";

import classNames from "classnames";
import Image from "next/image";
import { useMounted } from "src/hooks/useMounted.hook";
import { useTheme } from "src/hooks/useTheme.hook";
import styles from "./LoginFeatureVisual.module.css";

type LoginFeatureVisualProps = {
  imageBase?: string | undefined;
  alt?: string | undefined;
  className?: string | undefined;
  themeIndependent?: boolean | undefined;
};

export const LoginFeatureVisual = ({
  imageBase,
  alt,
  className,
  themeIndependent = false,
}: LoginFeatureVisualProps) => {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  const activeTheme = mounted ? resolvedTheme : "light";

  if (!imageBase) {
    return (
      <div
        className={classNames(styles.placeholder, className)}
        aria-hidden="true"
      />
    );
  }

  const imageSrc = themeIndependent
    ? `/images/${imageBase}.png`
    : `/images/${imageBase}--${activeTheme === "dark" ? "dark" : "light"}.png`;

  return (
    <div className={classNames(styles.visual, className)}>
      <Image
        src={imageSrc}
        alt={alt ?? ""}
        className={styles.image}
        fill
        sizes="(max-width: 768px) 100vw, 27.5rem"
      />
    </div>
  );
};
