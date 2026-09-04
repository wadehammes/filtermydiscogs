import { describe, expect, it } from "@jest/globals";
import { render, screen } from "test-utils";
import {
  OverlayStack,
  usePortaledOverlayContainer,
} from "./OverlayStack.component";

const PortalConsumer = () => {
  const container = usePortaledOverlayContainer();
  return (
    <span data-testid="portal-consumer">
      {container ? "has-portal" : "no-portal"}
    </span>
  );
};

describe("OverlayStack", () => {
  it("exposes a portal mount for nested portaled popups", () => {
    render(
      <OverlayStack>
        <PortalConsumer />
      </OverlayStack>,
    );

    expect(screen.getByTestId("portal-consumer")).toHaveTextContent(
      "has-portal",
    );
    expect(
      document.querySelector("[data-overlay-stack-portal]"),
    ).toBeInTheDocument();
  });

  it("uses the nearest nested stack portal", () => {
    render(
      <OverlayStack>
        <OverlayStack>
          <PortalConsumer />
        </OverlayStack>
      </OverlayStack>,
    );

    const portals = document.querySelectorAll("[data-overlay-stack-portal]");
    expect(portals).toHaveLength(2);
    expect(screen.getByTestId("portal-consumer")).toHaveTextContent(
      "has-portal",
    );
  });

  it("mounts an escaped portal on document.body when escapeStackingContext is set", () => {
    render(
      <OverlayStack
        escapeStackingContext
        popoverZIndex="calc(var(--z-9-playback-dock) + 1)"
      >
        <PortalConsumer />
      </OverlayStack>,
    );

    expect(screen.getByTestId("portal-consumer")).toHaveTextContent(
      "has-portal",
    );

    const escapedPortal = document.body.querySelector(
      "[data-overlay-stack-escape]",
    );
    expect(escapedPortal).toBeInTheDocument();
    expect(escapedPortal).toHaveStyle({
      zIndex: "calc(var(--z-9-playback-dock) + 1)",
    });
  });

  it("uses drawer popover z-index when escapeStackingContext targets the bottom drawer", () => {
    render(
      <OverlayStack
        escapeStackingContext
        popoverZIndex="calc(var(--z-10-bottom-drawer) + 1)"
      >
        <PortalConsumer />
      </OverlayStack>,
    );

    const escapedPortal = document.body.querySelector(
      "[data-overlay-stack-escape]",
    );
    expect(escapedPortal).toHaveStyle({
      zIndex: "calc(var(--z-10-bottom-drawer) + 1)",
    });
  });
});
