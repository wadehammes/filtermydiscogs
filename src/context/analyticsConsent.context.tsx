"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "src/context/auth.context";
import { useMounted } from "src/hooks/useMounted.hook";
import { usePersistUserPreferences } from "src/hooks/usePersistUserPreferences.hook";
import type { AnalyticsConsentState } from "src/types/analyticsConsent.types";
import {
  analyticsConsentChoiceToBoolean,
  booleanToAnalyticsConsentChoice,
  readAnalyticsConsentState,
  writeAnalyticsConsentChoice,
} from "src/utils/analyticsConsentStorage";

type AnalyticsConsentContextValue = {
  hasChosen: boolean;
  isAnalyticsEnabled: boolean;
  isReady: boolean;
  acceptAnalytics: () => void;
  rejectAnalytics: () => void;
  setAnalyticsEnabled: (enabled: boolean) => void;
  syncFromServerPreference: (analyticsConsent: boolean | undefined) => void;
};

const AnalyticsConsentContext =
  createContext<AnalyticsConsentContextValue | null>(null);

export const AnalyticsConsentProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const mounted = useMounted();
  const { state: authState } = useAuth();
  const { persistPreferences } = usePersistUserPreferences();
  const [consent, setConsent] = useState<AnalyticsConsentState>("pending");

  useEffect(() => {
    if (!mounted) {
      return;
    }

    setConsent(readAnalyticsConsentState());
  }, [mounted]);

  const applyChoice = useCallback(
    (nextConsent: Exclude<AnalyticsConsentState, "pending">) => {
      writeAnalyticsConsentChoice(nextConsent);
      setConsent(nextConsent);

      if (authState.isAuthenticated) {
        persistPreferences({
          analyticsConsent: analyticsConsentChoiceToBoolean(nextConsent),
        });
      }
    },
    [authState.isAuthenticated, persistPreferences],
  );

  const acceptAnalytics = useCallback(() => {
    applyChoice("granted");
  }, [applyChoice]);

  const rejectAnalytics = useCallback(() => {
    applyChoice("denied");
  }, [applyChoice]);

  const setAnalyticsEnabled = useCallback(
    (enabled: boolean) => {
      const nextChoice = booleanToAnalyticsConsentChoice(enabled);

      if (consent === "granted" && nextChoice === "denied") {
        applyChoice(nextChoice);
        window.location.reload();
        return;
      }

      applyChoice(nextChoice);
    },
    [applyChoice, consent],
  );

  const syncFromServerPreference = useCallback(
    (analyticsConsent: boolean | undefined) => {
      if (typeof analyticsConsent !== "boolean") {
        return;
      }

      const nextConsent = booleanToAnalyticsConsentChoice(analyticsConsent);
      setConsent((current) => {
        if (current === nextConsent) {
          return current;
        }

        writeAnalyticsConsentChoice(nextConsent);
        return nextConsent;
      });
    },
    [],
  );

  const value = useMemo(
    (): AnalyticsConsentContextValue => ({
      hasChosen: consent !== "pending",
      isAnalyticsEnabled: consent === "granted",
      isReady: mounted,
      acceptAnalytics,
      rejectAnalytics,
      setAnalyticsEnabled,
      syncFromServerPreference,
    }),
    [
      acceptAnalytics,
      consent,
      mounted,
      rejectAnalytics,
      setAnalyticsEnabled,
      syncFromServerPreference,
    ],
  );

  return (
    <AnalyticsConsentContext.Provider value={value}>
      {children}
    </AnalyticsConsentContext.Provider>
  );
};

export const useAnalyticsConsent = (): AnalyticsConsentContextValue => {
  const context = useContext(AnalyticsConsentContext);

  if (!context) {
    throw new Error(
      "useAnalyticsConsent must be used within AnalyticsConsentProvider",
    );
  }

  return context;
};
