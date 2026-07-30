import { beforeEach, describe, expect, it } from "@jest/globals";
import { GoogleTagManagerLoaderPageObject } from "src/components/GoogleTagManagerLoader/GoogleTagManagerLoader.po";
import { waitFor } from "test-utils";

let po: GoogleTagManagerLoaderPageObject;

describe("GoogleTagManagerLoader", () => {
  beforeEach(() => {
    document.getElementById("fmd-gtm")?.remove();
    po = new GoogleTagManagerLoaderPageObject();
  });

  it("injects GTM when analytics consent is granted", async () => {
    po.renderGoogleTagManagerLoader("granted");

    await waitFor(() => {
      expect(document.getElementById(po.gtmScriptId)).toBeInTheDocument();
    });

    expect(document.getElementById(po.gtmScriptId)).toHaveAttribute(
      "src",
      expect.stringContaining(po.expectedGtmId),
    );
  });

  it("does not inject GTM when analytics consent is denied", async () => {
    po.renderGoogleTagManagerLoader("denied");

    await waitFor(() => {
      expect(document.getElementById(po.gtmScriptId)).not.toBeInTheDocument();
    });
  });
});
