import "src/styles/fontface.css";

import * as Sentry from "@sentry/nextjs";
import { Integrations } from "@sentry/tracing";
import i18n from "i18next.config";
import { AppProps } from "next/app";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { FullStory } from "src/components/FullStory/FullStory.component";
import { UIProvider } from "src/context/ui.context";
import { loadAnalytics, trackEvent, trackPageView } from "src/lib/analytics";
import { Reset } from "src/styles/reset";
import { theme } from "src/styles/theme";
import { ThemeProvider } from "styled-components";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { muiTheme } from "src/styles/mui-theme";
import { FeatureFlagClientProvider } from "src/context/featureFlagClient.context";
import { ReviewsProvider } from "src/context/reviews.context";
import { useCookie } from "src/hooks/useCookie";
import { CONSTANTS } from "src/utils/constants";
import { tatariIdentify } from "src/lib/tatari";
import Script from "next/script";
import * as SegmentSnippet from "@segment/snippet";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    autoSessionTracking: true,
    integrations: [
      new Integrations.BrowserTracing({
        tracingOrigins: ["localhost", "gotrhythm.com"],
      }),
    ],
    environment: process.env.ENVIRONMENT,
    tracesSampleRate: parseFloat(
      process.env.SENTRY_TRACES_SAMPLE_RATE || "1.0"
    ),
  } as Sentry.NodeOptions);
}

const Rhythm = ({ Component, pageProps }: AppProps) => {
  const { asPath } = useRouter();
  const [rhFeatureFlagUserId] = useCookie(
    CONSTANTS.RH_FEATURE_FLAG_USER_ID_COOKIE
  );

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(asPath);
  }, [asPath]);

  useEffect(() => {
    if (rhFeatureFlagUserId) {
      tatariIdentify(rhFeatureFlagUserId);

      trackEvent("identify", {
        action: "userIdentified",
        category: "marketing",
        label: "User Identified",
        value: rhFeatureFlagUserId,
      });
    }
  }, [rhFeatureFlagUserId]);

  return (
    <>
      <FullStory />
      <UIProvider>
        <Reset />
        <I18nextProvider i18n={i18n}>
          <MuiThemeProvider theme={muiTheme}>
            <ThemeProvider theme={theme}>
              <FeatureFlagClientProvider
                featureFlagUserId={rhFeatureFlagUserId}
              >
                <ReviewsProvider>
                  <Component {...pageProps} />
                </ReviewsProvider>
              </FeatureFlagClientProvider>
            </ThemeProvider>
          </MuiThemeProvider>
        </I18nextProvider>
      </UIProvider>
      {process.env.SEGMENT_ANALYTICS_KEY && (
        <Script id="segmentio" type="text/javascript">
          {SegmentSnippet.min({
            apiKey: process.env.SEGMENT_ANALYTICS_KEY,
            page: false,
            // Include the segment assets, but don't load until we know this isn't a bot
            load: false,
          })}
        </Script>
      )}
    </>
  );
};

export default Rhythm;
