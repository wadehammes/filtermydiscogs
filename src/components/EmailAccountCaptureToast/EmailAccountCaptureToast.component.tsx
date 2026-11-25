"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { BrowserOnly } from "src/components/BrowserOnly/BrowserOnly.component";
import {
  dismissEmailAccountCaptureToast,
  showEmailAccountCaptureToast,
} from "src/components/EmailAccountCaptureToast/emailAccountToast";
import { buildSettingsSectionHref } from "src/components/Settings/settingsSections.constants";
import { useShowToastOnce } from "src/components/ToastManager/useShowToastOnce.hook";
import { useToastHostReadyAfterMount } from "src/components/ToastManager/useToastHostReadyAfterMount.hook";
import { useToastPresentationGate } from "src/components/ToastManager/useToastPresentationGate.hook";
import { useAuthQuery } from "src/hooks/queries/useAuthQuery";
import { useUserContactQuery } from "src/hooks/queries/useUserContactQuery";
import {
  hasEmailAccountToastBeenDismissed,
  markEmailAccountToastDismissed,
} from "src/utils/emailAccountToastDismissal";
import { shouldOfferEmailAccountCaptureToast } from "src/utils/userContactEmailCaptureEligibility";

const EmailAccountCaptureToastInner = () => {
  const router = useRouter();
  const { data: authData } = useAuthQuery();
  const userId = authData?.userId ?? null;
  const { data: contact, isSuccess: contactReady } = useUserContactQuery({
    userId,
    enabled: authData?.isAuthenticated === true,
  });
  const [dismissedLocally, setDismissedLocally] = useState(false);
  const canMountToast = useToastHostReadyAfterMount();

  const dismissedForUser = useMemo(() => {
    if (dismissedLocally) {
      return true;
    }

    return userId ? hasEmailAccountToastBeenDismissed(userId) : true;
  }, [dismissedLocally, userId]);

  const wantsEmailCaptureToast = shouldOfferEmailAccountCaptureToast({
    isAuthenticated: authData?.isAuthenticated === true,
    userId,
    contact,
    contactReady,
    dismissedForUser,
  });

  const mayPresent = useToastPresentationGate(
    "emailAccountCapture",
    wantsEmailCaptureToast,
  );

  const showToast = useCallback(() => {
    const settingsHref = buildSettingsSectionHref("account");

    const persistDismissal = () => {
      dismissEmailAccountCaptureToast();
      setDismissedLocally(true);
      if (userId) {
        markEmailAccountToastDismissed(userId);
      }
    };

    showEmailAccountCaptureToast({
      onOpenSettings: () => {
        persistDismissal();
        router.push(settingsHref);
      },
      onDismiss: persistDismissal,
    });
  }, [router, userId]);

  useShowToastOnce(canMountToast && mayPresent, showToast);

  return null;
};

export const EmailAccountCaptureToast = () => {
  return (
    <BrowserOnly>
      <EmailAccountCaptureToastInner />
    </BrowserOnly>
  );
};
