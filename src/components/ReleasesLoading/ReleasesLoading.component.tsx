import { Box, CircularProgress } from "@mui/material";
import { FC } from "react";
import { LOAD_MORE_RELEASES_TEXT } from "src/utils/constants";

interface ReleasesLoadingProps {
  isLoaded: boolean;
  text: string;
}

export const ReleasesLoading: FC<ReleasesLoadingProps> = ({
  isLoaded = false,
  text = LOAD_MORE_RELEASES_TEXT,
}) => {
  if (isLoaded) {
    return <span>{text}</span>;
  } else {
    return (
      <Box display="inline-flex" flexDirection="row" gap="0.75rem">
        <CircularProgress size={20} />
        <span>{text}</span>
      </Box>
    );
  }
};
