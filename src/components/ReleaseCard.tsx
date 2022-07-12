import { Box } from "@mui/material";
import Image from "next/image";
import { FC } from "react";

export interface Release {
  instance_id: string;
  basic_information: {
    resource_url: string;
    styles: string[];
    master_id: number;
    master_url: null;
    thumb: string;
    cover_image: string;
    title: string;
    year: number;
    formats: {
      name: string;
    }[];
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

interface ReleaseProps {
  release: Release;
}

export const ReleaseCard: FC<ReleaseProps> = ({ release }) => {
  return release ? (
    <Box display="flex" flexDirection="row">
      <Image
        src={release.basic_information.thumb}
        width="50"
        height="50"
        quality={100}
      />
    </Box>
  ) : null;
};

export default ReleaseCard;
