import classNames from "classnames";
import { LoginFeatureVisual } from "src/components/Login/LoginFeatureVisual.component";
import type { LoginFeature } from "src/components/Login/loginFeatures.constants";
import typography from "src/styles/modules/typography.module.css";
import styles from "./LoginFeatureRow.module.css";

type LoginFeatureRowProps = {
  feature: LoginFeature;
  index: number;
};

export const LoginFeatureRow = ({ feature, index }: LoginFeatureRowProps) => (
  <section
    className={classNames(styles.featureRow, {
      [styles.featureRowReverse]: index % 2 === 1,
    })}
    aria-labelledby={`feature-${index}`}
  >
    <div className={styles.featureCopy}>
      <p className={typography.sectionEyebrow}>{feature.eyebrow}</p>
      <h2 id={`feature-${index}`} className={typography.sectionHeading}>
        {feature.title}
      </h2>
      <p className={typography.bodyText}>{feature.description}</p>
    </div>
    <LoginFeatureVisual
      className={styles.featureVisual}
      imageBase={feature.imageBase}
      alt={feature.imageAlt}
      themeIndependent={feature.themeIndependent}
    />
  </section>
);
