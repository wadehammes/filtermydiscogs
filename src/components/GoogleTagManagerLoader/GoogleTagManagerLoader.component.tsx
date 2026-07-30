"use client";

import { useEffect, useRef } from "react";
import { GOOGLE_TAG_MANAGER_ID } from "src/constants/analytics";
import { useAnalyticsConsent } from "src/context/analyticsConsent.context";

export const GTM_SCRIPT_ID = "fmd-gtm";

const injectGoogleTagManager = (gtmId: string): void => {
  if (typeof document === "undefined") {
    return;
  }

  if (document.getElementById(GTM_SCRIPT_ID)) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    "gtm.start": Date.now(),
    event: "gtm.js",
  });

  const script = document.createElement("script");
  script.id = GTM_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
  document.head.appendChild(script);
};

export const GoogleTagManagerLoader = () => {
  const { isAnalyticsEnabled } = useAnalyticsConsent();
  const hasInjectedRef = useRef(false);

  useEffect(() => {
    if (!isAnalyticsEnabled || hasInjectedRef.current) {
      return;
    }

    hasInjectedRef.current = true;
    injectGoogleTagManager(GOOGLE_TAG_MANAGER_ID);
  }, [isAnalyticsEnabled]);

  return null;
};
