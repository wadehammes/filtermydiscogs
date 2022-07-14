import { Box, CircularProgress } from "@mui/material";
import { FC, useEffect, useState } from "react";
import { LOAD_MORE_RELEASES_TEXT } from "src/constants";
import Check from "src/styles/icons/check-solid.svg";

interface RelasesLoadingProps {
  isLoaded: boolean;
  text: string;
}

export const ReleasesLoading: FC<RelasesLoadingProps> = ({
  isLoaded = false,
  text = LOAD_MORE_RELEASES_TEXT,
}) => {
  const [hide, setHide] = useState<boolean>(false);

  useEffect(() => {
    if (isLoaded) {
      setTimeout(() => {
        setHide(true);
      }, 1000);

      return () => clearTimeout();
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
          <Check /> {text}
        </span>
      ) : (
        <>
          <CircularProgress size={16} />
          <span>{text}</span>
        </>
      )}
    </Box>
  ) : null;
};
