import { api } from "src/api/urls";
import {
  TrackYoutubeOverrideDialog,
  type TrackYoutubeOverrideTarget,
} from "src/components/TrackYoutubeOverrideDialog/TrackYoutubeOverrideDialog.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

jest.mock("src/api/urls", () => ({
  api: {
    fetchYoutubeOembed: jest.fn(),
    saveTrackYoutubeOverride: jest.fn(),
  },
}));

const mockApi = jest.mocked(api);
const apiError = new Error("save failed");

export type TrackYoutubeOverrideDialogRenderProps = {
  open?: boolean;
  target: TrackYoutubeOverrideTarget;
  onClose?: () => void;
  onSaved?: (youtubeVideoId: string | null) => void;
};

export class TrackYoutubeOverrideDialogPageObject extends BasePageObject {
  public testId = "fmdTrackYoutubeOverrideDialog";
  public mockFetchYoutubeOembed = mockApi.fetchYoutubeOembed;
  public mockSaveTrackYoutubeOverride = mockApi.saveTrackYoutubeOverride;

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks(): void {
    jest.clearAllMocks();
    mockApiResponse(
      true,
      this.mockSaveTrackYoutubeOverride,
      { ok: true },
      apiError,
    );
    this.mockFetchYoutubeOembed.mockResolvedValue({
      title: "Never Gonna Give You Up",
      authorName: "Rick Astley",
    });
  }

  renderTrackYoutubeOverrideDialog(
    overrides: TrackYoutubeOverrideDialogRenderProps,
  ): RenderResult {
    const {
      open = true,
      onClose = () => undefined,
      onSaved,
      target,
    } = overrides;

    return render(
      <TrackYoutubeOverrideDialog
        open={open}
        target={target}
        onClose={onClose}
        {...(onSaved ? { onSaved } : {})}
      />,
    );
  }
}
