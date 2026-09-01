"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  dismissSupportProjectToast,
  showSupportProjectToast,
} from "src/components/SupportProjectToast/supportProjectToast";
import { SUPPORT_PROJECT_ABOUT_PATH } from "src/constants/supportProjectToast.constants";
import { useDismissSupportProjectToastMutation } from "src/hooks/mutations/useAuthMutations";
import { useAuthQuery } from "src/hooks/queries/useAuthQuery";
import { navigateToPathHash } from "src/utils/hashNavigation";

export const SupportProjectToast = () => {
  const router = useRouter();
  const { data: authData } = useAuthQuery();
  const { mutate: dismissSupportToast } =
    useDismissSupportProjectToastMutation();
  const hasShownRef = useRef(false);

  useEffect(() => {
    if (
      !(authData?.isAuthenticated && authData.showSupportProjectToast) ||
      hasShownRef.current
    ) {
      return;
    }

    hasShownRef.current = true;

    const persistDismissal = () => {
      dismissSupportToast();
    };

    showSupportProjectToast({
      onLearnMore: () => {
        dismissSupportProjectToast();
        persistDismissal();
        navigateToPathHash({
          href: SUPPORT_PROJECT_ABOUT_PATH,
          currentPathname: window.location.pathname,
          router,
        });
      },
      onDismiss: persistDismissal,
    });
  }, [
    authData?.isAuthenticated,
    authData?.showSupportProjectToast,
    dismissSupportToast,
    router,
  ]);

  return null;
};
