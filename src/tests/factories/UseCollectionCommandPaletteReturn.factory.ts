import { faker } from "@faker-js/faker";
import { jest } from "@jest/globals";
import {
  COLLECTION_COMMAND_EXAMPLE_PROMPTS_FALLBACK,
  DEFAULT_COLLECTION_COMMAND_SHORTCUT,
} from "src/constants/collectionCommand.constants";
import type { useCollectionCommandPalette } from "src/hooks/useCollectionCommandPalette.hook";
import { BaseFactory } from "src/tests/factories/BaseFactory";

export type UseCollectionCommandPaletteReturn = ReturnType<
  typeof useCollectionCommandPalette
>;

type UseCollectionCommandPaletteReturnFactoryOptions = Record<string, never>;

const createUseCollectionCommandPaletteReturn = (
  attributes?: Partial<UseCollectionCommandPaletteReturn>,
): UseCollectionCommandPaletteReturn =>
  ({
    open: false,
    query: "",
    setQuery: jest.fn(),
    openPalette: jest.fn(),
    closePalette: jest.fn(),
    shortcut: DEFAULT_COLLECTION_COMMAND_SHORTCUT,
    paletteEnabled: true,
    promptHistory: [],
    clearPromptHistory: jest.fn(),
    examplePrompts: [...COLLECTION_COMMAND_EXAMPLE_PROMPTS_FALLBACK],
    interpretMutation: {
      isPending: false,
    } as UseCollectionCommandPaletteReturn["interpretMutation"],
    preview: null,
    previewIntent: null,
    previewFilters: null,
    runInterpret: jest.fn(),
    applyPreviewFilters: jest.fn(),
    saveFilterViewFromPreview: jest.fn(),
    canSaveFromPreview: false,
    createCrateFromPreview: jest.fn(),
    canCreateCrateFromPreview: false,
    preferCreateCrateAction: false,
    isCreatingCrateFromPreview: false,
    ...attributes,
  }) as UseCollectionCommandPaletteReturn;

class UseCollectionCommandPaletteReturnFactory extends BaseFactory<
  UseCollectionCommandPaletteReturn,
  UseCollectionCommandPaletteReturnFactoryOptions
> {
  build(
    attributes?: Partial<UseCollectionCommandPaletteReturn>,
    _options?: UseCollectionCommandPaletteReturnFactoryOptions,
  ): UseCollectionCommandPaletteReturn {
    return createUseCollectionCommandPaletteReturn(attributes);
  }

  open(
    attributes?: Partial<UseCollectionCommandPaletteReturn>,
  ): UseCollectionCommandPaletteReturn {
    return this.build({ open: true, ...attributes });
  }

  withQuery(
    query: string,
    attributes?: Partial<UseCollectionCommandPaletteReturn>,
  ): UseCollectionCommandPaletteReturn {
    return this.build({
      open: true,
      query,
      ...attributes,
    });
  }

  withPromptHistory(
    prompts: string[],
    attributes?: Partial<UseCollectionCommandPaletteReturn>,
  ): UseCollectionCommandPaletteReturn {
    return this.build({
      open: true,
      promptHistory: prompts.map((prompt) => ({
        prompt,
        usedAt: faker.date.recent().toISOString(),
      })),
      ...attributes,
    });
  }
}

export const useCollectionCommandPaletteReturnFactory =
  new UseCollectionCommandPaletteReturnFactory();
