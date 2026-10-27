export const isPublicPlaylistOwnerViewer = (
  ownerUserId: number,
  viewerUserId: number | null | undefined,
): boolean => viewerUserId != null && viewerUserId === ownerUserId;
