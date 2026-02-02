import type { ReactNode } from "react";

export interface DiscogsArtist {
  name: string;
  id?: number;
  resource_url?: string;
  [key: string]: unknown;
}

export interface DiscogsLabel {
  name: string;
  id?: number;
  resource_url?: string;
  [key: string]: unknown;
}

export interface DiscogsFormat {
  name: string;
  qty?: string;
  descriptions?: string[];
  [key: string]: unknown;
}

export interface DiscogsBasicInformation {
  resource_url: string;
  uri: string;
  styles: string[];
  master_id: number;
  master_url: string | null;
  thumb: string;
  cover_image: string;
  title: string;
  year: number;
  formats: DiscogsFormat[];
  labels: DiscogsLabel[];
  artists: DiscogsArtist[];
  [key: string]: unknown;
}

interface ReleaseNote {
  field_id: string;
  value: ReactNode;
}

export interface DiscogsRelease {
  instance_id: string;
  date_added: string;
  rating: number;
  basic_information: DiscogsBasicInformation;
  notes: ReleaseNote[];
  [key: string]: unknown;
}
