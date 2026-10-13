"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import dashboardStyles from "src/components/AdminDashboard/AdminDashboardClient.module.css";
import { DashboardSection } from "src/components/Dashboard/DashboardSection.component";
import {
  type AdminYoutubeEmbedFormValues,
  adminYoutubeEmbedFormSchema,
} from "src/lib/validation/adminYoutubeEmbed.schemas";
import { buildClientYoutubeEmbedUrl } from "src/utils/releasePlayback";
import { normalizeYoutubeVideoInput } from "src/utils/userTrack";
import {
  parseYoutubeEmbedTestMessage,
  type YoutubeEmbedTestLogLine,
} from "src/utils/youtubeEmbedTestLog";
import {
  enableYoutubeIframeListening,
  isYoutubeEmbedOrigin,
} from "src/utils/youtubeIframeEvents";
import { buildYoutubeWatchUrl } from "src/utils/youtubeVideoId";
import styles from "./AdminYoutubeEmbedTestPanel.module.css";

type LogEntry = YoutubeEmbedTestLogLine & {
  id: string;
};

const buildLogEntry = (line: YoutubeEmbedTestLogLine): LogEntry => ({
  ...line,
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
});

export const AdminYoutubeEmbedTestPanel = () => {
  const inputId = useId();
  const autoplayId = useId();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [loadedAutoplay, setLoadedAutoplay] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminYoutubeEmbedFormValues>({
    resolver: zodResolver(adminYoutubeEmbedFormSchema),
    defaultValues: {
      youtubeInput: "",
      autoplay: false,
    },
  });

  const watchUrl = useMemo(
    () => (activeVideoId ? buildYoutubeWatchUrl(activeVideoId) : null),
    [activeVideoId],
  );

  const embedUrl = useMemo(() => {
    if (!activeVideoId) {
      return null;
    }

    return buildClientYoutubeEmbedUrl({
      videoId: activeVideoId,
      autoplay: loadedAutoplay,
    });
  }, [activeVideoId, loadedAutoplay]);

  const appendLog = useCallback((line: YoutubeEmbedTestLogLine) => {
    setLogEntries((previous) =>
      [buildLogEntry(line), ...previous].slice(0, 50),
    );
  }, []);

  useEffect(() => {
    if (!activeVideoId) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (!isYoutubeEmbedOrigin(event.origin)) {
        return;
      }

      const line = parseYoutubeEmbedTestMessage(event.data);

      if (line) {
        appendLog(line);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [activeVideoId, appendLog]);

  const handleIframeLoad = useCallback(() => {
    enableYoutubeIframeListening(iframeRef.current);
    appendLog({
      kind: "info",
      message: "Iframe load — listening for postMessage events",
    });
  }, [appendLog]);

  const onSubmit = handleSubmit(({ youtubeInput, autoplay }) => {
    const videoId = normalizeYoutubeVideoInput(youtubeInput);

    if (!videoId) {
      return;
    }

    setLogEntries([]);
    setLoadedAutoplay(autoplay);
    setActiveVideoId(videoId);
  });

  const handleClearLog = () => {
    setLogEntries([]);
  };

  const youtubeInputError = errors.youtubeInput?.message;

  return (
    <DashboardSection
      id="youtube-embed-test"
      lede="Load a video with the same nocookie embed and enablejsapi settings as in-app playback. Embed errors and player states appear in the log (same error codes as skip toasts)."
      title="YouTube embed test"
    >
      <article className={styles.panel}>
        <form className={styles.controls} onSubmit={onSubmit}>
          <label className={styles.label} htmlFor={inputId}>
            Video ID or URL
          </label>
          <input
            {...register("youtubeInput")}
            id={inputId}
            className={styles.textInput}
            type="text"
            placeholder="dQw4w9WgXcQ or https://www.youtube.com/watch?v=…"
            autoComplete="off"
            spellCheck={false}
            data-testid="fmdAdminYoutubeEmbedTestInput"
          />
          {youtubeInputError ? (
            <p className={styles.inputError} role="alert">
              {youtubeInputError}
            </p>
          ) : null}
          <label className={styles.autoplayLabel} htmlFor={autoplayId}>
            <input {...register("autoplay")} id={autoplayId} type="checkbox" />
            Autoplay on load
          </label>
          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryButton}>
              Load embed
            </button>
            {watchUrl ? (
              <a
                className={styles.secondaryLink}
                href={watchUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open on YouTube
              </a>
            ) : null}
          </div>
        </form>

        <div className={styles.workbench}>
          <div className={styles.preview}>
            {activeVideoId && embedUrl ? (
              <>
                <p className={styles.embedMeta}>
                  Active video ID:{" "}
                  <code className={styles.code}>{activeVideoId}</code>
                </p>
                <div className={styles.embedHost}>
                  <iframe
                    ref={iframeRef}
                    key={`${activeVideoId}-${loadedAutoplay ? "1" : "0"}`}
                    className={styles.embedFrame}
                    title="YouTube embed test"
                    src={embedUrl}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    onLoad={handleIframeLoad}
                    data-testid="fmdAdminYoutubeEmbedTestIframe"
                  />
                </div>
              </>
            ) : (
              <p className={styles.embedPlaceholder} role="status">
                Load an embed to preview the player here.
              </p>
            )}
          </div>

          <div className={styles.logSection}>
            <div className={styles.logHeader}>
              <h3 className={dashboardStyles.panelEyebrow}>Event log</h3>
              <button
                type="button"
                className={styles.clearLogButton}
                onClick={handleClearLog}
                disabled={logEntries.length === 0}
              >
                Clear log
              </button>
            </div>
            {logEntries.length === 0 ? (
              <p className={styles.logEmpty} role="status">
                Load an embed to capture onReady, onStateChange, onError, and
                infoDelivery messages.
              </p>
            ) : (
              <ol className={styles.logList}>
                {logEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className={styles.logItem}
                    data-log-kind={entry.kind}
                  >
                    <span className={styles.logKind}>{entry.kind}</span>
                    <span className={styles.logMessage}>{entry.message}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </article>
    </DashboardSection>
  );
};
