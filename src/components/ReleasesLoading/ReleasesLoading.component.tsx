import { Box, CircularProgress } from "@mui/material";
import { FC } from "react";
import { LOAD_MORE_RELEASES_TEXT } from "src/constants";
import Check from "src/styles/icons/check-solid.svg";

interface RelasesLoadingProps {
  isLoaded: boolean;
  text: string;
}

export const ReleasesLoading: FC<RelasesLoadingProps> = ({
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
      <span>
        <Check /> {text}
      </span>
    ) : (
      <>
        <CircularProgress size={20} />
        <span>{text}</span>
      </>
    )}
  </Box>
);
