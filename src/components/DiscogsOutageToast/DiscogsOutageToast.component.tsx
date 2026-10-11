"use client";

import { useEffect, useRef } from "react";
import {
  dismissDiscogsOutageToast,
  showDiscogsOutageToast,
} from "src/components/DiscogsOutageToast/discogsOutageToast";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";

export const DiscogsOutageToast = () => {
  const {
    state: { discogsUnavailable },
  } = useAuth();
  const {
    state: { discogsUpstreamOutage },
  } = useCollectionContext();
  const showOutage = discogsUnavailable || discogsUpstreamOutage;
  const prevShowOutageRef = useRef(false);

  useEffect(() => {
    if (showOutage) {
      showDiscogsOutageToast();
    } else if (prevShowOutageRef.current) {
      dismissDiscogsOutageToast();
    }

    prevShowOutageRef.current = showOutage;
  }, [showOutage]);

  return null;
};
