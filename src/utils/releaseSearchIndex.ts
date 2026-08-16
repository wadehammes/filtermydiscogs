import type { DiscogsRelease } from "src/types";
import { getReleaseFormatTags } from "src/utils/formatFilterTags";
import { getReleaseGenreStyleTags } from "src/utils/releaseGenreStyleTags";
import { getReleaseNotesSearchText } from "src/utils/releaseNotes";

export interface ReleaseSearchIndexEntry {
  searchText: string;
  genreStyleTags: readonly string[];
  formatTags: readonly string[];
}

const searchIndexByInstanceId = new Map<string, ReleaseSearchIndexEntry>();

const buildReleaseSearchIndexEntry = (
  release: DiscogsRelease,
): ReleaseSearchIndexEntry => {
  const { title, artists, labels } = release.basic_information;
  const parts: string[] = [title.toLowerCase()];

  for (const artist of artists) {
    parts.push(artist.name.toLowerCase());
  }

  for (const label of labels) {
    parts.push(label.name.toLowerCase());
    if (label.catno) {
      parts.push(String(label.catno).toLowerCase());
    }
  }

  const notesText = getReleaseNotesSearchText(release);
  if (notesText) {
    parts.push(notesText);
  }

  const genreStyleTags = getReleaseGenreStyleTags(release.basic_information);
  for (const tag of genreStyleTags) {
    parts.push(tag.toLowerCase());
  }

  return {
    searchText: parts.join(" "),
    genreStyleTags,
    formatTags: getReleaseFormatTags(release.basic_information.formats),
  };
};

const indexRelease = (release: DiscogsRelease): void => {
  searchIndexByInstanceId.set(
    release.instance_id,
    buildReleaseSearchIndexEntry(release),
  );
};

export const buildReleaseSearchIndex = (releases: DiscogsRelease[]): void => {
  searchIndexByInstanceId.clear();

  for (const release of releases) {
    indexRelease(release);
  }
};

export const syncReleaseSearchIndex = (
  previousReleases: DiscogsRelease[],
  nextReleases: DiscogsRelease[],
): void => {
  if (nextReleases.length === 0) {
    searchIndexByInstanceId.clear();
    return;
  }

  if (nextReleases.length < previousReleases.length) {
    buildReleaseSearchIndex(nextReleases);
    return;
  }

  if (nextReleases.length === previousReleases.length) {
    for (let index = 0; index < nextReleases.length; index += 1) {
      const nextRelease = nextReleases[index];
      if (nextRelease && nextRelease !== previousReleases[index]) {
        indexRelease(nextRelease);
      }
    }
    return;
  }

  for (
    let index = previousReleases.length;
    index < nextReleases.length;
    index += 1
  ) {
    const nextRelease = nextReleases[index];
    if (nextRelease) {
      indexRelease(nextRelease);
    }
  }
};

export const getReleaseSearchIndexEntry = (
  release: DiscogsRelease,
): ReleaseSearchIndexEntry =>
  searchIndexByInstanceId.get(release.instance_id) ??
  buildReleaseSearchIndexEntry(release);

export const getReleaseSearchText = (release: DiscogsRelease): string =>
  getReleaseSearchIndexEntry(release).searchText;

export const clearReleaseSearchIndex = (): void => {
  searchIndexByInstanceId.clear();
};
