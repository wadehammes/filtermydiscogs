"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoginBottomCta } from "src/components/LoginBottomCta/LoginBottomCta.component";
import { LoginFeatureRow } from "src/components/LoginFeatureRow/LoginFeatureRow.component";
import { LoginIntro } from "src/components/LoginIntro/LoginIntro.component";
import { useAuth } from "src/context/auth.context";
import styles from "./Login.module.css";
import { LOGIN_FEATURES } from "./loginFeatures.constants";

export const Login = () => {
  const { state, login } = useAuth();
  const { isLoading, error, isAuthenticated, reconnectUsername } = state;
  const router = useRouter();

  const connect = () => login();
  const connectDifferentAccount = () => login({ force: true });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/releases");
    }
  }, [isAuthenticated, router]);

  return (
    <div className={styles.landing} data-testid="fmdLogin">
      <LoginIntro
        error={error}
        isLoading={isLoading}
        reconnectUsername={reconnectUsername}
        onConnect={connect}
        onConnectDifferentAccount={connectDifferentAccount}
      />

      <div className={styles.features}>
        {LOGIN_FEATURES.map((feature, index) => (
          <LoginFeatureRow
            key={feature.title}
            feature={feature}
            index={index}
          />
        ))}
      </div>

      <LoginBottomCta
        isLoading={isLoading}
        reconnectUsername={reconnectUsername}
        onConnect={connect}
        onConnectDifferentAccount={connectDifferentAccount}
      />
    </div>
  );
};
