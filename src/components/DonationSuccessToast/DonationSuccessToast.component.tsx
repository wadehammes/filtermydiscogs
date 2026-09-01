"use client";

import { useEffect, useRef } from "react";
import { useMounted } from "src/hooks/useMounted.hook";
import { handleDonationSuccessReturn } from "src/utils/donationSuccessToast";

export const DonationSuccessToast = () => {
  const mounted = useMounted();
  const handledRef = useRef(false);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    handleDonationSuccessReturn(handledRef);

    const handlePageShow = () => {
      handleDonationSuccessReturn(handledRef);
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [mounted]);

  return null;
};
