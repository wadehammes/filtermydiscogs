import { getPage } from "src/client";
import { CONSTANTS as constant } from "src/utils/constants";
import {
  GetPageProps,
  makeGetStaticProps,
  PageComponent,
} from "src/utils/pageHelpers";

const getPageProps: GetPageProps = async ({
  preview = false,
  locale = "en",
}) => {
  const page = await getPage({
    slug: constant.RH_HOME_PAGE_SLUG,
    preview,
  });

  return {
    page,
    locale,
    preview,
  };
};

export const getStaticProps = makeGetStaticProps(getPageProps);

export default PageComponent;
