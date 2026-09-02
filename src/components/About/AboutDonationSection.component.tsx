"use client";

import classNames from "classnames";
import Button from "src/components/Button/Button.component";
import {
  DONATION_MAX_DOLLARS,
  DONATION_MIN_DOLLARS,
  DONATION_PRESET_AMOUNTS_CENTS,
} from "src/constants/donate.constants";
import { useAboutDonationForm } from "src/hooks/useAboutDonationForm.hook";
import typography from "src/styles/modules/typography.module.css";
import { validatedFieldClass } from "src/utils/validatedFieldClass";
import styles from "./About.module.css";

export const AboutDonationSection = () => {
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
  } = useAboutDonationForm();

  return (
    <section
      id="support"
      className={classNames(
        styles.tile,
        styles.tileSupport,
        styles.donationSection,
      )}
      aria-labelledby="about-support"
    >
      <div className={styles.donationCopy}>
        <p
          className={classNames(
            typography.sectionEyebrow,
            styles.donationEyebrow,
          )}
        >
          Support
        </p>
        <h2
          id="about-support"
          className={classNames(styles.tileHeading, styles.donationHeading)}
        >
          Keep this project free
        </h2>
        <p className={styles.tileBody}>
          If FilterMyDiscogs has made your collection easier to actually use,
          consider chipping in. Every contribution helps keep the app free and
          the roadmap moving.
        </p>
      </div>

      <div className={styles.donationPanel}>
        <p className={styles.donationPrompt}>Pick an amount:</p>
        <form className={styles.donationForm} onSubmit={onDonateSubmit}>
          <div className={styles.donationAmounts}>
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
          <div className={styles.donationCustomAmount}>
            <label
              className={styles.donationCustomLabel}
              htmlFor="donation-custom-amount"
            >
              Or enter a custom amount (USD)
            </label>
            <div className={styles.donationCustomControls}>
              <div className={styles.donationCustomInputWrap}>
                <span
                  aria-hidden="true"
                  className={styles.donationCurrencyPrefix}
                >
                  $
                </span>
                <input
                  {...register("customAmountDollars")}
                  className={validatedFieldClass(styles.donationCustomInput)}
                  disabled={isSubmitting}
                  id="donation-custom-amount"
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
            {errors.amountCents && customAmountDollars.trim() !== "" && (
              <p className={styles.donationError} role="alert">
                {errors.amountCents.message}
              </p>
            )}
          </div>
        </form>
        <p className={styles.donateNote}>Secure checkout powered by Stripe.</p>
      </div>
    </section>
  );
};
