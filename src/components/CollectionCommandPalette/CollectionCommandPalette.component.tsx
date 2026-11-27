"use client";

import classNames from "classnames";
import { Command } from "cmdk";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Button from "src/components/Button/Button.component";
import { CollectionCommandPreviewBlock } from "src/components/CollectionCommandPalette/CollectionCommandPreviewBlock.component";
import inlineMenuStyles from "src/components/InlinePopoverMenu/InlinePopoverMenu.module.css";
import {
  COLLECTION_COMMAND_CLEAR_RECENT_LABEL,
  COLLECTION_COMMAND_INPUT_PLACEHOLDER,
  COLLECTION_COMMAND_PROMPT_MAX_LENGTH,
  COLLECTION_COMMAND_REPORT_ISSUE_LABEL,
  COLLECTION_COMMAND_START_OVER_LABEL,
} from "src/constants/collectionCommand.constants";
import { useCollectionCommandPalette } from "src/hooks/useCollectionCommandPalette.hook";
import { openCollectionCommandSentryFeedback } from "src/lib/sentry/openCollectionCommandSentryFeedback.client";
import { ClockThinIcon } from "src/styles/icons/ClockThinIcon.component";
import { QuestionThinIcon } from "src/styles/icons/QuestionThinIcon.component";
import { ReturnThinIcon } from "src/styles/icons/ReturnThinIcon.component";
import { SparklesThinIcon } from "src/styles/icons/SparklesThinIcon.component";
import accessibilityStyles from "src/styles/modules/accessibility.module.css";
import textActionStyles from "src/styles/modules/text-action.module.css";
import { definedProps } from "src/utils/definedProps";
import styles from "./CollectionCommandPalette.module.css";

export const CollectionCommandPalette = () => {
  const {
    open,
    query,
    setQuery,
    closePalette,
    promptHistory,
    clearPromptHistory,
    interpretMutation,
    preview,
    previewIntent,
    runInterpret,
    applyPreviewFilters,
    saveFilterViewFromPreview,
    canSaveFromPreview,
    createCrateFromPreview,
    canCreateCrateFromPreview,
    isCreatingCrateFromPreview,
    preferCreateCrateAction,
    shortcut,
    examplePrompts,
    startOver,
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
        clearPromptHistory={clearPromptHistory}
        interpretMutation={interpretMutation}
        preview={preview}
        previewIntent={previewIntent}
        runInterpret={runInterpret}
        applyPreviewFilters={applyPreviewFilters}
        saveFilterViewFromPreview={saveFilterViewFromPreview}
        canSaveFromPreview={canSaveFromPreview}
        createCrateFromPreview={createCrateFromPreview}
        canCreateCrateFromPreview={canCreateCrateFromPreview}
        isCreatingCrateFromPreview={isCreatingCrateFromPreview}
        preferCreateCrateAction={preferCreateCrateAction}
        shortcut={shortcut}
        examplePrompts={examplePrompts}
        closePalette={closePalette}
        startOver={startOver}
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
  clearPromptHistory: ReturnType<
    typeof useCollectionCommandPalette
  >["clearPromptHistory"];
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
  createCrateFromPreview: () => void;
  canCreateCrateFromPreview: boolean;
  isCreatingCrateFromPreview: boolean;
  preferCreateCrateAction: boolean;
  shortcut: string;
  examplePrompts: string[];
  closePalette: () => void;
  startOver: () => void;
};

const CollectionCommandPanel = ({
  className,
  query,
  setQuery,
  promptHistory,
  clearPromptHistory,
  interpretMutation,
  preview,
  previewIntent,
  runInterpret,
  applyPreviewFilters,
  saveFilterViewFromPreview,
  canSaveFromPreview,
  createCrateFromPreview,
  canCreateCrateFromPreview,
  isCreatingCrateFromPreview,
  preferCreateCrateAction,
  shortcut,
  examplePrompts,
  closePalette,
  startOver,
}: CollectionCommandPanelProps) => {
  const commandInputRef = useRef<HTMLInputElement>(null);
  const primaryPreviewActionRef = useRef<HTMLButtonElement>(null);
  const [highlightedValue, setHighlightedValue] = useState("");
  const queryIsEmpty = query.trim().length === 0;
  const canStartOver =
    !queryIsEmpty || preview !== null || interpretMutation.isError;

  const handleStartOver = useCallback(() => {
    startOver();
    setHighlightedValue("");
    commandInputRef.current?.focus();
  }, [startOver]);

  const interpretErrorMessage =
    interpretMutation.isError && interpretMutation.error
      ? interpretMutation.error instanceof Error
        ? interpretMutation.error.message
        : "Interpret failed"
      : undefined;

  const handleReportCommandIssue = useCallback(() => {
    closePalette();
    openCollectionCommandSentryFeedback({
      prompt: query,
      ...definedProps({
        interpretError: interpretErrorMessage,
        preview: preview
          ? { matchCount: preview.matchCount, facts: preview.facts }
          : undefined,
      }),
    });
  }, [closePalette, interpretErrorMessage, preview, query]);
  const hasCommandPreview = preview !== null;

  const primaryPreviewCommandValue = preferCreateCrateAction
    ? "create-crate"
    : "apply-filters";

  const focusPrimaryPreviewAction = useCallback(() => {
    const primaryButton =
      primaryPreviewActionRef.current ??
      commandInputRef.current
        ?.closest("[cmdk-root]")
        ?.querySelector<HTMLButtonElement>(
          `[cmdk-item][data-value='${primaryPreviewCommandValue}']`,
        ) ??
      null;

    primaryButton?.focus();
  }, [primaryPreviewCommandValue]);

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

    setHighlightedValue(primaryPreviewCommandValue);

    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) {
          focusPrimaryPreviewAction();
        }
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [
    focusPrimaryPreviewAction,
    hasCommandPreview,
    primaryPreviewCommandValue,
  ]);

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
        } else if (highlightedValue === "create-crate") {
          createCrateFromPreview();
        } else if (highlightedValue === "apply-filters") {
          applyPreviewFilters();
        } else if (preferCreateCrateAction) {
          createCrateFromPreview();
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
      createCrateFromPreview,
      highlightedValue,
      interpretMutation.isPending,
      preferCreateCrateAction,
      preview,
      query,
      runInterpret,
      saveFilterViewFromPreview,
    ],
  );

  const applyFiltersAction = ({ primary }: { primary: boolean }) => (
    <Command.Item asChild value="apply-filters" onSelect={applyPreviewFilters}>
      <Button
        ref={primary ? primaryPreviewActionRef : undefined}
        variant={primary ? "ghost" : "secondary"}
        size="md"
        className={primary ? styles.commandActionPrimary : styles.commandAction}
        data-testid={primary ? "fmdCollectionCommandApplyFilters" : undefined}
      >
        <span className={styles.actionLabel}>Apply filters</span>
        {primary ? (
          <span className={styles.actionShortcut} aria-hidden>
            <ReturnThinIcon />
          </span>
        ) : null}
      </Button>
    </Command.Item>
  );

  const createCrateAction = ({ primary }: { primary: boolean }) =>
    canCreateCrateFromPreview ? (
      <Command.Item
        asChild
        value="create-crate"
        onSelect={createCrateFromPreview}
      >
        <Button
          ref={primary ? primaryPreviewActionRef : undefined}
          variant={primary ? "ghost" : "secondary"}
          size="md"
          className={
            primary ? styles.commandActionPrimary : styles.commandAction
          }
          disabled={isCreatingCrateFromPreview}
        >
          <span className={styles.actionLabel}>
            {isCreatingCrateFromPreview ? "Creating crate…" : "Create crate"}
          </span>
          {primary ? (
            <span className={styles.actionShortcut} aria-hidden>
              <ReturnThinIcon />
            </span>
          ) : null}
        </Button>
      </Command.Item>
    ) : null;

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
        <div className={styles.commandInputRow}>
          <SparklesThinIcon
            className={styles.commandInputIcon}
            width={16}
            height={16}
          />
          <Command.Input
            ref={commandInputRef}
            autoFocus
            className={styles.commandInput}
            data-testid="fmdCollectionCommandInput"
            placeholder={COLLECTION_COMMAND_INPUT_PLACEHOLDER}
            maxLength={COLLECTION_COMMAND_PROMPT_MAX_LENGTH}
            value={query}
            onValueChange={setQuery}
            onKeyDown={handleCommandInputKeyDown}
          />
        </div>
        <Command.List
          className={styles.commandList}
          data-testid="fmdCollectionCommandList"
        >
          {queryIsEmpty && promptHistory.length === 0 ? (
            <section
              className={styles.recentSection}
              aria-label="Example commands"
              data-testid="fmdCollectionCommandExamples"
            >
              <ul className={styles.recentList}>
                {examplePrompts.map((prompt) => (
                  <li key={prompt}>
                    <Button
                      type="button"
                      variant="ghost"
                      className={classNames(
                        inlineMenuStyles.itemNeutral,
                        styles.recentRow,
                      )}
                      onPress={() => {
                        setQuery(prompt);
                        setHighlightedValue("");
                        commandInputRef.current?.focus();
                      }}
                    >
                      <SparklesThinIcon
                        className={styles.itemIcon}
                        width={16}
                        height={16}
                      />
                      <span className={styles.itemTitle}>{prompt}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {queryIsEmpty && promptHistory.length > 0 ? (
            <section
              className={styles.recentSection}
              aria-label="Past commands"
            >
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
                {preferCreateCrateAction ? (
                  <>
                    {createCrateAction({ primary: true })}
                    {applyFiltersAction({ primary: false })}
                  </>
                ) : (
                  <>
                    {applyFiltersAction({ primary: true })}
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
                    {createCrateAction({ primary: false })}
                  </>
                )}
                {preferCreateCrateAction && canSaveFromPreview ? (
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
        <footer
          className={styles.panelFooter}
          data-testid="fmdCollectionCommandPanelFooter"
        >
          <div className={styles.panelFooterStart}>
            {canStartOver ? (
              <button
                type="button"
                className={classNames(
                  textActionStyles.subtlelink,
                  styles.panelFooterAction,
                )}
                data-testid="fmdCollectionCommandStartOver"
                onClick={handleStartOver}
              >
                {COLLECTION_COMMAND_START_OVER_LABEL}
              </button>
            ) : null}
            {promptHistory.length > 0 ? (
              <button
                type="button"
                className={classNames(
                  textActionStyles.subtlelink,
                  styles.panelFooterAction,
                )}
                onClick={clearPromptHistory}
              >
                {COLLECTION_COMMAND_CLEAR_RECENT_LABEL}
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.panelFooterAction}
            data-testid="fmdCollectionCommandReportIssue"
            onClick={handleReportCommandIssue}
          >
            <QuestionThinIcon
              className={styles.panelFooterIcon}
              width={12}
              height={12}
            />
            <span>{COLLECTION_COMMAND_REPORT_ISSUE_LABEL}</span>
          </button>
        </footer>
      </Command>
    </div>
  );
};
