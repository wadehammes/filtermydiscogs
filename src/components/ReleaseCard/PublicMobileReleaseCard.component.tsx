import { memo } from "react";
import { MobileReleaseCard } from "src/components/ReleaseCard/MobileReleaseCard.component";
import type { ReleaseCardProps } from "src/types";

type PublicMobileReleaseCardProps = Omit<
  ReleaseCardProps,
  "isRandomMode" | "onExitRandomMode"
>;

const PublicMobileReleaseCardComponent = (
  props: PublicMobileReleaseCardProps,
) => {
  return (
    <MobileReleaseCard
      {...props}
      showOverlayActions={false}
      rootTestId="fmdPublicMobileReleaseCard"
    />
  );
};

export const PublicMobileReleaseCard = memo(PublicMobileReleaseCardComponent);
