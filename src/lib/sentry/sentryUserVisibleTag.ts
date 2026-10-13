const SENTRY_USER_VISIBLE_TAG = "user.visible";

export type SentryUserVisibleTagValue = "true" | "false";

export const sentryUserVisibleTag = (
  visible: boolean,
): Record<string, SentryUserVisibleTagValue> => ({
  [SENTRY_USER_VISIBLE_TAG]: visible ? "true" : "false",
});
