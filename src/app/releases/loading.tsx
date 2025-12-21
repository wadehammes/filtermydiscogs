"use client";

/**
 * Loading UI for the releases page.
 * Shows instantly while the page is loading, improving perceived performance.
 */
export default function ReleasesLoadingPage() {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          animation: "spin 1s linear infinite",
          border: "4px solid var(--gray-200)",
          borderRadius: "50%",
          borderTop: "4px solid var(--primary-600)",
          height: "50px",
          marginBottom: "1rem",
          width: "50px",
        }}
      />
      <p>Loading releases...</p>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
