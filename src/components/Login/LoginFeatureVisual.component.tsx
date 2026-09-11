"use client";

import classNames from "classnames";
import Image from "next/image";
import { use } from "react";
import { browser } from "react-dom";
import { useTheme } from "src/hooks/useTheme.hook";
import { themeUsesDarkAssets } from "src/utils/themeAppearance";
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
  use(browser());
  const { resolvedTheme } = useTheme();

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
    : `/images/${imageBase}--${themeUsesDarkAssets(resolvedTheme) ? "dark" : "light"}.png`;

  return (
    <div className={classNames(styles.visual, className)}>
      <Image
        src={imageSrc}
        alt={alt ?? ""}
        className={styles.image}
        fill
        loading="eager"
        sizes="(max-width: 768px) 100vw, 27.5rem"
      />
    </div>
  );
};
