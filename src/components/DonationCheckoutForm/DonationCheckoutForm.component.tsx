"use client";

import classNames from "classnames";
import Button from "src/components/Button/Button.component";
import {
  DONATION_MAX_DOLLARS,
  DONATION_MIN_DOLLARS,
  DONATION_PRESET_AMOUNTS_CENTS,
  DONATION_STRIPE_CHECKOUT_NOTE,
  type DonationCheckoutReturnTo,
} from "src/constants/donate.constants";
import { useDonationCheckoutForm } from "src/hooks/useDonationCheckoutForm.hook";
import { validatedFieldClass } from "src/utils/validatedFieldClass";
import styles from "./DonationCheckoutForm.module.css";

export type DonationCheckoutFormProps = {
  className?: string;
  customAmountInputId?: string;
  embedded?: boolean;
  returnTo?: DonationCheckoutReturnTo;
};

export const DonationCheckoutForm = ({
  className,
  customAmountInputId = "donation-custom-amount",
  embedded = false,
  returnTo = "about",
}: DonationCheckoutFormProps) => {
  const {
    customAmountDollars,
    errors,
    isCustomDonationSubmitting,
    isSubmitting,
    onDonateSubmit,
    prepareCustomAmount,
    preparePresetAmount,
    register,
    selectedAmountCents,
  } = useDonationCheckoutForm(returnTo);

  return (
    <div
      className={classNames(styles.root, className)}
      data-testid="fmdDonationCheckoutForm"
    >
      <div
        className={classNames(styles.panel, {
          [styles.panelEmbedded]: embedded,
        })}
      >
        <p className={styles.prompt}>Pick an amount:</p>
        <form className={styles.form} onSubmit={onDonateSubmit}>
          <div className={styles.amounts}>
            {DONATION_PRESET_AMOUNTS_CENTS.map((amountCents) => (
              <Button
                key={amountCents}
                type="submit"
                variant="primary"
                size="lg"
                className={styles.donateButton}
                onMouseDown={() => {
                  preparePresetAmount(amountCents);
                }}
                disabled={isSubmitting}
                isLoading={isSubmitting && selectedAmountCents === amountCents}
                loadingText="Redirecting..."
              >
                ${amountCents / 100}
              </Button>
            ))}
          </div>
          <div className={styles.customAmount}>
            <label className={styles.customLabel} htmlFor={customAmountInputId}>
              Or enter a custom amount (USD)
            </label>
            <div className={styles.customControls}>
              <div className={styles.customInputWrap}>
                <span aria-hidden="true" className={styles.currencyPrefix}>
                  $
                </span>
                <input
                  {...register("customAmountDollars")}
                  className={validatedFieldClass(styles.customInput)}
                  data-1p-ignore
                  disabled={isSubmitting}
                  id={customAmountInputId}
                  inputMode="decimal"
                  max={DONATION_MAX_DOLLARS}
                  min={DONATION_MIN_DOLLARS}
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                />
              </div>
              <Button
                type="submit"
                variant="outlinePrimary"
                size="lg"
                className={styles.donateButton}
                onMouseDown={prepareCustomAmount}
                disabled={isSubmitting}
                isLoading={isCustomDonationSubmitting}
                loadingText="Redirecting..."
              >
                Donate
              </Button>
            </div>
            {errors.amountCents && customAmountDollars.trim() !== "" ? (
              <p className={styles.error} role="alert">
                {errors.amountCents.message}
              </p>
            ) : null}
          </div>
        </form>
        <p className={styles.stripeNote}>{DONATION_STRIPE_CHECKOUT_NOTE}</p>
      </div>
    </div>
  );
};
