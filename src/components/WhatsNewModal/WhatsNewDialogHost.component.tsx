"use client";

import { useEffect, useRef, useState } from "react";
import { WhatsNewModal } from "src/components/WhatsNewModal/WhatsNewModal.component";
import { WHATS_NEW_LATEST_VERSION } from "src/constants/whatsNew.constants";
import { useAuth } from "src/context/auth.context";
import { registerWhatsNewDialogOpen } from "src/utils/whatsNewDialogBridge";
import {
  hasUnseenWhatsNewForUser,
  persistWhatsNewLastSeenForUser,
} from "src/utils/whatsNewLastSeen";
import { handleWhatsNewOpenFromQuery } from "src/utils/whatsNewOpenFromQuery";

export const WhatsNewDialogHost = () => {
  const { state: authState } = useAuth();
  const [open, setOpen] = useState(false);
  const queryHandledRef = useRef(false);

  useEffect(() => {
    return registerWhatsNewDialogOpen(() => {
      setOpen(true);
    });
  }, []);

  useEffect(() => {
    const userId = authState.userId;
    const hasUnseenWhatsNew = userId ? hasUnseenWhatsNewForUser(userId) : false;

    const tryOpenFromQuery = () => {
      handleWhatsNewOpenFromQuery(queryHandledRef, {
        userId,
        authResolved: !authState.isCheckingAuth,
        isAuthenticated: authState.isAuthenticated,
        hasUnseenWhatsNew,
        onOpen: () => {
          setOpen(true);
        },
      });
    };

    tryOpenFromQuery();

    window.addEventListener("pageshow", tryOpenFromQuery);

    return () => {
      window.removeEventListener("pageshow", tryOpenFromQuery);
    };
  }, [authState.isAuthenticated, authState.isCheckingAuth, authState.userId]);

  return (
    <WhatsNewModal
      isOpen={open}
      onClose={() => {
        setOpen(false);
        if (authState.userId) {
          persistWhatsNewLastSeenForUser(
            authState.userId,
            WHATS_NEW_LATEST_VERSION,
          );
        }
      }}
    />
  );
};
