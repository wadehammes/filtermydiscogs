import { RELEASE_MODAL_INSTANCE_PARAM } from "src/constants";

interface BuildPathWithReleaseInstanceParams {
  pathname: string;
  searchParams: Pick<URLSearchParams, "toString">;
  instanceId: string | null;
}

export const buildPathWithReleaseInstance = ({
  pathname,
  searchParams,
  instanceId,
}: BuildPathWithReleaseInstanceParams): string => {
  const params = new URLSearchParams(searchParams.toString());

  if (instanceId) {
    params.set(RELEASE_MODAL_INSTANCE_PARAM, instanceId);
  } else {
    params.delete(RELEASE_MODAL_INSTANCE_PARAM);
  }

  const queryString = params.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
};

export const parseReleaseInstanceFromSearchParams = (
  searchParams: Pick<URLSearchParams, "get">,
): string | null => searchParams.get(RELEASE_MODAL_INSTANCE_PARAM);
