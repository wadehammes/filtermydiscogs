import { PageFooter } from "src/components/Page/PageFooter.server";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { PublicAuthLayout } from "src/components/PublicAuthLayout/PublicAuthLayout.component";
import { PUBLIC_SHARED_CRATE_MAIN_LABEL } from "src/constants/accessibilityLabels.constants";

export default function PublicCrateLoadingPage() {
  return (
    <PublicAuthLayout footer={<PageFooter />} omitMainLandmark>
      <main
        data-testid="fmdPublicCrate"
        aria-label={PUBLIC_SHARED_CRATE_MAIN_LABEL}
      >
        <PageLoader message="Loading crate..." />
      </main>
    </PublicAuthLayout>
  );
}
