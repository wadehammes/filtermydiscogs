"use client";

import { useQueryClient } from "@tanstack/react-query";
import Button from "src/components/Button/Button.component";
import { DiscogsExternalLink } from "src/components/DiscogsExternalLink/DiscogsExternalLink.component";
import { useAuth } from "src/context/auth.context";
import { DiscogsCollectionQueryKeys } from "src/hooks/queries/querykeys.constants";
import { getCollectionLoadErrorContent } from "src/utils/collectionLoadError";
import styles from "./ReleasesClient.module.css";

type CollectionLoadErrorPanelProps = {
  error: unknown;
};

export const CollectionLoadErrorPanel = ({
  error,
}: CollectionLoadErrorPanelProps) => {
  const queryClient = useQueryClient();
  const {
    state: { username },
  } = useAuth();
  const content = getCollectionLoadErrorContent(error);

  const handleRetry = () => {
    const normalizedUsername = username?.trim();

    if (!normalizedUsername) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: DiscogsCollectionQueryKeys.byUsername(normalizedUsername),
    });
  };

  return (
    <div className={styles.errorContainer} data-testid="fmdCollectionLoadError">
      <h2>{content.title}</h2>
      <p className={styles.errorMessage}>
        {content.message}
        {content.showDiscogsStatusLink ? (
          <>
            {" "}
            <DiscogsExternalLink
              href={content.statusUrl}
              variant="text"
              label="Discogs status"
            />
          </>
        ) : null}
      </p>
      <div className={styles.errorActions}>
        <Button type="button" variant="secondary" onPress={handleRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
};
