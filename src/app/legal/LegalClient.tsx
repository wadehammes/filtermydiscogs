"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearData } from "src/api/helpers";
import Button from "src/components/Button/Button.component";
import { PublicPageHeader } from "src/components/PublicPageHeader/PublicPageHeader.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { useCrate } from "src/context/crate.context";
import styles from "./page.module.css";

export function LegalClient() {
  const { state: authState, logout } = useAuth();
  const { dispatchResetState } = useCollectionContext();
  const { clearCrate } = useCrate();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);
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

    setIsClearing(true);

    try {
      // Clear all cookies (authentication tokens)
      await clearData();

      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("filtermydiscogs_selected_releases");
        localStorage.removeItem("fmd_username");
        localStorage.removeItem("filtermydiscogs_theme");
        localStorage.removeItem("filtermydiscogs_view_state");
      }

      // Clear React Query cache and reset collection state
      queryClient.clear();
      dispatchResetState();
      clearCrate();

      // Logout and redirect to home
      await logout();
      router.replace("/");
    } catch (error) {
      console.error("Error clearing data:", error);
      alert("Failed to clear all data. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      {isAuthenticated ? (
        <StickyHeaderBar
          allReleasesLoaded={true}
          hideFilters={true}
          currentPage="legal"
        />
      ) : (
        <PublicPageHeader currentPage="legal" />
      )}
      <div className={styles.container}>
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
                I only read your Discogs collection—I never touch, modify, or
                delete anything in your actual Discogs account. Your collection
                stays safe.
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
                I might change things up or shut it down. That's just how it
                goes with free projects.
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
              I'm not in the data-selling business. Here's what I actually do
              with your stuff:
            </p>
            <h3>What I Collect</h3>
            <ul>
              <li>
                OAuth 1.0a authentication—I never see your Discogs password.
                That stays between you and Discogs.
              </li>
              <li>
                OAuth tokens live in your browser's local storage so you don't
                have to log in every time.
              </li>
              <li>
                Your collection data comes straight from Discogs API and gets
                cached in your browser to keep things snappy.
              </li>
              <li>
                Your crates? Those live in my Postgres database so they stick
                around between sessions. That's the only server-side storage I
                do.
              </li>
              <li>
                I don't sell your data, share it, or do anything sketchy with
                it. Period.
              </li>
            </ul>
            <h3>What I Do With It</h3>
            <ul>
              <li>
                Your collection data is just for showing you your records.
                That's it.
              </li>
              <li>
                I don't analyze it, mine it, or send it anywhere. Your music
                taste stays yours.
              </li>
              <li>
                Collection data runs through your browser and hits Discogs API
                directly. Your crates get saved to my Postgres database so they
                don't disappear when you close the tab.
              </li>
              <li>
                Want to nuke everything? Hit "Clear All Data" below and I'll
                wipe your crates from the database. Gone forever.
              </li>
            </ul>
            <h3>Cookies & Storage</h3>
            <ul>
              <li>
                Local storage holds your preferences (theme, view settings,
                filters). Just quality-of-life stuff.
              </li>
              <li>
                OAuth tokens hang out in local storage too, so you stay logged
                in.
              </li>
              <li>
                I use Google Tag Manager for basic analytics (page views,
                clicks, that kind of thing). Standard web stuff—nothing
                personal.
              </li>
            </ul>
            <h3>Third-Party Stuff</h3>
            <ul>
              <li>
                The app talks to Discogs API. That's it. Their rules apply to
                that relationship.
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
                Every crate you've created (deleted from Postgres, gone
                forever—no takebacks)
              </li>
              <li>All your preferences and settings</li>
              <li>All cached collection data</li>
            </ul>
            <p>
              <strong>Heads up:</strong> This logs you out and you'll need to
              reconnect with Discogs. All your crates get permanently deleted
              from the database. Useful if you're on a shared computer or just
              want a clean slate.
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
    </>
  );
}
