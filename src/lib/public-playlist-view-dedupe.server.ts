import type { NextRequest, NextResponse } from "next/server";
import { PUBLIC_PLAYLIST_VIEW_DEDUPE_MAX_AGE_SEC } from "src/constants/publicPlaylistEngagement.constants";

export const publicPlaylistViewCookieName = (playlistId: string): string =>
  `fmd_plv_${playlistId}`;

export const hasPublicPlaylistViewCookie = (
  request: NextRequest,
  playlistId: string,
): boolean =>
  request.cookies.get(publicPlaylistViewCookieName(playlistId))?.value === "1";

export const setPublicPlaylistViewRecordedCookie = (
  response: NextResponse,
  playlistId: string,
): void => {
  response.cookies.set(publicPlaylistViewCookieName(playlistId), "1", {
    maxAge: PUBLIC_PLAYLIST_VIEW_DEDUPE_MAX_AGE_SEC,
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
};
