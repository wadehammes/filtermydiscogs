"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearData } from "src/api/helpers";
import Button from "src/components/Button/Button.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { useCrate } from "src/context/crate.context";
import Logo from "src/styles/icons/fmd-logo.svg";
import styles from "./page.module.css";

export function AboutClient() {
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
          currentPage="about"
        />
      ) : (
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <Link href="/" className={styles.logoLink}>
              <Logo className={styles.logo} />
            </Link>
            <nav className={styles.nav}>
              <Link href="/" className={styles.navLink}>
                Home
              </Link>
              <Link
                href="/about"
                className={`${styles.navLink} ${styles.active}`}
              >
                About
              </Link>
            </nav>
          </div>
        </header>
      )}
      <div className={styles.container}>
        <div className={styles.content}>
          <section className={styles.section}>
            <h2>Terms of Service</h2>
            <p>
              By using Filter My Disco.gs, you agree to the following terms:
            </p>
            <ul>
              <li>
                This application is provided "as is" without warranty of any
                kind.
              </li>
              <li>
                This service does not modify or delete data from your Discogs
                account. We are not responsible for any issues that may occur
                while using this service, as it only reads data from your
                Discogs collection.
              </li>
              <li>
                You are responsible for maintaining the security of your Discogs
                account credentials.
              </li>
              <li>
                This application uses OAuth to access your Discogs collection
                data. We do not store your Discogs password.
              </li>
              <li>
                You may revoke access to your Discogs account at any time
                through your Discogs settings.
              </li>
              <li>
                We reserve the right to modify or discontinue the service at any
                time without notice.
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Privacy Policy</h2>
            <p>
              Your privacy is important to us. This privacy policy explains how
              we handle your data:
            </p>
            <h3>Data Collection</h3>
            <ul>
              <li>
                We use OAuth 1.0a to authenticate with Discogs. We never see or
                store your Discogs password.
              </li>
              <li>
                We store OAuth tokens in your browser's local storage to
                maintain your session.
              </li>
              <li>
                Collection data is fetched directly from Discogs API and cached
                in your browser.
              </li>
              <li>
                We do not collect, store, or transmit your personal information
                to third parties.
              </li>
            </ul>
            <h3>Data Usage</h3>
            <ul>
              <li>
                Your collection data is only used to display your releases
                within the application.
              </li>
              <li>
                We do not analyze, sell, or share your collection data with
                anyone.
              </li>
              <li>
                All data processing happens locally in your browser or through
                direct API calls to Discogs.
              </li>
              <li>
                Your crates (custom collections you create) are stored in a
                database and are associated with your user account. You can
                clear all crates at any time using the "Clear All Data" button
                in the Data Management section below.
              </li>
            </ul>
            <h3>Cookies and Local Storage</h3>
            <ul>
              <li>
                We use browser local storage to save your preferences (theme,
                view settings, filters).
              </li>
              <li>
                OAuth tokens are stored in local storage for session management.
              </li>
              <li>We do not use tracking cookies or analytics services.</li>
            </ul>
            <h3>Third-Party Services</h3>
            <ul>
              <li>
                This application integrates with Discogs API. Your use of this
                application is also subject to Discogs' Terms of Service and
                Privacy Policy.
              </li>
              <li>
                We use an image proxy service to optimize release thumbnails.
                Images are cached but not permanently stored.
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Data Management</h2>
            <p>
              You can clear all data stored by this application at any time.
              This includes:
            </p>
            <ul>
              <li>Authentication tokens and session data</li>
              <li>
                All your created and stored crates (stored in our database and
                permanently deleted when cleared)
              </li>
              <li>View preferences and settings</li>
              <li>All cached collection data</li>
            </ul>
            <p>
              <strong>Note:</strong> Clearing data will log you out and you will
              need to authorize the application again to use it. All crates
              stored in the database will be permanently deleted. This is useful
              if you're using a shared device or want to start fresh.
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

          <section className={styles.section}>
            <h2>Contact</h2>
            <p>
              If you have questions, concerns, or feedback about Filter My
              Disco.gs, please reach out:
            </p>
            <div className={styles.contactInfo}>
              <p>
                <strong>Email:</strong>{" "}
                <a href="mailto:noise@filtermydisco.gs">
                  noise@filtermydisco.gs
                </a>
              </p>
              <p>
                <strong>GitHub:</strong>{" "}
                <a
                  href="https://github.com/wadehammes/filtermydiscogs"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  wadehammes/filtermydiscogs
                </a>
              </p>
              <p>
                <strong>Feature Requests:</strong> Please use{" "}
                <a
                  href="https://github.com/wadehammes/filtermydiscogs/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Discussions
                </a>{" "}
                to share feature ideas and suggestions.
              </p>
              <p>
                <strong>Bug Reports:</strong> If you encounter an issue, please
                submit it as an{" "}
                <a
                  href="https://github.com/wadehammes/filtermydiscogs/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  issue on GitHub
                </a>
                .
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Repository</h2>
            <p>
              Filter My Disco.gs is an open-source project. You can view the
              source code, contribute, or report issues on GitHub:
            </p>
            <div className={styles.repoLink}>
              <a
                href="https://github.com/wadehammes/filtermydiscogs"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.repoButton}
              >
                View on GitHub
              </a>
            </div>
            <p className={styles.license}>
              This project is licensed under the MIT License.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Built By</h2>
            <p>
              Filter My Disco.gs was built by{" "}
              <a
                href="https://wadehammes.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Wade Hammes
              </a>
              .
            </p>
            <div className={styles.contactInfo}>
              <p>
                <strong>Personal Website:</strong>{" "}
                <a
                  href="https://wadehammes.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  wadehammes.com
                </a>
              </p>
              <p>
                <strong>Links:</strong>{" "}
                <a
                  href="https://linktr.ee/wadehammes"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  linktr.ee/wadehammes
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
