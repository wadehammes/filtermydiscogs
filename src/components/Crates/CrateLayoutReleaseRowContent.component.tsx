"use client";

import classNames from "classnames";
import Image from "next/image";
import type { ReactNode } from "react";
import { ReleaseCardMeta } from "src/components/ReleaseCard/ReleaseCardMeta.component";
import { ReleaseHeaderArtistLine } from "src/components/ReleaseCard/ReleaseHeaderLinks.component";
import type { CrateLayoutReleaseItem } from "src/types/crate.types";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import styles from "./CrateLayoutList.module.css";
import listStyles from "./CrateReleaseList.module.css";

interface CrateLayoutReleaseRowContentProps {
  item: CrateLayoutReleaseItem;
  dragHandle: ReactNode;
  identityActions?: {
    openRelease: () => void;
    releaseOpenFocusProps: Record<string, unknown>;
  };
  noteSlot?: ReactNode;
  actions?: ReactNode;
  overlayPreview?: boolean;
}

export const CrateLayoutReleaseRowContent = ({
  item,
  dragHandle,
  identityActions,
  noteSlot,
  actions,
  overlayPreview = false,
}: CrateLayoutReleaseRowContentProps) => {
  const release = item.release;
  const { basic_information } = release;
  const { artists, labels, title, year } = basic_information;
  const labelUrl = getResourceUrl({
    resourceUrl: labels[0]?.resource_url,
    type: "label",
  });
  const imageUrl = getReleaseImageUrl({
    thumb: basic_information.thumb,
    cover_image: basic_information.cover_image,
    width: 112,
    height: 112,
    preferCoverImage: true,
  });

  const cover = (
    <span className={listStyles.cover}>
      <Image
        src={imageUrl}
        alt=""
        width={56}
        height={56}
        sizes="(width >= 1024px) 56px, 48px"
      />
    </span>
  );

  return (
    <>
      {dragHandle}
      <div className={listStyles.identity}>
        {identityActions && !overlayPreview ? (
          <button
            type="button"
            className={listStyles.identityCoverButton}
            onClick={identityActions.openRelease}
            aria-label={`Open ${title}`}
            {...identityActions.releaseOpenFocusProps}
          >
            {cover}
          </button>
        ) : (
          <span className={listStyles.identityCoverButton}>{cover}</span>
        )}
        <div className={listStyles.identityText}>
          <ReleaseHeaderArtistLine
            artists={artists}
            className={listStyles.identityArtist}
            linkClassName={listStyles.identityMetaLink}
          />
          {identityActions && !overlayPreview ? (
            <button
              type="button"
              className={listStyles.identityTitle}
              onClick={identityActions.openRelease}
              {...identityActions.releaseOpenFocusProps}
            >
              {title}
            </button>
          ) : (
            <span className={listStyles.identityTitle}>{title}</span>
          )}
          <ReleaseCardMeta
            labelName={labels[0]?.name}
            labelUrl={labelUrl}
            year={year}
            metaClassName={listStyles.identityMeta}
          />
        </div>
      </div>
      {noteSlot ? <div className={listStyles.noteSlot}>{noteSlot}</div> : null}
      {actions ? <div className={listStyles.actions}>{actions}</div> : null}
    </>
  );
};

export const crateLayoutReleaseRowClassName = ({
  packedEnabled,
  packed,
  isDragging,
  overlayPreview,
}: {
  packedEnabled: boolean;
  packed: boolean;
  isDragging?: boolean;
  overlayPreview?: boolean;
}) =>
  classNames(
    listStyles.row,
    styles.layoutReleaseRow,
    styles.releaseRowWithHandle,
    {
      [styles.layoutReleaseRowPacked]: packedEnabled && packed,
      [styles.releaseRowDragging]: isDragging,
      [styles.releaseRowDragOverlay]: overlayPreview,
    },
  );
