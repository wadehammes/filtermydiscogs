import { beforeEach, describe, expect, it } from "@jest/globals";
import { ReleasesTableSkeleton } from "src/components/ReleasesClient/ReleasesTableSkeleton.component";
import { render, screen } from "test-utils";

describe("ReleasesTableSkeleton", () => {
  beforeEach(() => {
    render(<ReleasesTableSkeleton />);
  });

  it("renders a table skeleton root", () => {
    expect(screen.getByTestId("fmdReleasesTableSkeleton")).toBeInTheDocument();
  });

  it("renders multiple skeleton data rows", () => {
    expect(screen.getAllByTestId("fmdReleasesTableSkeletonRow")).toHaveLength(
      12,
    );
  });
});
