"use client";

import { AppToaster } from "src/components/AppToaster/AppToaster.component";
import { PromotionalToastHosts } from "src/components/ToastManager/PromotionalToastHosts.component";
import {
  SESSION_TOAST_HOSTS_BY_PRIORITY,
  STANDALONE_ROOT_TOAST_HOSTS,
} from "src/components/ToastManager/toastHostIds.constants";
import { ToastHost } from "src/components/ToastManager/toastHostRegistry";

export const SessionToastManager = () => {
  return (
    <>
      {SESSION_TOAST_HOSTS_BY_PRIORITY.map((hostId) => (
        <ToastHost key={hostId} hostId={hostId} />
      ))}
    </>
  );
};

export const RootToastManager = () => {
  return (
    <>
      <AppToaster />
      <PromotionalToastHosts />
      {STANDALONE_ROOT_TOAST_HOSTS.map((hostId) => (
        <ToastHost key={hostId} hostId={hostId} />
      ))}
    </>
  );
};
