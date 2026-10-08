import classNames from "classnames";
import { Suspense } from "react";
import pageStyles from "src/components/Page/Page.module.css";
import {
  ABOUT_GITHUB_LINKS,
  ABOUT_SUPPORT_EMAIL,
} from "src/constants/about.constants";
import styles from "./Legal.module.css";
import { LegalDataManagementActions } from "./LegalDataManagementActions.client";

export function LegalPageContent() {
  return (
    <div className={pageStyles.container}>
      <div className={styles.content} data-prose>
        <section data-prose-section>
          <h2>Terms of Service</h2>
          <p>
            FilterMyDiscogs is a free tool for browsing and organizing your
            Discogs collection. It stays in continuous beta: features change
            often and bugs are expected. These terms describe how the app works
            and what to expect.
          </p>
          <ul>
            <li>
              The app is provided as-is. I do my best to keep it running
              smoothly, but I can&apos;t guarantee it will always be available
              or error-free.
            </li>
            <li>
              Found a bug? Open a{" "}
              <a
                href={ABOUT_GITHUB_LINKS.issues}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub issue
              </a>{" "}
              with steps to reproduce when you can. Ideas and feedback belong in{" "}
              <a
                href={ABOUT_GITHUB_LINKS.discussions}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Discussions
              </a>
              , or email{" "}
              <a href={`mailto:${ABOUT_SUPPORT_EMAIL}`}>
                {ABOUT_SUPPORT_EMAIL}
              </a>
              .
            </li>
            <li>
              Most of the time the app only reads your Discogs collection. When
              you add, edit, or clear release notes here, those changes are
              saved to your Discogs account through the Discogs API. They are
              not stored in my database. Clearing app data below does not undo
              note changes you already saved on Discogs.
            </li>
            <li>
              The app does not add or remove releases from your collection. Note
              edits apply only to text fields you choose to change on releases
              you already own.
            </li>
            <li>
              Please keep your Discogs account credentials secure. You are
              responsible for activity on your Discogs account.
            </li>
            <li>
              Sign-in uses OAuth, so I never see your Discogs password. Your
              login stays between you and Discogs.
            </li>
            <li>
              You can revoke the app&apos;s access anytime in your Discogs
              account settings.
            </li>
            <li>
              Features may change over time, and I may need to take the service
              offline for maintenance or other reasons.
            </li>
            <li>
              The app is free today. If that ever changes (for example, paid
              features or subscriptions), I&apos;ll explain the change before it
              applies to you.
            </li>
          </ul>
        </section>

        <section data-prose-section>
          <h2>Privacy Policy</h2>
          <p>
            I don&apos;t sell your data or run ads against it. This section
            describes what the app stores, where it lives, and why.
          </p>
          <h3>What I Collect</h3>
          <ul>
            <li>
              <strong>Sign-in:</strong> OAuth 1.0a with Discogs. I never see
              your password. Session tokens are stored in httpOnly cookies so
              the server can call Discogs on your behalf; page JavaScript cannot
              read them.
            </li>
            <li>
              <strong>Your collection:</strong> Release data, including notes,
              comes from the Discogs API. It is cached in your browser to keep
              the app responsive. After a full load, a copy may live in
              IndexedDB on this device so return visits can skip re-downloading
              every page; on sign-in we re-check collection size with Discogs
              and clear the cache if your collection has changed. We may also
              store your collection size in localStorage (not the releases
              themselves) to speed up pagination.
            </li>
            <li>
              <strong>Notes you edit:</strong> When you save notes in the app,
              that text passes through my server to the Discogs API. I do not
              store note content in Postgres.
            </li>
            <li>
              <strong>Crates:</strong> Crate names and which releases belong in
              each crate are stored in Postgres so they persist between
              sessions.
            </li>
            <li>
              <strong>In-app playback:</strong> Per-track play and listen counts
              (plus basic track labels) are stored in Postgres. On repeat on the
              dashboard shows both; release tracklists show listen counts only.
              Counts increment when playback actually starts or you resume from
              pause, not when a paused session reopens after a page refresh.
              This is separate from optional product analytics below.
            </li>
            <li>
              <strong>Account preferences</strong> (when you&apos;re signed in):
              theme, default view (grid or table), whether to remember filter
              selections, whether to auto-play when adding to an empty queue,
              whether to extend the playback queue with similar releases from
              your collection when up next runs low (opt-in; default off), your
              analytics cookie choice (when set), named saved views from the
              Views menu on Releases, and, when enabled, saved filter and sort
              choices (styles, years, formats, sort order, genre/style, format,
              and release year match mode, and search text). These sync across
              browsers; your full collection is not stored in Postgres.
            </li>
            <li>
              <strong>Optional analytics</strong> (only if you opt in): product
              usage events in Postgres (for example page path, event name, and
              interaction label). When you&apos;re signed in, events may include
              your account ID. I use this to improve the app, not to sell data.
            </li>
          </ul>
          <h3>What I Do With It</h3>
          <ul>
            <li>
              Collection data powers browsing, search, and filters in the app.
            </li>
            <li>
              Note edits are sent to Discogs on your behalf. I don&apos;t
              analyze note text or keep a separate copy in my database.
            </li>
            <li>
              Collection pages flow through your browser and my API routes,
              which proxy Discogs. Crates and account preferences are saved to
              Postgres so they survive when you close the tab.
            </li>
            <li>
              Theme, view, filter, playback, and analytics cookie preferences
              are also kept in your browser for fast loads on this device. When
              you&apos;re signed in, changes sync to your account.
            </li>
            <li>
              You can remove everything stored on my side with &quot;Clear All
              Data&quot; below. That wipes crates, in-app playback stats, and
              saved preferences from the database and clears local app data in
              this browser. It does not delete or change your Discogs collection
              or notes. You&apos;d manage those on Discogs itself.
            </li>
          </ul>
          <h3 id="cookies">Cookies & Storage</h3>
          <ul>
            <li>
              <strong>Essential cookies:</strong> HttpOnly cookies hold your
              OAuth session so you stay logged in without exposing tokens to
              JavaScript. These are required for the app to work and do not need
              separate consent.
            </li>
            <li>
              <strong>Local storage:</strong> Theme, default view, filter and
              sort selections (when &quot;Remember filter selections&quot; is
              on), your analytics cookie choice, in-progress playback (current
              track and upcoming queue), remembered collection size for faster
              loading, and similar UI state. When you&apos;re logged in, the
              same preferences are also stored on the server (see above).{" "}
              <strong>IndexedDB:</strong> After your collection finishes
              loading, a cached copy of those pages may be stored on this device
              to speed up return visits until your Discogs collection size
              changes or you clear app data.
            </li>
            <li>
              <strong>Optional analytics:</strong> When you opt in, Google Tag
              Manager may set analytics cookies to measure page views and basic
              interactions. The app may also store similar interaction events in
              Postgres (for example page path, event name, and label) to
              understand product usage, sometimes linked to your account ID when
              you&apos;re signed in. Analytics does not run until you accept.
              You can change your choice anytime in Settings under Data, or use
              Essential only on the consent banner.
            </li>
          </ul>
          <h3>Third parties</h3>
          <ul>
            <li>
              The app uses the Discogs API for your collection and notes.
              Discogs&apos; own terms and privacy policy apply to that
              relationship.
            </li>
            <li>
              If you opt in to analytics, Google Tag Manager may set cookies;
              Google&apos;s privacy policy applies there. First-party product
              analytics events are stored in my Postgres database under the same
              consent choice.
            </li>
            <li>
              Cover images are proxied for performance and cached briefly; they
              are not permanently stored on my servers.
            </li>
          </ul>
        </section>

        <section
          className={classNames(styles.dataManagementPanel)}
          data-prose-section
        >
          <h2>Data Management</h2>
          <p>
            If you want a clean slate in FilterMyDiscogs, &quot;Clear All
            Data&quot; removes the following:
          </p>
          <ul>
            <li>Auth tokens and session cookies</li>
            <li>
              All crates and crate membership (permanently deleted from
              Postgres)
            </li>
            <li>
              In-app playback stats: per-track play and listen counts from
              in-app playback (not optional product analytics; deleted with your
              account row)
            </li>
            <li>
              Saved account preferences on the server: theme, default view (grid
              or table), analytics cookie choice, named saved views from the
              Views menu on Releases, filter/sort selections when &quot;Remember
              filter selections&quot; is enabled in Settings, and playback
              settings (auto-play on queue add and extend queue with similar
              releases)
            </li>
            <li>
              Product analytics events linked to your account (when analytics
              was enabled), such as page views and interaction labels
            </li>
            <li>
              Local data on this browser: theme, view mode, filters, analytics
              cookie choice (you will be asked about analytics cookies again),
              in-progress playback, remembered collection size, cached
              collection pages in IndexedDB, and similar UI state
            </li>
            <li>
              In-memory caches for the current session, including your loaded
              collection
            </li>
            <li>
              Your Discogs collection and any notes saved there are unchanged.
              You can still view and edit them on Discogs or after you sign in
              here again
            </li>
          </ul>
          <p>
            <strong>Please note:</strong> This signs you out and permanently
            deletes crates and saved preferences from the database. Logging out
            without clearing data keeps your crates and preferences. You can
            sign in again later. Helpful on a shared computer or when you want
            to reset this app only. It does not undo note edits on Discogs.
          </p>
          <Suspense fallback={null}>
            <div data-prose-actions>
              <LegalDataManagementActions />
            </div>
          </Suspense>
        </section>
      </div>
    </div>
  );
}
