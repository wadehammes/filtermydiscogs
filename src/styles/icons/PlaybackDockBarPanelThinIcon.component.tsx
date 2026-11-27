import type { SVGProps } from "react";

const PLAYBACK_DOCK_PANEL_OUTLINE =
  "M3.5 2.75h9a.75.75 0 0 1 .75.75v9.5a.75.75 0 0 1-.75.75h-9a.75.75 0 0 1-.75-.75V3.5a.75.75 0 0 1 .75-.75z";

const PLAYBACK_DOCK_BAR_FILL = "M4.5 10H11.5V12.25H4.5V10Z";

const PLAYBACK_DOCK_BAR_RULE = "M4.5 10H11.5";

interface PlaybackDockBarPanelThinIconProps extends SVGProps<SVGSVGElement> {
  dockBarSolid: boolean;
}

export const PlaybackDockBarPanelThinIcon = ({
  dockBarSolid,
  ...props
}: PlaybackDockBarPanelThinIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...props}
  >
    <path d={PLAYBACK_DOCK_PANEL_OUTLINE} />
    <path
      d={PLAYBACK_DOCK_BAR_FILL}
      fill="currentColor"
      fillOpacity={dockBarSolid ? 1 : 0.35}
      stroke="none"
    />
    <path d={PLAYBACK_DOCK_BAR_RULE} strokeLinecap="butt" />
  </svg>
);
