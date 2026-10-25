import { PageFooter } from "src/components/Page/PageFooter.server";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { PublicAuthLayout } from "src/components/PublicAuthLayout/PublicAuthLayout.component";
export default function PublicPlaylistLoadingPage() {
  return (
    <PublicAuthLayout footer={<PageFooter />} omitMainLandmark>
      <div aria-busy="true" aria-live="polite">
        <PageLoader message="Loading playlist..." />
      </div>
    </PublicAuthLayout>
  );
}
