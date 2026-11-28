export const WHATS_NEW_SHORTCUT_PLACEHOLDER = "%shortcut%";

export type WhatsNewBulletBadge = "new" | "fixed" | "improved" | "removed";

export const WHATS_NEW_BULLET_BADGE_LABEL: Record<WhatsNewBulletBadge, string> =
  {
    new: "New",
    fixed: "Fixed",
    improved: "Improved",
    removed: "Removed",
  };

export type WhatsNewBullet = {
  id: string;
  text: string;
  badge: WhatsNewBulletBadge;
};

export type WhatsNewRelease = {
  version: string;
  highlights: readonly WhatsNewBullet[];
};

export const WHATS_NEW_NAV_LABEL = "What's New?";

export const WHATS_NEW_MODAL_TITLE = "What's New";

export const WHATS_NEW_OPEN_QUERY_PARAM = "whatsnew";

export const WHATS_NEW_OPEN_QUERY_VALUE = "1";

export const WHATS_NEW_OTHER_IMPROVEMENTS =
  "Other bug fixes and performance improvements";

export const resolveWhatsNewBulletText = (
  bullet: WhatsNewBullet,
  shortcutLabel: string,
): string =>
  bullet.text.includes(WHATS_NEW_SHORTCUT_PLACEHOLDER)
    ? bullet.text.replaceAll(WHATS_NEW_SHORTCUT_PLACEHOLDER, shortcutLabel)
    : bullet.text;

export const WHATS_NEW_RELEASES: readonly WhatsNewRelease[] = [
  {
    version: "v2026.11.27",
    highlights: [
      {
        id: "whats-new-modal",
        badge: "new",
        text: "What's New? in the account menu lists release notes and may open once after a deploy refresh.",
      },
      {
        id: "collection-command-palette",
        badge: "new",
        text: `Collection Ask (${WHATS_NEW_SHORTCUT_PLACEHOLDER}, filters bar, or mobile header): describe filters, then apply, save a view, or create a crate.`,
      },
      {
        id: "genre-style-exclude",
        badge: "new",
        text: "Genre & Style excludes: row Exclude → Not chips, or say what to omit in Ask. Same tag cannot be included and excluded.",
      },
      {
        id: "collection-radio-removed",
        badge: "removed",
        text: "Collection radio is removed for now. A revised version may return after I refine the concept.",
      },
      {
        id: "mobile-playback-header-dock",
        badge: "improved",
        text: "Mobile header can hide the playback bar; play and pause stay in the header.",
      },
    ],
  },
  {
    version: "v2026.11.26",
    highlights: [
      {
        id: "mosaic-export-menus",
        badge: "new",
        text: "Export a mosaic from crate and playlist menus.",
      },
      {
        id: "bottom-drawer-footers",
        badge: "improved",
        text: "Mobile drawer footers match Queue, Play, and More.",
      },
      {
        id: "collection-load-cache",
        badge: "improved",
        text: "Collection opens faster with smoother filters, sidebar, and cover art while sync runs.",
      },
    ],
  },
  {
    version: "v2026.11.25",
    highlights: [
      {
        id: "marketing-email-verification",
        badge: "fixed",
        text: "Marketing mail needs a verified email in Settings.",
      },
      {
        id: "toast-manager",
        badge: "improved",
        text: "Promotional toasts share one manager so support and email prompts do not fight for space.",
      },
    ],
  },
  {
    version: "v2026.11.24",
    highlights: [
      {
        id: "mono-font-spots",
        badge: "improved",
        text: "Mono type in more labels and meta lines across the app.",
      },
    ],
  },
  {
    version: "v2026.11.23",
    highlights: [
      {
        id: "resend-errors",
        badge: "improved",
        text: "Clearer errors when verification or welcome email fails to send.",
      },
    ],
  },
  {
    version: "v2026.11.22",
    highlights: [
      {
        id: "welcome-email-login",
        badge: "fixed",
        text: "Welcome email runs reliably after login when your account is eligible.",
      },
    ],
  },
  {
    version: "v2026.11.19",
    highlights: [
      {
        id: "image-skeletons",
        badge: "improved",
        text: "Skeleton placeholders while cover art loads.",
      },
    ],
  },
  {
    version: "v2026.11.18",
    highlights: [
      {
        id: "public-playlist-ssr",
        badge: "improved",
        text: "Public playlists paint from database snapshots before Discogs catches up.",
      },
      {
        id: "discogs-throttle",
        badge: "improved",
        text: "Collection fetches win over background batch jobs when rate limits bite.",
      },
    ],
  },
  {
    version: "v2026.11.16",
    highlights: [
      {
        id: "build-version-poll",
        badge: "fixed",
        text: "Client refresh after deploy detects new builds sooner.",
      },
    ],
  },
  {
    version: "v2026.11.15",
    highlights: [
      {
        id: "bottom-drawer-render",
        badge: "fixed",
        text: "Mobile bottom drawer renders consistently when opened.",
      },
    ],
  },
  {
    version: "v2026.11.14",
    highlights: [
      {
        id: "similar-toolbar-mobile",
        badge: "new",
        text: "Sticky similar-release actions on mobile release pages.",
      },
    ],
  },
  {
    version: "v2026.11.12",
    highlights: [
      {
        id: "release-performance",
        badge: "improved",
        text: "Collection and release views feel snappier on large libraries.",
      },
    ],
  },
  {
    version: "v2026.11.10",
    highlights: [
      {
        id: "create-crate-409",
        badge: "fixed",
        text: "Creating a crate no longer errors when the name already exists.",
      },
    ],
  },
  {
    version: "v2026.11.06",
    highlights: [
      {
        id: "public-release-pages",
        badge: "new",
        text: "Public release listen pages for shared links.",
      },
      {
        id: "mobile-release-page",
        badge: "improved",
        text: "Mobile release layout polish.",
      },
    ],
  },
  {
    version: "v2026.11.05",
    highlights: [
      {
        id: "public-crate-header",
        badge: "fixed",
        text: "Public crate header spacing on small screens.",
      },
    ],
  },
  {
    version: "v2026.11.03",
    highlights: [
      {
        id: "sort-titles",
        badge: "improved",
        text: "Sort options show clearer titles in menus.",
      },
    ],
  },
  {
    version: "v2026.11.01",
    highlights: [
      {
        id: "public-playlist-qa",
        badge: "improved",
        text: "Public playlist share pages behave more like owner playlists.",
      },
    ],
  },
  {
    version: "v2026.10.27",
    highlights: [
      {
        id: "playlist-share-stats",
        badge: "new",
        text: "View and play counts on public playlist share links.",
      },
    ],
  },
  {
    version: "v2026.10.25-9",
    highlights: [
      {
        id: "public-share-revalidate",
        badge: "improved",
        text: "Public crates and playlists refresh shared cache more reliably.",
      },
    ],
  },
  {
    version: "v2026.10.25",
    highlights: [
      {
        id: "playlist-drawer-padding",
        badge: "fixed",
        text: "Playlist drawer padding with the mini player visible.",
      },
    ],
  },
  {
    version: "v2026.10.23",
    highlights: [
      {
        id: "player-bar-add",
        badge: "fixed",
        text: "Add-to-queue control on the playback bar works when expected.",
      },
    ],
  },
  {
    version: "v2026.10.22",
    highlights: [
      {
        id: "playlist-qa",
        badge: "improved",
        text: "Playlist drawer and playback edge cases from QA passes.",
      },
    ],
  },
  {
    version: "v2026.10.19",
    highlights: [
      {
        id: "admin-playback-stats",
        badge: "new",
        text: "Admin dashboard playback stats for support and debugging.",
      },
    ],
  },
  {
    version: "v2026.10.17",
    highlights: [
      {
        id: "queue-advance-regression",
        badge: "fixed",
        text: "Background queue advances correctly after a regression.",
      },
    ],
  },
  {
    version: "v2026.10.16",
    highlights: [
      {
        id: "watchdog-play-next",
        badge: "fixed",
        text: "Watchdog no longer skips the next track when embeds load slowly.",
      },
    ],
  },
  {
    version: "v2026.10.15",
    highlights: [
      {
        id: "card-hover-paint",
        badge: "improved",
        text: "Less paint work when hovering release cards and crate controls.",
      },
    ],
  },
  {
    version: "v2026.10.14",
    highlights: [
      {
        id: "next-production-hardening",
        badge: "improved",
        text: "Hardened production Next.js config and headers.",
      },
    ],
  },
  {
    version: "v2026.10.13",
    highlights: [
      {
        id: "release-loading-shell",
        badge: "fixed",
        text: "Release modal shell while detail loads.",
      },
    ],
  },
  {
    version: "v2026.10.12",
    highlights: [
      {
        id: "sentry-copy",
        badge: "improved",
        text: "Clearer copy in the bug report dialog.",
      },
    ],
  },
  {
    version: "v2026.10.11",
    highlights: [
      {
        id: "sentry-feedback",
        badge: "improved",
        text: "Bug report flow and screenshots behave more reliably.",
      },
    ],
  },
  {
    version: "v2026.10.10",
    highlights: [
      {
        id: "sentry-config",
        badge: "fixed",
        text: "Sentry client config loads in production builds.",
      },
    ],
  },
  {
    version: "v2026.10.08",
    highlights: [
      {
        id: "delete-account",
        badge: "improved",
        text: "Delete account flow with clearer confirmation and data wipe.",
      },
    ],
  },
  {
    version: "v2026.10.01",
    highlights: [
      {
        id: "collection-fetch-error",
        badge: "fixed",
        text: "Collection fetch errors surface without breaking the page.",
      },
    ],
  },
  {
    version: "v2026.09.30",
    highlights: [
      {
        id: "on-this-day-order",
        badge: "fixed",
        text: "On this day dashboard ordering matches the selected range.",
      },
    ],
  },
  {
    version: "v2026.09.27",
    highlights: [
      {
        id: "pip-queue-end",
        badge: "fixed",
        text: "Queue keeps playing when picture-in-picture closes.",
      },
    ],
  },
  {
    version: "v2026.09.26",
    highlights: [
      {
        id: "ui-tweaks",
        badge: "improved",
        text: "Miscellaneous spacing and control polish.",
      },
    ],
  },
  {
    version: "v2026.09.24-5",
    highlights: [
      {
        id: "queue-new-release",
        badge: "fixed",
        text: "Starting a new release does not leave the queue in a bad state.",
      },
    ],
  },
  {
    version: "v2026.09.24",
    highlights: [
      {
        id: "login-style",
        badge: "improved",
        text: "Login page layout and copy refresh.",
      },
    ],
  },
  {
    version: "v2026.09.22",
    highlights: [
      {
        id: "up-next-duplicate",
        badge: "fixed",
        text: "Up next no longer duplicates the same track.",
      },
    ],
  },
  {
    version: "v2026.09.20",
    highlights: [
      {
        id: "background-skip-watchdog",
        badge: "fixed",
        text: "Background playback skip watchdog tracks embed state better.",
      },
    ],
  },
  {
    version: "v2026.09.18-13",
    highlights: [
      {
        id: "custom-fields",
        badge: "new",
        text: "Custom collection field improvements in filters and cards.",
      },
    ],
  },
  {
    version: "v2026.09.18",
    highlights: [
      {
        id: "rating-save-invalidate",
        badge: "fixed",
        text: "Collection ratings refresh after you save in the release modal.",
      },
    ],
  },
  {
    version: "v2026.09.17",
    highlights: [
      {
        id: "youtube-skip-toast",
        badge: "improved",
        text: "Toasts when YouTube skips private or missing tracks.",
      },
      {
        id: "player-loading-overlay",
        badge: "improved",
        text: "Loading overlay while the embed prepares.",
      },
    ],
  },
  {
    version: "v2026.09.16",
    highlights: [
      {
        id: "pip-queue-close",
        badge: "fixed",
        text: "Queue playback survives closing picture-in-picture.",
      },
      {
        id: "queue-add-polish",
        badge: "improved",
        text: "Smoother add-to-queue and similar-tail behavior.",
      },
    ],
  },
  {
    version: "v2026.09.15",
    highlights: [
      {
        id: "crate-selector-resize",
        badge: "improved",
        text: "Crate selector layout when the drawer is narrow.",
      },
    ],
  },
  {
    version: "v2026.09.13",
    highlights: [
      {
        id: "discogs-queue-throttle",
        badge: "fixed",
        text: "Discogs rate limits interrupt queue fetches less often.",
      },
    ],
  },
  {
    version: "v2026.09.12",
    highlights: [
      {
        id: "skeleton-pulse",
        badge: "fixed",
        text: "Skeleton pulse animation regression on loading cards.",
      },
    ],
  },
  {
    version: "v2026.09.11",
    highlights: [
      {
        id: "highlighted-card",
        badge: "fixed",
        text: "Random and filtered highlight cards render correctly again.",
      },
    ],
  },
  {
    version: "v2026.09.10",
    highlights: [
      {
        id: "cache-loading",
        badge: "improved",
        text: "Collection cache loading strategy and UI fixes.",
      },
    ],
  },
  {
    version: "v2026.09.09",
    highlights: [
      {
        id: "favicon",
        badge: "fixed",
        text: "Favicon and app icons load on all routes.",
      },
    ],
  },
  {
    version: "v2026.09.04",
    highlights: [
      {
        id: "drawer-height-mobile",
        badge: "fixed",
        text: "Drawer height on phones with the mini player open.",
      },
    ],
  },
  {
    version: "v2026.09.03",
    highlights: [
      {
        id: "video-playback",
        badge: "fixed",
        text: "YouTube playback regressions from dependency updates.",
      },
    ],
  },
  {
    version: "v17.23.0",
    highlights: [
      {
        id: "scroll-jank",
        badge: "fixed",
        text: "Janky scrolling on collection and crate views.",
      },
    ],
  },
  {
    version: "v17.21.2",
    highlights: [
      {
        id: "rating-decimal",
        badge: "improved",
        text: "Half-star ratings display consistently.",
      },
    ],
  },
  {
    version: "v17.20.0",
    highlights: [
      {
        id: "stripe-donation",
        badge: "new",
        text: "Optional Stripe donation on About and in Settings.",
      },
    ],
  },
  {
    version: "v17.17.6",
    highlights: [
      {
        id: "track-bpm-key",
        badge: "new",
        text: "Track BPM and key on release detail when Discogs provides them.",
      },
    ],
  },
  {
    version: "v17.17.0",
    highlights: [
      {
        id: "saved-views",
        badge: "new",
        text: "Saved filter views on the collection page.",
      },
    ],
  },
  {
    version: "v17.15.13",
    highlights: [
      {
        id: "security-audit",
        badge: "improved",
        text: "Security and dependency hardening across the stack.",
      },
    ],
  },
] as const;

export const WHATS_NEW_LATEST_VERSION = WHATS_NEW_RELEASES[0]?.version ?? "";
