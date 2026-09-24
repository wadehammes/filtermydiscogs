import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { useState } from "react";
import { api } from "src/api/urls";
import { CrateLayoutList } from "src/components/Crates/CrateLayoutList.component";
import { CollectionPlaybackPageShell } from "src/components/PlaybackPageShell/CollectionPlaybackPageShell.component";
import { CRATE_TEMP_MARKER_PREFIX } from "src/constants/crate";
import { crateLayoutItemFactory } from "src/tests/factories/CrateLayoutItem.factory";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import {
  expectReleaseOpenPrefetchAfterHover,
  setupReleaseOpenPrefetchHoverTimers,
  teardownReleaseOpenPrefetchHoverTimers,
} from "src/tests/utils/expectReleaseOpenPrefetchOnHover";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import type { CrateLayoutItem } from "src/types/crate.types";
import { render, screen, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const apiError = new Error("API request failed");

const CRATE_LAYOUT_ROW_HEIGHT = 72;

const crateLayoutListTopInsertInset = () => CRATE_LAYOUT_ROW_HEIGHT;

const crateLayoutListRowCenterY = (rowIndex: number) =>
  crateLayoutListTopInsertInset() +
  rowIndex * CRATE_LAYOUT_ROW_HEIGHT +
  CRATE_LAYOUT_ROW_HEIGHT / 2;

let crateLayoutDragPointerY = 0;

const defaultLayoutRect = {
  x: 100,
  y: 200,
  width: 240,
  height: 44,
  top: 200,
  left: 100,
  right: 340,
  bottom: 244,
  toJSON: () => ({}),
} as DOMRect;

const parseTranslateY = (element: Element): number => {
  const transform = (element as HTMLElement).style.transform;

  if (!transform) {
    return 0;
  }

  const translate3dMatch = transform.match(
    /translate3d\(\s*[-\d.]+px,\s*([-\d.]+)px/,
  );

  if (translate3dMatch?.[1]) {
    return Number.parseFloat(translate3dMatch[1]);
  }

  const translateYMatch = transform.match(/translateY\(\s*([-\d.]+)px/);

  if (translateYMatch?.[1]) {
    return Number.parseFloat(translateYMatch[1]);
  }

  return 0;
};

const mockCrateLayoutListRowBoundingRects = () => {
  const rectSpy = jest.spyOn(HTMLElement.prototype, "getBoundingClientRect");

  rectSpy.mockImplementation(function (this: HTMLElement) {
    const isDragOverlayRow =
      this.tagName === "LI" &&
      this.querySelector('button[aria-hidden="true"]') &&
      !this.querySelector('button[aria-label="Reorder"]');

    if (isDragOverlayRow && crateLayoutDragPointerY > 0) {
      const top = crateLayoutDragPointerY - CRATE_LAYOUT_ROW_HEIGHT / 2;

      return {
        x: 0,
        y: top,
        width: 480,
        height: CRATE_LAYOUT_ROW_HEIGHT,
        top,
        left: 0,
        right: 480,
        bottom: top + CRATE_LAYOUT_ROW_HEIGHT,
        toJSON: () => ({}),
      } as DOMRect;
    }

    const list = this.closest('[data-testid="fmdCrateReleasesTable"]');

    if (list && this.tagName === "LI") {
      const listChildren = Array.from(list.querySelectorAll(":scope > li"));
      const selfIndex = listChildren.indexOf(this);
      const insertDropTestId = this.getAttribute("data-testid");

      if (
        selfIndex >= 0 &&
        insertDropTestId?.startsWith("fmdCrateLayoutInsertDrop-")
      ) {
        let top = 0;

        for (let i = 0; i < selfIndex; i++) {
          const sibling = listChildren[i];

          if (
            sibling?.querySelector('button[aria-label="Reorder"]') ||
            sibling
              ?.getAttribute("data-testid")
              ?.startsWith("fmdCrateLayoutInsertDrop-")
          ) {
            top += CRATE_LAYOUT_ROW_HEIGHT;
          }
        }

        return {
          x: 0,
          y: top,
          width: 480,
          height: CRATE_LAYOUT_ROW_HEIGHT,
          top,
          left: 0,
          right: 480,
          bottom: top + CRATE_LAYOUT_ROW_HEIGHT,
          toJSON: () => ({}),
        } as DOMRect;
      }

      const rows = Array.from(list.querySelectorAll(":scope > li")).filter(
        (row) => row.querySelector('button[aria-label="Reorder"]'),
      );
      const index = rows.indexOf(this);

      if (index >= 0) {
        const headInsertDrop = list.querySelector(
          ':scope > li[data-testid="fmdCrateLayoutInsertDrop-0"]',
        );
        const headInsertOffset = headInsertDrop ? CRATE_LAYOUT_ROW_HEIGHT : 0;
        const top =
          headInsertOffset +
          index * CRATE_LAYOUT_ROW_HEIGHT +
          parseTranslateY(this);

        return {
          x: 0,
          y: top,
          width: 480,
          height: CRATE_LAYOUT_ROW_HEIGHT,
          top,
          left: 0,
          right: 480,
          bottom: top + CRATE_LAYOUT_ROW_HEIGHT,
          toJSON: () => ({}),
        } as DOMRect;
      }
    }

    return defaultLayoutRect;
  });

  return () => {
    rectSpy.mockReturnValue(defaultLayoutRect);
  };
};

const layoutRelease = releaseFactory.withTitle("Layout Row Album", 249504, {
  instance_id: "layout-row-instance",
});

const layoutItems: CrateLayoutItem[] = [
  {
    kind: "release",
    instance_id: "layout-row-instance",
    sort_order: 1000,
    section_id: null,
    release: layoutRelease,
    found_at: null,
  },
];

const crateLayoutListTestWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <TestProviders
    authInitialState={testAuthenticatedAuthState}
    includeCollectionSync={false}
  >
    {children}
  </TestProviders>
);

const renderCrateLayoutList = (
  props: React.ComponentProps<typeof CrateLayoutList>,
) =>
  render(<CrateLayoutList {...props} />, {
    wrapper: crateLayoutListTestWrapper,
  });

const renderCrateLayoutWithEdgeInserts = (
  layoutItems: CrateLayoutItem[],
  props: Partial<React.ComponentProps<typeof CrateLayoutList>> = {},
) => {
  const CrateLayoutWithEdgeInserts = () => {
    const [topInsertMount, setTopInsertMount] = useState<HTMLElement | null>(
      null,
    );
    const [bottomInsertMount, setBottomInsertMount] =
      useState<HTMLElement | null>(null);

    return (
      <>
        <div
          ref={setTopInsertMount}
          data-testid="fmdCrateLayoutTopInsertMount"
        />
        <CrateLayoutList
          crateId="crate-1"
          layoutItems={layoutItems}
          hidePackedItems={false}
          packedEnabled={false}
          isPacked={() => false}
          setPacked={jest.fn()}
          removeFromCrate={jest.fn()}
          onReleaseClick={jest.fn()}
          topInsertMount={topInsertMount}
          bottomInsertMount={bottomInsertMount}
          {...props}
        />
        <div
          ref={setBottomInsertMount}
          data-testid="fmdCrateLayoutBottomInsertMount"
        />
      </>
    );
  };

  return render(<CrateLayoutWithEdgeInserts />, {
    wrapper: crateLayoutListTestWrapper,
  });
};

describe("CrateLayoutList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultCrateApiMocks(mockApi);
    setupFetchDiscogsReleaseMock(
      mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: 249504 }),
    );
    mockApiResponse(
      true,
      mockApi.discogsRelease,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: 249504 }),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.collectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      apiError,
    );
  });

  it("prefetches release detail when a row action is hovered", async () => {
    const onReleaseClick = jest.fn();
    const user = setupReleaseOpenPrefetchHoverTimers();

    render(
      <CrateLayoutList
        crateId="crate-1"
        layoutItems={layoutItems}
        hidePackedItems={false}
        packedEnabled={false}
        isPacked={() => false}
        setPacked={jest.fn()}
        removeFromCrate={jest.fn()}
        onReleaseClick={onReleaseClick}
      />,
      {
        wrapper: ({ children }) => (
          <TestProviders
            authInitialState={testAuthenticatedAuthState}
            includeCollectionSync={false}
          >
            {children}
          </TestProviders>
        ),
      },
    );

    try {
      await expectReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByRole("button", {
          name: `Remove ${layoutRelease.basic_information.title} from crate`,
        }),
        mockDiscogsRelease: mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });

  it("when remove is confirmed, removes the release from the crate", async () => {
    const removeFromCrate = jest.fn();
    const user = userEvent.setup();

    render(
      <CrateLayoutList
        crateId="crate-1"
        layoutItems={layoutItems}
        hidePackedItems={false}
        packedEnabled={false}
        isPacked={() => false}
        setPacked={jest.fn()}
        removeFromCrate={removeFromCrate}
        onReleaseClick={jest.fn()}
      />,
      {
        wrapper: ({ children }) => (
          <TestProviders
            authInitialState={testAuthenticatedAuthState}
            includeCollectionSync={false}
          >
            {children}
          </TestProviders>
        ),
      },
    );

    await user.click(
      screen.getByRole("button", {
        name: `Remove ${layoutRelease.basic_information.title} from crate`,
      }),
    );

    expect(
      screen.getByText(
        `Remove "${layoutRelease.basic_information.title}" from this crate? It stays in your collection.`,
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /^remove from crate$/i }),
    );

    expect(removeFromCrate).toHaveBeenCalledWith("layout-row-instance");
  });

  it("when remove is cancelled, does not remove the release from the crate", async () => {
    const removeFromCrate = jest.fn();
    const user = userEvent.setup();

    render(
      <CrateLayoutList
        crateId="crate-1"
        layoutItems={layoutItems}
        hidePackedItems={false}
        packedEnabled={false}
        isPacked={() => false}
        setPacked={jest.fn()}
        removeFromCrate={removeFromCrate}
        onReleaseClick={jest.fn()}
      />,
      {
        wrapper: ({ children }) => (
          <TestProviders
            authInitialState={testAuthenticatedAuthState}
            includeCollectionSync={false}
          >
            {children}
          </TestProviders>
        ),
      },
    );

    await user.click(
      screen.getByRole("button", {
        name: `Remove ${layoutRelease.basic_information.title} from crate`,
      }),
    );
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(removeFromCrate).not.toHaveBeenCalled();
  });

  it("when remove section is clicked on the first persisted section, opens the confirm dialog before removing", async () => {
    const user = userEvent.setup();
    const sectionLayout = crateLayoutItemFactory.list([
      crateLayoutItemFactory.marker("peak-section", 1000, {
        label: "Peak hour",
      }),
      crateLayoutItemFactory.release("layout-row-instance", 2000, null, {
        release: layoutRelease,
      }),
    ]);

    renderCrateLayoutList({
      crateId: "crate-1",
      layoutItems: sectionLayout,
      hidePackedItems: false,
      packedEnabled: false,
      isPacked: () => false,
      setPacked: jest.fn(),
      removeFromCrate: jest.fn(),
      onReleaseClick: jest.fn(),
    });

    await user.click(
      screen.getByRole("button", { name: "Remove section Peak hour" }),
    );

    expect(
      screen.getByText(
        'Remove "Peak hour" from this crate? Releases stay in the list; nested groups move up one level.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Section label")).toHaveValue("Peak hour");
  });

  it("when removing the first persisted section on the crate detail shell, keeps the confirm dialog open until confirmed", async () => {
    const user = userEvent.setup();
    const persistedSectionId = "b2222222-2222-4222-8222-222222222222";
    const sectionLayout = crateLayoutItemFactory.list([
      crateLayoutItemFactory.marker(persistedSectionId, 1000, {
        label: "Opening set",
      }),
      crateLayoutItemFactory.release("layout-row-instance", 2000, null, {
        release: layoutRelease,
      }),
    ]);

    const CrateLayoutOnDetailShell = () => {
      const [topInsertMount, setTopInsertMount] = useState<HTMLElement | null>(
        null,
      );
      const [bottomInsertMount, setBottomInsertMount] =
        useState<HTMLElement | null>(null);

      return (
        <TestProviders
          authInitialState={testAuthenticatedAuthState}
          includeCollectionSync={false}
        >
          <CollectionPlaybackPageShell currentPage="crates" hideFilters>
            <div
              ref={setTopInsertMount}
              data-testid="fmdCrateLayoutTopInsertMount"
            />
            <CrateLayoutList
              crateId="crate-1"
              layoutItems={sectionLayout}
              hidePackedItems={false}
              packedEnabled={false}
              isPacked={() => false}
              setPacked={jest.fn()}
              removeFromCrate={jest.fn()}
              onReleaseClick={jest.fn()}
              topInsertMount={topInsertMount}
              bottomInsertMount={bottomInsertMount}
            />
            <div
              ref={setBottomInsertMount}
              data-testid="fmdCrateLayoutBottomInsertMount"
            />
          </CollectionPlaybackPageShell>
        </TestProviders>
      );
    };

    render(<CrateLayoutOnDetailShell />);

    await user.click(
      screen.getByRole("button", { name: "Remove section Opening set" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          'Remove "Opening set" from this crate? Releases stay in the list; nested groups move up one level.',
        ),
      ).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Section label")).toHaveValue("Opening set");
  });

  it("when remove section is clicked on a temp first-section marker, opens the confirm dialog before removing", async () => {
    const user = userEvent.setup();
    const tempSectionLayout = crateLayoutItemFactory.list([
      crateLayoutItemFactory.marker(
        `${CRATE_TEMP_MARKER_PREFIX}first-section`,
        1000,
        { label: "New section" },
      ),
      crateLayoutItemFactory.release("layout-row-instance", 2000, null, {
        release: layoutRelease,
      }),
    ]);

    renderCrateLayoutList({
      crateId: "crate-1",
      layoutItems: tempSectionLayout,
      hidePackedItems: false,
      packedEnabled: false,
      isPacked: () => false,
      setPacked: jest.fn(),
      removeFromCrate: jest.fn(),
      onReleaseClick: jest.fn(),
    });

    await user.click(
      screen.getByRole("button", { name: "Remove section New section" }),
    );

    expect(
      screen.getByText(
        'Remove "New section" from this crate? Releases stay in the list; nested groups move up one level.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Section label")).toHaveValue("New section");
  });

  it("when the user adds the first section then clicks remove, opens the confirm dialog before removing", async () => {
    const user = userEvent.setup();

    renderCrateLayoutList({
      crateId: "crate-1",
      layoutItems,
      hidePackedItems: false,
      packedEnabled: false,
      isPacked: () => false,
      setPacked: jest.fn(),
      removeFromCrate: jest.fn(),
      onReleaseClick: jest.fn(),
    });

    const addSectionButtons = screen.getAllByRole("button", {
      name: "Add section (splits the list here)",
    });
    const firstAddSectionButton = addSectionButtons[0];

    if (!firstAddSectionButton) {
      throw new Error("Expected an Add section control");
    }

    await user.click(firstAddSectionButton);

    await user.click(
      screen.getByRole("button", { name: "Remove section New section" }),
    );

    expect(
      screen.getByText(
        'Remove "New section" from this crate? Releases stay in the list; nested groups move up one level.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Section label")).toHaveValue("New section");
  });

  it("when section remove is cancelled, keeps the section in the list", async () => {
    const user = userEvent.setup();
    const tempSectionLayout = crateLayoutItemFactory.list([
      crateLayoutItemFactory.marker(
        `${CRATE_TEMP_MARKER_PREFIX}keep-section`,
        1000,
        { label: "New section" },
      ),
      crateLayoutItemFactory.release("layout-row-instance", 2000, null, {
        release: layoutRelease,
      }),
    ]);

    renderCrateLayoutList({
      crateId: "crate-1",
      layoutItems: tempSectionLayout,
      hidePackedItems: false,
      packedEnabled: false,
      isPacked: () => false,
      setPacked: jest.fn(),
      removeFromCrate: jest.fn(),
      onReleaseClick: jest.fn(),
    });

    await user.click(
      screen.getByRole("button", { name: "Remove section New section" }),
    );
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(screen.getByLabelText("Section label")).toHaveValue("New section");
  });

  it("when section remove is confirmed, removes the section from the list", async () => {
    const user = userEvent.setup();
    const sectionLayout = crateLayoutItemFactory.list([
      crateLayoutItemFactory.marker("gone-section", 1000, {
        label: "Peak hour",
      }),
      crateLayoutItemFactory.release("layout-row-instance", 2000, null, {
        release: layoutRelease,
      }),
    ]);

    renderCrateLayoutList({
      crateId: "crate-1",
      layoutItems: sectionLayout,
      hidePackedItems: false,
      packedEnabled: false,
      isPacked: () => false,
      setPacked: jest.fn(),
      removeFromCrate: jest.fn(),
      onReleaseClick: jest.fn(),
    });

    await user.click(
      screen.getByRole("button", { name: "Remove section Peak hour" }),
    );
    await user.click(screen.getByRole("button", { name: /^remove section$/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Remove section Peak hour" }),
      ).not.toBeInTheDocument();
    });
  });

  it("when a subsection sits before parent member releases, still renders every parent member release", () => {
    const parentMemberOne = releaseFactory.withTitle("Parent Member One", 101, {
      instance_id: "parent-member-one",
    });
    const parentMemberTwo = releaseFactory.withTitle("Parent Member Two", 102, {
      instance_id: "parent-member-two",
    });
    const nestedSectionLayout: CrateLayoutItem[] = [
      {
        kind: "marker",
        id: "deep-section",
        label: "Deep",
        sort_order: 1000,
        parent_id: null,
        accent_key: null,
      },
      {
        kind: "marker",
        id: "nested-section",
        label: "Nested",
        sort_order: 1500,
        parent_id: "deep-section",
        accent_key: null,
      },
      {
        kind: "release",
        instance_id: "parent-member-one",
        sort_order: 2000,
        section_id: "deep-section",
        release: parentMemberOne,
        found_at: null,
      },
      {
        kind: "release",
        instance_id: "parent-member-two",
        sort_order: 3000,
        section_id: "deep-section",
        release: parentMemberTwo,
        found_at: null,
      },
    ];

    setupFetchDiscogsReleaseMock(
      mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: 101 }),
    );
    setupFetchDiscogsReleaseMock(
      mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: 102 }),
    );

    render(
      <CrateLayoutList
        crateId="crate-1"
        layoutItems={nestedSectionLayout}
        hidePackedItems={false}
        packedEnabled={false}
        isPacked={() => false}
        setPacked={jest.fn()}
        removeFromCrate={jest.fn()}
        onReleaseClick={jest.fn()}
      />,
      {
        wrapper: ({ children }) => (
          <TestProviders
            authInitialState={testAuthenticatedAuthState}
            includeCollectionSync={false}
          >
            {children}
          </TestProviders>
        ),
      },
    );

    expect(screen.getByText("Parent Member One")).toBeInTheDocument();
    expect(screen.getByText("Parent Member Two")).toBeInTheDocument();
  });

  it("when the next row is a section marker, omits the inline insert zone between the loose release and the section", () => {
    const sectionLayout: CrateLayoutItem[] = [
      {
        kind: "release",
        instance_id: "loose-one",
        sort_order: 500,
        section_id: null,
        release: releaseFactory.withTitle("Loose One", 201, {
          instance_id: "loose-one",
        }),
        found_at: null,
      },
      {
        kind: "marker",
        id: "section-a",
        label: "Section A",
        sort_order: 1000,
        parent_id: null,
        accent_key: null,
      },
      {
        kind: "release",
        instance_id: "member-one",
        sort_order: 2000,
        section_id: "section-a",
        release: releaseFactory.withTitle("Member One", 202, {
          instance_id: "member-one",
        }),
        found_at: null,
      },
    ];

    render(
      <CrateLayoutList
        crateId="crate-1"
        layoutItems={sectionLayout}
        hidePackedItems={false}
        packedEnabled={false}
        isPacked={() => false}
        setPacked={jest.fn()}
        removeFromCrate={jest.fn()}
        onReleaseClick={jest.fn()}
      />,
      {
        wrapper: ({ children }) => (
          <TestProviders
            authInitialState={testAuthenticatedAuthState}
            includeCollectionSync={false}
          >
            {children}
          </TestProviders>
        ),
      },
    );

    expect(
      screen.getAllByRole("button", {
        name: "Add section (splits the list here)",
      }),
    ).toHaveLength(3);
  });

  it("when two loose releases stack in a row, renders top, middle, and bottom insert zones", () => {
    const loosePairLayout: CrateLayoutItem[] = [
      {
        kind: "release",
        instance_id: "loose-one",
        sort_order: 1000,
        section_id: null,
        release: releaseFactory.withTitle("Loose One", 301, {
          instance_id: "loose-one",
        }),
        found_at: null,
      },
      {
        kind: "release",
        instance_id: "loose-two",
        sort_order: 2000,
        section_id: null,
        release: releaseFactory.withTitle("Loose Two", 302, {
          instance_id: "loose-two",
        }),
        found_at: null,
      },
    ];

    render(
      <CrateLayoutList
        crateId="crate-1"
        layoutItems={loosePairLayout}
        hidePackedItems={false}
        packedEnabled={false}
        isPacked={() => false}
        setPacked={jest.fn()}
        removeFromCrate={jest.fn()}
        onReleaseClick={jest.fn()}
      />,
      {
        wrapper: ({ children }) => (
          <TestProviders
            authInitialState={testAuthenticatedAuthState}
            includeCollectionSync={false}
          >
            {children}
          </TestProviders>
        ),
      },
    );

    expect(
      screen.getAllByRole("button", {
        name: "Add section (splits the list here)",
      }),
    ).toHaveLength(3);
  });

  it("when pointer reordering a release row, reorders rows and schedules a debounced layout save", async () => {
    jest.useFakeTimers();
    const restoreBoundingRects = mockCrateLayoutListRowBoundingRects();
    crateLayoutDragPointerY = 0;
    const setTimeoutSpy = jest.spyOn(global, "setTimeout");
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    try {
      const firstRelease = releaseFactory.withTitle("Drag First", 501, {
        instance_id: "drag-first",
      });
      const secondRelease = releaseFactory.withTitle("Drag Second", 502, {
        instance_id: "drag-second",
      });
      const dragLayout: CrateLayoutItem[] = [
        {
          kind: "release",
          instance_id: "drag-first",
          sort_order: 1000,
          section_id: null,
          release: firstRelease,
          found_at: null,
        },
        {
          kind: "release",
          instance_id: "drag-second",
          sort_order: 2000,
          section_id: null,
          release: secondRelease,
          found_at: null,
        },
      ];

      render(
        <CrateLayoutList
          crateId="crate-1"
          layoutItems={dragLayout}
          hidePackedItems={false}
          packedEnabled={false}
          isPacked={() => false}
          setPacked={jest.fn()}
          removeFromCrate={jest.fn()}
          onReleaseClick={jest.fn()}
        />,
        {
          wrapper: ({ children }) => (
            <TestProviders
              authInitialState={testAuthenticatedAuthState}
              includeCollectionSync={false}
            >
              {children}
            </TestProviders>
          ),
        },
      );

      const handles = screen.getAllByRole("button", { name: "Reorder" });
      const firstHandle = handles[0];
      const secondHandle = handles[1];

      if (!(firstHandle && secondHandle)) {
        throw new Error("Expected sortable release rows");
      }

      const firstRowCenterY = crateLayoutListRowCenterY(0);
      const secondRowCenterY = crateLayoutListRowCenterY(1);

      crateLayoutDragPointerY = secondRowCenterY;

      await user.pointer([
        { keys: "[MouseLeft>]", target: firstHandle },
        {
          target: firstHandle,
          coords: { clientX: 10, clientY: firstRowCenterY },
        },
        { coords: { clientX: 10, clientY: secondRowCenterY } },
        {
          target: secondHandle,
          coords: { clientX: 10, clientY: secondRowCenterY },
        },
        { keys: "[/MouseLeft]", target: secondHandle },
      ]);

      await waitFor(() => {
        const handlesAfter = screen.getAllByRole("button", { name: "Reorder" });
        expect(handlesAfter[0]).toBe(secondHandle);
      });

      expect(setTimeoutSpy.mock.calls.some(([, delay]) => delay === 300)).toBe(
        true,
      );
    } finally {
      crateLayoutDragPointerY = 0;
      setTimeoutSpy.mockRestore();
      restoreBoundingRects();
      jest.useRealTimers();
    }
  });

  it("when the crate detail shell uses edge insert mounts with no groups, dropping on the top insert target moves a release above the first row", async () => {
    const restoreBoundingRects = mockCrateLayoutListRowBoundingRects();
    crateLayoutDragPointerY = 0;
    const user = userEvent.setup();

    try {
      const firstRelease = releaseFactory.withTitle("Top Row", 601, {
        instance_id: "edge-top-first",
      });
      const secondRelease = releaseFactory.withTitle("Second Row", 602, {
        instance_id: "edge-top-second",
      });
      const dragLayout: CrateLayoutItem[] = [
        {
          kind: "release",
          instance_id: "edge-top-first",
          sort_order: 1000,
          section_id: null,
          release: firstRelease,
          found_at: null,
        },
        {
          kind: "release",
          instance_id: "edge-top-second",
          sort_order: 2000,
          section_id: null,
          release: secondRelease,
          found_at: null,
        },
      ];

      renderCrateLayoutWithEdgeInserts(dragLayout);

      const handles = screen.getAllByRole("button", { name: "Reorder" });
      const secondHandle = handles[1];

      if (!secondHandle) {
        throw new Error("Expected two sortable release rows");
      }

      crateLayoutDragPointerY = 12;

      await user.pointer([
        { keys: "[MouseLeft>]", target: secondHandle },
        {
          target: secondHandle,
          coords: { clientX: 10, clientY: CRATE_LAYOUT_ROW_HEIGHT * 1.5 },
        },
      ]);

      const topInsertDrop = await waitFor(() =>
        screen.getByTestId("fmdCrateLayoutInsertDrop-0"),
      );

      await user.pointer([
        { target: topInsertDrop, coords: { clientX: 10, clientY: 12 } },
        { keys: "[/MouseLeft]", target: topInsertDrop },
      ]);

      await waitFor(() => {
        const handlesAfter = screen.getAllByRole("button", { name: "Reorder" });
        expect(handlesAfter[0]).toBe(secondHandle);
      });
    } finally {
      crateLayoutDragPointerY = 0;
      restoreBoundingRects();
    }
  });

  it("when edge insert mounts are used, dragging the first row does not show the top list insert drop target", async () => {
    const restoreBoundingRects = mockCrateLayoutListRowBoundingRects();
    crateLayoutDragPointerY = 0;
    const user = userEvent.setup();

    try {
      const dragLayout: CrateLayoutItem[] = [
        {
          kind: "release",
          instance_id: "only-first",
          sort_order: 1000,
          section_id: null,
          release: releaseFactory.withTitle("Only First", 621, {
            instance_id: "only-first",
          }),
          found_at: null,
        },
        {
          kind: "release",
          instance_id: "only-second",
          sort_order: 2000,
          section_id: null,
          release: releaseFactory.withTitle("Only Second", 622, {
            instance_id: "only-second",
          }),
          found_at: null,
        },
      ];

      renderCrateLayoutWithEdgeInserts(dragLayout);

      const firstHandle = screen.getAllByRole("button", {
        name: "Reorder",
      })[0];

      if (!firstHandle) {
        throw new Error("Expected two sortable release rows");
      }

      await user.pointer([
        { keys: "[MouseLeft>]", target: firstHandle },
        {
          target: firstHandle,
          coords: { clientX: 10, clientY: CRATE_LAYOUT_ROW_HEIGHT / 2 },
        },
      ]);

      expect(
        screen.queryByTestId("fmdCrateLayoutInsertDrop-0"),
      ).not.toBeInTheDocument();

      await user.pointer([{ keys: "[/MouseLeft]", target: firstHandle }]);
    } finally {
      crateLayoutDragPointerY = 0;
      restoreBoundingRects();
    }
  });

  it("when edge insert mounts are used with no groups, dropping on the bottom insert target moves a release after the last row", async () => {
    const restoreBoundingRects = mockCrateLayoutListRowBoundingRects();
    crateLayoutDragPointerY = 0;
    const user = userEvent.setup();

    try {
      const firstRelease = releaseFactory.withTitle("Bottom First", 701, {
        instance_id: "edge-bottom-first",
      });
      const secondRelease = releaseFactory.withTitle("Bottom Last", 702, {
        instance_id: "edge-bottom-second",
      });
      const dragLayout: CrateLayoutItem[] = [
        {
          kind: "release",
          instance_id: "edge-bottom-first",
          sort_order: 1000,
          section_id: null,
          release: firstRelease,
          found_at: null,
        },
        {
          kind: "release",
          instance_id: "edge-bottom-second",
          sort_order: 2000,
          section_id: null,
          release: secondRelease,
          found_at: null,
        },
      ];

      renderCrateLayoutWithEdgeInserts(dragLayout);

      const handles = screen.getAllByRole("button", { name: "Reorder" });
      const firstHandle = handles[0];
      const secondHandle = handles[1];

      if (!(firstHandle && secondHandle)) {
        throw new Error("Expected two sortable release rows");
      }

      crateLayoutDragPointerY = 220;

      await user.pointer([
        { keys: "[MouseLeft>]", target: firstHandle },
        {
          target: firstHandle,
          coords: { clientX: 10, clientY: CRATE_LAYOUT_ROW_HEIGHT / 2 },
        },
      ]);

      const bottomInsertDrop = await waitFor(() =>
        screen.getByTestId("fmdCrateLayoutInsertDrop-2"),
      );

      await user.pointer([
        { target: bottomInsertDrop, coords: { clientX: 10, clientY: 220 } },
        { keys: "[/MouseLeft]", target: bottomInsertDrop },
      ]);

      await waitFor(() => {
        const handlesAfter = screen.getAllByRole("button", { name: "Reorder" });
        expect(handlesAfter[0]).toBe(secondHandle);
      });
    } finally {
      crateLayoutDragPointerY = 0;
      restoreBoundingRects();
    }
  });

  it("when edge insert mounts are used with three loose releases, dropping on the top insert target moves the third row first", async () => {
    const restoreBoundingRects = mockCrateLayoutListRowBoundingRects();
    crateLayoutDragPointerY = 0;
    const user = userEvent.setup();

    try {
      const dragLayout: CrateLayoutItem[] = [
        {
          kind: "release",
          instance_id: "tri-a",
          sort_order: 1000,
          section_id: null,
          release: releaseFactory.withTitle("Tri A", 801, {
            instance_id: "tri-a",
          }),
          found_at: null,
        },
        {
          kind: "release",
          instance_id: "tri-b",
          sort_order: 2000,
          section_id: null,
          release: releaseFactory.withTitle("Tri B", 802, {
            instance_id: "tri-b",
          }),
          found_at: null,
        },
        {
          kind: "release",
          instance_id: "tri-c",
          sort_order: 3000,
          section_id: null,
          release: releaseFactory.withTitle("Tri C", 803, {
            instance_id: "tri-c",
          }),
          found_at: null,
        },
      ];

      renderCrateLayoutWithEdgeInserts(dragLayout);

      const handles = screen.getAllByRole("button", { name: "Reorder" });
      const thirdHandle = handles[2];

      if (!thirdHandle) {
        throw new Error("Expected three sortable release rows");
      }

      crateLayoutDragPointerY = 8;

      await user.pointer([
        { keys: "[MouseLeft>]", target: thirdHandle },
        {
          target: thirdHandle,
          coords: { clientX: 10, clientY: CRATE_LAYOUT_ROW_HEIGHT * 2.5 },
        },
      ]);

      const topInsertDrop = await waitFor(() =>
        screen.getByTestId("fmdCrateLayoutInsertDrop-0"),
      );

      await user.pointer([
        { target: topInsertDrop, coords: { clientX: 10, clientY: 8 } },
        { keys: "[/MouseLeft]", target: topInsertDrop },
      ]);

      await waitFor(() => {
        expect(screen.getAllByText(/Tri [ABC]/)[0]).toHaveTextContent("Tri C");
      });
    } finally {
      crateLayoutDragPointerY = 0;
      restoreBoundingRects();
    }
  });

  it("when edge insert mounts are off, dragging onto the upper half of the first row moves a lower release above it", async () => {
    const restoreBoundingRects = mockCrateLayoutListRowBoundingRects();
    crateLayoutDragPointerY = 0;
    const user = userEvent.setup();

    try {
      const dragLayout: CrateLayoutItem[] = [
        {
          kind: "release",
          instance_id: "inline-first",
          sort_order: 1000,
          section_id: null,
          release: releaseFactory.withTitle("Inline First", 901, {
            instance_id: "inline-first",
          }),
          found_at: null,
        },
        {
          kind: "release",
          instance_id: "inline-second",
          sort_order: 2000,
          section_id: null,
          release: releaseFactory.withTitle("Inline Second", 902, {
            instance_id: "inline-second",
          }),
          found_at: null,
        },
      ];

      renderCrateLayoutList({
        crateId: "crate-1",
        layoutItems: dragLayout,
        hidePackedItems: false,
        packedEnabled: false,
        isPacked: () => false,
        setPacked: jest.fn(),
        removeFromCrate: jest.fn(),
        onReleaseClick: jest.fn(),
      });

      const handles = screen.getAllByRole("button", { name: "Reorder" });
      const firstHandle = handles[0];
      const secondHandle = handles[1];

      if (!(firstHandle && secondHandle)) {
        throw new Error("Expected two sortable release rows");
      }

      const firstRowTopEdgeY = CRATE_LAYOUT_ROW_HEIGHT / 4;
      crateLayoutDragPointerY = firstRowTopEdgeY;

      await user.pointer([
        { keys: "[MouseLeft>]", target: secondHandle },
        {
          target: secondHandle,
          coords: { clientX: 10, clientY: CRATE_LAYOUT_ROW_HEIGHT * 1.5 },
        },
        {
          target: firstHandle,
          coords: { clientX: 10, clientY: firstRowTopEdgeY },
        },
        { keys: "[/MouseLeft]", target: firstHandle },
      ]);

      await waitFor(() => {
        const handlesAfter = screen.getAllByRole("button", { name: "Reorder" });
        expect(handlesAfter[0]).toBe(secondHandle);
      });
    } finally {
      crateLayoutDragPointerY = 0;
      restoreBoundingRects();
    }
  });
});
