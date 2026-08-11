import { describe, expect, it } from "@jest/globals";
import { toast } from "sonner";
import {
  COLLECTION_LOADING_TOAST_ID,
  showCollectionLoadingToast,
} from "src/components/CollectionLoadingToast/collectionLoadingToast";

jest.mock("sonner", () => ({
  toast: {
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

const mockToastLoading = jest.mocked(toast.loading);

describe("showCollectionLoadingToast", () => {
  it("uses the app spinner as the toast icon", () => {
    showCollectionLoadingToast(900);

    expect(mockToastLoading).toHaveBeenCalledWith(
      "Loading releases… 900 loaded",
      expect.objectContaining({
        id: COLLECTION_LOADING_TOAST_ID,
        duration: Number.POSITIVE_INFINITY,
        icon: expect.objectContaining({ props: expect.any(Object) }),
      }),
    );
  });
});
