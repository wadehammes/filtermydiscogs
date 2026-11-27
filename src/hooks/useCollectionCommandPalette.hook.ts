"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "src/api/urls";
import { FiltersActionTypes } from "src/atoms/filters.atoms";
import { DEFAULT_COLLECTION_COMMAND_SHORTCUT } from "src/constants/collectionCommand.constants";
import { useAuth } from "src/context/auth.context";
import { useUserPreferencesQuery } from "src/hooks/queries/useUserPreferencesQuery";
import {
  useAllReleases,
  useFacetOptions,
  useFiltersDispatch,
} from "src/hooks/useFilterAtoms.hook";
import { useFilterViews } from "src/hooks/useFilterViews.hook";
import type { CollectionCommandIntent } from "src/lib/validation/collectionCommand.schemas";
import type { PersistedFiltersJson } from "src/types/filters.types";
import { sanitizeCollectionCommandIntent } from "src/utils/collectionCommandIntent";
import { shouldClearCollectionCommandPreview } from "src/utils/collectionCommandPalettePreview";
import {
  formatCollectionCommandPreviewDetails,
  previewCollectionCommandFilters,
} from "src/utils/collectionCommandPreview";
import {
  readCollectionCommandPromptHistory,
  recordCollectionCommandPromptHistory,
} from "src/utils/collectionCommandPromptHistory";
import { buildCollectionCommandViewName } from "src/utils/collectionCommandViewName";
import { persistedFiltersEqual } from "src/utils/filtersStorage";
import {
  eventMatchesShortcut,
  isTypingTarget,
} from "src/utils/keyboardShortcut";
import { toast } from "src/utils/toast";

export const useCollectionCommandPalette = () => {
  const { state: authState } = useAuth();
  const allReleases = useAllReleases();
  const facetOptions = useFacetOptions();
  const filtersDispatch = useFiltersDispatch();
  const { saveViewFromFilters, canAddView } = useFilterViews();

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
  const promptHistory = useMemo(
    () => (open ? readCollectionCommandPromptHistory(authState.userId) : []),
    [authState.userId, open],
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

  return {
    open,
    query,
    setQuery,
    openPalette,
    closePalette,
    shortcut,
    paletteEnabled,
    promptHistory,
    interpretMutation,
    preview,
    previewIntent,
    previewFilters,
    runInterpret,
    applyPreviewFilters,
    saveFilterViewFromPreview,
    canSaveFromPreview,
  };
};
