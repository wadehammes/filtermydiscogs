"use client";

import { useEffect, useState } from "react";
import styles from "./BackToTop.module.css";

const SCROLL_THRESHOLD = 400; // Show button after scrolling 400px

export const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrollY > SCROLL_THRESHOLD);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`${styles.backToTop} ${isVisible ? styles.visible : ""}`}
      aria-label="Back to top"
      title="Back to top"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.icon}
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
      <span className={styles.label}>Back to top</span>
    </button>
  );
};
