import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { ChangeEvent, FC, forwardRef, Ref } from "react";
import { H1 } from "src/components/Typography";
import {
  CollectionSortingValues,
  Release,
  SortMenuItem,
  useCollectionContext,
} from "src/context/collection.context";
import { StickyHeader } from "src/components/Layout";
import { ALL_STYLE, AWAITING_USERNAME } from "src/constants";
import debounce from "lodash.debounce";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { device } from "src/styles/theme";
import { ReleasesLoading } from "src/components/ReleasesLoading/ReleasesLoading.component";

interface StickyHeaderBarProps {
  ref: Ref<HTMLInputElement>;
}

const SORTING_OPTIONS: SortMenuItem[] = [
  {
    name: "A-Z (Label)",
    value: CollectionSortingValues.AZLabel,
  },
  {
    name: "Z-A (Label)",
    value: CollectionSortingValues.ZALabel,
  },
  {
    name: "Date Added (New to Old)",
    value: CollectionSortingValues.DateAddedNew,
  },
  {
    name: "Date Added (Old to New)",
    value: CollectionSortingValues.DateAddedOld,
  },
];

export const sortReleases = (
  releases: Release[],
  sort: CollectionSortingValues
): Release[] => {
  switch (sort) {
    case CollectionSortingValues.DateAddedNew:
      return releases.sort(
        (a, b) =>
          new Date(b.date_added).getTime() - new Date(a.date_added).getTime()
      );
    case CollectionSortingValues.DateAddedOld:
      return releases.sort(
        (a, b) =>
          new Date(a.date_added).getTime() - new Date(b.date_added).getTime()
      );
    case CollectionSortingValues.AZLabel:
      return releases.sort((a, b) =>
        a.basic_information.labels[0].name.localeCompare(
          b.basic_information.labels[0].name
        )
      );
    case CollectionSortingValues.ZALabel:
      return releases.sort((a, b) =>
        b.basic_information.labels[0].name.localeCompare(
          a.basic_information.labels[0].name
        )
      );
    default:
      return releases;
  }
};

export const StickyHeaderBar: FC<StickyHeaderBarProps> = forwardRef(
  (props, ref: Ref<HTMLInputElement>) => {
    const isTablet = useMediaQuery(device.tablet);
    const {
      state,
      dispatchUser,
      dispatchFetchingCollection,
      dispatchReleases,
      dispatchSelectedReleaseStyle,
      dispatchLoadMoreReleaseText,
      dispatchSelectedReleaseSort,
      dispatchFilteredReleases,
      dispatchError,
    } = useCollectionContext();

    const {
      releaseStyles,
      fetchingCollection,
      selectedReleaseStyle,
      collection,
      error,
      selectedReleaseSort,
      releases,
      loadMoreReleasesText,
    } = state;

    const handleStyleChange = (e: SelectChangeEvent) => {
      const { value } = e.target;

      if (value) {
        dispatchSelectedReleaseStyle(value);
      }
    };

    const handleSortChange = (e: SelectChangeEvent) => {
      const { value } = e.target;

      if (value) {
        dispatchSelectedReleaseSort(value as CollectionSortingValues);
      }
    };

    const handleUserChange = debounce((e: ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;

      if (value) {
        dispatchUser(value);
      } else {
        dispatchUser(null);
        dispatchFetchingCollection(true);
        dispatchReleases([]);
        dispatchFilteredReleases([]);
        dispatchLoadMoreReleaseText(AWAITING_USERNAME);
        dispatchSelectedReleaseStyle(ALL_STYLE);
        dispatchSelectedReleaseSort(CollectionSortingValues.DateAddedNew);
        dispatchError(null);
      }
    }, 1000);

    return (
      <StickyHeader>
        <H1>Filter My Disco.gs</H1>
        <OutlinedInput
          placeholder="Type your Discogs username..."
          onChange={handleUserChange}
          fullWidth={!isTablet}
          inputRef={ref}
        />
        {releaseStyles && !fetchingCollection && !error && (
          <Box display="flex" flexDirection="row" gap={2} width="100%">
            <FormControl fullWidth>
              <InputLabel id="style-select">Style</InputLabel>
              <Select
                labelId="style-select"
                id="style-select"
                value={selectedReleaseStyle}
                label="Styles"
                onChange={handleStyleChange}
                disabled={!collection}
              >
                <MenuItem value={ALL_STYLE}>All</MenuItem>
                {releaseStyles.map((style) => (
                  <MenuItem key={style} value={style}>
                    {style}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="sort-select">Sort</InputLabel>
              <Select
                labelId="sort-select"
                id="sort-select"
                value={selectedReleaseSort}
                label="sort"
                onChange={handleSortChange}
                disabled={fetchingCollection}
              >
                {SORTING_OPTIONS.map((sort) => (
                  <MenuItem key={sort.name} value={sort.value}>
                    {sort.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
        {!fetchingCollection && collection && (
          <ReleasesLoading
            isLoaded={releases.length >= collection.pagination.items}
            text={loadMoreReleasesText}
          />
        )}
      </StickyHeader>
    );
  }
);
