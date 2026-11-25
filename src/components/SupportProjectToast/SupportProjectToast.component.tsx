"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { BrowserOnly } from "src/components/BrowserOnly/BrowserOnly.component";
import {
  dismissSupportProjectToast,
  showSupportProjectToast,
} from "src/components/SupportProjectToast/supportProjectToast";
import { useShowToastOnce } from "src/components/ToastManager/useShowToastOnce.hook";
import { useToastHostReadyAfterMount } from "src/components/ToastManager/useToastHostReadyAfterMount.hook";
import { useToastPresentationGate } from "src/components/ToastManager/useToastPresentationGate.hook";
import { SUPPORT_PROJECT_ABOUT_PATH } from "src/constants/supportProjectToast.constants";
import { useDismissSupportProjectToastMutation } from "src/hooks/mutations/useAuthMutations";
import { useAuthQuery } from "src/hooks/queries/useAuthQuery";
import { navigateToPathHash } from "src/utils/hashNavigation";
import { markSupportProjectToastShownThisSession } from "src/utils/supportProjectToastSession";

const SupportProjectToastInner = () => {
  const router = useRouter();
  const { data: authData } = useAuthQuery();
  const { mutate: dismissSupportToast } =
    useDismissSupportProjectToastMutation();
  const canMountToast = useToastHostReadyAfterMount();
  const wantsSupportToast = Boolean(
    authData?.isAuthenticated && authData.showSupportProjectToast,
  );
  const mayPresent = useToastPresentationGate(
    "supportProject",
    wantsSupportToast,
  );

  const showToast = useCallback(() => {
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
  }, [dismissSupportToast, router]);

  useShowToastOnce(canMountToast && mayPresent, showToast);

  return null;
};

export const SupportProjectToast = () => {
  return (
    <BrowserOnly>
      <SupportProjectToastInner />
    </BrowserOnly>
  );
};
