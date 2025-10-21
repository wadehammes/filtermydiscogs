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

export interface DiscogsReleaseJson {
  uri: string;
  [key: string]: unknown;
}

export interface DiscogsPagination {
  pages: number;
  items: number;
  urls: {
    next: string;
    prev: string;
  };
  [key: string]: unknown;
}

export interface DiscogsCollection {
  pagination: DiscogsPagination;
  releases: DiscogsRelease[];
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

export interface CollectionPage {
  pagination: DiscogsPagination;
  releases: DiscogsRelease[];
}

export interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export interface InfiniteQueryResult<T> extends QueryResult<T> {
  fetchNextPage: () => Promise<unknown>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}
export interface ReleaseCardProps {
  release: DiscogsRelease;
  isHighlighted?: boolean;
  onExitRandomMode?: () => void;
}

export interface ReleaseListItemProps {
  release: DiscogsRelease;
  isHighlighted?: boolean;
  onExitRandomMode?: () => void;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label: string;
  options: SelectOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
}

export interface AnalyticsEvent {
  event: string;
  action: string;
  category: string;
  label: string;
  value?: string | number;
}

export interface TrackEventProps {
  action: string;
  category: string;
  label: string;
  value?: string | number;
}

export interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  username: string | null;
}

export interface PerformanceMetrics {
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
}

export type PropsWithChildrenOnly = {
  children: React.ReactNode;
};

export type PropsWithChildren = {
  children: React.ReactNode;
  className?: string;
};
// Search-related types
export interface DiscogsSearchResult {
  id: number;
  type: string;
  title: string;
  uri: string;
  resource_url: string;
  thumb: string;
  cover_image: string;
  master_id?: number;
  master_url?: string;
  year?: number;
  format?: string[];
  country?: string;
  barcode?: string[];
  label?: string[];
  genre?: string[];
  style?: string[];
  [key: string]: unknown;
}

export interface DiscogsSearchResponse {
  pagination: DiscogsPagination;
  results: DiscogsSearchResult[];
}

export interface SearchParams {
  query: string;
  page?: number;
  perPage?: number;
  type?: string;
  format?: string;
  year?: string;
  genre?: string;
  style?: string;
}

export type Release = DiscogsRelease;
export type Collection = DiscogsCollection;
export type ReleaseJson = DiscogsReleaseJson;
