"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  dismissSupportProjectToast,
  showSupportProjectToast,
} from "src/components/SupportProjectToast/supportProjectToast";
import { SUPPORT_PROJECT_ABOUT_PATH } from "src/constants/supportProjectToast.constants";
import { useDismissSupportProjectToastMutation } from "src/hooks/mutations/useAuthMutations";
import { useAuthQuery } from "src/hooks/queries/useAuthQuery";
import { navigateToPathHash } from "src/utils/hashNavigation";
import { markSupportProjectToastShownThisSession } from "src/utils/supportProjectToastSession";

export const SupportProjectToast = () => {
  const router = useRouter();
  const { data: authData } = useAuthQuery();
  const { mutate: dismissSupportToast } =
    useDismissSupportProjectToastMutation();
  const hasShownRef = useRef(false);
  const [canMountToast, setCanMountToast] = useState(false);

  useEffect(() => {
    const readyTimer = window.setTimeout(() => {
      setCanMountToast(true);
    }, 0);

    return () => {
      window.clearTimeout(readyTimer);
    };
  }, []);

  useEffect(() => {
    if (!canMountToast) {
      return;
    }

    if (!(authData?.isAuthenticated && authData.showSupportProjectToast)) {
      return;
    }

    if (hasShownRef.current) {
      return;
    }

    hasShownRef.current = true;

    showSupportProjectToast({
      onLearnMore: () => {
        navigateToPathHash({
          href: SUPPORT_PROJECT_ABOUT_PATH,
          currentPathname: window.location.pathname,
          router,
        });
      },
      onDismiss: () => {
        markSupportProjectToastShownThisSession();
        dismissSupportProjectToast();
        dismissSupportToast();
      },
    });
  }, [
    authData?.isAuthenticated,
    authData?.showSupportProjectToast,
    canMountToast,
    dismissSupportToast,
    router,
  ]);

  return null;
};
