import { Box, CircularProgress } from "@mui/material";
import { FC, useEffect, useState } from "react";
import { ALL_RELEASES_LOADED } from "src/constants";
import Check from "src/styles/icons/check-solid.svg";

interface RelasesLoadingProps {
  isLoaded: boolean;
}

export const ReleasesLoading: FC<RelasesLoadingProps> = ({
  isLoaded = false,
}) => {
  const [hide, setHide] = useState<boolean>(false);

  useEffect(() => {
    if (isLoaded) {
      const timeout = setTimeout(() => {
        setHide(true);
      }, 1000);

      return () => clearTimeout(timeout);
    } else {
      setHide(false);
    }
  }, [isLoaded]);

  return !hide ? (
    <Box
      display="inline-flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="flex-end"
      gap="0.75rem"
    >
      {isLoaded ? (
        <span>
          <Check /> {ALL_RELEASES_LOADED}
        </span>
      ) : (
        <CircularProgress size={16} />
      )}
    </Box>
  ) : null;
};
