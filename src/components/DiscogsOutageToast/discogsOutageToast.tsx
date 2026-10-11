"use client";

import { DiscogsExternalLink } from "src/components/DiscogsExternalLink/DiscogsExternalLink.component";
import { showPersistentQueueAreaErrorToast } from "src/utils/playbackQueueToast";
import { toast } from "src/utils/toast";

export const DISCOGS_OUTAGE_TOAST_ID = "discogs-outage";

const DISCOGS_STATUS_URL = "https://status.discogs.com";

export const showDiscogsOutageToast = () => {
  showPersistentQueueAreaErrorToast({
    id: DISCOGS_OUTAGE_TOAST_ID,
    title: "Discogs is having trouble right now",
    description: (
      <>
        Your collection will load when it's back.{" "}
        <DiscogsExternalLink
          href={DISCOGS_STATUS_URL}
          variant="text"
          label="Discogs status"
        />
      </>
    ),
  });
};

export const dismissDiscogsOutageToast = () => {
  toast.dismiss(DISCOGS_OUTAGE_TOAST_ID);
};
