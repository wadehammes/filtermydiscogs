import { describe, expect, it } from "@jest/globals";
import { configureBrowserZod } from "src/lib/validation/configureBrowserZod.client";
import { config, z } from "zod";

describe("configureBrowserZod", () => {
  it("when Function is blocked, a schema still parses", () => {
    const previous = config().jitless;
    configureBrowserZod();
    expect(config().jitless).toBe(true);

    const OriginalFunction = globalThis.Function;
    globalThis.Function = (() => {
      throw new Error("CSP eval blocked");
    }) as unknown as typeof Function;

    let parsed: { name: string };
    try {
      parsed = z.object({ name: z.string() }).parse({ name: "Vibes" });
    } finally {
      globalThis.Function = OriginalFunction;
      config({ jitless: previous });
    }

    expect(parsed).toEqual({ name: "Vibes" });
  });
});
