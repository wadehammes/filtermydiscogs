| **3. Structure** | **One** top-level **`describe`** per spec file for hook specs (**`src/hooks/*.hook.spec.ts(x)`**, colocated **`src/components/**/use*.hook.spec.ts`**, and **`src/components/ToastManager/*.hook.spec.ts(x)`** — e.g. [`useToastPresentationGate.hook.spec.tsx`](../../src/components/ToastManager/useToastPresentationGate.hook.spec.tsx)) and for colocated util specs that back extracted hook logic (**`src/utils/*.spec.ts`**, e.g. [`releasePlaybackEmbedLoadOwnership.spec.ts`](../../src/utils/releasePlaybackEmbedLoadOwnership.spec.ts), [`releasePlaybackActivePresentation.spec.ts`](../../src/utils/releasePlaybackActivePresentation.spec.ts) (**`resolveCommittedSessionEmbedVideoId`**, **`resolveNeedsPlaybackVideoSwitch`**), [`releasePlaybackPendingResolution.spec.ts`](../../src/utils/releasePlaybackPendingResolution.spec.ts), [`releasePlaybackTrackVideoMatching.spec.ts`](../../src/utils/releasePlaybackTrackVideoMatching.spec.ts)). Provider integration uses the same rule across themed **`releasePlayback.context.*.spec.tsx`** files (one flat **`describe`** each — see [playback-embed-invariants.md](playback-embed-invariants.md) theme map), not a single monolith spec. **Do not** nest **`describe("when …")`** / **`describe("edge cases")`**—fold those into **`it("when …, …")`** or **`it("myFn …")`** names and module-level helpers (e.g. **`renderVideoPanelState`** + **`it.each`** in [`useReleaseMiniPlayerVideoPanelState.hook.spec.ts`](../../src/components/ReleaseMiniPlayer/useReleaseMiniPlayerVideoPanelState.hook.spec.tsx)). |
| **4. Mocks**     | Mock **`src/api/urls`** (or route-level fetch helpers), not **`src/hooks/queries/*`**. Prefer real pure utils (e.g. [`similarReleaseQueue`](../../src/utils/similarReleaseQueue.ts)) with API stubs over mocking the util the hook imports. When the harness mounts **`CrateProvider`** (default **`TestProviders`** with **`testAuthenticatedAuthState`** / seeded **`authInitialState`**) and the spec mocks **`src/api/urls`**, call **[`setupDefaultCrateApiMocks`](../../src/tests/mocks/setupDefaultCrateApiMocks.ts)** in PO **`setupMocks()`** or hook **`beforeEach`** even if the test only asserts toasts, settings copy, or unrelated **`api.*`**—otherwise **`useCratesQuery`** / **`useCrateQuery`** run and Jest logs **`Query data cannot be undefined`** for **`["crates", userId]`**. |
| **5. Green**     | Minimal hook change; refactor with suite still green.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

**Structure — do not nest `describe`:**

```ts
// ❌ Breaks handbook rules
describe("useReleasePlaybackSessionPersistence", () => {
  describe("restore", () => {
    it("…", () => { … });
  });
});

// ✅ One block; scenario in the test name
describe("useReleasePlaybackSessionPersistence", () => {
  it("restores upcoming queue from localStorage after collection finishes loading", () => { … });
});
```

**Data — use factories:**

```ts
// ❌ Inline domain shape
const track = { position: "A1", title: "Track", type_: "track" };

// ✅ Factory + literal only where asserted
const track = discogsTrackFactory.build({ title: "Night Drive" });
```

