import { Factory } from "rosie";
import { ExitIntentModalProps } from "src/components/ExitIntentModal/ExitIntentModal.interfaces";
import { modalTypeFactory } from "src/tests/factories/ModalType.factory";

export const exitIntentModalProps = Factory.define<ExitIntentModalProps>(
  "exitIntentModalProps"
)
  .attr("modalFields", modalTypeFactory.build())
  .attr("id", "rhModal")
  .attr("initiallyOpen", false);
