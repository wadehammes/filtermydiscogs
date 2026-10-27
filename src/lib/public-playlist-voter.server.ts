import { randomUUID } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import {
  PUBLIC_PLAYLIST_VOTER_COOKIE_MAX_AGE_SEC,
  PUBLIC_PLAYLIST_VOTER_COOKIE_NAME,
} from "src/constants/playlistTrackVote.constants";

export const buildPlaylistTrackVoterKey = (
  viewerUserId: number | null | undefined,
  anonymousVoterId: string | null | undefined,
): string | null => {
  if (viewerUserId != null) {
    return `user:${viewerUserId}`;
  }

  if (anonymousVoterId?.trim()) {
    return `anon:${anonymousVoterId.trim()}`;
  }

  return null;
};

export const readPublicPlaylistAnonymousVoterId = (
  request: NextRequest,
): string | null =>
  request.cookies.get(PUBLIC_PLAYLIST_VOTER_COOKIE_NAME)?.value?.trim() || null;

const publicPlaylistAnonymousVoterCookieOptions = {
  maxAge: PUBLIC_PLAYLIST_VOTER_COOKIE_MAX_AGE_SEC,
  sameSite: "lax" as const,
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

export const setPublicPlaylistAnonymousVoterCookie = (
  response: NextResponse,
  anonymousVoterId: string,
): void => {
  response.cookies.set(
    PUBLIC_PLAYLIST_VOTER_COOKIE_NAME,
    anonymousVoterId,
    publicPlaylistAnonymousVoterCookieOptions,
  );
};

export const ensurePublicPlaylistAnonymousVoterCookie = (
  response: NextResponse,
  request: NextRequest,
): string => {
  const existing = readPublicPlaylistAnonymousVoterId(request);

  if (existing) {
    return existing;
  }

  const created = randomUUID();
  setPublicPlaylistAnonymousVoterCookie(response, created);

  return created;
};
