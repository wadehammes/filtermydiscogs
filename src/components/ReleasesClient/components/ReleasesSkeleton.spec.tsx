import { describe, expect, it } from "@jest/globals";
import { ReleasesSkeleton } from "src/components/ReleasesClient/components/ReleasesSkeleton.component";
import { render, screen } from "test-utils";

describe("ReleasesSkeleton", () => {
  it("renders the desktop card skeleton by default", () => {
    render(<ReleasesSkeleton />);

    expect(screen.getByTestId("fmdReleasesSkeleton")).toBeInTheDocument();
    expect(screen.getAllByTestId("fmdDesktopReleaseCardSkeleton")).toHaveLength(
      12,
    );
    expect(screen.queryByTestId("fmdMobileReleaseCardSkeleton")).toBeNull();
  });

  it("renders the mobile card skeleton when isMobile is true", () => {
    render(<ReleasesSkeleton isMobile />);

    expect(screen.getAllByTestId("fmdMobileReleaseCardSkeleton")).toHaveLength(
      12,
    );
    expect(screen.queryByTestId("fmdDesktopReleaseCardSkeleton")).toBeNull();
  });
});
