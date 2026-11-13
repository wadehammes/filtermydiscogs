import { expect, jest } from "@jest/globals";
import { toast } from "src/utils/toast";

export const setupExecCommandCopyMock = (expectedCopyValue: string) => {
  const originalClipboard = navigator.clipboard;
  const originalIsSecureContext = window.isSecureContext;
  const execCommandMock = jest.fn((command: string) => {
    if (command === "copy") {
      const textarea = document.body.querySelector("textarea");
      expect(textarea?.value).toBe(expectedCopyValue);
    }
    return true;
  });

  Object.defineProperty(navigator, "clipboard", {
    value: undefined,
    configurable: true,
  });
  Object.defineProperty(window, "isSecureContext", {
    value: false,
    configurable: true,
  });
  Object.defineProperty(document, "execCommand", {
    value: execCommandMock,
    configurable: true,
    writable: true,
  });
  jest.spyOn(toast, "success");

  return {
    execCommandMock,
    restore: () => {
      jest.restoreAllMocks();
      Object.defineProperty(navigator, "clipboard", {
        value: originalClipboard,
        configurable: true,
      });
      Object.defineProperty(window, "isSecureContext", {
        value: originalIsSecureContext,
        configurable: true,
      });
      Reflect.deleteProperty(document, "execCommand");
    },
  };
};
