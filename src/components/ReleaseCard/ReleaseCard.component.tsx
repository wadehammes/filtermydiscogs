import { Button } from "@mui/material";
import Image from "next/image";
import { FC } from "react";
import { Release, ReleaseJson } from "src/context/collection.context";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import Chevron from "src/styles/icons/chevron-right-solid.svg";
import { headers } from "src/api/helpers";
import { device } from "src/styles/theme";

interface ReleaseProps {
  release: Release;
}

const handleReleaseClick = async (release: Release) => {
  const windowReference = window.open("about:blank", "_blank");

  const fetchRelease = fetch(release.basic_information.resource_url, {
    headers,
    method: "GET",
  });

  const fetchedRelease = await fetchRelease;

  if (fetchedRelease.ok) {
    const releaseJson: ReleaseJson = await fetchedRelease.json();

    if (releaseJson && windowReference) {
      windowReference.location = releaseJson.uri;
    }
  }
};

export const ReleaseCard: FC<ReleaseProps> = ({ release }) => {
  const isLaptop = useMediaQuery(device.laptop);

  const thumbUrl =
    release?.basic_information?.thumb ?? "https://placehold.jp/100x100.png";

  return release ? (
    <Button variant="outlined" onClick={() => handleReleaseClick(release)}>
      {thumbUrl && (
        <Image
          src={thumbUrl}
          height={isLaptop ? 150 : 100}
          width={isLaptop ? 150 : 100}
          quality={100}
        />
      )}
      <span style={{ flex: 1, padding: "1rem 1rem 1rem 0" }}>
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
  ) : null;
};

export default ReleaseCard;
