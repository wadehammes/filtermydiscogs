import { BasePageObject } from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import { AdminYoutubeEmbedTestPanel } from "./AdminYoutubeEmbedTestPanel.component";

export class AdminYoutubeEmbedTestPanelPageObject extends BasePageObject {
  testId = "fmdAdminYoutubeEmbedTestPanel";

  renderPanel() {
    return render(<AdminYoutubeEmbedTestPanel />);
  }
}
