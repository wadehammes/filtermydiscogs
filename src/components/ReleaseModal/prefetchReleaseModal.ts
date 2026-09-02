import { loadReleaseModal } from "src/components/ReleaseModal/releaseModalLoader";

let prefetchStarted = false;

export const prefetchReleaseModal = (): void => {
  if (prefetchStarted) {
    return;
  }

  prefetchStarted = true;
  void loadReleaseModal();
};
