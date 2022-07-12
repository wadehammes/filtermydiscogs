import {
  Box,
  CircularProgress,
  OutlinedInput,
  MenuItem,
  Select,
  SelectChangeEvent,
  FormControl,
  InputLabel,
} from "@mui/material";
import flatten from "lodash.flatten";
import { GetStaticProps } from "next";
import { ChangeEvent, FC, useEffect, useState } from "react";
import Page from "src/components/Page/Page.component";
import { Content, StickyHeader } from "src/components/Layout";
import { H1, LI, OL } from "src/components/Typography";
import debounce from "lodash.debounce";
import Router from "next/router";
import { Release } from "src/components/ReleaseCard";
import styled from "styled-components";

const headers = { Accept: "application/json" };

interface ReleaseJson {
  uri: string;
  [key: string]: unknown;
}

interface Collection {
  pagination: Record<string, unknown>;
  releases: Release[];
}

const ReleaseButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
`;

const Home: FC = () => {
  const [user, setUser] = useState<string>("wadehammes");
  const [collection, setCollection] = useState<Collection>();
  const [fetchingCollection, setFetchingCollection] = useState<boolean>(true);
  const [filteredReleases, setFilteredReleases] = useState<Release[]>();
  const [styles, setStyles] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>("All");

  useEffect(() => {
    setFetchingCollection(true);

    (async () => {
      const fetchDiscogsCollection = fetch(
        `https://api.discogs.com/users/${user}/collection/folders/0/releases?token=NyQClxOGhZKdrUdiLocTrirpfMylQTtWrJlGSeLU&per_page=500`,
        { headers, method: "GET" }
      );

      const fetched = await fetchDiscogsCollection;

      if (fetched.ok) {
        const json = await fetched.json();

        setFetchingCollection(false);
        setFilteredReleases(json.releases);
        setSelectedStyle("All");
        setCollection(json);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (collection) {
      const uniqueStyles = new Set(
        flatten(
          collection.releases.map((release) => release.basic_information.styles)
        )
      );

      setStyles(Array.from(uniqueStyles));
    }
  }, [collection]);

  useEffect(() => {
    if (collection) {
      const { releases } = collection;

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
    }
  }, [collection, selectedStyle]);

  const handleStyleChange = (e: SelectChangeEvent) => {
    const { value } = e.target;

    if (value) {
      setSelectedStyle(value);
    }
  };

  const handleUserChange = debounce((e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    if (value) {
      setUser(value);
    }
  }, 500);

  const handleReleaseClick = async (release: Release) => {
    const fetchRelease = fetch(release.basic_information.resource_url, {
      headers,
      method: "GET",
    });

    const fetchedRelease = await fetchRelease;

    if (fetchedRelease.ok) {
      const releaseJson: ReleaseJson = await fetchedRelease.json();

      if (releaseJson) {
        Router.push(releaseJson.uri);
      }
    }
  };

  return (
    <Page>
      <Box display="flex" flexDirection="column" gap={5} width="100%">
        <StickyHeader>
          <H1>Filter My Disco.gs</H1>
          <OutlinedInput
            placeholder="Discogs username"
            onChange={handleUserChange}
          />
          {styles && !fetchingCollection && (
            <FormControl>
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
          )}
        </StickyHeader>

        <Content>
          {collection && filteredReleases && !fetchingCollection ? (
            <Box display="flex" flexDirection="column" gap={3}>
              <h2>
                <b>
                  {user}'s collection (showing {filteredReleases.length})
                </b>
              </h2>
              <OL>
                {filteredReleases.map((release) => {
                  return (
                    <LI key={release.instance_id}>
                      <ReleaseButton
                        onClick={() => handleReleaseClick(release)}
                      >
                        {release.basic_information.labels[0].name}
                        &nbsp;&mdash;&nbsp;
                        {release.basic_information.title}
                        &nbsp;&mdash;&nbsp;
                        {release.basic_information.artists[0].name}
                        <span>→</span>
                      </ReleaseButton>
                    </LI>
                  );
                })}
              </OL>
            </Box>
          ) : (
            <CircularProgress />
          )}
        </Content>
      </Box>
    </Page>
  );
};

export const getStaticProps: GetStaticProps = () => ({
  props: {},
  revalidate: 60,
});

export default Home;
