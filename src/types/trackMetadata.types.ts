export type TrackMetadataLookup = {
  id: string;
  artist: string;
  title: string;
};

export type TrackDjMetadata = {
  bpm: number | null;
  key: string | null;
};

export type TrackMetadataLookupResult = TrackMetadataLookup & TrackDjMetadata;

export type TrackMetadataBatchRequest = {
  lookups: TrackMetadataLookup[];
};

export type TrackMetadataBatchResponse = {
  results: Record<string, TrackDjMetadata | null>;
};
