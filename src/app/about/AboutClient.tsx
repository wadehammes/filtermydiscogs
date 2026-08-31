"use client";

import classNames from "classnames";
import Image from "next/image";
import Link from "next/link";
import Button from "src/components/Button/Button.component";
import { LOGIN_FEATURES } from "src/components/Login/loginFeatures.constants";
import pageStyles from "src/components/Page/Page.module.css";
import { useAuth } from "src/context/auth.context";
import { useClearAllUserData } from "src/hooks/useClearAllUserData.hook";
import typography from "src/styles/modules/typography.module.css";
import { toast } from "src/utils/toast";
import styles from "./page.module.css";

export function AboutClient() {
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
          "• Delete your saved account preferences (theme, default view, saved views, filter selections, playback settings, and analytics cookie choice)\n" +
          "• Delete product analytics events linked to your account (when analytics was enabled)\n" +
          "• Clear local preferences and cached data on this browser\n\n" +
          "You will need to authorize the app again to use it.",
      )
    ) {
      return;
    }

    try {
      await clearAllUserData();
    } catch (error) {
      console.error("Error clearing data:", error);
      toast.error("Failed to clear all data. Please try again.");
    }
  };

  return (
    <div className={pageStyles.container}>
      <div className={styles.content}>
        <section className={styles.section}>
          <h2>About FilterMyDiscogs</h2>
          <div className={styles.sectionBody}>
            <p>
              Discogs is where your collection lives. FilterMyDiscogs is the
              free app I built to help you dig through it. Search, filter, queue
              tracks and preview them, pack crates, spot trends in your buying
              habits, and more.
            </p>
            <p className={styles.sectionMeta}>
              <Link href="/legal" className={styles.inlineLink}>
                Terms & Privacy
              </Link>
            </p>
          </div>
        </section>

        <section className={classNames(styles.section, styles.featuresSection)}>
          <h2>What You Can Do</h2>
          <div className={styles.featureList}>
            {LOGIN_FEATURES.map((feature) => (
              <article key={feature.title} className={styles.feature}>
                <p className={typography.sectionEyebrow}>{feature.eyebrow}</p>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p
                  className={classNames(
                    typography.bodyText,
                    styles.featureDescription,
                  )}
                >
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className={classNames(styles.section, styles.donationSection)}>
          <h2>Support This Project</h2>
          <p>
            If FilterMyDiscogs has made your collection easier to actually use,
            not just admire, consider chipping in. Every contribution helps keep
            the app free and the roadmap moving.
          </p>
          <div className={styles.donationContent}>
            <div className={styles.donationQR}>
              <Image
                src="/images/paypal-qr.png"
                alt="PayPal Donation QR Code"
                className={styles.qrCode}
                width={200}
                height={200}
                quality={90}
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
          <div className={styles.sectionBody}>
            <p>Want to start fresh? Clear everything out. This button wipes:</p>
            <ul>
              <li>All your auth tokens and session cookies</li>
              <li>
                Every crate you&apos;ve created, including which releases are in
                each crate (deleted from Postgres, gone forever. No takebacks)
              </li>
              <li>
                Your saved account preferences on our server: theme, default
                view (grid or table), your analytics cookie choice, named saved
                views from the Views menu on Releases, filter/sort selections
                when &quot;Remember filter selections&quot; is enabled in
                Settings, and playback settings (auto-play on queue add)
              </li>
              <li>
                Product analytics events linked to your account (when you had
                analytics enabled), such as page views and interaction labels
              </li>
              <li>
                Local preferences on this browser: theme, view mode, filters,
                analytics cookie choice (you will be asked about analytics
                cookies again), in-progress playback (current track and upcoming
                queue), remembered collection size (to load large collections
                faster), a cached copy of your loaded collection in IndexedDB
                (for faster return visits on this device), and similar UI state
              </li>
              <li>
                In-memory caches for the current browser session, including your
                loaded collection
              </li>
              <li>
                Your Discogs collection and saved notes are not deleted. Only
                app-side data here
              </li>
            </ul>
            <p>
              <strong>Heads up:</strong> This logs you out and you&apos;ll need
              to reconnect with Discogs. Crates and saved preferences are
              permanently deleted from our database. Logging out without
              clearing data keeps your crates and preferences—you can sign in
              again later. Useful on a shared computer or when you want a clean
              slate on this app. It is not a way to undo note edits on Discogs.
            </p>
          </div>
          <div className={styles.clearDataFooter}>
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
          </div>
        </section>

        <section className={styles.section}>
          <h2>Repository</h2>
          <div className={styles.repoSectionBody}>
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
              MIT License. Use it, fork it, make it better.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Contact</h2>
          <div className={styles.sectionBody}>
            <p>
              Got questions? Found a bug? Want to suggest something? Hit me up:
            </p>
          </div>
          <div className={styles.contactInfo}>
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:noise@filtermydisco.gs">noise@filtermydisco.gs</a>
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
  );
}
