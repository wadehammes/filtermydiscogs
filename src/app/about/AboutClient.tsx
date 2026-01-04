"use client";

import Link from "next/link";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { useAuth } from "src/context/auth.context";
import Logo from "src/styles/icons/fmd-logo.svg";
import styles from "./page.module.css";

export function AboutClient() {
  const { state: authState } = useAuth();
  const isAuthenticated = authState.isAuthenticated;

  return (
    <>
      {isAuthenticated ? (
        <StickyHeaderBar
          allReleasesLoaded={true}
          hideCrate={true}
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
