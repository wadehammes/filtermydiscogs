export interface DiscogsTrack {
  position: string;
  title: string;
  duration?: string;
  type_?: string;
  sub_tracks?: DiscogsTrack[];
  [key: string]: unknown;
}

export interface DiscogsVideo {
  uri: string;
  title: string;
  description?: string;
  duration?: number;
  embed?: boolean;
  [key: string]: unknown;
}

export interface DiscogsReleaseDetail {
  id: number;
  uri: string;
  title: string;
  artists?: Array<{ name: string; [key: string]: unknown }>;
  labels?: Array<{ name: string; catno?: string; [key: string]: unknown }>;
  year?: number;
  released?: string;
  notes?: string;
  tracklist?: DiscogsTrack[];
  videos?: DiscogsVideo[];
  thumb?: string;
  images?: Array<{ uri: string; [key: string]: unknown }>;
  [key: string]: unknown;
}
