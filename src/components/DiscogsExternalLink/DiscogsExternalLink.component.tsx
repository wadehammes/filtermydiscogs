"use client";

import classNames from "classnames";
import type { MouseEvent, ReactNode } from "react";
import { IconButtonLink } from "src/components/IconButton/IconButtonLink.component";
import { ModalToolbarLink } from "src/components/ModalToolbar/ModalToolbar.component";
import ExternalLinkIcon from "src/styles/icons/external-link-thin.svg";
import textActionStyles from "src/styles/modules/text-action.module.css";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getResourceUrl } from "src/utils/helpers";

export type DiscogsExternalLinkVariant = "icon" | "toolbar" | "text";

export interface DiscogsExternalLinkProps {
  href: string;
  variant: DiscogsExternalLinkVariant;
  className?: string | undefined;
  iconClassName?: string | undefined;
  label?: string;
  onClick?: (event: MouseEvent) => void;
}

const DEFAULT_LABEL = "View on Discogs";

export function getDiscogsReleaseUrl(release: DiscogsRelease): string | null {
  return getResourceUrl({
    resourceUrl: release.basic_information.resource_url,
    type: "release",
  });
}

export const DiscogsExternalLink = ({
  href,
  variant,
  className,
  iconClassName,
  label = DEFAULT_LABEL,
  onClick,
}: DiscogsExternalLinkProps) => {
  const linkProps = {
    href,
    target: "_blank" as const,
    rel: "noopener noreferrer",
    "aria-label": label,
    title: label,
    ...definedProps({ onClick }),
  };

  if (variant === "toolbar") {
    return (
      <ModalToolbarLink variant="external" {...linkProps}>
        <ExternalLinkIcon />
      </ModalToolbarLink>
    );
  }

  if (variant === "icon") {
    return (
      <IconButtonLink
        variant="external"
        className={className}
        iconClassName={iconClassName}
        {...linkProps}
      >
        <ExternalLinkIcon />
      </IconButtonLink>
    );
  }

  return (
    <a
      className={classNames(textActionStyles.primary, className)}
      {...linkProps}
    >
      {label}
    </a>
  );
};

export interface DiscogsReleaseExternalLinkProps
  extends Omit<DiscogsExternalLinkProps, "href"> {
  release: DiscogsRelease;
  fallback?: ReactNode;
}

export const DiscogsReleaseExternalLink = ({
  release,
  fallback = null,
  ...props
}: DiscogsReleaseExternalLinkProps) => {
  const href = getDiscogsReleaseUrl(release);

  if (!href) {
    return fallback;
  }

  return <DiscogsExternalLink href={href} {...props} />;
};
