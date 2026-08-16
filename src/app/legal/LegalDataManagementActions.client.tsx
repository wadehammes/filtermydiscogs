"use client";

import { toast } from "sonner";
import Button from "src/components/Button/Button.component";
import { useAuth } from "src/context/auth.context";
import { useClearAllUserData } from "src/hooks/useClearAllUserData.hook";
import styles from "./page.module.css";

export function LegalDataManagementActions() {
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
          "• Delete your saved account preferences (theme, default view, filter selections, and analytics cookie choice)\n" +
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
    <>
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
    </>
  );
}
