export const ALL_RELEASES_LOADED = "All releases loaded!";
export const LOAD_RELEASES_TEXT = "Loading releases...";
export const LOAD_MORE_RELEASES_TEXT = "Loading next 500 releases...";
export const AWAITING_USERNAME = "";
export const ERROR_FETCHING =
  "Failed to fetch collection. Check spelling or this collection could be private.";
export const DEFAULT_COLLECTION = "wadehammes";
export const LOAD_SAMPLE_COLLECTION = "View My Collection";
export const USERNAME_STORAGE_PARAM = "fmd_username";

// Minimal sample collection object for demo/sample use
export const DEFAULT_COLLECTION_OBJECT = {
  pagination: {
    pages: 1,
    items: 1,
    urls: {
      next: "",
      prev: "",
    },
  },
  releases: [
    {
      instance_id: "1",
      date_added: "2024-01-01T00:00:00Z",
      rating: 5,
      basic_information: {
        resource_url: "https://www.discogs.com/release/1",
        styles: ["Rock"],
        master_id: 1,
        master_url: null,
        thumb: "https://i.discogs.com/sample-thumb.jpg",
        cover_image: "https://i.discogs.com/sample-cover.jpg",
        title: "Sample Album",
        year: 2024,
        formats: [{ name: "Vinyl" }],
        labels: [{ name: "Sample Label" }],
        artists: [{ name: "Sample Artist" }],
      },
    },
  ],
};
