import { beforeEach, describe, expect, it } from "@jest/globals";
import { MosaicExportMenuSubmenuPageObject } from "src/components/MosaicExportMenu/MosaicExportMenuSubmenu.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { screen } from "test-utils";

let po: MosaicExportMenuSubmenuPageObject;

describe("MosaicExportMenuSubmenu", () => {
  beforeEach(() => {
    po = new MosaicExportMenuSubmenuPageObject();
  });

  it("when there are no releases, disables the Generate mosaic submenu trigger", () => {
    po.renderMosaicExportMenuSubmenuWithReleases([]);

    expect(
      screen.getByRole("menuitem", { name: "Generate mosaic" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("when releases exist, exposes an enabled Generate mosaic submenu trigger", () => {
    po.renderMosaicExportMenuSubmenuWithReleases([releaseFactory.build()]);

    const submenuTrigger = screen.getByRole("menuitem", {
      name: "Generate mosaic",
    });

    expect(submenuTrigger).not.toHaveAttribute("aria-disabled", "true");
  });
});
