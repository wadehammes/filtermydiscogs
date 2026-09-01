"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import {
  SUPPORT_PROJECT_ABOUT_PATH,
  SUPPORT_PROJECT_NAV_ARIA_LABEL,
} from "src/constants/supportProjectToast.constants";
import {
  navigateToPathHash,
  splitPathHashHref,
} from "src/utils/hashNavigation";

type SupportProjectNavLinkProps = Omit<ComponentProps<typeof Link>, "href">;

const supportTarget = splitPathHashHref(SUPPORT_PROJECT_ABOUT_PATH);

export const SupportProjectNavLink = ({
  children,
  onClick,
  ...props
}: SupportProjectNavLinkProps) => {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    const currentPathname = window.location.pathname;

    if (currentPathname === supportTarget.pathname) {
      navigateToPathHash({
        href: SUPPORT_PROJECT_ABOUT_PATH,
        currentPathname,
        router,
        event,
      });
    }
  };

  return (
    <Link
      href={SUPPORT_PROJECT_ABOUT_PATH}
      aria-label={SUPPORT_PROJECT_NAV_ARIA_LABEL}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
};
