"use client";

import { ReleaseCardOverlayActions } from "src/components/ReleaseCard/ReleaseCardOverlayActions.component";
import { ReleaseNotesEditorProvider } from "src/components/ReleaseNotes/ReleaseNotesEditor.context";
import { useReleaseOpenHandler } from "src/hooks/useReleaseOpenHandler.hook";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getResourceUrl } from "src/utils/helpers";

interface ReleasesTableRowActionsProps {
  release: DiscogsRelease;
  onReleaseClick: (release: DiscogsRelease) => void;
}

export const ReleasesTableRowActions = ({
  release,
  onReleaseClick,
}: ReleasesTableRowActionsProps) => {
  const { openRelease, prefetchPointerProps } = useReleaseOpenHandler({
    release,
    onReleaseClick: (_instanceId: string) => {
      onReleaseClick(release);
    },
  });
  const releaseUrl = getResourceUrl({
    resourceUrl: release.basic_information.resource_url,
    type: "release",
  });

  return (
    <ReleaseNotesEditorProvider release={release}>
      <div {...definedProps(prefetchPointerProps ?? {})}>
        <ReleaseCardOverlayActions
          release={release}
          releaseUrl={releaseUrl}
          layout="table"
          notesVariant="table"
          onReleaseOpen={openRelease}
        />
      </div>
    </ReleaseNotesEditorProvider>
  );
};
