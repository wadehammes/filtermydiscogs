import {
  CircularProgress,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import flatten from "lodash.flatten";
import { GetStaticProps } from "next";
import Link from "next/link";
import { FC, useEffect, useState } from "react";
import Page from "src/components/Page/Page.component";
import { StickyHeader } from "src/components/Layout";

const headers = { Accept: "application/json" };

interface Release {
  instance_id: string;
  basic_information: {
    title: string;
    resource_url: string;
    styles: string[];
    labels: {
      name: string;
    }[];
    artists: {
      name: string;
    }[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface Collection {
  pagination: Record<string, unknown>;
  releases: Release[];
}

const Home: FC = () => {
  const [user, setUser] = useState<string>("wadehammes");
  const [collection, setCollection] = useState<Collection>();
  const [filteredReleases, setFilteredReleases] = useState<Release[]>();
  const [styles, setStyles] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>("All");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const userParam = params.get("user");

    if (userParam) {
      setUser(userParam);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const fetchDiscogsCollection = fetch(
        `https://api.discogs.com/users/${user}/collection/folders/0/releases?per_page=500`,
        { headers, method: "GET" }
      );

      const fetched = await fetchDiscogsCollection;

      if (fetched.ok) {
        const json = await fetched.json();

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

  return (
    <Page>
      {collection && filteredReleases ? (
        <div style={{ width: "100%" }}>
          <StickyHeader>
            {styles && (
              <Select
                labelId="style-select"
                id="style-select"
                value={selectedStyle}
                label="Styles"
                onChange={handleStyleChange}
              >
                <MenuItem disabled value="All">
                  <em>Select style...</em>
                </MenuItem>
                {styles.map((style) => (
                  <MenuItem key={style} value={style}>
                    {style}
                  </MenuItem>
                ))}
              </Select>
            )}
          </StickyHeader>

          <ul>
            {filteredReleases.map((release) => (
              <li key={release.instance_id}>
                <Link href={release.basic_information.resource_url}>
                  <a target="_blank">
                    {release.basic_information.labels[0].name}
                    &nbsp;&mdash;&nbsp;
                    {release.basic_information.title}
                    &nbsp;&mdash;&nbsp;
                    {release.basic_information.artists[0].name}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <CircularProgress />
      )}
    </Page>
  );
};

export const getStaticProps: GetStaticProps = () => ({
  props: {},
  revalidate: 60,
});

export default Home;
