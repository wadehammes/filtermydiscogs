export const prefetchReleaseModalChunk = (): void => {
  void import("src/components/ReleaseModal/prefetchReleaseModal").then(
    ({ prefetchReleaseModal }) => {
      prefetchReleaseModal();
    },
  );
};
