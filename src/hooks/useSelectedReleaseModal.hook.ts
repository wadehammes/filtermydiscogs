"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useCollectionReleaseByInstanceId } from "src/hooks/queries/useCollectionReleaseByInstanceId.hook";
import type { DiscogsRelease } from "src/types";
import {
  buildPathWithReleaseInstance,
  parseReleaseInstanceFromSearchParams,
} from "src/utils/releaseModalUrl";

export interface UseSelectedReleaseModalParams {
  collectionUsername?: string | null;
  fallbackReleases?: DiscogsRelease[];
}

export const useSelectedReleaseModal = ({
  collectionUsername = null,
  fallbackReleases = [],
}: UseSelectedReleaseModalParams = {}) => {
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

  const collectionRelease = useCollectionReleaseByInstanceId({
    username: collectionUsername,
    instanceId: selectedReleaseId,
    enabled: !!collectionUsername,
  });

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

    if (collectionRelease) {
      return collectionRelease;
    }

    return (
      fallbackReleases.find(
        (release) => String(release.instance_id) === selectedReleaseId,
      ) ?? null
    );
  }, [collectionRelease, fallbackReleases, selectedReleaseId]);

  return {
    selectedRelease,
    selectedReleaseId,
    handleReleaseClick,
    handleCloseModal,
  };
};
