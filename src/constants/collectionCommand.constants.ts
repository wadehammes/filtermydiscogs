export const COLLECTION_COMMAND_PROMPT_MAX_LENGTH = 500;

export const COLLECTION_COMMAND_PROMPT_HISTORY_MAX = 15;

export const DEFAULT_COLLECTION_COMMAND_SHORTCUT = "mod+shift+k";

export const COLLECTION_COMMAND_AI_MODEL_ENV = "COLLECTION_COMMAND_AI_MODEL";

export const COLLECTION_COMMAND_GATEWAY_KEY_ENV = "AI_GATEWAY_API_KEY";

export const DEFAULT_COLLECTION_COMMAND_AI_MODEL = "openai/gpt-4o-mini";

export const COLLECTION_COMMAND_REPORT_ISSUE_LABEL = "Report command issue";

export const COLLECTION_COMMAND_CHIP_LABEL = "Ask";

export const COLLECTION_COMMAND_CLEAR_RECENT_LABEL = "Clear recent";

export const COLLECTION_COMMAND_START_OVER_LABEL = "Start over";

export const COLLECTION_COMMAND_INPUT_PLACEHOLDER =
  "Ask about your collection…";

export const COLLECTION_COMMAND_OPEN_TOOLTIP_LEDE =
  "Ask your collection in plain English";

export const COLLECTION_COMMAND_EXAMPLE_PROMPT_MAX_LENGTH = 72;

export const COLLECTION_COMMAND_EXAMPLE_PROMPTS_FALLBACK = [
  "Show me House AND Disco releases from the 2010s",
  'Save a view named "Sunday spins"',
  "Create a crate from ambient vinyl",
] as const;
