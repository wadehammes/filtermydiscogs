import type {
  TrackDjMetadata,
  TrackMetadataLookup,
} from "src/types/trackMetadata.types";

const GETSONGBPM_BASE_URL = "https://api.getsongbpm.com";
const MAX_LOOKUPS_PER_REQUEST = 20;

type GetSongBpmSearchEntry = {
  id?: string;
  title?: string;
  name?: string;
  tempo?: string | number | null;
  key?: string | null;
};

type GetSongBpmSearchResponse = {
  search?: GetSongBpmSearchEntry[] | { error?: string };
};

type GetSongBpmSongResponse = {
  song?: GetSongBpmSearchEntry & {
    tempo?: string | number | null;
    key?: string | null;
  };
};

const normalizeMatchText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const parseTempo = (
  value: string | number | null | undefined,
): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return Math.round(parsed);
    }
  }

  return null;
};

const parseKey = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const toTrackDjMetadata = (
  entry: GetSongBpmSearchEntry | undefined,
): TrackDjMetadata | null => {
  if (!entry) {
    return null;
  }

  const bpm = parseTempo(entry.tempo);
  const key = parseKey(entry.key);

  if (bpm === null && key === null) {
    return null;
  }

  return { bpm, key };
};

const getApiKey = (): string | null => {
  const apiKey = process.env.GETSONGBPM_API_KEY?.trim();
  return apiKey ? apiKey : null;
};

const buildSearchUrl = (lookup: TrackMetadataLookup): string => {
  const apiKey = getApiKey();
  const params = new URLSearchParams({
    api_key: apiKey ?? "",
    type: "both",
    lookup: `song:${lookup.title} artist:${lookup.artist}`,
    limit: "10",
  });

  return `${GETSONGBPM_BASE_URL}/search/?${params.toString()}`;
};

const buildSongUrl = (songId: string): string => {
  const apiKey = getApiKey();
  const params = new URLSearchParams({
    api_key: apiKey ?? "",
    id: songId,
  });

  return `${GETSONGBPM_BASE_URL}/song/?${params.toString()}`;
};

const scoreSearchEntry = (
  entry: GetSongBpmSearchEntry,
  lookup: TrackMetadataLookup,
): number => {
  const targetTitle = normalizeMatchText(lookup.title);
  const targetArtist = normalizeMatchText(lookup.artist);
  const entryTitle = normalizeMatchText(entry.title ?? "");
  const entryArtist = normalizeMatchText(entry.name ?? "");

  let score = 0;

  if (entryTitle === targetTitle) {
    score += 4;
  } else if (
    entryTitle.includes(targetTitle) ||
    targetTitle.includes(entryTitle)
  ) {
    score += 2;
  }

  if (entryArtist === targetArtist) {
    score += 4;
  } else if (
    entryArtist.includes(targetArtist) ||
    targetArtist.includes(entryArtist)
  ) {
    score += 2;
  }

  return score;
};

const pickBestSearchEntry = (
  entries: GetSongBpmSearchEntry[],
  lookup: TrackMetadataLookup,
): GetSongBpmSearchEntry | null => {
  if (entries.length === 0) {
    return null;
  }

  const ranked = [...entries].sort(
    (left, right) =>
      scoreSearchEntry(right, lookup) - scoreSearchEntry(left, lookup),
  );
  const best = ranked[0];

  if (!best || scoreSearchEntry(best, lookup) < 2) {
    return null;
  }

  return best;
};

const fetchJson = async <T>(url: string): Promise<T | null> => {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": process.env.DISCOGS_API_USER_AGENT ?? "FilterMyDiscogs/1.0",
    },
    next: { revalidate: 60 * 60 * 24 * 7 },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
};

const fetchSongMetadata = async (
  songId: string,
): Promise<TrackDjMetadata | null> => {
  const payload = await fetchJson<GetSongBpmSongResponse>(buildSongUrl(songId));
  return toTrackDjMetadata(payload?.song);
};

export const isGetSongBpmConfigured = (): boolean => getApiKey() !== null;

export const lookupTrackDjMetadata = async (
  lookup: TrackMetadataLookup,
): Promise<TrackDjMetadata | null> => {
  if (!getApiKey()) {
    return null;
  }

  const payload = await fetchJson<GetSongBpmSearchResponse>(
    buildSearchUrl(lookup),
  );
  const searchResults = Array.isArray(payload?.search) ? payload.search : [];
  const bestMatch = pickBestSearchEntry(searchResults, lookup);

  if (!bestMatch) {
    return null;
  }

  const inlineMetadata = toTrackDjMetadata(bestMatch);
  if (inlineMetadata && (inlineMetadata.bpm !== null || inlineMetadata.key)) {
    return inlineMetadata;
  }

  if (!bestMatch.id) {
    return null;
  }

  return fetchSongMetadata(bestMatch.id);
};

export const lookupTrackDjMetadataBatch = async (
  lookups: TrackMetadataLookup[],
): Promise<Record<string, TrackDjMetadata | null>> => {
  const cappedLookups = lookups.slice(0, MAX_LOOKUPS_PER_REQUEST);
  const entries = await Promise.all(
    cappedLookups.map(async (lookup) => {
      const metadata = await lookupTrackDjMetadata(lookup);
      return [lookup.id, metadata] as const;
    }),
  );

  return Object.fromEntries(entries);
};
