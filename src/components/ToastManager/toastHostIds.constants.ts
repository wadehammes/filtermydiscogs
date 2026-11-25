export const SESSION_TOAST_HOSTS_BY_PRIORITY = [
  "authChecking",
  "collectionLoading",
  "deploymentUpdate",
  "discogsOutage",
] as const;

export const PROMOTIONAL_TOAST_HOSTS_BY_PRIORITY = [
  "supportProject",
  "emailAccountCapture",
] as const;

export const STANDALONE_ROOT_TOAST_HOSTS = ["donationSuccess"] as const;

export type StandaloneRootToastHostId =
  (typeof STANDALONE_ROOT_TOAST_HOSTS)[number];

export type SessionToastHostId =
  (typeof SESSION_TOAST_HOSTS_BY_PRIORITY)[number];

export type PromotionalToastHostId =
  (typeof PROMOTIONAL_TOAST_HOSTS_BY_PRIORITY)[number];

export type RegisteredToastHostId =
  | SessionToastHostId
  | StandaloneRootToastHostId;
