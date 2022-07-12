import { Factory } from "rosie";
import { mediaTypeFactory } from "src/tests/factories/MediaType.factory";
import { ModalType } from "src/components/Modal/Modal.interfaces";
import { allLanguageDocumentFactory } from "src/tests/factories/AllLanguageDocument.factory";

export const modalTypeFactory = Factory.define<ModalType>("modalType")
  .sequence("id")
  .attr("modalIcon", mediaTypeFactory.build())
  .attr("modalTitle", { en: "Modal Title", es: "Título modal" })
  .attr("modalDescription", allLanguageDocumentFactory.build())
  .sequence("modalCta")
  .attr("showOnExitIntent", false)
  .attr("cookieExpirationInDays", 1);
