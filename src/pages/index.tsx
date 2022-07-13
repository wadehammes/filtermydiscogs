import {
  Box,
  CircularProgress,
  OutlinedInput,
  MenuItem,
  Select,
  SelectChangeEvent,
  FormControl,
  InputLabel,
  Button,
} from "@mui/material";
import flatten from "lodash.flatten";
import { GetStaticProps } from "next";
import { ChangeEvent, FC, useEffect, useState } from "react";
import Page from "src/components/Page/Page.component";
import { Content, StickyHeader } from "src/components/Layout";
import { H1, LI, OL, P } from "src/components/Typography";
import debounce from "lodash.debounce";
import { Release } from "src/components/ReleaseCard";
import Image from "next/image";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import Chevron from "src/styles/icons/chevron-right-solid.svg";
import { breakpoints } from "src/styles/theme";

enum SortingValues {
  AZLabel = "AZLabel",
  ZALabel = "ZALabel",
  DateAddedNew = "DateAddedNew",
  DateAddedOld = "DateAddedOld",
  RatingHigh = "RatingHigh",
  RatingLow = "RatingLow",
}

interface Sort {
  name: string;
  value: SortingValues;
}

const ALL_RELEASES_LOADED = "All releases loaded!";
const LOAD_RELEASES_TEXT = "Loading releases...";
const LOAD_MORE_RELEASES_TEXT = "Loading next 500 releases...";
const ERROR_FETCHING =
  "Failed to fetch collection. Check spelling or this collection could be private.";

const headers = { Accept: "application/json" };

const SORTING_OPTIONS: Sort[] = [
  {
    name: "A-Z (Label)",
    value: SortingValues.AZLabel,
  },
  {
    name: "Z-A (Label)",
    value: SortingValues.ZALabel,
  },
  {
    name: "Date Added (New to Old)",
    value: SortingValues.DateAddedNew,
  },
  {
    name: "Date Added (Old to New)",
    value: SortingValues.DateAddedOld,
  },
];

interface ReleaseJson {
  uri: string;
  [key: string]: unknown;
}

interface Collection {
  pagination: {
    pages: number;
    items: number;
    urls: {
      next: string;
      prev: string;
    };
    [key: string]: unknown;
  };
  releases: Release[];
}

const sortReleases = (releases: Release[], sort: SortingValues): Release[] => {
  switch (sort) {
    case SortingValues.DateAddedNew:
      return releases.sort(
        (a, b) =>
          new Date(b.date_added).getTime() - new Date(a.date_added).getTime()
      );
    case SortingValues.DateAddedOld:
      return releases.sort(
        (a, b) =>
          new Date(a.date_added).getTime() - new Date(b.date_added).getTime()
      );
    case SortingValues.AZLabel:
      return releases.sort((a, b) =>
        a.basic_information.labels[0].name.localeCompare(
          b.basic_information.labels[0].name
        )
      );
    case SortingValues.ZALabel:
      return releases.sort((a, b) =>
        b.basic_information.labels[0].name.localeCompare(
          a.basic_information.labels[0].name
        )
      );
    default:
      return releases;
  }
};

const Loader: FC<{ isLoaded: boolean; text: string }> = ({
  isLoaded = false,
  text = LOAD_MORE_RELEASES_TEXT,
}) => (
  <Box
    display="inline-flex"
    flexDirection="row"
    justifyContent="flex-end"
    gap="0.75rem"
  >
    {isLoaded ? (
      <span>{text}</span>
    ) : (
      <>
        <CircularProgress size={20} />
        <span>{text}</span>
      </>
    )}
  </Box>
);

const Home: FC = () => {
  const isMobile = useMediaQuery(breakpoints.tablet);
  const [user, setUser] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [nextLink, setNextLink] = useState<string>("");
  const [collection, setCollection] = useState<Collection>();
  const [fetchingCollection, setFetchingCollection] = useState<boolean>(true);
  const [releases, setReleases] = useState<Release[]>([]);
  const [filteredReleases, setFilteredReleases] = useState<Release[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>("All");
  const [loadMoreText, setLoadMoreText] = useState<string>(LOAD_RELEASES_TEXT);
  const [selectedSort, setSelectedSort] = useState<SortingValues>(
    SortingValues.DateAddedNew
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFetchingCollection(true);
      setReleases([]);
      setLoadMoreText(LOAD_RELEASES_TEXT);
      setError(null);

      (async () => {
        const fetchDiscogsCollection = fetch(
          `https://api.discogs.com/users/${user}/collection/folders/0/releases?token=NyQClxOGhZKdrUdiLocTrirpfMylQTtWrJlGSeLU&per_page=500`,
          { headers, method: "GET" }
        );

        const fetched = await fetchDiscogsCollection;

        if (fetched.ok) {
          const json = await fetched.json();

          setFetchingCollection(false);
          setFilteredReleases([]);
          setNextLink(json.pagination.urls.next);
          setReleases(json.releases);
          setSelectedStyle("All");
          setCollection(json);
        } else {
          setFetchingCollection(false);
          setError(ERROR_FETCHING);
        }
      })();
    }
  }, [user]);

  useEffect(() => {
    if (releases) {
      const uniqueStyles = new Set(
        flatten(
          releases.map((release) => release.basic_information.styles)
        ).sort((a, b) => a.localeCompare(b))
      );

      setStyles(Array.from(uniqueStyles));
    }
  }, [releases]);

  useEffect(() => {
    if (releases) {
      if (selectedStyle !== "All") {
        const filteredReleasesByStyle = releases.filter((release) =>
          release.basic_information.styles.includes(selectedStyle)
        );

        setFilteredReleases(filteredReleasesByStyle);
      } else {
        setFilteredReleases(releases);
      }
    }
  }, [selectedStyle, releases, selectedSort]);

  useEffect(() => {
    if (
      collection &&
      nextLink &&
      releases.length < collection.pagination.items &&
      page <= collection.pagination.pages
    ) {
      setLoadMoreText(LOAD_RELEASES_TEXT);

      (async () => {
        const fetchNext = fetch(nextLink, {
          headers,
          method: "GET",
        });

        const fetchedNext = await fetchNext;

        if (fetchedNext.ok) {
          const nextReleases: Collection = await fetchedNext.json();

          if (nextReleases) {
            setReleases([...releases, ...nextReleases.releases]);
            setNextLink(nextReleases.pagination.urls.next);
            setPage(page + 1);
          }
        }
      })();
    }
  }, [collection, releases, page, nextLink]);

  useEffect(() => {
    if (collection && releases.length >= collection.pagination.items) {
      setLoadMoreText(ALL_RELEASES_LOADED);
    } else {
      setLoadMoreText(LOAD_MORE_RELEASES_TEXT);
    }
  }, [collection, releases.length]);

  const handleStyleChange = (e: SelectChangeEvent) => {
    const { value } = e.target;

    if (value) {
      setSelectedStyle(value);
    }
  };

  const handleSortChange = (e: SelectChangeEvent) => {
    const { value } = e.target;

    if (value) {
      setSelectedSort(value as SortingValues);
    }
  };

  const handleUserChange = debounce((e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    if (value) {
      setUser(value);
    }
  }, 1000);

  const handleReleaseClick = async (release: Release) => {
    const fetchRelease = fetch(release.basic_information.resource_url, {
      headers,
      method: "GET",
    });

    const fetchedRelease = await fetchRelease;

    if (fetchedRelease.ok) {
      const releaseJson: ReleaseJson = await fetchedRelease.json();

      if (releaseJson) {
        window.open(releaseJson.uri, "_blank");
      }
    }
  };

  return (
    <Page>
      <Box display="flex" flexDirection="column" gap={5} width="100%">
        <StickyHeader>
          <H1>Filter My Disco.gs</H1>
          <OutlinedInput
            placeholder="Type your Discogs username..."
            onChange={handleUserChange}
            fullWidth={!isMobile}
          />
          {styles && !fetchingCollection && !error && (
            <>
              <FormControl fullWidth={!isMobile}>
                <InputLabel id="style-select">Style</InputLabel>
                <Select
                  labelId="style-select"
                  id="style-select"
                  value={selectedStyle}
                  label="Styles"
                  onChange={handleStyleChange}
                  disabled={!collection}
                >
                  <MenuItem value="All">All</MenuItem>
                  {styles.map((style) => (
                    <MenuItem key={style} value={style}>
                      {style}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth={!isMobile}>
                <InputLabel id="sort-select">Sort</InputLabel>
                <Select
                  labelId="sort-select"
                  id="sort-select"
                  value={selectedSort}
                  label="sort"
                  onChange={handleSortChange}
                  disabled={fetchingCollection}
                >
                  {SORTING_OPTIONS.map((sort) => (
                    <MenuItem key={sort.name} value={sort.value}>
                      {sort.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
          {!fetchingCollection && collection && (
            <Loader
              isLoaded={releases.length >= collection.pagination.items}
              text={loadMoreText}
            />
          )}
        </StickyHeader>

        {user ? (
          <Content>
            {collection && filteredReleases && !fetchingCollection ? (
              <Box display="flex" flexDirection="column" gap={3}>
                <h2>
                  <b>
                    {user}'s collection (showing {filteredReleases.length} of{" "}
                    {collection.pagination.items} releases)
                  </b>
                </h2>
                <OL>
                  {sortReleases(filteredReleases, selectedSort).map(
                    (release) => {
                      const thumbUrl =
                        release?.basic_information?.thumb ??
                        "https://placehold.jp/50x50.png";

                      return (
                        <LI
                          key={`${release.instance_id}-${release.date_added}`}
                        >
                          <Button
                            variant="outlined"
                            onClick={() => handleReleaseClick(release)}
                          >
                            {thumbUrl && (
                              <Image
                                src={thumbUrl}
                                height={100}
                                width={100}
                                quality={100}
                              />
                            )}
                            <span
                              style={{ flex: 1, padding: "1rem 1rem 1rem 0" }}
                            >
                              <b>{release.basic_information.labels[0].name}</b>
                              <br />
                              {release.basic_information.title}
                              <br />
                              {release.basic_information.artists
                                .map((artist) => artist.name)
                                .join(", ")}
                            </span>

                            <span>
                              <Chevron />
                            </span>
                          </Button>
                        </LI>
                      );
                    }
                  )}
                </OL>
              </Box>
            ) : error ? (
              <P>
                <b>{ERROR_FETCHING}</b>
              </P>
            ) : (
              <CircularProgress />
            )}
          </Content>
        ) : (
          <Content>
            <P>
              <b>
                Type your Discogs username above to fetch your collection. Note:
                it must be publically available for this to work currently.
              </b>
            </P>
          </Content>
        )}
      </Box>
    </Page>
  );
};

export const getStaticProps: GetStaticProps = () => ({
  props: {},
  revalidate: 60,
});

export default Home;
