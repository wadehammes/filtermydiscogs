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
import { ChangeEvent, FC, useEffect, useRef } from "react";
import Page from "src/components/Page/Page.component";
import { Content, StickyHeader } from "src/components/Layout";
import { H1, LI, OL, P } from "src/components/Typography";
import debounce from "lodash.debounce";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { device } from "src/styles/theme";
import {
  ALL_RELEASES_LOADED,
  ALL_STYLE,
  AWAITING_USERNAME,
  DEFAULT_COLLECTION,
  ERROR_FETCHING,
  LOAD_MORE_RELEASES_TEXT,
  LOAD_RELEASES_TEXT,
} from "src/constants";
import {
  CollectionSortingValues,
  SortMenuItem,
  Release,
  Collection,
  useCollectionContext,
} from "src/context/collection.context";
import { headers } from "src/api/helpers";
import ReleaseCard from "src/components/ReleaseCard/ReleaseCard.component";
import { ReleasesLoading } from "src/components/ReleasesLoading/ReleasesLoading.component";

const SORTING_OPTIONS: SortMenuItem[] = [
  {
    name: "A-Z (Label)",
    value: CollectionSortingValues.AZLabel,
  },
  {
    name: "Z-A (Label)",
    value: CollectionSortingValues.ZALabel,
  },
  {
    name: "Date Added (New to Old)",
    value: CollectionSortingValues.DateAddedNew,
  },
  {
    name: "Date Added (Old to New)",
    value: CollectionSortingValues.DateAddedOld,
  },
];

const sortReleases = (
  releases: Release[],
  sort: CollectionSortingValues
): Release[] => {
  switch (sort) {
    case CollectionSortingValues.DateAddedNew:
      return releases.sort(
        (a, b) =>
          new Date(b.date_added).getTime() - new Date(a.date_added).getTime()
      );
    case CollectionSortingValues.DateAddedOld:
      return releases.sort(
        (a, b) =>
          new Date(a.date_added).getTime() - new Date(b.date_added).getTime()
      );
    case CollectionSortingValues.AZLabel:
      return releases.sort((a, b) =>
        a.basic_information.labels[0].name.localeCompare(
          b.basic_information.labels[0].name
        )
      );
    case CollectionSortingValues.ZALabel:
      return releases.sort((a, b) =>
        b.basic_information.labels[0].name.localeCompare(
          a.basic_information.labels[0].name
        )
      );
    default:
      return releases;
  }
};

const FilterMyDiscogs: FC = () => {
  const usernameRef = useRef<HTMLInputElement>(null);
  const isTablet = useMediaQuery(device.tablet);
  const {
    state,
    dispatchUser,
    dispatchPage,
    dispatchNextPageLink,
    dispatchFetchingCollection,
    dispatchCollection,
    dispatchReleases,
    dispatchFilteredReleases,
    dispatchReleaseStyles,
    dispatchSelectedReleaseStyle,
    dispatchSelectedReleaseSort,
    dispatchLoadMoreReleaseText,
    dispatchError,
  } = useCollectionContext();

  const {
    username,
    page,
    nextPageLink,
    collection,
    releases,
    fetchingCollection,
    filteredReleases,
    releaseStyles,
    selectedReleaseStyle,
    loadMoreReleasesText,
    selectedReleaseSort,
    error,
  } = state;

  useEffect(() => {
    if (username) {
      dispatchFetchingCollection(true);
      dispatchReleases([]);
      dispatchFilteredReleases([]);
      dispatchLoadMoreReleaseText(LOAD_RELEASES_TEXT);
      dispatchError(null);

      (async () => {
        const fetchDiscogsCollection = fetch(
          `https://api.discogs.com/users/${username}/collection/folders/0/releases?token=NyQClxOGhZKdrUdiLocTrirpfMylQTtWrJlGSeLU&per_page=500`,
          { headers, method: "GET" }
        );

        const fetched = await fetchDiscogsCollection;

        if (fetched.ok) {
          const collectionJson = await fetched.json();

          dispatchFetchingCollection(false);
          dispatchNextPageLink(collectionJson.pagination.urls.next);
          dispatchReleases(collectionJson.releases);
          dispatchSelectedReleaseStyle(ALL_STYLE);
          dispatchCollection(collectionJson);
        } else {
          dispatchFetchingCollection(false);
          dispatchError(ERROR_FETCHING);
        }
      })();
    }
  }, [
    dispatchCollection,
    dispatchError,
    dispatchFetchingCollection,
    dispatchFilteredReleases,
    dispatchLoadMoreReleaseText,
    dispatchNextPageLink,
    dispatchReleases,
    dispatchSelectedReleaseStyle,
    username,
  ]);

  useEffect(() => {
    if (releases) {
      const uniqueStyles = new Set(
        flatten(releases.map((release) => release.basic_information.styles))
      );

      const sortedStyles: string[] = Array.from(uniqueStyles).sort((a, b) =>
        a.localeCompare(b)
      );

      dispatchReleaseStyles(sortedStyles);
    }
  }, [dispatchReleaseStyles, releases]);

  useEffect(() => {
    if (releases) {
      if (selectedReleaseStyle !== ALL_STYLE) {
        const filteredReleasesByStyle = releases.filter((release) =>
          release.basic_information.styles.includes(selectedReleaseStyle)
        );

        dispatchFilteredReleases(filteredReleasesByStyle);
      } else {
        dispatchFilteredReleases(releases);
      }
    }
  }, [selectedReleaseStyle, releases, dispatchFilteredReleases]);

  useEffect(() => {
    if (
      collection &&
      nextPageLink &&
      releases.length < collection.pagination.items &&
      page <= collection.pagination.pages
    ) {
      dispatchLoadMoreReleaseText(LOAD_RELEASES_TEXT);

      (async () => {
        const fetchNext = fetch(nextPageLink, {
          headers,
          method: "GET",
        });

        const fetchedNext = await fetchNext;

        if (fetchedNext.ok) {
          const nextReleases: Collection = await fetchedNext.json();

          if (nextReleases) {
            dispatchReleases([...releases, ...nextReleases.releases]);
            dispatchNextPageLink(nextReleases.pagination.urls.next);
            dispatchPage(page + 1);
          }
        }
      })();
    }
  }, [
    collection,
    releases,
    page,
    nextPageLink,
    dispatchLoadMoreReleaseText,
    dispatchReleases,
    dispatchNextPageLink,
    dispatchPage,
  ]);

  useEffect(() => {
    if (collection && releases.length >= collection.pagination.items) {
      dispatchLoadMoreReleaseText(ALL_RELEASES_LOADED);
    } else {
      dispatchLoadMoreReleaseText(LOAD_MORE_RELEASES_TEXT);
    }
  }, [collection, dispatchLoadMoreReleaseText, releases.length]);

  const handleStyleChange = (e: SelectChangeEvent) => {
    const { value } = e.target;

    if (value) {
      dispatchSelectedReleaseStyle(value);
    }
  };

  const handleSortChange = (e: SelectChangeEvent) => {
    const { value } = e.target;

    if (value) {
      dispatchSelectedReleaseSort(value as CollectionSortingValues);
    }
  };

  const handleUserChange = debounce((e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    if (value) {
      dispatchUser(value);
    } else {
      dispatchUser(null);
      dispatchFetchingCollection(false);
      dispatchReleases([]);
      dispatchFilteredReleases([]);
      dispatchLoadMoreReleaseText(AWAITING_USERNAME);
      dispatchSelectedReleaseStyle(ALL_STYLE);
      dispatchSelectedReleaseStyle(CollectionSortingValues.DateAddedNew);
      dispatchError(null);
    }
  }, 1000);

  return (
    <Page>
      <Box display="flex" flexDirection="column" gap={5} width="100%">
        <StickyHeader>
          <H1>Filter My Disco.gs</H1>
          <OutlinedInput
            placeholder="Type your Discogs username..."
            onChange={handleUserChange}
            fullWidth={!isTablet}
            inputRef={usernameRef}
          />
          {releaseStyles && !fetchingCollection && !error && (
            <Box display="flex" flexDirection="row" gap={2} width="100%">
              <FormControl fullWidth>
                <InputLabel id="style-select">Style</InputLabel>
                <Select
                  labelId="style-select"
                  id="style-select"
                  value={selectedReleaseStyle}
                  label="Styles"
                  onChange={handleStyleChange}
                  disabled={!collection}
                >
                  <MenuItem value={ALL_STYLE}>All</MenuItem>
                  {releaseStyles.map((style) => (
                    <MenuItem key={style} value={style}>
                      {style}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="sort-select">Sort</InputLabel>
                <Select
                  labelId="sort-select"
                  id="sort-select"
                  value={selectedReleaseSort}
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
            </Box>
          )}
          {!fetchingCollection && collection && (
            <ReleasesLoading
              isLoaded={releases.length >= collection.pagination.items}
              text={loadMoreReleasesText}
            />
          )}
        </StickyHeader>

        {username ? (
          <Content>
            {collection && filteredReleases && !fetchingCollection ? (
              <Box display="flex" flexDirection="column" gap={3}>
                <header style={{ lineHeight: 1.5 }}>
                  <h2>
                    <b>
                      {username}
                      {username.endsWith("s") ? "'" : "'s"} collection
                    </b>
                  </h2>
                  <p>
                    (showing {filteredReleases.length} of{" "}
                    {collection.pagination.items} releases)
                  </p>
                </header>

                <OL>
                  {sortReleases(filteredReleases, selectedReleaseSort).map(
                    (release) => (
                      <LI key={`${release.instance_id}-${release.date_added}`}>
                        <ReleaseCard release={release} />
                      </LI>
                    )
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
                it must be publicly available for this to work currently.
              </b>
            </P>
            <P>
              <Button
                variant="contained"
                onClick={() => {
                  dispatchUser(DEFAULT_COLLECTION);

                  if (usernameRef?.current) {
                    usernameRef.current.value = DEFAULT_COLLECTION;
                  }
                }}
              >
                Or try mine
              </Button>
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

export default FilterMyDiscogs;
