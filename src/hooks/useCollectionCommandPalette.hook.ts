"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "src/api/urls";
import {
  FiltersActionTypes,
  sessionFiltersAtom,
} from "src/atoms/filters.atoms";
import { DEFAULT_COLLECTION_COMMAND_SHORTCUT } from "src/constants/collectionCommand.constants";
import { useAuth } from "src/context/auth.context";
import { useOptionalCrateActions } from "src/context/crate.context";
import {
  CrateQueryKeys,
  CratesQueryKeys,
} from "src/hooks/queries/querykeys.constants";
import { useUserPreferencesQuery } from "src/hooks/queries/useUserPreferencesQuery";
import {
  useAllReleases,
  useFacetOptions,
  useFiltersDispatch,
} from "src/hooks/useFilterAtoms.hook";
import { useFilterViews } from "src/hooks/useFilterViews.hook";
import type { CollectionCommandIntent } from "src/lib/validation/collectionCommand.schemas";
import type { PersistedFiltersJson } from "src/types/filters.types";
import { addCollectionCommandReleasesToCrate } from "src/utils/collectionCommandCrateFromPreview";
import { buildCollectionCommandExamplePrompts } from "src/utils/collectionCommandExamplePrompts";
import { sanitizeCollectionCommandIntent } from "src/utils/collectionCommandIntent";
import { registerCollectionCommandPaletteOpen } from "src/utils/collectionCommandPaletteBridge";
import {
  promptMentionsCollectionCrate,
  shouldClearCollectionCommandPreview,
} from "src/utils/collectionCommandPalettePreview";
import {
  formatCollectionCommandPreviewDetails,
  listCollectionCommandMatchedReleases,
  previewCollectionCommandFilters,
} from "src/utils/collectionCommandPreview";
import {
  clearCollectionCommandPromptHistory,
  readCollectionCommandPromptHistory,
  recordCollectionCommandPromptHistory,
} from "src/utils/collectionCommandPromptHistory";
import {
  buildCollectionCommandCrateName,
  buildCollectionCommandViewName,
} from "src/utils/collectionCommandViewName";
import { persistedFiltersEqual } from "src/utils/filtersStorage";
import {
  eventMatchesShortcut,
  isTypingTarget,
} from "src/utils/keyboardShortcut";
import { toast } from "src/utils/toast";

export const useCollectionCommandPalette = () => {
  const { state: authState } = useAuth();
  const queryClient = useQueryClient();
  const allReleases = useAllReleases();
  const facetOptions = useFacetOptions();
  const sessionFilters = useAtomValue(sessionFiltersAtom);
  const filtersDispatch = useFiltersDispatch();
  const { saveViewFromFilters, canAddView } = useFilterViews();
  const crateActions = useOptionalCrateActions();

  const { data: preferences } = useUserPreferencesQuery({
    userId: authState.userId,
    enabled: authState.isAuthenticated && !authState.isCheckingAuth,
  });

  const shortcut =
    preferences?.collectionCommandPaletteShortcut ??
    DEFAULT_COLLECTION_COMMAND_SHORTCUT;
  const paletteEnabled = preferences?.collectionCommandPaletteEnabled ?? true;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [previewFilters, setPreviewFilters] =
    useState<PersistedFiltersJson | null>(null);
  const [previewIntent, setPreviewIntent] =
    useState<CollectionCommandIntent | null>(null);
  const [previewSourcePrompt, setPreviewSourcePrompt] = useState<string | null>(
    null,
  );
  const [isCreatingCrateFromPreview, setIsCreatingCrateFromPreview] =
    useState(false);
  const [promptHistoryRevision, setPromptHistoryRevision] = useState(0);
  const promptHistory = useMemo(
    () => (open ? readCollectionCommandPromptHistory(authState.userId) : []),
    [authState.userId, open, promptHistoryRevision],
  );
  const examplePrompts = useMemo(
    () =>
      buildCollectionCommandExamplePrompts({
        filters: sessionFilters,
        facetOptions,
      }),
    [facetOptions, sessionFilters],
  );

  const interpretMutation = useMutation({
    mutationFn: (prompt: string) => api.interpretCollectionCommand(prompt),
    onSuccess: (response, prompt) => {
      const sanitized = sanitizeCollectionCommandIntent(
        response.intent,
        facetOptions,
      );
      setPreviewIntent(response.intent);
      setPreviewFilters(sanitized.filters);
      setPreviewSourcePrompt(prompt);
    },
    onError: () => {
      toast.error("Couldn't build a filter from that.");
    },
  });

  const preview = useMemo(() => {
    if (!previewFilters) {
      return null;
    }

    const { matchCount } = previewCollectionCommandFilters({
      releases: allReleases,
      filters: previewFilters,
    });

    return {
      matchCount,
      facts: formatCollectionCommandPreviewDetails(previewFilters),
    };
  }, [allReleases, previewFilters]);

  const clearPreview = useCallback(() => {
    setPreviewFilters(null);
    setPreviewIntent(null);
    setPreviewSourcePrompt(null);
    interpretMutation.reset();
  }, [interpretMutation]);

  const resetPaletteState = useCallback(() => {
    setQuery("");
    clearPreview();
  }, [clearPreview]);

  const recordPromptIfNeeded = useCallback(() => {
    const prompt = query.trim();
    if (!prompt) {
      return;
    }

    recordCollectionCommandPromptHistory({
      userId: authState.userId,
      prompt,
    });
  }, [authState.userId, query]);

  const clearPromptHistory = useCallback(() => {
    clearCollectionCommandPromptHistory(authState.userId);
    setPromptHistoryRevision((revision) => revision + 1);
  }, [authState.userId]);

  const closePalette = useCallback(() => {
    setOpen(false);
    resetPaletteState();
  }, [resetPaletteState]);

  const openPalette = useCallback(() => {
    if (!paletteEnabled) {
      return;
    }

    setOpen(true);
  }, [paletteEnabled]);

  const applyPreviewFilters = useCallback(() => {
    if (!previewFilters) {
      return;
    }

    filtersDispatch({
      type: FiltersActionTypes.ApplySessionFilters,
      payload: previewFilters,
    });

    recordPromptIfNeeded();

    toast.success("Filters applied");
    closePalette();
  }, [closePalette, filtersDispatch, previewFilters, recordPromptIfNeeded]);

  const runInterpret = useCallback(() => {
    const prompt = query.trim();
    if (!prompt || interpretMutation.isPending) {
      return;
    }

    interpretMutation.mutate(prompt);
  }, [interpretMutation, query]);

  const saveFilterViewFromPreview = useCallback(() => {
    if (!previewFilters) {
      return;
    }

    const suggestedViewName = previewIntent?.suggestedViewName?.trim();
    const viewName = buildCollectionCommandViewName({
      prompt: query,
      ...(suggestedViewName ? { suggestedViewName } : {}),
      filters: previewFilters,
      ...(previewIntent ? { intent: previewIntent } : {}),
    });

    const saved = saveViewFromFilters(viewName, previewFilters);

    if (!saved) {
      return;
    }

    recordPromptIfNeeded();

    closePalette();
  }, [
    closePalette,
    previewFilters,
    previewIntent,
    query,
    recordPromptIfNeeded,
    saveViewFromFilters,
  ]);

  const canSaveFromPreview = Boolean(previewFilters) && canAddView;

  const canCreateCrateFromPreview =
    Boolean(previewFilters) &&
    (preview?.matchCount ?? 0) > 0 &&
    !isCreatingCrateFromPreview;

  const preferCreateCrateAction =
    canCreateCrateFromPreview && promptMentionsCollectionCrate(query);

  const createCrateFromPreview = useCallback(async () => {
    if (!previewFilters || isCreatingCrateFromPreview) {
      return;
    }

    const createCrate = crateActions?.createCrate;
    if (!createCrate) {
      toast.error("Crates aren't available right now.");
      return;
    }

    const matchedReleases = listCollectionCommandMatchedReleases({
      releases: allReleases,
      filters: previewFilters,
    });

    if (matchedReleases.length === 0) {
      toast.error("No matching releases to add.");
      return;
    }

    const suggestedViewName = previewIntent?.suggestedViewName?.trim();
    const crateName = buildCollectionCommandCrateName({
      prompt: query,
      ...(suggestedViewName ? { suggestedViewName } : {}),
      filters: previewFilters,
      ...(previewIntent ? { intent: previewIntent } : {}),
    });

    setIsCreatingCrateFromPreview(true);

    try {
      const crateId = await createCrate(crateName);
      if (!crateId) {
        return;
      }

      const addedCount = await addCollectionCommandReleasesToCrate({
        crateId,
        releases: matchedReleases,
        addReleaseToCrate: api.addReleaseToCrate,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: CrateQueryKeys.byUserAndId(authState.userId, crateId),
        }),
        queryClient.invalidateQueries({
          queryKey: CratesQueryKeys.byUserId(authState.userId),
        }),
      ]);

      recordPromptIfNeeded();

      toast.success(
        addedCount === matchedReleases.length
          ? `Crate “${crateName}” created with ${addedCount} releases`
          : `Crate “${crateName}” created with ${addedCount} of ${matchedReleases.length} releases`,
      );
      closePalette();
    } catch {
      toast.error("Couldn't create a crate from that.");
    } finally {
      setIsCreatingCrateFromPreview(false);
    }
  }, [
    allReleases,
    authState.userId,
    closePalette,
    crateActions,
    isCreatingCrateFromPreview,
    previewFilters,
    previewIntent,
    query,
    queryClient,
    recordPromptIfNeeded,
  ]);

  useEffect(() => {
    if (
      !shouldClearCollectionCommandPreview({
        query,
        previewSourcePrompt,
        hasPreview: Boolean(previewFilters),
      })
    ) {
      return;
    }

    clearPreview();
  }, [clearPreview, previewFilters, previewSourcePrompt, query]);

  useEffect(() => {
    if (!previewIntent) {
      return;
    }

    const sanitized = sanitizeCollectionCommandIntent(
      previewIntent,
      facetOptions,
    );

    setPreviewFilters((previous) => {
      if (previous && persistedFiltersEqual(previous, sanitized.filters)) {
        return previous;
      }

      return sanitized.filters;
    });
  }, [facetOptions, previewIntent]);

  useEffect(
    () => registerCollectionCommandPaletteOpen(openPalette),
    [openPalette],
  );

  useEffect(() => {
    if (!paletteEnabled) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      if (!eventMatchesShortcut(event, shortcut)) {
        return;
      }

      event.preventDefault();
      setOpen((previous) => {
        if (previous) {
          resetPaletteState();
        }

        return !previous;
      });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [paletteEnabled, resetPaletteState, shortcut]);

  const startOver = resetPaletteState;

  return {
    open,
    query,
    setQuery,
    startOver,
    openPalette,
    closePalette,
    shortcut,
    paletteEnabled,
    promptHistory,
    clearPromptHistory,
    examplePrompts,
    interpretMutation,
    preview,
    previewIntent,
    previewFilters,
    runInterpret,
    applyPreviewFilters,
    saveFilterViewFromPreview,
    canSaveFromPreview,
    createCrateFromPreview,
    canCreateCrateFromPreview,
    preferCreateCrateAction,
    isCreatingCrateFromPreview,
  };
};
