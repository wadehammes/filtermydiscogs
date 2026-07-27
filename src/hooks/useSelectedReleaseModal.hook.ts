import { useCallback, useMemo, useState } from "react";
import type { DiscogsRelease } from "src/types";

export const useSelectedReleaseModal = (releases: DiscogsRelease[]) => {
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(
    null,
  );

  const handleReleaseClick = useCallback((instanceId: string) => {
    setSelectedReleaseId(instanceId);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedReleaseId(null);
  }, []);

  const selectedRelease = useMemo(() => {
    if (!selectedReleaseId) {
      return null;
    }

    return (
      releases.find(
        (release) => String(release.instance_id) === selectedReleaseId,
      ) ?? null
    );
  }, [releases, selectedReleaseId]);

  return {
    selectedRelease,
    selectedReleaseId,
    handleReleaseClick,
    handleCloseModal,
  };
};
