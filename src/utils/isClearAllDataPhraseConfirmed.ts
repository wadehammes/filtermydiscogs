import { CLEAR_ALL_DATA_CONFIRM_PHRASE } from "src/constants/clearData.constants";

export const isClearAllDataPhraseConfirmed = (
  input: string,
  phrase: string = CLEAR_ALL_DATA_CONFIRM_PHRASE,
): boolean => input.trim() === phrase;
