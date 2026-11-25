import type { ComponentType } from "react";
import { AuthCheckingToast } from "src/components/AuthCheckingToast/AuthCheckingToast.component";
import { CollectionLoadingToast } from "src/components/CollectionLoadingToast/CollectionLoadingToast.component";
import { DeploymentUpdateToast } from "src/components/DeploymentUpdateToast/DeploymentUpdateToast.component";
import { DiscogsOutageToast } from "src/components/DiscogsOutageToast/DiscogsOutageToast.component";
import { DonationSuccessToast } from "src/components/DonationSuccessToast/DonationSuccessToast.component";
import type { RegisteredToastHostId } from "src/components/ToastManager/toastHostIds.constants";

export const toastHostRegistry = {
  authChecking: AuthCheckingToast,
  collectionLoading: CollectionLoadingToast,
  deploymentUpdate: DeploymentUpdateToast,
  discogsOutage: DiscogsOutageToast,
  donationSuccess: DonationSuccessToast,
} satisfies Record<RegisteredToastHostId, ComponentType>;

export const ToastHost = ({ hostId }: { hostId: RegisteredToastHostId }) => {
  const Component = toastHostRegistry[hostId];
  return <Component />;
};
