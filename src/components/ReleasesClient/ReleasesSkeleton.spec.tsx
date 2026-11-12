import { describe, expect, it } from "@jest/globals";
import { ReleasesSkeleton } from "src/components/ReleasesClient/ReleasesSkeleton.component";
import { render, screen } from "test-utils";

describe("ReleasesSkeleton", () => {
  it("renders the desktop card skeleton by default", () => {
    render(<ReleasesSkeleton />);

    expect(screen.getByTestId("fmdReleasesSkeleton")).toBeInTheDocument();
    expect(screen.getAllByTestId("fmdDesktopReleaseCardSkeleton")).toHaveLength(
      15,
    );
    expect(screen.queryByTestId("fmdMobileReleaseCardSkeleton")).toBeNull();
  });

  it("renders the mobile card skeleton when isMobile is true", () => {
    render(<ReleasesSkeleton isMobile />);

    expect(screen.getAllByTestId("fmdMobileReleaseCardSkeleton")).toHaveLength(
      15,
    );
    expect(screen.queryByTestId("fmdDesktopReleaseCardSkeleton")).toBeNull();
  });

  it("renders the table skeleton when view is list on desktop", () => {
    render(<ReleasesSkeleton view="list" />);

    expect(screen.getByTestId("fmdReleasesTableSkeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("fmdDesktopReleaseCardSkeleton")).toBeNull();
  });

  it("renders card skeletons when view is list on mobile", () => {
    render(<ReleasesSkeleton view="list" isMobile />);

    expect(screen.getAllByTestId("fmdMobileReleaseCardSkeleton")).toHaveLength(
      15,
    );
    expect(screen.queryByTestId("fmdReleasesTableSkeleton")).toBeNull();
  });
});
