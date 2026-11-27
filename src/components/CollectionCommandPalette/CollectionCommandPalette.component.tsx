"use client";

import classNames from "classnames";
import { Command } from "cmdk";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import Button from "src/components/Button/Button.component";
import { CollectionCommandPreviewBlock } from "src/components/CollectionCommandPalette/CollectionCommandPreviewBlock.component";
import { CollectionCommandShortcutKeys } from "src/components/CollectionCommandPalette/CollectionCommandShortcutKeys.component";
import inlineMenuStyles from "src/components/InlinePopoverMenu/InlinePopoverMenu.module.css";
import { COLLECTION_COMMAND_PROMPT_MAX_LENGTH } from "src/constants/collectionCommand.constants";
import { useCollectionCommandPalette } from "src/hooks/useCollectionCommandPalette.hook";
import { ClockThinIcon } from "src/styles/icons/ClockThinIcon.component";
import { ReturnThinIcon } from "src/styles/icons/ReturnThinIcon.component";
import accessibilityStyles from "src/styles/modules/accessibility.module.css";
import styles from "./CollectionCommandPalette.module.css";

export const CollectionCommandPalette = () => {
  const {
    open,
    query,
    setQuery,
    closePalette,
    promptHistory,
    interpretMutation,
    preview,
    previewIntent,
    runInterpret,
    applyPreviewFilters,
    saveFilterViewFromPreview,
    canSaveFromPreview,
    shortcut,
  } = useCollectionCommandPalette();

  return open ? (
    <div className={styles.dialog}>
      <Button
        type="button"
        variant="ghost"
        className={styles.backdrop}
        aria-label="Dismiss collection command"
        onPress={closePalette}
      >
        <span className={accessibilityStyles.visuallyHidden}>
          Dismiss collection command
        </span>
      </Button>
      <CollectionCommandPanel
        className={styles.panel}
        query={query}
        setQuery={setQuery}
        promptHistory={promptHistory}
        interpretMutation={interpretMutation}
        preview={preview}
        previewIntent={previewIntent}
        runInterpret={runInterpret}
        applyPreviewFilters={applyPreviewFilters}
        saveFilterViewFromPreview={saveFilterViewFromPreview}
        canSaveFromPreview={canSaveFromPreview}
        shortcut={shortcut}
      />
    </div>
  ) : null;
};

type CollectionCommandPanelProps = {
  className?: string;
  query: string;
  setQuery: (value: string) => void;
  promptHistory: ReturnType<
    typeof useCollectionCommandPalette
  >["promptHistory"];
  interpretMutation: ReturnType<
    typeof useCollectionCommandPalette
  >["interpretMutation"];
  preview: ReturnType<typeof useCollectionCommandPalette>["preview"];
  previewIntent: ReturnType<
    typeof useCollectionCommandPalette
  >["previewIntent"];
  runInterpret: () => void;
  applyPreviewFilters: () => void;
  saveFilterViewFromPreview: () => void;
  canSaveFromPreview: boolean;
  shortcut: string;
};

const CollectionCommandPanel = ({
  className,
  query,
  setQuery,
  promptHistory,
  interpretMutation,
  preview,
  previewIntent,
  runInterpret,
  applyPreviewFilters,
  saveFilterViewFromPreview,
  canSaveFromPreview,
  shortcut,
}: CollectionCommandPanelProps) => {
  const commandInputRef = useRef<HTMLInputElement>(null);
  const applyFiltersActionRef = useRef<HTMLButtonElement>(null);
  const recentHeadingId = useId();
  const [highlightedValue, setHighlightedValue] = useState("");
  const queryIsEmpty = query.trim().length === 0;
  const hasCommandPreview = preview !== null;

  const focusApplyFiltersAction = useCallback(() => {
    const applyButton =
      applyFiltersActionRef.current ??
      commandInputRef.current
        ?.closest("[cmdk-root]")
        ?.querySelector<HTMLButtonElement>(
          "[cmdk-item][data-value='apply-filters']",
        ) ??
      null;

    applyButton?.focus();
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      commandInputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hasCommandPreview) {
      return undefined;
    }

    setHighlightedValue("apply-filters");

    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) {
          focusApplyFiltersAction();
        }
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [focusApplyFiltersAction, hasCommandPreview]);

  useEffect(() => {
    if (hasCommandPreview) {
      return undefined;
    }

    if (query.trim().length > 0) {
      setHighlightedValue("run-interpret");
      return undefined;
    }

    setHighlightedValue("");
    return undefined;
  }, [hasCommandPreview, query]);

  const handleCommandInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();

      if (interpretMutation.isPending) {
        return;
      }

      if (preview) {
        if (highlightedValue === "save-filter-view") {
          saveFilterViewFromPreview();
        } else {
          applyPreviewFilters();
        }

        return;
      }

      if (query.trim().length > 0) {
        runInterpret();
      }
    },
    [
      applyPreviewFilters,
      highlightedValue,
      interpretMutation.isPending,
      preview,
      query,
      runInterpret,
      saveFilterViewFromPreview,
    ],
  );

  return (
    <div
      className={className}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      role="dialog"
      aria-label="Collection command"
      data-testid="fmdCollectionCommandPalette"
    >
      <Command
        className={styles.command}
        label="Collection command"
        shouldFilter={false}
        value={highlightedValue}
        onValueChange={setHighlightedValue}
      >
        <Command.Input
          ref={commandInputRef}
          autoFocus
          className={styles.commandInput}
          data-testid="fmdCollectionCommandInput"
          placeholder="Filter your collection…"
          maxLength={COLLECTION_COMMAND_PROMPT_MAX_LENGTH}
          value={query}
          onValueChange={setQuery}
          onKeyDown={handleCommandInputKeyDown}
        />
        <Command.List
          className={styles.commandList}
          data-testid="fmdCollectionCommandList"
        >
          {queryIsEmpty && promptHistory.length === 0 ? (
            <Command.Empty className={styles.empty}>
              <span>Type a command, or open with </span>
              <CollectionCommandShortcutKeys shortcut={shortcut} />
            </Command.Empty>
          ) : null}

          {queryIsEmpty && promptHistory.length > 0 ? (
            <section
              className={styles.recentSection}
              aria-labelledby={recentHeadingId}
            >
              <p className={styles.recentHeading} id={recentHeadingId}>
                Recent
              </p>
              <ul className={styles.recentList}>
                {promptHistory.map((entry) => (
                  <li key={`${entry.usedAt}-${entry.prompt}`}>
                    <Button
                      type="button"
                      variant="ghost"
                      className={classNames(
                        inlineMenuStyles.itemNeutral,
                        styles.recentRow,
                      )}
                      onPress={() => {
                        setQuery(entry.prompt);
                        setHighlightedValue("");
                        commandInputRef.current?.focus();
                      }}
                    >
                      <ClockThinIcon
                        className={styles.itemIcon}
                        width={16}
                        height={16}
                      />
                      <span className={styles.itemTitle}>{entry.prompt}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {query.trim().length > 0 && !preview ? (
            <div className={styles.actionStack}>
              <Command.Item
                asChild
                value="run-interpret"
                onSelect={runInterpret}
                disabled={interpretMutation.isPending}
              >
                <Button
                  variant="ghost"
                  size="md"
                  className={styles.commandActionPrimary}
                  disabled={interpretMutation.isPending}
                  isLoading={interpretMutation.isPending}
                  loadingText="Running…"
                >
                  {interpretMutation.isPending ? null : (
                    <>
                      <span className={styles.actionLabel}>Run</span>
                      <span className={styles.actionShortcut} aria-hidden>
                        <ReturnThinIcon />
                      </span>
                    </>
                  )}
                </Button>
              </Command.Item>
            </div>
          ) : null}

          {preview ? (
            <>
              <CollectionCommandPreviewBlock
                matchCount={preview.matchCount}
                facts={preview.facts}
                confidenceNotes={previewIntent?.confidenceNotes}
              />
              <div className={styles.actionStack}>
                <Command.Item
                  asChild
                  value="apply-filters"
                  onSelect={applyPreviewFilters}
                >
                  <Button
                    ref={applyFiltersActionRef}
                    variant="ghost"
                    size="md"
                    className={styles.commandActionPrimary}
                    data-testid="fmdCollectionCommandApplyFilters"
                  >
                    <span className={styles.actionLabel}>Apply filters</span>
                    <span className={styles.actionShortcut} aria-hidden>
                      <ReturnThinIcon />
                    </span>
                  </Button>
                </Command.Item>
                {canSaveFromPreview ? (
                  <Command.Item
                    asChild
                    value="save-filter-view"
                    onSelect={saveFilterViewFromPreview}
                  >
                    <Button
                      variant="secondary"
                      size="md"
                      className={styles.commandAction}
                    >
                      <span className={styles.actionLabel}>Save view</span>
                    </Button>
                  </Command.Item>
                ) : null}
              </div>
            </>
          ) : null}
        </Command.List>
      </Command>
    </div>
  );
};
