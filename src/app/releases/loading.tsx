import { ReleasesPageLoading } from "src/components/ReleasesClient/ReleasesPageLoading.component";
import { readSsrCollectionView } from "src/utils/readSsrCollectionView.server";

export default async function ReleasesLoadingPage() {
  const ssrView = await readSsrCollectionView();

  return ssrView !== undefined ? (
    <ReleasesPageLoading ssrView={ssrView} />
  ) : (
    <ReleasesPageLoading />
  );
}
