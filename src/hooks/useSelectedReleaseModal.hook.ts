"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { DiscogsRelease } from "src/types";
import {
  buildPathWithReleaseInstance,
  parseReleaseInstanceFromSearchParams,
} from "src/utils/releaseModalUrl";

export const useSelectedReleaseModal = (releases: DiscogsRelease[]) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const preModalUrlRef = useRef<string | null>(null);

  const selectedReleaseId = parseReleaseInstanceFromSearchParams(searchParams);

  useEffect(() => {
    if (!selectedReleaseId) {
      preModalUrlRef.current = null;
    }
  }, [selectedReleaseId]);

  const buildUrl = useCallback(
    (instanceId: string | null) =>
      buildPathWithReleaseInstance({
        pathname,
        searchParams,
        instanceId,
      }),
    [pathname, searchParams],
  );

  const handleReleaseClick = useCallback(
    (instanceId: string) => {
      const url = buildUrl(instanceId);

      if (!selectedReleaseId) {
        preModalUrlRef.current = buildUrl(null);
      }

      router.push(url, { scroll: false });
    },
    [buildUrl, router, selectedReleaseId],
  );

  const handleCloseModal = useCallback(() => {
    const returnUrl = preModalUrlRef.current;

    if (returnUrl !== null) {
      router.replace(returnUrl, { scroll: false });
      return;
    }

    if (selectedReleaseId) {
      router.replace(buildUrl(null), { scroll: false });
    }
  }, [buildUrl, router, selectedReleaseId]);

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
