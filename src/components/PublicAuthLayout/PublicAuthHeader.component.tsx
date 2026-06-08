"use client";

import { PublicPageHeader } from "src/components/PublicPageHeader/PublicPageHeader.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { useAuth } from "src/context/auth.context";

type PublicAuthHeaderProps = {
  authenticatedNavPage?: "about" | "legal";
  currentPage?: "home" | "about" | "legal";
};

export const PublicAuthHeader = ({
  authenticatedNavPage,
  currentPage = "home",
}: PublicAuthHeaderProps) => {
  const {
    state: { isAuthenticated },
  } = useAuth();

  if (isAuthenticated && authenticatedNavPage) {
    return (
      <StickyHeaderBar
        allReleasesLoaded={true}
        hideFilters={true}
        currentPage={authenticatedNavPage}
      />
    );
  }

  return <PublicPageHeader currentPage={currentPage} />;
};
