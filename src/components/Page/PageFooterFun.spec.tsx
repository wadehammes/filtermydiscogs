import { describe, expect, it } from "@jest/globals";
import { PageFooterFun } from "src/components/Page/PageFooterFun.component";
import type { PublicCommunityStats } from "src/types/public-stats.types";
import { render, screen } from "test-utils";

const stats: PublicCommunityStats = {
  totalCrates: 128,
  totalPublicCrates: 12,
  totalReleases: 4_200,
  totalTracksSaved: 89,
  totalCollectors: 56,
  totalTrackPlays: 1_234,
};

describe("PageFooterFun", () => {
  it("lists community stat labels including tracks saved and releases in crates", () => {
    render(<PageFooterFun stats={stats} />);

    expect(screen.getByText("Crates created")).toBeInTheDocument();
    expect(screen.getByText("Public crates")).toBeInTheDocument();
    expect(screen.getByText("Releases in crates")).toBeInTheDocument();
    expect(screen.getByText("Tracks saved")).toBeInTheDocument();
    expect(screen.getByText("Collectors")).toBeInTheDocument();
    expect(screen.getByText("Track plays")).toBeInTheDocument();
    expect(screen.queryByText("Releases saved")).not.toBeInTheDocument();
  });

  it("formats stat values for display", () => {
    render(<PageFooterFun stats={stats} />);

    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.getByText("4,200")).toBeInTheDocument();
    expect(screen.getByText("89")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });
});
