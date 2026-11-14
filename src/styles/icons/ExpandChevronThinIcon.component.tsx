import expandStyles from "../modules/chevron-expand.module.css";
import ChevronDownThin from "./chevron-down-thin.svg";
import ChevronUpThin from "./chevron-up-thin.svg";

export const ExpandChevronThinIcon = () => (
  <>
    <ChevronDownThin className={expandStyles.chevronWhenClosed} />
    <ChevronUpThin className={expandStyles.chevronWhenOpen} />
  </>
);
