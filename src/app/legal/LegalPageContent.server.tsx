import { Suspense } from "react";
import pageStyles from "src/components/Page/Page.module.css";
import { LegalDataManagementActions } from "./LegalDataManagementActions.client";
import styles from "./page.module.css";

export function LegalPageContent() {
  return (
    <div className={pageStyles.container}>
      <div className={styles.content}>
        <section className={styles.section}>
          <h2>Terms of Service</h2>
          <p>
            Here's the deal: use this app at your own risk. I'm not a lawyer,
            but here's what you should know:
          </p>
          <ul>
            <li>
              This thing is free and comes with zero guarantees. If it breaks,
              I'll try to fix it, but no promises.
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
            <li>Keep your Discogs account secure. That's on you, not me.</li>
            <li>
              I use OAuth, so I never see your password. Your Discogs login
              stays between you and Discogs.
            </li>
            <li>
              Want to bail? Revoke access anytime in your Discogs settings. No
              hard feelings.
            </li>
            <li>
              I might change things up or shut it down. That's just how it goes
              with free projects.
            </li>
            <li>
              Right now it's free, but that might change. If I ever add paid
              features or subscriptions, I'll give you a heads up first.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Privacy Policy</h2>
          <p>
            I'm not in the data-selling business. Here's what I actually do with
            your stuff:
          </p>
          <h3>What I Collect</h3>
          <ul>
            <li>
              OAuth 1.0a authentication. I never see your Discogs password. That
              stays between you and Discogs.
            </li>
            <li>
              OAuth session tokens live in httpOnly cookies on your browser so
              the server can call Discogs on your behalf. They are not readable
              by page JavaScript.
            </li>
            <li>
              Your collection data, including release notes, comes from the
              Discogs API and is cached in your browser to keep things snappy.
            </li>
            <li>
              When you save notes in the app, that text passes through my server
              to the Discogs API. I do not store note content in my Postgres
              database.
            </li>
            <li>
              Your crates and which releases are in them live in my Postgres
              database so they stick around between sessions.
            </li>
            <li>
              When you&apos;re logged in, account preferences also live in
              Postgres: theme (light, dim, sepia, slate, dark, midnight, high
              contrast, or system), default view (grid or table), whether to
              remember filter selections, your analytics cookie choice (when
              set), and—when that option is on—your saved filter and sort
              choices (styles, years, formats, sort order, style match mode, and
              search text). That lets settings follow you across browsers. I
              don&apos;t store your full collection there.
            </li>
            <li>
              I don't sell your data, share it, or do anything sketchy with it.
              Period.
            </li>
          </ul>
          <h3>What I Do With It</h3>
          <ul>
            <li>
              Your collection data, including notes, is for showing, searching,
              and filtering your records in the app. That's it.
            </li>
            <li>
              When you edit release notes, I send your changes to Discogs on
              your behalf. I don't analyze note text, mine it, or keep a
              separate copy in my database.
            </li>
            <li>
              Collection data runs through your browser and hits my API routes,
              which proxy Discogs. Your crates and account preferences get saved
              to Postgres so they don&apos;t disappear when you close the tab.
            </li>
            <li>
              Theme, view, filter, and analytics cookie preferences are also
              kept in your browser for fast loads and continuity on this device.
              When you&apos;re signed in, changes sync to your account.
            </li>
            <li>
              Want to nuke everything on my side? Hit &quot;Clear All Data&quot;
              below and I&apos;ll wipe your crates and saved preferences from
              the database and clear local app data on this browser. That does
              not delete or change your Discogs collection or notes. You&apos;d
              need to edit or remove those on Discogs itself.
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
              on), your analytics cookie choice, in-progress playback position,
              and similar UI state. When you&apos;re logged in, the same
              preferences are also stored on the server (see above).
            </li>
            <li>
              <strong>Optional analytics cookies:</strong> When you opt in,
              Google Tag Manager may set analytics cookies to measure page views
              and basic interactions. Analytics does not run until you accept.
              You can change your choice anytime in Settings under Data, or use
              Essential only on the consent banner.
            </li>
          </ul>
          <h3>Third-Party Stuff</h3>
          <ul>
            <li>
              The app talks to Discogs API. That's it. Their rules apply to that
              relationship.
            </li>
            <li>
              Google Tag Manager handles analytics when you opt in.
              Google&apos;s privacy policy applies there.
            </li>
            <li>
              Images get proxied for speed, but I don't hoard them. They're
              cached, not stored.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Data Management</h2>
          <p>Want to start fresh? Clear everything out. This button wipes:</p>
          <ul>
            <li>All your auth tokens and session cookies</li>
            <li>
              Every crate you&apos;ve created, including which releases are in
              each crate (deleted from Postgres, gone forever. No takebacks)
            </li>
            <li>
              Your saved account preferences on our server: theme, default view
              (grid or table), your analytics cookie choice, and filter/sort
              selections when &quot;Remember filter selections&quot; is enabled
              in Settings
            </li>
            <li>
              Local preferences on this browser: theme, view mode, filters,
              analytics cookie choice (you will be asked about analytics cookies
              again), in-progress playback position, and similar UI state
            </li>
            <li>Cached collection data for the current session</li>
            <li>
              Your Discogs collection and any notes you saved there are not
              affected. You can still see and edit them on Discogs or after you
              log in again here
            </li>
          </ul>
          <p>
            <strong>Heads up:</strong> This logs you out and you&apos;ll need to
            reconnect with Discogs. Crates and saved preferences are permanently
            deleted from our database. Logging out without clearing data keeps
            your crates and preferences—you can sign in again later. Useful on a
            shared computer or when you want a clean slate on this app. It is
            not a way to undo note edits on Discogs.
          </p>
          <Suspense fallback={null}>
            <LegalDataManagementActions />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
