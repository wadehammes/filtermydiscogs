import classNames from "classnames";
import styles from "./PublicSharedViewBanner.module.css";

export type PublicSharedViewBannerKind = "crate" | "playlist";

export interface PublicSharedViewBannerProps {
  kind: PublicSharedViewBannerKind;
  username?: string | null;
  className?: string;
}

const kindLabel: Record<PublicSharedViewBannerKind, string> = {
  crate: "Public crate",
  playlist: "Public playlist",
};

export const PublicSharedViewBanner = ({
  kind,
  username,
  className,
}: PublicSharedViewBannerProps) => {
  const trimmedUsername = username?.trim() ?? "";
  const sharedBySuffix = trimmedUsername
    ? ` · Shared by ${trimmedUsername}`
    : "";

  return (
    <div
      className={classNames(styles.banner, className)}
      data-testid="fmdPublicSharedViewBanner"
      role="status"
    >
      <p className={styles.text}>
        {kindLabel[kind]}
        {sharedBySuffix}
      </p>
    </div>
  );
};
