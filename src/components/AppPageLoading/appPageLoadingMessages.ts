export type AppPage = "releases" | "dashboard" | "mosaic";

export const LOADING_MESSAGES: Record<AppPage, string> = {
  releases: "Loading releases...",
  dashboard: "Loading dashboard...",
  mosaic: "Loading mosaic...",
};

export function formatLoadingMessage(
  currentPage: AppPage,
  loadedCount?: number,
): string {
  const baseMessage = LOADING_MESSAGES[currentPage];

  if (loadedCount == null || loadedCount <= 0) {
    return baseMessage;
  }

  const loadedLabel = currentPage === "dashboard" ? "items loaded" : "loaded";

  return `${baseMessage.replace(/\.\.\.$/, "")}… ${loadedCount.toLocaleString()} ${loadedLabel}`;
}
