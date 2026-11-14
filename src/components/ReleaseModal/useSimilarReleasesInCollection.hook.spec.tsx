import { describe, expect, it, jest } from "@jest/globals";
import { useSetAtom } from "jotai";
import { type ReactNode, useEffect } from "react";
import { allReleasesAtom } from "src/atoms/filters.atoms";
import { useSimilarReleasesInCollection } from "src/components/ReleaseModal/useSimilarReleasesInCollection.hook";
import { artistFactory } from "src/tests/factories/Artist.factory";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease } from "src/types";
import { act, renderFeatureHook, waitFor } from "test-utils";

const mockCollectionLoadState = {
  isLoading: false,
  hasNextPage: false,
  isFetchingNextPage: false,
};

jest.mock("src/hooks/useCollectionData.hook", () => {
  const actual = jest.requireActual<
    typeof import("src/hooks/useCollectionData.hook")
  >("src/hooks/useCollectionData.hook");

  return {
    ...actual,
    useCollectionLoadState: () => mockCollectionLoadState,
  };
});

const SeedAllReleases = ({
  releases,
  children,
}: {
  releases: DiscogsRelease[];
  children: ReactNode;
}) => {
  const setAllReleases = useSetAtom(allReleasesAtom);

  useEffect(() => {
    setAllReleases(releases);
  }, [releases, setAllReleases]);

  return children;
};

const renderSimilarReleasesHookWithCollection = (
  release: DiscogsRelease,
  collection: DiscogsRelease[],
) =>
  renderFeatureHook(() => useSimilarReleasesInCollection(release, true), {
    includeCollectionSync: false,
    wrapper: ({ children }) => (
      <SeedAllReleases releases={collection}>{children}</SeedAllReleases>
    ),
  });

describe("useSimilarReleasesInCollection", () => {
  const otherArtist = artistFactory.build({ id: 42, name: "Peer Artist" });

  const sourceRelease = releaseFactory.build({
    instance_id: "source-instance",
    basic_information: basicInformationFactory.build({
      styles: ["Techno", "Ambient"],
      genres: ["Electronic"],
      master_id: 100,
      title: "Source Album",
      year: 2018,
    }),
  });

  const buildPeer = (instanceId: string, title: string, masterId: number) =>
    releaseFactory.withStyles(["Techno"], {
      instance_id: instanceId,
      basic_information: {
        genres: ["Electronic"],
        master_id: masterId,
        title,
        year: 2018,
        artists: [otherArtist],
      },
    });

  it("when shuffle is invoked, surfaces a fresh similar batch for the same release", async () => {
    const peers = Array.from({ length: 34 }, (_, index) =>
      buildPeer(`peer-${index}`, `Peer ${index}`, 201 + index),
    );
    const collection = [sourceRelease, ...peers];

    const { result } = renderSimilarReleasesHookWithCollection(
      sourceRelease,
      collection,
    );

    await waitFor(() => {
      expect(result.current.similarReleases).toHaveLength(34);
    });

    expect(result.current.canShuffleSimilarReleases).toBe(true);

    const initialInstanceIds = result.current.similarReleases.map(
      (release) => release.instance_id,
    );

    act(() => {
      result.current.shuffleSimilarReleases();
    });

    await waitFor(() => {
      expect(
        result.current.similarReleases.map((release) => release.instance_id),
      ).not.toEqual(initialInstanceIds);
    });
  });

  it("when the release changes, resets shuffle state for the next anchor", async () => {
    const nextSource = releaseFactory.build({
      instance_id: "next-source",
      basic_information: basicInformationFactory.build({
        styles: ["House"],
        genres: ["Electronic"],
        master_id: 400,
        title: "Next Source",
        year: 2019,
      }),
    });
    const technoPeer = buildPeer("techno-peer", "Techno Peer", 150);
    const housePeer = releaseFactory.withStyles(["House"], {
      instance_id: "peer-a",
      basic_information: {
        genres: ["Electronic"],
        master_id: 201,
        title: "Peer A",
        year: 2019,
        artists: [otherArtist],
      },
    });
    const collection = [sourceRelease, nextSource, housePeer, technoPeer];

    const { result, rerender } = renderFeatureHook(
      ({ anchor }: { anchor: DiscogsRelease }) =>
        useSimilarReleasesInCollection(anchor, true),
      {
        includeCollectionSync: false,
        initialProps: { anchor: sourceRelease },
        wrapper: ({ children }) => (
          <SeedAllReleases releases={collection}>{children}</SeedAllReleases>
        ),
      },
    );

    await waitFor(() => {
      expect(result.current.similarReleases.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.shuffleSimilarReleases();
    });

    rerender({ anchor: nextSource });

    await waitFor(() => {
      expect(result.current.similarReleases).toHaveLength(1);
      expect(result.current.similarReleases[0]?.instance_id).toBe("peer-a");
    });
  });
});
