"use client";

import { ReleaseCardOverlayActions } from "src/components/ReleaseCard/ReleaseCardOverlayActions.component";
import { ReleaseNotesEditorProvider } from "src/components/ReleaseNotes/ReleaseNotesEditor.context";
import type { DiscogsRelease } from "src/types";
import { getResourceUrl } from "src/utils/helpers";

interface ReleasesTableRowActionsProps {
  release: DiscogsRelease;
  onReleaseClick: (release: DiscogsRelease) => void;
}

export const ReleasesTableRowActions = ({
  release,
  onReleaseClick,
}: ReleasesTableRowActionsProps) => {
  const releaseUrl = getResourceUrl({
    resourceUrl: release.basic_information.resource_url,
    type: "release",
  });

  return (
    <ReleaseNotesEditorProvider release={release}>
      <ReleaseCardOverlayActions
        release={release}
        releaseUrl={releaseUrl}
        layout="table"
        notesVariant="table"
        onReleaseOpen={() => {
          onReleaseClick(release);
        }}
      />
    </ReleaseNotesEditorProvider>
  );
};
