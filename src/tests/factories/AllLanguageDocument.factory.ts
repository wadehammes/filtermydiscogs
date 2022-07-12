import { Factory } from "rosie";
import { BLOCKS, Document } from "@contentful/rich-text-types";
import { AllLanguageObject } from "src/interfaces/common.interfaces";

const document: Document = {
  nodeType: BLOCKS.DOCUMENT,
  data: {},
  content: [],
};

export const allLanguageDocumentFactory = Factory.define<
  AllLanguageObject<Document>
>("allLanguageDocument")
  .attr("en", document)
  .attr("es", document);
