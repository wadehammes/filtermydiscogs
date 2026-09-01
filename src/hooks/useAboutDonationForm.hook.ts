"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { createDonateCheckoutSession } from "src/api/endpoints/donate";
import {
  DONATION_PRESET_AMOUNTS_CENTS,
  DONATION_SUCCESS_QUERY_PARAM,
  DONATION_SUCCESS_QUERY_VALUE,
  isDonationPresetAmount,
} from "src/constants/donate.constants";
import {
  type DonateCheckoutFormValues,
  donateCheckoutFormSchema,
  parseCustomDonationDollarsToCents,
} from "src/lib/validation/donate.schemas";
import { toast } from "src/utils/toast";

export const useAboutDonationForm = () => {
  const {
    control,
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DonateCheckoutFormValues>({
    resolver: zodResolver(donateCheckoutFormSchema),
    defaultValues: {
      amountCents: DONATION_PRESET_AMOUNTS_CENTS[0],
      customAmountDollars: "",
    },
  });
  const selectedAmountCents = useWatch({ control, name: "amountCents" });
  const customAmountDollars = useWatch({
    control,
    name: "customAmountDollars",
  });
  const isCustomDonationSubmitting =
    isSubmitting && !isDonationPresetAmount(selectedAmountCents);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        reset();
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [reset]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (
      params.get(DONATION_SUCCESS_QUERY_PARAM) !== DONATION_SUCCESS_QUERY_VALUE
    ) {
      return;
    }

    toast.success("Thank you for your support!");

    params.delete(DONATION_SUCCESS_QUERY_PARAM);
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  const onDonateSubmit = handleSubmit(async ({ amountCents }) => {
    try {
      const { url } = await createDonateCheckoutSession(amountCents);
      window.location.assign(url);
    } catch (error) {
      console.error("Error starting donation checkout:", error);
      toast.error("Could not start checkout. Please try again.");
      reset();
    }
  });

  const preparePresetAmount = (amountCents: number) => {
    setValue("customAmountDollars", "");
    setValue("amountCents", amountCents, { shouldValidate: true });
  };

  const prepareCustomAmount = () => {
    setValue(
      "amountCents",
      parseCustomDonationDollarsToCents(getValues("customAmountDollars")),
      { shouldValidate: true },
    );
  };

  return {
    customAmountDollars,
    errors,
    isCustomDonationSubmitting,
    isSubmitting,
    onDonateSubmit,
    prepareCustomAmount,
    preparePresetAmount,
    register,
    selectedAmountCents,
  };
};
