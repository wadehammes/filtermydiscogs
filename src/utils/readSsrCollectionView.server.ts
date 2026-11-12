import { cookies } from "next/headers";
import { VIEW_STATE_COOKIE_NAME } from "src/constants/storageKeys";
import type { ViewMode } from "src/types/view.types";
import { parseCollectionViewCookie } from "src/utils/collectionViewModeStorage";

export const readSsrCollectionView = async (): Promise<ViewMode | undefined> =>
  parseCollectionViewCookie(
    (await cookies()).get(VIEW_STATE_COOKIE_NAME)?.value,
  );
