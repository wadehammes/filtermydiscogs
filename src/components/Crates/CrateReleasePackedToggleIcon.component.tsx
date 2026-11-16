import { CheckThinIcon } from "src/styles/icons/CheckThinIcon.component";
import { RecordBagThinIcon } from "src/styles/icons/RecordBagThinIcon.component";

interface CrateReleasePackedToggleIconProps {
  packed: boolean;
}

export const CrateReleasePackedToggleIcon = ({
  packed,
}: CrateReleasePackedToggleIconProps) =>
  packed ? <CheckThinIcon /> : <RecordBagThinIcon />;
