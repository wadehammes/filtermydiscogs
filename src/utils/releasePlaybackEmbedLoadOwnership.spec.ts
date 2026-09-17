import { describe, expect, it } from "@jest/globals";
import {
  shouldProviderImperativeLoadEmbed,
  shouldRegisterIframeImperativeLoadEmbed,
} from "src/utils/releasePlaybackEmbedLoadOwnership";

describe("releasePlaybackEmbedLoadOwnership", () => {
  it("shouldProviderImperativeLoadEmbed loads via provider postMessage when no persistent iframe is registered yet", () => {
    expect(
      shouldProviderImperativeLoadEmbed({
        isPlaybackEmbedMounted: false,
        hasRegisteredPlaybackIframe: false,
      }),
    ).toBe(true);
  });

  it("shouldProviderImperativeLoadEmbed does not load via provider when the persistent iframe is mounted", () => {
    expect(
      shouldProviderImperativeLoadEmbed({
        isPlaybackEmbedMounted: true,
        hasRegisteredPlaybackIframe: true,
      }),
    ).toBe(false);
  });

  it("shouldProviderImperativeLoadEmbed does not load via provider when only the iframe ref is registered", () => {
    expect(
      shouldProviderImperativeLoadEmbed({
        isPlaybackEmbedMounted: false,
        hasRegisteredPlaybackIframe: true,
      }),
    ).toBe(false);
  });

  it("shouldRegisterIframeImperativeLoadEmbed loads when the iframe element is swapped while a track switch is pending", () => {
    expect(
      shouldRegisterIframeImperativeLoadEmbed({
        isIframeElementChange: true,
        isRebindAfterUnregister: false,
        pendingPlayFromGesture: true,
        embedVideoId: "abc12345678",
      }),
    ).toBe(true);
  });

  it("shouldRegisterIframeImperativeLoadEmbed loads when rebinding after unregister while a track switch is pending", () => {
    expect(
      shouldRegisterIframeImperativeLoadEmbed({
        isIframeElementChange: false,
        isRebindAfterUnregister: true,
        pendingPlayFromGesture: true,
        embedVideoId: "abc12345678",
      }),
    ).toBe(true);
  });

  it("shouldRegisterIframeImperativeLoadEmbed does not load on initial registration before the embed was ever mounted", () => {
    expect(
      shouldRegisterIframeImperativeLoadEmbed({
        isIframeElementChange: false,
        isRebindAfterUnregister: false,
        pendingPlayFromGesture: true,
        embedVideoId: "abc12345678",
      }),
    ).toBe(false);
  });

  it("shouldRegisterIframeImperativeLoadEmbed does not load when there is no target embed video id", () => {
    expect(
      shouldRegisterIframeImperativeLoadEmbed({
        isIframeElementChange: true,
        isRebindAfterUnregister: false,
        pendingPlayFromGesture: true,
        embedVideoId: null,
      }),
    ).toBe(false);
  });
});
