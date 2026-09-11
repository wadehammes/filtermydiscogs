"use client";

import { useEffect, useRef } from "react";
import { BrowserOnly } from "src/components/BrowserOnly/BrowserOnly.component";
import { handleDonationSuccessReturn } from "src/utils/donationSuccessToast";

const DonationSuccessToastInner = () => {
  const handledRef = useRef(false);

  useEffect(() => {
    handleDonationSuccessReturn(handledRef);

    const handlePageShow = () => {
      handleDonationSuccessReturn(handledRef);
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return null;
};

export const DonationSuccessToast = () => {
  return (
    <BrowserOnly>
      <DonationSuccessToastInner />
    </BrowserOnly>
  );
};
