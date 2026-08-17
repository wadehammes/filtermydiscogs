import { describe, expect, it } from "@jest/globals";
import { RELEASE_MODAL_INSTANCE_PARAM } from "src/constants";
import {
  buildPathWithReleaseInstance,
  parseReleaseInstanceFromSearchParams,
} from "src/utils/releaseModalUrl";

describe("releaseModalUrl", () => {
  it("buildPathWithReleaseInstance adds instance while preserving other params", () => {
    const searchParams = new URLSearchParams("auth=success&genre=House");

    expect(
      buildPathWithReleaseInstance({
        pathname: "/releases",
        searchParams,
        instanceId: "12345",
      }),
    ).toBe("/releases?auth=success&genre=House&instance=12345");
  });

  it("buildPathWithReleaseInstance removes instance param when cleared", () => {
    const searchParams = new URLSearchParams("instance=12345&genre=House");

    expect(
      buildPathWithReleaseInstance({
        pathname: "/releases",
        searchParams,
        instanceId: null,
      }),
    ).toBe("/releases?genre=House");
  });

  it("parseReleaseInstanceFromSearchParams reads the instance param", () => {
    const searchParams = new URLSearchParams(
      `${RELEASE_MODAL_INSTANCE_PARAM}=99`,
    );

    expect(parseReleaseInstanceFromSearchParams(searchParams)).toBe("99");
  });
});
