"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { prefetchReleaseModal } from "src/components/ReleaseModal/prefetchReleaseModal";
import { DiscogsReleaseQueryKeys } from "src/hooks/queries/querykeys.constants";
import { useCollectionReleaseByInstanceId } from "src/hooks/queries/useCollectionReleaseByInstanceId.hook";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import type { DiscogsRelease } from "src/types";
import { buildReleaseIndexFromList } from "src/utils/collectionReleaseLookup";
import {
  buildPathWithReleaseInstance,
  parseReleaseInstanceFromSearchParams,
} from "src/utils/releaseModalUrl";
import { parseReleaseId } from "src/utils/releaseNotes";

export interface UseSelectedReleaseModalParams {
  collectionUsername?: string | null;
  fallbackReleases?: DiscogsRelease[];
}

interface ModalSyncState {
  optimisticId: string | null;
  closing: boolean;
}

type ModalSyncAction =
  | { type: "open"; instanceId: string }
  | { type: "close" }
  | { type: "syncUrl"; urlInstanceId: string | null };

const initialModalSyncState: ModalSyncState = {
  optimisticId: null,
  closing: false,
};

const modalSyncReducer = (
  state: ModalSyncState,
  action: ModalSyncAction,
): ModalSyncState => {
  switch (action.type) {
    case "open":
      return { optimisticId: action.instanceId, closing: false };
    case "close":
      return { optimisticId: null, closing: true };
    case "syncUrl":
      if (!action.urlInstanceId) {
        return { optimisticId: null, closing: false };
      }
      if (state.optimisticId === action.urlInstanceId) {
        return { closing: false, optimisticId: null };
      }
      return { ...state, closing: false };
    default:
      return state;
  }
};

export const useSelectedReleaseModal = ({
  collectionUsername = null,
  fallbackReleases = [],
}: UseSelectedReleaseModalParams = {}) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const preModalUrlRef = useRef<string | null>(null);
  const urlInstanceId = parseReleaseInstanceFromSearchParams(searchParams);
  const [modalSync, dispatchModalSync] = useReducer(
    modalSyncReducer,
    initialModalSyncState,
  );

  const syncModalFromUrl = useEffectEvent(
    (nextUrlInstanceId: string | null) => {
      dispatchModalSync({ type: "syncUrl", urlInstanceId: nextUrlInstanceId });
    },
  );

  useEffect(() => {
    syncModalFromUrl(urlInstanceId);
  }, [urlInstanceId]);

  const selectedReleaseId = modalSync.closing
    ? null
    : (urlInstanceId ?? modalSync.optimisticId);

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

  const fallbackReleaseIndex = useMemo(
    () => buildReleaseIndexFromList(fallbackReleases),
    [fallbackReleases],
  );

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
      prefetchReleaseModal();

      const clickedRelease = fallbackReleaseIndex.get(instanceId);
      const releaseId = clickedRelease ? parseReleaseId(clickedRelease) : null;

      if (releaseId !== null) {
        const releaseQueryKey = DiscogsReleaseQueryKeys.byId(String(releaseId));

        if (queryClient.getQueryData(releaseQueryKey) === undefined) {
          void queryClient.prefetchQuery(
            discogsReleaseQueryOptions(String(releaseId)),
          );
        }
      }

      dispatchModalSync({ type: "open", instanceId });

      const url = buildUrl(instanceId);

      if (!selectedReleaseId) {
        preModalUrlRef.current = buildUrl(null);
      }

      router.push(url, { scroll: false });
    },
    [buildUrl, fallbackReleaseIndex, queryClient, router, selectedReleaseId],
  );

  const handleCloseModal = useCallback(() => {
    const hadOpenRelease = urlInstanceId ?? modalSync.optimisticId;

    dispatchModalSync({ type: "close" });

    const returnUrl = preModalUrlRef.current;

    if (returnUrl !== null) {
      router.replace(returnUrl, { scroll: false });
      return;
    }

    if (hadOpenRelease) {
      router.replace(buildUrl(null), { scroll: false });
    }
  }, [buildUrl, modalSync.optimisticId, router, urlInstanceId]);

  const selectedRelease = useMemo(() => {
    if (!selectedReleaseId) {
      return null;
    }

    return (
      fallbackReleaseIndex.get(selectedReleaseId) ?? collectionRelease ?? null
    );
  }, [collectionRelease, fallbackReleaseIndex, selectedReleaseId]);

  return {
    selectedRelease,
    selectedReleaseId,
    handleReleaseClick,
    handleCloseModal,
  };
};
