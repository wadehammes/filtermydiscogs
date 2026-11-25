"use client";

import { memo } from "react";
import { EmailAccountCaptureToast } from "src/components/EmailAccountCaptureToast/EmailAccountCaptureToast.component";
import { SupportProjectToast } from "src/components/SupportProjectToast/SupportProjectToast.component";

const PromotionalToastHostsInner = () => {
  return (
    <>
      <SupportProjectToast />
      <EmailAccountCaptureToast />
    </>
  );
};

export const PromotionalToastHosts = memo(PromotionalToastHostsInner);
