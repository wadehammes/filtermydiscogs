"use client";

import { useEffect, useRef } from "react";
import { handleDonationSuccessReturn } from "src/utils/donationSuccessToast";

export const DonationSuccessToast = () => {
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
