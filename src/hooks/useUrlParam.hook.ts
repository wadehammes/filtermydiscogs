import { useEffect, useState } from "react";

interface UrlParam {
  queryParam: string;
  storageParam?: string;
  defaultValue?: string;
  persist?: boolean;
}

export const useUrlParam = ({
  queryParam,
  storageParam,
  defaultValue = "",
  persist = false,
}: UrlParam) => {
  const [param, setParam] = useState<string>(defaultValue);

  useEffect(() => {
    const {
      location: { search },
      localStorage,
    } = window;

    const currentSearchParams = new URLSearchParams(search);
    const urlParam = currentSearchParams.get(queryParam);
    const localParam = storageParam && localStorage.getItem(storageParam);

    if (urlParam && localParam !== urlParam) {
      setParam(urlParam);
    } else if (persist && localParam) {
      setParam(localParam);
    } else if (persist && defaultValue) {
      setParam(defaultValue);
    } else {
      if (urlParam) {
        if (storageParam) {
          localStorage.setItem(storageParam, urlParam);
        }

        setParam(urlParam);
      } else {
        setParam(defaultValue);
      }
    }
  }, [defaultValue, persist, queryParam, storageParam]);

  return param;
};
