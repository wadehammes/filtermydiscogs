"use client";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { prefetchReleaseModal } from "src/components/ReleaseModal/prefetchReleaseModal";
import { useCollectionReleaseByInstanceId } from "src/hooks/queries/useCollectionReleaseByInstanceId.hook";
import type { DiscogsRelease } from "src/types";
import { buildReleaseIndexFromList } from "src/utils/collectionReleaseLookup";
import { prefetchReleaseOpenData } from "src/utils/prefetchReleaseOpenData";
import {
  buildPathWithReleaseInstance,
  parseReleaseInstanceFromSearchParams,
} from "src/utils/releaseModalUrl";

export interface UseSelectedReleaseModalParams {
  collectionUsername?: string | null;
  fallbackReleases?: DiscogsRelease[];
}

const prefetchReleaseForOpen = (
  queryClient: QueryClient,
  fallbackReleaseIndex: Map<string, DiscogsRelease>,
  instanceId: string,
): void => {
  const clickedRelease = fallbackReleaseIndex.get(instanceId);

  if (clickedRelease) {
    prefetchReleaseOpenData(queryClient, clickedRelease, {
      cancelOtherFetches: true,
    });
    return;
  }

  prefetchReleaseModal();
};

const useResolvedSelectedRelease = ({
  collectionUsername,
  fallbackReleases,
  selectedReleaseId,
}: UseSelectedReleaseModalParams & {
  selectedReleaseId: string | null;
}) => {
  const collectionRelease = useCollectionReleaseByInstanceId({
    username: collectionUsername,
    instanceId: selectedReleaseId,
    enabled: !!collectionUsername,
  });

  const fallbackReleaseIndex = useMemo(
    () => buildReleaseIndexFromList(fallbackReleases ?? []),
    [fallbackReleases],
  );

  const selectedRelease = useMemo(() => {
    if (!selectedReleaseId) {
      return null;
    }

    return (
      fallbackReleaseIndex.get(selectedReleaseId) ?? collectionRelease ?? null
    );
  }, [collectionRelease, fallbackReleaseIndex, selectedReleaseId]);

  return {
    fallbackReleaseIndex,
    selectedRelease,
    selectedReleaseId,
  };
};

interface ModalSyncState {
  optimisticId: string | null;
}

type ModalSyncAction =
  | { type: "open"; instanceId: string }
  | { type: "close" }
  | { type: "syncUrl"; urlInstanceId: string | null };

const initialModalSyncState: ModalSyncState = {
  optimisticId: null,
};

const modalSyncReducer = (
  state: ModalSyncState,
  action: ModalSyncAction,
): ModalSyncState => {
  switch (action.type) {
    case "open":
      return { optimisticId: action.instanceId };
    case "close":
      return { optimisticId: null };
    case "syncUrl":
      if (!action.urlInstanceId) {
        if (state.optimisticId) {
          return state;
        }

        return { optimisticId: null };
      }
      if (state.optimisticId === action.urlInstanceId) {
        return { optimisticId: null };
      }
      return state;
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

  const selectedReleaseId = modalSync.optimisticId ?? urlInstanceId;

  useEffect(() => {
    if (!selectedReleaseId) {
      preModalUrlRef.current = null;
    }
  }, [selectedReleaseId]);

  const { fallbackReleaseIndex, selectedRelease } = useResolvedSelectedRelease({
    collectionUsername,
    fallbackReleases,
    selectedReleaseId,
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
      prefetchReleaseForOpen(queryClient, fallbackReleaseIndex, instanceId);

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

  return {
    selectedRelease,
    selectedReleaseId,
    handleReleaseClick,
    handleCloseModal,
  };
};

export const useLocalSelectedReleaseModal = ({
  collectionUsername = null,
  fallbackReleases = [],
}: UseSelectedReleaseModalParams = {}) => {
  const queryClient = useQueryClient();
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(
    null,
  );

  const { fallbackReleaseIndex, selectedRelease } = useResolvedSelectedRelease({
    collectionUsername,
    fallbackReleases,
    selectedReleaseId,
  });

  const handleReleaseClick = useCallback(
    (instanceId: string) => {
      prefetchReleaseForOpen(queryClient, fallbackReleaseIndex, instanceId);
      setSelectedReleaseId(instanceId);
    },
    [fallbackReleaseIndex, queryClient],
  );

  const handleCloseModal = useCallback(() => {
    setSelectedReleaseId(null);
  }, []);

  return {
    selectedRelease,
    selectedReleaseId,
    handleReleaseClick,
    handleCloseModal,
  };
};
