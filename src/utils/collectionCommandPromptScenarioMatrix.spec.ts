import { describe, expect, it } from "@jest/globals";
import { SortSecondaryValues, SortValues } from "src/constants/sortValues";
import type { CollectionCommandIntent } from "src/lib/validation/collectionCommand.schemas";
import { collectionCommandIntentFactory } from "src/tests/factories/CollectionCommandIntent.factory";
import { applyCollectionCommandPromptRules } from "src/utils/collectionCommandPromptRules";
import { COLLECTION_COMMAND_PROMPT_SCENARIO_MATRIX } from "src/utils/collectionCommandPromptScenarioMatrix";

const referenceDate = new Date("2026-11-27T12:00:00.000Z");

const withLlm = (
  attributes?: Partial<CollectionCommandIntent>,
): CollectionCommandIntent =>
  collectionCommandIntentFactory.build({
    selectedSort: SortValues.DateAddedNew,
    selectedSortSecondary: SortSecondaryValues.None,
    ...attributes,
  });

describe("collectionCommandPromptScenarioMatrix", () => {
  for (const scenario of COLLECTION_COMMAND_PROMPT_SCENARIO_MATRIX) {
    it(`[${scenario.category}] ${scenario.id}`, () => {
      const merged = applyCollectionCommandPromptRules(
        withLlm(scenario.llm),
        scenario.prompt,
        referenceDate,
      );

      expect(merged).toMatchObject(scenario.expected);
    });
  }
});
