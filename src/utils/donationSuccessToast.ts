import {
  DONATION_SUCCESS_QUERY_PARAM,
  DONATION_SUCCESS_QUERY_VALUE,
} from "src/constants/donate.constants";
import { replacePathHash } from "src/utils/hashNavigation";
import { toast } from "src/utils/toast";

export const handleDonationSuccessReturn = (handledRef: {
  current: boolean;
}) => {
  if (handledRef.current) {
    return;
  }

  const params = new URLSearchParams(window.location.search);

  if (
    params.get(DONATION_SUCCESS_QUERY_PARAM) !== DONATION_SUCCESS_QUERY_VALUE
  ) {
    return;
  }

  handledRef.current = true;

  toast.success("Thank you for your support!");

  params.delete(DONATION_SUCCESS_QUERY_PARAM);
  const query = params.toString();

  replacePathHash({
    pathname: window.location.pathname,
    hash: window.location.hash,
    search: query ? `?${query}` : "",
  });
};
