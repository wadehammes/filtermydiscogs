import { Box, CircularProgress, Button } from "@mui/material";
import flatten from "lodash.flatten";
import { GetStaticProps } from "next";
import { FC, useEffect, useRef } from "react";
import Page from "src/components/Page/Page.component";
import { Content } from "src/components/Layout";
import { LI, OL, P } from "src/components/Typography";
import {
  ALL_RELEASES_LOADED,
  ALL_STYLE,
  DEFAULT_COLLECTION,
  ERROR_FETCHING,
  LOAD_MORE_RELEASES_TEXT,
  LOAD_RELEASES_TEXT,
  LOAD_SAMPLE_COLLECTION,
} from "src/constants";
import {
  Collection,
  useCollectionContext,
} from "src/context/collection.context";
import { headers } from "src/api/helpers";
import ReleaseCard from "src/components/ReleaseCard/ReleaseCard.component";
import {
  sortReleases,
  StickyHeaderBar,
} from "src/components/StickyHeaderBar/StickyHeaderBar.component";

const FilterMyDiscogs: FC = () => {
  const usernameRef = useRef<HTMLInputElement>(null);
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
    selectedReleaseStyle,
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

  return (
    <Page>
      <Box
        display="flex"
        flexDirection="column"
        gap={4}
        width="100%"
        height="100%"
      >
        <StickyHeaderBar ref={usernameRef} />
        {username ? (
          <Content>
            {collection && filteredReleases && !fetchingCollection ? (
              <Box display="flex" flexDirection="column" gap={4} width="100%">
                <header style={{ lineHeight: 1.5 }}>
                  <h2>
                    <b>
                      {username}
                      {username.endsWith("s") ? "'" : "'s"} collection
                    </b>
                  </h2>
                  <p>
                    viewing {filteredReleases.length} of{" "}
                    {collection.pagination.items} releases
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
                {LOAD_SAMPLE_COLLECTION}
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
