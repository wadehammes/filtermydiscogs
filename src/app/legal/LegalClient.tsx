"use client";

import Button from "src/components/Button/Button.component";
import pageStyles from "src/components/Page/Page.module.css";
import { useAuth } from "src/context/auth.context";
import { useClearAllUserData } from "src/hooks/useClearAllUserData.hook";
import styles from "./page.module.css";

export function LegalClient() {
  const { state: authState } = useAuth();
  const { clearAllUserData, isClearing } = useClearAllUserData();
  const isAuthenticated = authState.isAuthenticated;

  const handleClearAllData = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all data? This will:\n\n" +
          "• Log you out\n" +
          "• Clear all authentication tokens\n" +
          "• Delete all your stored crates\n" +
          "• Clear all preferences and cached data\n\n" +
          "You will need to authorize the app again to use it.",
      )
    ) {
      return;
    }

    try {
      await clearAllUserData();
    } catch (error) {
      console.error("Error clearing data:", error);
      alert("Failed to clear all data. Please try again.");
    }
  };

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
              Your crates? Those live in my Postgres database so they stick
              around between sessions. That's the only server-side storage I do.
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
              which proxy Discogs. Your crates get saved to my Postgres database
              so they don't disappear when you close the tab.
            </li>
            <li>
              Want to nuke everything on my side? Hit "Clear All Data" below and
              I'll wipe your crates from the database and clear local app data.
              That does not delete or change your Discogs collection or notes.
              You'd need to edit or remove those on Discogs itself.
            </li>
          </ul>
          <h3>Cookies & Storage</h3>
          <ul>
            <li>
              HttpOnly cookies hold your OAuth session so you stay logged in
              without exposing tokens to JavaScript.
            </li>
            <li>
              Local storage holds your preferences (theme, view settings,
              filters, and similar UI state). Just quality-of-life stuff.
            </li>
            <li>
              I use Google Tag Manager for basic analytics (page views, clicks,
              that kind of thing). Standard web stuff. Nothing personal.
            </li>
          </ul>
          <h3>Third-Party Stuff</h3>
          <ul>
            <li>
              The app talks to Discogs API. That's it. Their rules apply to that
              relationship.
            </li>
            <li>
              Google Tag Manager handles analytics. Google's privacy policy
              applies there.
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
            <li>All your auth tokens and session stuff</li>
            <li>
              Every crate you've created (deleted from Postgres, gone forever.
              No takebacks)
            </li>
            <li>All your preferences and settings</li>
            <li>All cached collection data in the app</li>
            <li>
              Your Discogs collection and any notes you saved there are not
              affected. You can still see and edit them on Discogs or after you
              log in again here
            </li>
          </ul>
          <p>
            <strong>Heads up:</strong> This logs you out and you'll need to
            reconnect with Discogs. All your crates get permanently deleted from
            the database. Useful if you're on a shared computer or just want a
            clean slate on this app. It is not a way to undo note edits on
            Discogs.
          </p>
          <div className={styles.clearDataButton}>
            <Button
              variant="danger"
              size="md"
              onPress={handleClearAllData}
              disabled={isClearing || !isAuthenticated}
              aria-label="Clear all data"
            >
              {isClearing ? "Clearing..." : "Clear All Data"}
            </Button>
          </div>
          {!isAuthenticated && (
            <p className={styles.clearDataNote}>
              You must be logged in to clear data.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
