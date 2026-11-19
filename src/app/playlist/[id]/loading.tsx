import { PageFooter } from "src/components/Page/PageFooter.server";
import { PublicAuthLayout } from "src/components/PublicAuthLayout/PublicAuthLayout.component";
import { PublicPlaylistRouteLoading } from "src/components/PublicPlaylist/PublicPlaylist.component";

export default function PublicPlaylistLoadingPage() {
  return (
    <PublicAuthLayout footer={<PageFooter />} omitMainLandmark>
      <PublicPlaylistRouteLoading />
    </PublicAuthLayout>
  );
}
