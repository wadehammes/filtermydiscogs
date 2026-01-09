"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
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
        <PublicPageHeader currentPage="about" />
      )}
      <div className={styles.container}>
        <div className={styles.content}>
          <section className={styles.section}>
            <h2>About This Project</h2>
            <p>
              FilterMyDisco.gs is a tool to help you browse, filter, and
              organize your Discogs collection. Made by{" "}
              <a
                href="https://wadehammes.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.inlineLink}
              >
                Wade Hammes
              </a>
              . A passion project to help you discover, organize, and explore
              your music collection—whether it's vinyl, CDs, cassettes, or
              digital releases. Create crates for DJ sets, organize by theme, or
              just rediscover what you already own.
            </p>
            <p>
              For legal information, see our{" "}
              <Link href="/legal" className={styles.inlineLink}>
                Terms of Service and Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section className={`${styles.section} ${styles.donationSection}`}>
            <h2>Support This Project</h2>
            <p>
              If you find this app useful and want to support its development,
              consider tossing me some coin. Every contribution helps keep this
              project running and improving!
            </p>
            <div className={styles.donationContent}>
              <div className={styles.donationQR}>
                <img
                  src="/images/paypal-qr.png"
                  alt="PayPal Donation QR Code"
                  className={styles.qrCode}
                />
                <p className={styles.qrLabel}>Scan to donate</p>
              </div>
              <div className={styles.donationLink}>
                <a
                  href="https://www.paypal.com/donate/?business=D86FX8QV7BPMG&no_recurring=0&currency_code=USD"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.donateButton}
                >
                  Donate via PayPal
                </a>
                <p className={styles.donateNote}>
                  Your support means the world and helps keep this project free
                  for everyone.
                </p>
              </div>
            </div>
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
            <p className={styles.clearDataNote}>
              For more information about how we handle your data, see our{" "}
              <Link href="/legal" className={styles.inlineLink}>
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section className={styles.section}>
            <h2>Repository</h2>
            <p>
              This is open source. Check out the code, submit a PR, or just
              snoop around:
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
              MIT License—use it, fork it, make it better.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Contact</h2>
            <p>
              Got questions? Found a bug? Want to suggest something? Hit me up:
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
                <strong>Feature Requests:</strong> Drop your ideas in{" "}
                <a
                  href="https://github.com/wadehammes/filtermydiscogs/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Discussions
                </a>
                . I'm always down to hear what would make this better.
              </p>
              <p>
                <strong>Bug Reports:</strong> Something broken? Open an{" "}
                <a
                  href="https://github.com/wadehammes/filtermydiscogs/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  issue on GitHub
                </a>
                . The more details, the faster I can fix it.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
