import { FeatureFlagsClientSync } from "src/context/featureFlags.context";
import { getFeatureFlags } from "src/lib/featureFlags.server";

export const FeatureFlagsServerSync = async () => (
  <FeatureFlagsClientSync featureFlags={await getFeatureFlags()} />
);
