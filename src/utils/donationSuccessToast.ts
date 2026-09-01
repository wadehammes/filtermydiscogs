import {
  DONATION_SUCCESS_QUERY_PARAM,
  DONATION_SUCCESS_QUERY_VALUE,
} from "src/constants/donate.constants";
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
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", nextUrl);
};
