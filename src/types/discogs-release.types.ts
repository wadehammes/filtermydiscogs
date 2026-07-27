export interface DiscogsArtist {
  name: string;
  anv?: string;
  join?: string;
  id?: number;
  resource_url?: string;
  [key: string]: unknown;
}

export interface DiscogsLabel {
  name: string;
  id?: number;
  resource_url?: string;
  catno?: string;
  [key: string]: unknown;
}

export interface DiscogsFormat {
  name: string;
  qty?: string;
  descriptions?: string[];
  [key: string]: unknown;
}

export interface DiscogsBasicInformation {
  id?: number;
  resource_url: string;
  uri: string;
  genres?: string[];
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

export interface ReleaseNote {
  field_id: number;
  value: string;
}

export interface DiscogsCollectionField {
  id: number;
  name: string;
  type: string;
  options?: string[];
  lines?: boolean;
  public?: boolean;
  position?: number;
}

export interface DiscogsCollectionFieldsResponse {
  fields: DiscogsCollectionField[];
}

export interface DiscogsRelease {
  id?: number;
  folder_id?: number;
  instance_id: string;
  date_added: string;
  rating: number;
  basic_information: DiscogsBasicInformation;
  notes?: ReleaseNote[] | undefined;
  [key: string]: unknown;
}
