export const shouldPersistentIframeOwnEmbedLoad = ({
  isPlaybackEmbedMounted,
  hasRegisteredPlaybackIframe,
}: {
  isPlaybackEmbedMounted: boolean;
  hasRegisteredPlaybackIframe: boolean;
}): boolean => isPlaybackEmbedMounted || hasRegisteredPlaybackIframe;

export const shouldProviderImperativeLoadEmbed = (params: {
  isPlaybackEmbedMounted: boolean;
  hasRegisteredPlaybackIframe: boolean;
}): boolean => !shouldPersistentIframeOwnEmbedLoad(params);

export const shouldRegisterIframeImperativeLoadEmbed = ({
  isIframeElementChange,
  isRebindAfterUnregister,
  pendingPlayFromGesture,
  embedVideoId,
}: {
  isIframeElementChange: boolean;
  isRebindAfterUnregister: boolean;
  pendingPlayFromGesture: boolean;
  embedVideoId: string | null;
}): boolean =>
  pendingPlayFromGesture &&
  embedVideoId !== null &&
  (isIframeElementChange || isRebindAfterUnregister);
