import { describe, expect, it } from "@jest/globals";
import { publicPlaylistInfoFactory } from "src/tests/factories/PublicPlaylistInfo.factory";
import { publicPlaylistResponseFactory } from "src/tests/factories/PublicPlaylistResponse.factory";
import {
  resolvePublicPlaylistViewerIsOwner,
  shouldShowPublicPlaylistTrackVotes,
} from "src/utils/publicPlaylistViewerAccess";

const authChecking = {
  isCheckingAuth: true,
  isAuthenticated: false,
  username: null,
};

const authGuest = {
  isCheckingAuth: false,
  isAuthenticated: false,
  username: null,
};

const authOwner = {
  isCheckingAuth: false,
  isAuthenticated: true,
  username: "dj-crate",
};

const authOtherUser = {
  isCheckingAuth: false,
  isAuthenticated: true,
  username: "other-collector",
};

describe("publicPlaylistViewerAccess", () => {
  it("when the API marks the viewer as owner, resolvePublicPlaylistViewerIsOwner returns true", () => {
    const response = publicPlaylistResponseFactory.build({
      viewerIsOwner: true,
    });

    expect(resolvePublicPlaylistViewerIsOwner(response, authGuest)).toBe(true);
  });

  it("when the API marks the viewer as not owner, resolvePublicPlaylistViewerIsOwner returns false", () => {
    const response = publicPlaylistResponseFactory.build({
      viewerIsOwner: false,
    });

    expect(resolvePublicPlaylistViewerIsOwner(response, authOwner)).toBe(false);
  });

  it("when auth is still checking, resolvePublicPlaylistViewerIsOwner only assumes owner when the API or usernames say so", () => {
    const response = publicPlaylistResponseFactory.build();

    expect(resolvePublicPlaylistViewerIsOwner(response, authChecking)).toBe(
      false,
    );

    expect(
      resolvePublicPlaylistViewerIsOwner(
        publicPlaylistResponseFactory.build({ viewerIsOwner: true }),
        authChecking,
      ),
    ).toBe(true);

    expect(
      resolvePublicPlaylistViewerIsOwner(
        publicPlaylistResponseFactory.build({
          playlist: publicPlaylistInfoFactory.build({ username: "dj-crate" }),
        }),
        { isCheckingAuth: true, isAuthenticated: true, username: "dj-crate" },
      ),
    ).toBe(true);
  });

  it("when usernames match before hydration, resolvePublicPlaylistViewerIsOwner returns true for the owner", () => {
    const response = publicPlaylistResponseFactory.build({
      playlist: publicPlaylistInfoFactory.build({
        username: "dj-crate",
      }),
    });

    expect(resolvePublicPlaylistViewerIsOwner(response, authOwner)).toBe(true);
  });

  it("when usernames differ before hydration, resolvePublicPlaylistViewerIsOwner returns false for a signed-in visitor", () => {
    const response = publicPlaylistResponseFactory.build({
      playlist: publicPlaylistInfoFactory.build({
        username: "dj-crate",
      }),
    });

    expect(resolvePublicPlaylistViewerIsOwner(response, authOtherUser)).toBe(
      false,
    );
  });

  it("when signed in without a playlist username, resolvePublicPlaylistViewerIsOwner waits for API ownership", () => {
    const response = publicPlaylistResponseFactory.build({
      playlist: publicPlaylistInfoFactory.build({
        username: null,
      }),
    });

    expect(resolvePublicPlaylistViewerIsOwner(response, authOwner)).toBe(true);
  });

  it("when auth is still checking, shouldShowPublicPlaylistTrackVotes keeps guest vote UI stable", () => {
    const response = publicPlaylistResponseFactory.build();

    expect(shouldShowPublicPlaylistTrackVotes(response, authChecking)).toBe(
      true,
    );
    expect(
      shouldShowPublicPlaylistTrackVotes(
        publicPlaylistResponseFactory.build({ viewerIsOwner: true }),
        authChecking,
      ),
    ).toBe(false);
    expect(shouldShowPublicPlaylistTrackVotes(response, authGuest)).toBe(true);
  });

  it("shouldShowPublicPlaylistTrackVotes hides votes for owners and shows votes for guests", () => {
    const ownerResponse = publicPlaylistResponseFactory.build({
      viewerIsOwner: true,
    });
    const guestResponse = publicPlaylistResponseFactory.build({
      viewerIsOwner: false,
    });

    expect(shouldShowPublicPlaylistTrackVotes(ownerResponse, authGuest)).toBe(
      false,
    );
    expect(shouldShowPublicPlaylistTrackVotes(guestResponse, authGuest)).toBe(
      true,
    );
  });

  it("shouldShowPublicPlaylistTrackVotes shows votes for a signed-in visitor when usernames differ before hydration", () => {
    const response = publicPlaylistResponseFactory.build({
      playlist: publicPlaylistInfoFactory.build({
        username: "dj-crate",
      }),
    });

    expect(shouldShowPublicPlaylistTrackVotes(response, authOtherUser)).toBe(
      true,
    );
  });
});
