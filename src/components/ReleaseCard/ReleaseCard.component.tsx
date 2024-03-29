import { Box, Button } from "@mui/material";
import Image from "next/image";
import { FC } from "react";
import { Release, ReleaseJson } from "src/context/collection.context";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import Chevron from "src/styles/icons/chevron-right-solid.svg";
import { headers } from "src/api/helpers";
import { device } from "src/styles/device";
import { trackEvent } from "src/analytics/analytics";
import parse from "html-react-parser";
import { Span } from "src/components/Typography";

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
      trackEvent("releaseClicked", {
        action: "releaseClicked",
        category: "home",
        label: "Release Clicked",
        value: release.basic_information.resource_url,
      });

      setTimeout(() => {
        windowReference.location = releaseJson.uri;
      }, 200);
    }
  }
};

export const ReleaseCard: FC<ReleaseProps> = ({ release }) => {
  const isLaptop = useMediaQuery(device.laptop);

  const { labels, year, artists, title, thumb } = release.basic_information;

  const thumbUrl = thumb
    ? thumb
    : "https://placehold.jp/effbf2/000/150x150.png?text=%F0%9F%98%B5";

  return release ? (
    <Button variant="outlined" onClick={() => handleReleaseClick(release)}>
      {thumbUrl && (
        <Box
          display="flex"
          alignItems="center"
          height="100%"
          width={isLaptop ? "150px" : "125px"}
          style={{ backgroundColor: "var(--black)" }}
        >
          <Image
            src={thumbUrl}
            height={isLaptop ? 150 : 125}
            width={isLaptop ? 150 : 125}
            quality={100}
            alt={release.basic_information.title}
          />
        </Box>
      )}
      <Box style={{ flex: 1, padding: "1rem 1rem 1rem 0" }}>
        <Span>
          <b>
            {labels[0].name} {year !== 0 ? parse(`&mdash; ${year}`) : ""}
          </b>
        </Span>
        <Span>{title}</Span>
        <Span>{artists.map((artist) => artist.name).join(", ")}</Span>
      </Box>

      <Span>
        <Chevron />
      </Span>
    </Button>
  ) : null;
};

export default ReleaseCard;
